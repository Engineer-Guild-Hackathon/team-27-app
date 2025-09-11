#URLからFastAPIを呼び出す

from fastapi import FastAPI, Query
from fastapi.responses import FileResponse
import requests
import tempfile
import os

app = FastAPI()

VOICEVOX_URL = "http://127.0.0.1:50021"

@app.get("/speak")
def speak(text: str = Query(...), speaker: int = Query(1)):
    # 1. audio_query
    query_res = requests.post(
        f"{VOICEVOX_URL}/audio_query",
        params={"text": text, "speaker": speaker}
    )
    query_res.raise_for_status()

    # 2. synthesis
    synth_res = requests.post(
        f"{VOICEVOX_URL}/synthesis",
        params={"speaker": speaker},
        json=query_res.json()
    )
    synth_res.raise_for_status()

    # 一時ファイルに保存
    with tempfile.NamedTemporaryFile(delete=False, suffix=f"_speaker{speaker}.wav") as tmp:
        tmp.write(synth_res.content)
        tmp_path = tmp.name

    # wav ファイルを返す
    return FileResponse(
        tmp_path,
        media_type="audio/wav",
        filename=f"voice_speaker{speaker}.wav"
    )
