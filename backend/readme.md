# 動かし方
## １．ライブラリのインストール
`requirements.txt`から、必要なライブラリをインストールできる
開発時のpythonのバージョンは3.11.13
```
pip install -r "requirements.txt"
```

## ２．VOICEVOXのダウンロード
https://github.com/VOICEVOX/voicevox_engine
リリースからOSに合ったファイルををダウンロードする
Linux(wsl)の場合
```
wget https://github.com/VOICEVOX/voicevox_engine/releases/download/バージョン/ファイル名
```
などでインストールし
```
7z x "ファイル名"
```
で解凍する(7zipがない場合は`sudo apt-get install p7zip-full`でインストール)
ダウンロードしたファイルは`voicevox_engine-linux-cpu-x64-0.24.1.7z.001`のようなファイル名になっているのでそのままコピペするとよい
(アーカイブファイルは圧縮の際に複数ファイルに分けることができ、末尾に.001、.002のような感じで連番になる)

あとは解凍したフォルダの中のrun、というファイルを実行すると、VOICEVOXのバックエンドサーバーが立ち上がる(中身はFastAPI)
VOICEVOXに関しては、どこで起動していても変わらない(確かWSL⇔Windows間でも大丈夫だったと思う)

## ３．VOSKモデルのダウンロード
https://alphacephei.com/vosk/models
このサイトからダウンロードできる
同じく`wget`でインストールするとよい
`server/models`の中に解凍する
`server/models/vosk-model-ja-0.22/`
のようになっているとよい

## ４．.envの設定
`server`直下に`.env`というファイルを作成し、APIキーとモデルを入力する
```
API_KEY="キーを入力"
GEMINI_MODEL="モデル名を入力(デフォルトではgemini-2.0-flash)"

```

以上で設定が完了する。
`mvp_server.py`を実行し、`frontend_test`の`index.html`をlive serverなどで閲覧すると動かすことができる。