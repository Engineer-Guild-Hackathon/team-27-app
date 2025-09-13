import { marked } from "marked";

let isMicMute = true;
const micBtn = document.getElementById("mic");

let isLogOpen = false;
const logBtn = document.getElementById("log");
const logEl = document.getElementById("log-wrapper");
const log = document.getElementById("log-c");
const settingBtn = document.getElementById("setting");
const accountBtn = document.getElementById("account");

/**
 *
 * @param {boolean} to - マイクをどの状態にするか / true: mute, false: unmute
 * @returns {{ success: boolean }}
 */
async function micToggle(to) {
  return { success: true };
}

micBtn.addEventListener("click", async () => {
  micBtn.disabled = true;

  isMicMute = !isMicMute;

  const done = await micToggle(isMicMute);

  if (done.success) {
    setTimeout(() => {
      if (!isMicMute) {
        // unmute
        micBtn.classList.remove("mic-off");
        micBtn.classList.add("mic-on");
      } else {
        // mute
        micBtn.classList.remove("mic-on");
        micBtn.classList.add("mic-off");
      }
      micBtn.disabled = false;
    }, 500);
  }
});

logBtn.addEventListener("click", () => {
  if (!isLogOpen) {
    logEl.classList.add("log-open");
  } else {
    logEl.classList.remove("log-open");
  }
  isLogOpen = !isLogOpen;
});

window.addEventListener("load", async () => {
  const data = await fetch("./data/example/log.json");
  const json = await data.json();

  json.sort((a, b) => b.time - a.time);

  json.forEach((logEntry) => {
    const messageDiv = document.createElement("div");
    const p = document.createElement("p");
    const timestampSpan = document.createElement("span");
    const contentSpan = document.createElement("span");

    messageDiv.className = "message";
    timestampSpan.className = "timestamp";
    contentSpan.className = "content";

    const date = new Date(logEntry.time);
    const formattedTime = `${date.getFullYear()}/${String(
      date.getMonth() + 1,
    ).padStart(2, "0")}/${String(date.getDate()).padStart(2, "0")} ${String(
      date.getHours(),
    ).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;

    timestampSpan.textContent = `[${formattedTime}] `;
    contentSpan.textContent = logEntry.message;

    p.appendChild(timestampSpan);
    p.appendChild(contentSpan);
    messageDiv.appendChild(p);

    log.appendChild(messageDiv);
  });
});

settingBtn.addEventListener("click", () => {
  location.href = "./setting.html";
});
accountBtn.addEventListener("click", () => {
  location.href = "./account_setting.html";
});

const btnStart = document.getElementById("btnStart");
const wsStatusEl = document.getElementById("status");
const player = document.getElementById("player");

let ws;

let lastUrl = null;

function playBlob(blob) {
  // 前の URL を解放（もし残っていれば）
  if (lastUrl) {
    try {
      URL.revokeObjectURL(lastUrl);
    } catch (e) {}
    lastUrl = null;
  }

  const url = URL.createObjectURL(blob);
  lastUrl = url;
  player.src = url;
  player.play().catch((err) => {
    console.warn("play() failed:", err);
  });

  // 再生終了時に解放（冗長だが安全）
  player.onended = () => {
    if (lastUrl) {
      try {
        URL.revokeObjectURL(lastUrl);
      } catch (e) {}
      lastUrl = null;
    }
  };
}

btnStart.onclick = async () => {
  if (ws) return;
  ws = new WebSocket("ws://localhost:8765");
  ws.binaryType = "blob";
  ws.onopen = () => {
    wsStatusEl.textContent = "接続中！";
    btnStart.disabled = true;
    micBtn.disabled = false;
    startMic(ws);
  };
  ws.onmessage = (ev) => {
    if (typeof ev.data === "string") {
      const meta = JSON.parse(ev.data);
      // log(`User: ${meta.user_text}\nAI: ${meta.reply_text}`);
      return;
    } else {
      const blob = ev.data;
      // log("Audio received size=" + blob.size);
      playBlob(blob);
    }
  };
  ws.onclose = () => {
    wsStatusEl.textContent = "接続終了";
    btnStart.disabled = false;
    micBtn.disabled = true;
  };
};

async function startMic(ws) {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const ctx = new AudioContext({ sampleRate: 16000 });
  await ctx.audioWorklet.addModule(
    new URL("./audio-processor.js", import.meta.url),
  );
  const src = ctx.createMediaStreamSource(stream);
  const node = new AudioWorkletNode(ctx, "audio-processor");
  node.port.onmessage = (e) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(e.data.buffer);
    }
  };
  src.connect(node); // destination へは繋がない
  // log("Mic started sampleRate=" + ctx.sampleRate);
}
