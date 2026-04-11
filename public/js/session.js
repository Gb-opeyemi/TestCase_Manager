let currentUser = null;
let currentUserRequest = null;
let csrfToken = null;

async function loadCurrentUser(force = false) {
  // This loads the signed-in user from the server.
  if (!force && currentUserRequest) {
    return currentUserRequest;
  }

  currentUserRequest = fetch("/api/session")
    .then(async (response) => {
      if (!response.ok) {
        currentUser = null;
        return null;
      }

      const data = await response.json();
      currentUser = data.user || null;
      csrfToken = data.csrfToken || null;
      return currentUser;
    })
    .catch(() => {
      currentUser = null;
      csrfToken = null;
      return null;
    });

  return currentUserRequest;
}

function getCurrentUser() {
  // This returns the last loaded user value.
  return currentUser;
}

async function requireCurrentUser() {
  // This redirects guests back to the login page.
  const user = await loadCurrentUser();

  if (!user) {
    window.location.href = "/login.html";
    return null;
  }

  return user;
}

async function logoutUser() {
  // This asks the server to end the current session.
  try {
    await csrfFetch("/logout", {
      method: "POST",
    });
  } finally {
    currentUser = null;
    currentUserRequest = null;
    csrfToken = null;
    window.location.href = "/login.html";
  }
}

async function getCsrfToken() {
  // This loads the current CSRF token from the session.
  if (csrfToken) {
    return csrfToken;
  }

  await loadCurrentUser(true);
  return csrfToken;
}

async function csrfFetch(url, options = {}) {
  // This adds the CSRF token to write requests.
  const requestOptions = { ...options };
  const method = (requestOptions.method || "GET").toUpperCase();

  if (["POST", "PATCH", "PUT", "DELETE"].includes(method)) {
    const token = await getCsrfToken();
    requestOptions.headers = {
      ...(requestOptions.headers || {}),
      "x-csrf-token": token || "",
    };
  }

  return fetch(url, requestOptions);
}

function canManageTestCases(user) {
  // This checks if the user can manage test cases.
  return user?.role === "Admin" || user?.role === "Tester";
}

function canCommentOnTestCases(user) {
  // This checks if the user can add comments.
  return Boolean(user);
}

window.getCurrentUser = getCurrentUser;
window.loadCurrentUser = loadCurrentUser;
window.csrfFetch = csrfFetch;
window.logoutUser = logoutUser;
window.requireCurrentUser = requireCurrentUser;
window.canManageTestCases = canManageTestCases;
window.canCommentOnTestCases = canCommentOnTestCases;
