const createForm = document.querySelector("#create-testcase-form");
const createMessage = document.querySelector("#create-message");
const sessionStorageKey = "testcase-manager-user";

function setCreateMessage(message, state) {
  // This updates the message under the form.
  createMessage.textContent = message;
  createMessage.classList.remove("is-success", "is-error");

  if (state) {
    createMessage.classList.add(state);
  }
}

if (createForm) {
  const savedUser = localStorage.getItem(sessionStorageKey);

  if (savedUser) {
    // This fills the email fields from the saved user.
    const user = JSON.parse(savedUser);
    createForm.createdBy.value = user.email || "";
    createForm.updatedBy.value = user.email || "";
  }

  createForm.addEventListener("submit", async (event) => {
    // This sends the new test case to the API.
    event.preventDefault();

    const formData = new FormData(createForm);
    const payload = Object.fromEntries(formData.entries());

    setCreateMessage("Saving test case...");

    try {
      const response = await fetch("/testcases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setCreateMessage(data.message || "Unable to save test case.", "is-error");
        return;
      }

      window.location.href = data.redirectTo;
    } catch (error) {
      setCreateMessage("Unable to save test case.", "is-error");
    }
  });
}
