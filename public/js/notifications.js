const notificationStorageKey = "testcase-manager-notification";

function getNotificationRoot() {
  let root = document.querySelector("#notification-root");

  if (!root) {
    root = document.createElement("div");
    root.id = "notification-root";
    root.className = "notification-root";
    document.body.appendChild(root);
  }

  return root;
}

function showNotification(message, type = "success") {
  // This shows a banner on the side of the screen.
  const root = getNotificationRoot();
  const banner = document.createElement("div");

  banner.className = `notification-banner ${type}`;
  banner.textContent = message;
  root.appendChild(banner);

  setTimeout(() => {
    banner.classList.add("is-hidden");

    setTimeout(() => {
      banner.remove();
    }, 250);
  }, 2800);
}

function saveNotification(message, type = "success") {
  // This stores one banner for the next page.
  localStorage.setItem(
    notificationStorageKey,
    JSON.stringify({ message, type })
  );
}

function loadSavedNotification() {
  const savedValue = localStorage.getItem(notificationStorageKey);

  if (!savedValue) {
    return;
  }

  localStorage.removeItem(notificationStorageKey);

  try {
    const notification = JSON.parse(savedValue);
    showNotification(notification.message, notification.type);
  } catch (error) {
    localStorage.removeItem(notificationStorageKey);
  }
}

window.showNotification = showNotification;
window.saveNotification = saveNotification;
window.loadSavedNotification = loadSavedNotification;

loadSavedNotification();
