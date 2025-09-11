#VOICEVOX単体使用

import requests
import soundfile as sf

# VOICEVOX ENGINE の URL
VOICEVOX_URL = "http://127.0.0.1:50021"

# 音声にしたいテキスト
text = "こんにちは、これはVOICEVOXをPythonから使ったテストです。"

# 使用する話者ID（speakers APIで確認可能）
speaker_id = 3

# 1. audio_query を作成
query_res = requests.post(
    f"{VOICEVOX_URL}/audio_query",
    params={"text": text, "speaker": speaker_id}
)
query_res.raise_for_status()
audio_query = query_res.json()

# audio_query["speedScale"] = 1.1
# audio_query["pitchScale"] = 1.5
# audio_query["intonationScale"] = 0.9
# audio_query["accentScale"] = 1.2
# audio_query["volumeScale"] = 1.0
# audio_query["prePhonemeLength"] = 0.05
# audio_query["postPhonemeLength"] = 0.05

# 2. 音声合成
synthesis_res = requests.post(
    f"{VOICEVOX_URL}/synthesis",
    params={"speaker": speaker_id},
    json=audio_query
)
synthesis_res.raise_for_status()

# 3. 音声をファイルに保存（WAV形式）
filename="output"+str(speaker_id)+".wav"
with open(filename, "wb") as f:
    f.write(synthesis_res.content)

print("音声ファイル output"+str(speaker_id)+".wav を作成しました。")
