const currentUser = window.getCurrentUser();

if (!currentUser) {
  window.location.href = "/login.html";
}

const dashboardSubtitle = document.querySelector("#dashboard-subtitle");
const totalCount = document.querySelector("#total-count");
const passedCount = document.querySelector("#passed-count");
const failedCount = document.querySelector("#failed-count");
const pendingCount = document.querySelector("#pending-count");
const activityList = document.querySelector("#activity-list");
const logoutButton = document.querySelector("#logout-button");
const newTestCaseLink = document.querySelector("#new-testcase-link");
const usersLink = document.querySelector("#users-link");

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renderActivity(items) {
  activityList.innerHTML = "";

  if (!items.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "inline-message";
    emptyState.textContent = "No recent activity.";
    activityList.appendChild(emptyState);
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "activity-item";

    const copy = document.createElement("div");
    copy.className = "activity-copy";

    const title = document.createElement("strong");
    title.textContent = item.title;

    const status = document.createElement("span");
    status.textContent = item.status;

    copy.append(title, status);

    const meta = document.createElement("div");
    meta.className = "activity-meta";

    const priority = document.createElement("strong");
    priority.textContent = item.priority;

    const updatedAt = document.createElement("span");
    updatedAt.textContent = formatDate(item.updated_at);

    meta.append(priority, updatedAt);
    card.append(copy, meta);
    activityList.appendChild(card);
  });
}

async function loadDashboard() {
  if (!currentUser) {
    return;
  }

  // This shows the create link for admins and testers.
  if (newTestCaseLink && window.canManageTestCases(currentUser)) {
    newTestCaseLink.classList.remove("hidden");
  }

  // This shows the users link for admins only.
  if (usersLink && currentUser.role === "Admin") {
    usersLink.classList.remove("hidden");
  }

  dashboardSubtitle.textContent = `${currentUser.fullName} · ${currentUser.role}`;

  try {
    const response = await fetch("/api/dashboard");
    const data = await response.json();

    totalCount.textContent = data.metrics.total;
    passedCount.textContent = data.metrics.passed;
    failedCount.textContent = data.metrics.failed;
    pendingCount.textContent = data.metrics.pending;
    renderActivity(data.recentActivity || []);
  } catch (error) {
    activityList.innerHTML = "";

    const errorState = document.createElement("p");
    errorState.className = "inline-message is-error";
    errorState.textContent = "Unable to load dashboard.";
    activityList.appendChild(errorState);
  }
}

if (logoutButton) {
  logoutButton.addEventListener("click", () => {
    localStorage.removeItem(window.sessionStorageKey);
    window.location.href = "/login.html";
  });
}

loadDashboard();
