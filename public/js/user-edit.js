const sessionStorageKey = "testcase-manager-user";
const storedUser = localStorage.getItem(sessionStorageKey);
const editUserForm = document.querySelector("#edit-user-form");
const params = new URLSearchParams(window.location.search);
const userId = params.get("id");

let currentUser = null;

try {
  currentUser = storedUser ? JSON.parse(storedUser) : null;
} catch (error) {
  localStorage.removeItem(sessionStorageKey);
}

if (!currentUser) {
  window.location.href = "/login.html";
}

function fillForm(user) {
  // This fills the edit form with saved user values.
  editUserForm.fullName.value = user.full_name || "";
  editUserForm.email.value = user.email || "";
  editUserForm.password.value = "";
  editUserForm.role.value = user.role || "";
}

async function loadUser() {
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

    const payload = Object.fromEntries(new FormData(editUserForm).entries());

    try {
      const response = await fetch(`/users/${userId}`, {
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
