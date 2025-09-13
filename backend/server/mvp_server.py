import asyncio, json, logging, time, io, wave, os
import websockets, aiohttp, webrtcvad
from vosk import Model, KaldiRecognizer
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")

VOICEVOX_URL = "http://127.0.0.1:50021"
SPEAKER_ID = 2
VAD_MODE = 2  # 固定
FRAME_MS = 20
SAMPLE_RATE = 16000
FRAME_SAMPLES = SAMPLE_RATE * FRAME_MS // 1000  # 320
FRAME_BYTES = FRAME_SAMPLES * 2  # Int16
MAX_SEGMENT_MS = 8000
SILENCE_END_MS = 160
SPEECH_START_MS = 60

# 誤トリガ対策(最小): 開始判定に必要な speech 連続フレーム数
REQ_SPEECH_START_FRAMES = SPEECH_START_MS // FRAME_MS
REQ_SILENCE_END_FRAMES = SILENCE_END_MS // FRAME_MS

# グローバル初期化
logging.info("Loading VOSK model...")
base = os.path.dirname(__file__)
vosk_model = Model(os.path.join(base, "models", os.getenv("VOSK_MODEL", "vosk-model-ja-0.22")))
logging.info("Loaded VOSK.")
vad = webrtcvad.Vad(VAD_MODE)


import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("API_KEY")
if not API_KEY:
    raise RuntimeError("API_KEY が未設定です (.env などで設定)")

MODEL_NAME = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
SYSTEM_PROMPT = "あなたは簡潔に日本語で答えるアシスタントです。60文字以内を目安。"

genai.configure(api_key=API_KEY)
_gemini_model = genai.GenerativeModel(model_name=MODEL_NAME, system_instruction=SYSTEM_PROMPT)


def _gemini_call_sync(history_list, last_user: str) -> str:
    gemini_history = []
    for m in history_list:
        if not isinstance(m, dict):
            continue
        role = m.get("role")
        if role not in ("user", "assistant"):
            continue
        gemini_history.append(
            {"role": "user" if role == "user" else "model", "parts": [{"text": m.get("content", "")}]}
        )
    chat = _gemini_model.start_chat(history=gemini_history)
    resp = chat.send_message(last_user)
    return (resp.text or "").strip()


async def run_llm(conversation):
    # conversation 末尾が user である前提
    if not conversation or conversation[-1].get("role") != "user":
        return ""
    last_user = conversation[-1]["content"]
    history_before = conversation[:-1]
    return await asyncio.to_thread(_gemini_call_sync, history_before, last_user)


_session: aiohttp.ClientSession | None = None


async def get_http_session() -> aiohttp.ClientSession:
    global _session
    if _session is None or _session.closed:
        _session = aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30))
    return _session


async def tts_voicevox(text: str, **opts) -> bytes:
    sess = await get_http_session()
    async with sess.post(f"{VOICEVOX_URL}/audio_query", params={"text": text, "speaker": SPEAKER_ID}, data="") as r:
        q = await r.json()
    # q の調整（speedScale 等）をここで行う
    async with sess.post(f"{VOICEVOX_URL}/synthesis", params={"speaker": SPEAKER_ID}, json=q) as r2:
        return await r2.read()


async def close_aiohttp_resources():
    global _session
    if _session and not _session.closed:
        await _session.close()


def pcm16_concat(frames):
    return b"".join(frames)


def pcm16_to_wav_bytes(pcm: bytes, sample_rate: int = SAMPLE_RATE) -> bytes:
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sample_rate)
        w.writeframes(pcm)
    return buf.getvalue()


class Segmenter:
    def __init__(self):
        self.reset()

    def reset(self):
        self.active = False
        self.speech_frames = []
        self.speech_frame_count = 0
        self.silence_frame_count = 0
        self.start_time = None

    def update(self, frame_pcm: bytes) -> str:
        # frame_pcm: 16kHz 16-bit mono 20ms
        is_speech = vad.is_speech(frame_pcm, SAMPLE_RATE)
        if not self.active:
            if is_speech:
                self.speech_frame_count += 1
                if self.speech_frame_count >= REQ_SPEECH_START_FRAMES:
                    self.active = True
                    self.start_time = time.perf_counter()
                    self.speech_frames.extend([frame_pcm] * self.speech_frame_count)
            else:
                self.speech_frame_count = 0
            return "CONTINUE"
        # active
        self.speech_frames.append(frame_pcm)
        if is_speech:
            self.silence_frame_count = 0
        else:
            self.silence_frame_count += 1
        dur_ms = len(self.speech_frames) * FRAME_MS
        # 終了条件
        if self.silence_frame_count >= REQ_SILENCE_END_FRAMES or dur_ms >= MAX_SEGMENT_MS:
            return "END"
        return "CONTINUE"

    def take(self):
        pcm = pcm16_concat(self.speech_frames)
        self.reset()
        return pcm


async def handler(ws):
    logging.info("Client connected")
    buffer_8ms = b""
    segmenter = Segmenter()
    recognizer = KaldiRecognizer(vosk_model, SAMPLE_RATE)
    recognizer.SetWords(True)
    conversation = []  # ここで一度だけ作成（リセットしない）

    async for msg in ws:
        if isinstance(msg, bytes):
            buffer_8ms += msg
            while len(buffer_8ms) >= FRAME_BYTES:
                frame = buffer_8ms[:FRAME_BYTES]
                buffer_8ms = buffer_8ms[FRAME_BYTES:]
                state = segmenter.update(frame)
                if state == "END":
                    pcm = segmenter.take()
                    if len(pcm) < 0.2 * SAMPLE_RATE * 2:
                        logging.info("Segment too short, drop")
                        continue

                    recognizer.Reset()
                    recognizer.AcceptWaveform(pcm)
                    stt_json = json.loads(recognizer.Result())
                    user_text = stt_json.get("text", "").strip()
                    logging.info(f"STT: {user_text}")
                    if not user_text:
                        continue

                    conversation.append({"role": "user", "content": user_text})
                    reply_text = await run_llm(conversation)
                    conversation.append({"role": "assistant", "content": reply_text})
                    logging.info(f"LLM reply: {reply_text}")

                    wav = await tts_voicevox(reply_text)
                    meta = {"type": "result", "user_text": user_text, "reply_text": reply_text}
                    await ws.send(json.dumps(meta, ensure_ascii=False))
                    await ws.send(wav)
        else:
            try:
                data = json.loads(msg)
                logging.info(f"JSON msg: {data}")
            except:
                pass
    logging.info("Client disconnected")


async def main():
    port = int(os.environ.get("PORT", "8765"))
    async with websockets.serve(handler, "0.0.0.0", port, max_size=2**23):
        logging.info(f"Listening WS :{port} (MVP all-in-one)")
        await asyncio.Future()


if __name__ == "__main__":

    async def _runner():
        try:
            await main()
        finally:
            await close_aiohttp_resources()

    asyncio.run(_runner())
