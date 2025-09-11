// HTMLの要素を取得
const startButton = document.getElementById("startButton");
const statusDisplay = document.getElementById("status");
const audioPlayer = new Audio(); // 音声再生用のAudioオブジェクト

// ボタンがクリックされたときの処理
startButton.addEventListener("click", () => {
  // ボタンを無効化し、ステータスを更新
  startButton.disabled = true;
  statusDisplay.textContent = "WebSocketサーバーに接続しています...";

  // WebSocketサーバーに接続
  const socket = new WebSocket("ws://localhost:8765");

  socket.onopen = () => {
    console.log("WebSocket接続が確立しました。");
    statusDisplay.textContent = "接続完了。マイクの準備をしています...";
    startRecording(socket); // WebSocketオブジェクトを渡して録音開始
  };

  // サーバーからメッセージを受信したときの処理
  socket.onmessage = (event) => {
    // データがバイナリ形式(BlobやArrayBuffer)かチェック
    if (event.data instanceof Blob || event.data instanceof ArrayBuffer) {
      console.log("サーバーから音声データを受信しました。");
      statusDisplay.textContent = "応答を再生中です...";
      const blob = new Blob([event.data], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      audioPlayer.src = url;
      audioPlayer.play();

      // 再生が終わったらステータスを戻す
      audioPlayer.onended = () => {
        statusDisplay.textContent = "話しかけてください。";
      };
    }
  };

  socket.onerror = (error) => {
    console.error("WebSocketエラー:", error);
    statusDisplay.textContent =
      "エラーが発生しました。接続を確認してください。";
    startButton.disabled = false; // ボタンを再度有効化
  };

  socket.onclose = () => {
    console.log("WebSocket接続が切れました。");
    statusDisplay.textContent = "接続が切れました。リロードしてください。";
    startButton.disabled = true;
  };
});

// 録音を開始する関数
async function startRecording(socket) {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    statusDisplay.textContent = "マイクに接続しました。話しかけてください。";

    const audioContext = new AudioContext({ sampleRate: 16000 }); // 多くの音声認識モデルは16000Hzを要求
    const source = audioContext.createMediaStreamSource(stream);

    // AudioWorkletをロードして使用
    await audioContext.audioWorklet.addModule("audio-processor.js");
    const processorNode = new AudioWorkletNode(audioContext, "audio-processor");

    // 音声データをWebSocketでサーバーに送信
    processorNode.port.onmessage = (event) => {
      const audioData = event.data;
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(audioData.buffer);
      }
    };

    source.connect(processorNode).connect(audioContext.destination);
    
  } catch (e) {
    console.error("マイクへのアクセスに失敗しました:", e);
    statusDisplay.textContent = "マイクへのアクセスが拒否されました。";
    startButton.disabled = false; // ボタンを再度有効化
  }
}
