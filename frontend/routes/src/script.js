const openPrivacyPolicy = document.getElementById("open-privacy-policy");
const mailInput = document.getElementById("mail-input");
const passwordInput = document.getElementById("password-input");
const registerBtn = document.getElementById("register");
const loginBtn = document.getElementById("login");

const userStorage = {
  set: (o) => {
    localStorage.setItem("userdata", JSON.stringify(o));
  },
  get: () => {
    return JSON.parse(localStorage.getItem("userdata"));
  },
};

function checkInput() {
  const mail = mailInput.value;
  const password = passwordInput.value;

  return {
    success: !!(mail && password),
    mail: mail,
    password: password,
  };
}

function sendLogin(o) {
  if (!o || !o.mail || !o.password) return;

  userStorage.set(o);
  location.href = "./main.html";
}

function handleAuth() {
  const o = checkInput();
  if (o.success) {
    sendLogin(o);
  } else {
    alert("メールアドレスとパスワードを入力してください");
  }
}

if (registerBtn && loginBtn) {
  registerBtn.addEventListener("click", handleAuth);
  loginBtn.addEventListener("click", handleAuth);
}
