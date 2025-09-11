#VOICEVOXのFastAPI

from fastapi import FastAPI
from pydantic import BaseModel
import requests
from datetime import datetime

app = FastAPI(title="VOICEVOX API with Speaker Info")

VOICEVOX_URL = "http://127.0.0.1:50021"

class SynthesisRequest(BaseModel):
    text: str
    speaker: int = 3
    speedScale: float = 1.0
    pitchScale: float = 0.0
    intonationScale: float = 1.0
    volumeScale: float = 1.0
    prePhonemeLength: float = 0.1
    postPhonemeLength: float = 0.1

@app.post("/speak")
def speak(req: SynthesisRequest):
    # 1. audio_query 作成
    query_res = requests.post(
        f"{VOICEVOX_URL}/audio_query",
        params={"text": req.text, "speaker": req.speaker}
    )
    query_res.raise_for_status()
    audio_query = query_res.json()

    # パラメータ調整
    audio_query["speedScale"] = req.speedScale
    audio_query["pitchScale"] = req.pitchScale
    audio_query["intonationScale"] = req.intonationScale
    audio_query["volumeScale"] = req.volumeScale
    audio_query["prePhonemeLength"] = req.prePhonemeLength
    audio_query["postPhonemeLength"] = req.postPhonemeLength

    # 2. 音声合成
    synthesis_res = requests.post(
        f"{VOICEVOX_URL}/synthesis",
        params={"speaker": req.speaker},
        json=audio_query
    )
    synthesis_res.raise_for_status()

    output_file = f"output_{req.speaker}.wav"
    #output_file="output.wav"


    # ファイルに保存
    with open(output_file, "wb") as f:
        f.write(synthesis_res.content)

    return {"message": "音声生成完了", "file": output_file}
