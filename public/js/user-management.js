const createUserForm = document.querySelector("#create-user-form");
const usersTableBody = document.querySelector("#users-table-body");

function renderUsers(users) {
  // This prints the user rows in the table.
  usersTableBody.innerHTML = "";

  users.forEach((user) => {
    const row = document.createElement("tr");
    const nameCell = document.createElement("td");
    nameCell.textContent = user.full_name || "";

    const emailCell = document.createElement("td");
    emailCell.textContent = user.email || "";

    const roleCell = document.createElement("td");
    roleCell.textContent = user.role || "";

    const actionsCell = document.createElement("td");
    actionsCell.className = "table-actions";

    const editLink = document.createElement("a");
    editLink.className = "button button-secondary table-action-button";
    editLink.href = `/user-edit.html?id=${user.id}`;
    editLink.textContent = "Edit";

    const deleteButton = document.createElement("button");
    deleteButton.className = "button button-danger table-action-button table-delete-button";
    deleteButton.dataset.id = user.id;
    deleteButton.type = "button";
    deleteButton.textContent = "Delete";

    actionsCell.append(editLink, deleteButton);
    row.append(nameCell, emailCell, roleCell, actionsCell);
    usersTableBody.appendChild(row);
  });
}

async function loadUsers() {
  const currentUser = await window.requireCurrentUser();

  if (!currentUser) {
    return;
  }

  if (currentUser.role !== "Admin") {
    window.showNotification("You do not have access to this page.", "error");
    window.location.href = "/dashboard.html";
    return;
  }

  try {
    const response = await fetch("/users");
    const data = await response.json();

    if (!response.ok) {
      window.showNotification(data.message || "Unable to load users.", "error");
      return;
    }

    renderUsers(data);
  } catch (error) {
    window.showNotification("Unable to load users.", "error");
  }
}

if (createUserForm) {
  createUserForm.addEventListener("submit", async (event) => {
    // This sends the new user to the API.
    event.preventDefault();

    const currentUser = await window.requireCurrentUser();

    if (!currentUser) {
      return;
    }

    if (currentUser.role !== "Admin") {
      window.showNotification("You do not have permission to create users.", "error");
      return;
    }

    const payload = Object.fromEntries(new FormData(createUserForm).entries());

    try {
      const response = await window.csrfFetch("/users", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        window.showNotification(data.message || "Unable to create user.", "error");
        return;
      }

      createUserForm.reset();
      window.showNotification("User created successfully.", "success");
      loadUsers();
    } catch (error) {
      window.showNotification("Unable to create user.", "error");
    }
  });
}

if (usersTableBody) {
  usersTableBody.addEventListener("click", async (event) => {
    const deleteButton = event.target.closest(".table-delete-button");

    if (!deleteButton) {
      return;
    }

    // This sends the delete request for one user.
    const userId = deleteButton.dataset.id;

    const currentUser = await window.requireCurrentUser();

    if (!currentUser) {
      return;
    }

    if (currentUser.role !== "Admin") {
      window.showNotification("You do not have permission to delete users.", "error");
      return;
    }

    try {
      const response = await window.csrfFetch(`/users/${userId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        window.showNotification(data.message || "Unable to delete user.", "error");
        return;
      }

      window.showNotification("User deleted successfully.", "success");
      loadUsers();
    } catch (error) {
      window.showNotification("Unable to delete user.", "error");
    }
  });
}

loadUsers();
