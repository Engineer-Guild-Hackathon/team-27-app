import { marked } from "marked";

const underlineExtension = {
  name: "underline",
  level: "inline",

  tokenizer(src) {
    const rule = /^__(.+?)__/;
    const match = rule.exec(src);

    if (match) {
      const text = match[1];
      return {
        type: "underline",
        raw: match[0],
        text: text,
        tokens: this.lexer.inlineTokens(text),
      };
    }
  },

  renderer(token) {
    return `<u>${this.parser.parseInline(token.tokens)}</u>`;
  },
};

marked.use({
  extensions: [underlineExtension],
  breaks: true,
});

const parseMarkdown = (markdownText) => {
  const rawHtml = marked.parse(markdownText || "");
  // 外部リンク
  let processedHtml = rawHtml.replace(
    /<a href="http/g,
    '<a target="_blank" rel="noopener noreferrer" href="http',
  );
  return processedHtml;
};

const body = document.body;
let header;

window.addEventListener("load", async () => {
  header = document.createElement("header");

  const backBtn = document.createElement("button");
  backBtn.id = "back";
  backBtn.title = "戻る";
  backBtn.classList.add("circle-btn");

  header.appendChild(backBtn);
  body.appendChild(header);

  backBtn.addEventListener("click", () => {
    history.go(-1);
  });

  const pp = parseMarkdown(await (await fetch("./data/example/pp.md")).text());

  const ppEl = document.createElement("div");
  ppEl.id = "privacy-policy-popup";
  ppEl.innerHTML = pp;

  // 完成まで非表示
  ppEl.hidden = true;

  console.log(ppEl);

  body.appendChild(ppEl);

  openPrivacyPolicy.addEventListener("click", () => {
    ppEl.classList.add("open-pp");
  });
});

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
