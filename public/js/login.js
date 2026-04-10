const loginForm = document.querySelector("#login-form");
const loginMessage = document.querySelector("#login-message");

function setLoginMessage(message, state) {
  loginMessage.textContent = message;
  loginMessage.classList.remove("is-success", "is-error");

  if (state) {
    loginMessage.classList.add(state);
  }
}

if (loginForm && loginMessage) {
  loginForm.addEventListener("submit", async (event) => {
    // This sends the form straight to the login route.
    event.preventDefault();

    const formData = new FormData(loginForm);
    const email = formData.get("email")?.toString().trim() || "";
    const password = formData.get("password")?.toString() || "";

    setLoginMessage("Signing in...");

    try {
      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginMessage(data.message || "Unable to sign in.", "is-error");
        return;
      }

      window.location.href = data.redirectTo || "/dashboard.html";
    } catch (error) {
      setLoginMessage("Unable to sign in.", "is-error");
    }
  });
}
