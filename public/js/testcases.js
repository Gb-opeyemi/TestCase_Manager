const tableBody = document.querySelector("#testcases-table-body");
const listMessage = document.querySelector("#list-message");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");
const newTestCaseLink = document.querySelector("#new-testcase-link");

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renderRows(testCases) {
  // This prints the table rows from the API data.
  tableBody.innerHTML = "";

  if (!testCases.length) {
    listMessage.textContent = "No test cases found.";
    return;
  }

  listMessage.textContent = "";

  testCases.forEach((testCase) => {
    const row = document.createElement("tr");
    const titleCell = document.createElement("td");
    const titleLink = document.createElement("a");
    titleLink.className = "table-link";
    titleLink.href = `/testcase-detail.html?id=${testCase.id}`;
    titleLink.textContent = testCase.title || "";
    titleCell.appendChild(titleLink);

    const statusCell = document.createElement("td");
    const statusBadge = document.createElement("span");
    statusBadge.className = "status-badge";
    statusBadge.textContent = testCase.status || "";
    statusCell.appendChild(statusBadge);

    const priorityCell = document.createElement("td");
    priorityCell.textContent = testCase.priority || "";

    const severityCell = document.createElement("td");
    severityCell.textContent = testCase.severity || "";

    const updatedCell = document.createElement("td");
    updatedCell.textContent = formatDate(testCase.updated_at);

    row.append(titleCell, statusCell, priorityCell, severityCell, updatedCell);

    tableBody.appendChild(row);
  });
}

async function loadTestCases(search = "") {
  const currentUser = await window.requireCurrentUser();

  if (!currentUser) {
    return;
  }

  // This shows the create link for admins and testers.
  if (newTestCaseLink && window.canManageTestCases(currentUser)) {
    newTestCaseLink.classList.remove("hidden");
  }

  listMessage.textContent = "Loading test cases...";

  try {
    const response = await fetch(`/testcases?search=${encodeURIComponent(search)}`);
    const data = await response.json();
    renderRows(data);
  } catch (error) {
    listMessage.textContent = "Unable to load test cases.";
  }
}

if (searchForm) {
  searchForm.addEventListener("submit", (event) => {
    // This reloads the page data with the search text.
    event.preventDefault();
    loadTestCases(searchInput.value.trim());
  });
}

loadTestCases();
