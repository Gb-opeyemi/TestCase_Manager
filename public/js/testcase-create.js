const createForm = document.querySelector("#create-testcase-form");

async function setCreateFormUser() {
  const currentUser = await window.requireCurrentUser();

  if (!createForm || !currentUser) {
    return;
  }

  if (!window.canManageTestCases(currentUser)) {
    window.showNotification("You do not have access to this page.", "error");
    window.location.href = "/testcases.html";
    return;
  }

  if (currentUser) {
    // This fills the email fields from the saved user.
    createForm.createdBy.value = currentUser.email || "";
    createForm.updatedBy.value = currentUser.email || "";
  }
}

if (createForm) {
  createForm.addEventListener("submit", async (event) => {
    // This sends the new test case to the API.
    event.preventDefault();

    const currentUser = await window.requireCurrentUser();

    if (!currentUser) {
      return;
    }

    if (!window.canManageTestCases(currentUser)) {
      window.showNotification("You do not have permission to create test cases.", "error");
      return;
    }

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

setCreateFormUser();
