const logoutBtn = document.getElementById("logout");

async function logout() {
  const check = await confirm("ログアウトしますか？");
  if (check) {
    localStorage.removeItem("userdata");
    location.href = "/";
  }
}

logoutBtn.addEventListener("click", logout);
