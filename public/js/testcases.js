const tableBody = document.querySelector("#testcases-table-body");
const listMessage = document.querySelector("#list-message");
const searchForm = document.querySelector("#search-form");
const searchInput = document.querySelector("#search-input");

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
    row.innerHTML = `
      <td>
        <a class="table-link" href="/testcase-detail.html?id=${testCase.id}">
          ${testCase.title}
        </a>
      </td>
      <td><span class="status-badge">${testCase.status || ""}</span></td>
      <td>${testCase.priority || ""}</td>
      <td>${testCase.severity || ""}</td>
      <td>${formatDate(testCase.updated_at)}</td>
    `;

    tableBody.appendChild(row);
  });
}

async function loadTestCases(search = "") {
  listMessage.textContent = "Loading test cases...";

  try {
    const response = await fetch(`/testcases?search=${search}`);
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
