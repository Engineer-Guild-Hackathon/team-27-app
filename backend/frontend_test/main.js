const btnStart = document.getElementById("btnStart");
const wsStatusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const player = document.getElementById("player");

let ws;

let lastUrl = null;

function playBlob(blob) {
  // 前の URL を解放（もし残っていれば）
  if (lastUrl) {
    try { URL.revokeObjectURL(lastUrl); } catch (e) { }
    lastUrl = null;
  }

  const url = URL.createObjectURL(blob);
  lastUrl = url;
  player.src = url;
  player.play().catch(err => {
    console.warn("play() failed:", err);
  });

  // 再生終了時に解放（冗長だが安全）
  player.onended = () => {
    if (lastUrl) {
      try { URL.revokeObjectURL(lastUrl); } catch (e) { }
      lastUrl = null;
    }
  };
}

function log(m) { logEl.textContent += m + "\n"; logEl.scrollTop = logEl.scrollHeight; }

btnStart.onclick = async () => {
  if (ws) return;
  ws = new WebSocket("ws://localhost:8765");
  ws.binaryType = "blob";
  ws.onopen = () => { wsStatusEl.textContent = "Streaming..."; startMic(ws); };
  ws.onmessage = ev => {
    if (typeof ev.data === "string") {
      const meta = JSON.parse(ev.data);
      log(`User: ${meta.user_text}\nAI: ${meta.reply_text}`);
      return;
    } else {
      const blob = ev.data;
      log("Audio received size=" + blob.size);
      playBlob(blob);
    }
  };
  ws.onclose = () => { wsStatusEl.textContent = "Closed"; };
};

async function startMic(ws) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext({ sampleRate: 16000 });
  await ctx.audioWorklet.addModule('./audio-processor.js');
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "audio-processor");
  node.port.onmessage = e => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(e.data.buffer);
    }
  };
  src.connect(node); // destination へは繋がない
  log("Mic started sampleRate=" + ctx.sampleRate);
}