const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");

if (loginForm && loginMessage) {
  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const email = document.querySelector("#email").value.trim();

    loginMessage.textContent = email
      ? `Signing in as ${email}.`
      : "Signing in.";
    loginMessage.classList.add("is-success");
  });
}
