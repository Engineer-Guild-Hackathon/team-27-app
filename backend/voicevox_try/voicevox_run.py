#Pythonの実行でFastAPIを呼び出す
import requests

data = {
    "text": "こんにちは、FastAPI経由のVOICEVOXテストです。",
    "speaker": 5
}
res = requests.post("http://127.0.0.1:8000/speak", json=data)
print(res.json())


# import requests

# data = {"text": "テストです", "speaker": 3}
# res = requests.post("http://127.0.0.1:8000/speak", json=data)

# print("ステータスコード:", res.status_code)
# print("レスポンスのContent-Type:", res.headers.get("content-type"))
# print("レスポンス本文:", res.text[:200])  # 最初の200文字だけ表示
