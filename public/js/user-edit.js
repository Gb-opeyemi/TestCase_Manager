const editUserForm = document.querySelector("#edit-user-form");
const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

function fillForm(user) {
  // This fills the edit form with saved user values.
  editUserForm.fullName.value = user.full_name || "";
  editUserForm.email.value = user.email || "";
  editUserForm.password.value = "";
  editUserForm.role.value = user.role || "";
}

async function loadUser() {
  const currentUser = await window.requireCurrentUser();

  if (!currentUser) {
    return;
  }

  if (currentUser.role !== "Admin") {
    window.showNotification("You do not have access to this page.", "error");
    window.location.href = "/dashboard.html";
    return;
  }

  if (!userId) {
    window.showNotification("User not found.", "error");
    return;
  }

  try {
    // This direct user fetch allows IDOR in the UI.
    const response = await fetch(`/users/${userId}`);
    const data = await response.json();

    if (!response.ok) {
      window.showNotification(data.message || "Unable to load user.", "error");
      return;
    }

    fillForm(data);
  } catch (error) {
    window.showNotification("Unable to load user.", "error");
  }
}

if (editUserForm) {
  editUserForm.addEventListener("submit", async (event) => {
    // This sends the edited user values to the API.
    event.preventDefault();

    const currentUser = await window.requireCurrentUser();

    if (!currentUser) {
      return;
    }

    if (currentUser.role !== "Admin") {
      window.showNotification("You do not have permission to update users.", "error");
      return;
    }

    const payload = Object.fromEntries(new FormData(editUserForm).entries());

    try {
      const response = await window.csrfFetch(`/users/${userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        window.showNotification(data.message || "Unable to update user.", "error");
        return;
      }

      window.showNotification("User updated successfully.", "success");
    } catch (error) {
      window.showNotification("Unable to update user.", "error");
    }
  });
}

loadUser();
