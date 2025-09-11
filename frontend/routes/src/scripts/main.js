let isMute = true;
const micBtn = document.getElementById("mic");

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

  isMute = !isMute;

  const done = await micToggle(isMute);

  if (done.success) {
    setTimeout(() => {
      if (!isMute) {
        micBtn.classList.remove("mic-off");
        micBtn.classList.add("mic-on");
      } else {
        micBtn.classList.remove("mic-on");
        micBtn.classList.add("mic-off");
      }
      micBtn.disabled = false;
    }, 500);
  }
});

settingBtn.addEventListener("click", () => {
  location.href = "./setting.html";
});
accountBtn.addEventListener("click", () => {
  location.href = "./account_setting.html";
});
