const sessionStorageKey = "testcase-manager-user";

function getCurrentUser() {
  // This reads the saved user from the browser.
  const storedUser = localStorage.getItem(sessionStorageKey);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser);
  } catch (error) {
    localStorage.removeItem(sessionStorageKey);
    return null;
  }
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
window.canManageTestCases = canManageTestCases;
window.canCommentOnTestCases = canCommentOnTestCases;
window.sessionStorageKey = sessionStorageKey;
