const btn = document.getElementById("btnStart");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");
const player = document.getElementById("player");

let ws;

function log(m) { logEl.textContent += m + "\n"; logEl.scrollTop = logEl.scrollHeight; }

btn.onclick = async () => {
  if (ws) return;
  ws = new WebSocket("ws://localhost:8765");
  ws.binaryType = "blob";
  ws.onopen = () => { statusEl.textContent = "Streaming..."; startMic(ws); };
  ws.onmessage = ev => {
    if (typeof ev.data === "string") {
      const meta = JSON.parse(ev.data);
      log(`User: ${meta.user_text}\nAI: ${meta.reply_text}`);
      return;
    } else {
      const blob = ev.data;
      log("Audio received size=" + blob.size);
      player.src = URL.createObjectURL(blob);
      player.play();
    }
  };
  ws.onclose = () => { statusEl.textContent = "Closed"; };
};

async function startMic(ws) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext({ sampleRate: 16000 });
  await ctx.audioWorklet.addModule("audio-processor.js");
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