const createForm = document.querySelector("#create-testcase-form");
const sessionStorageKey = "testcase-manager-user";

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
        window.showNotification(data.message || "Unable to save test case.", "error");
        return;
      }

      window.saveNotification("Test case created successfully.", "success");
      window.location.href = data.redirectTo;
    } catch (error) {
      window.showNotification("Unable to save test case.", "error");
    }
  });
}
