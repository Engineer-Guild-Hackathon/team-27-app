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
  const data = await fetch("../../data/example/log.json");
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
