const params = new URLSearchParams(window.location.search);
const testCaseId = params.get("id");
const detailTitle = document.querySelector("#detail-title");
const detailSubtitle = document.querySelector("#detail-subtitle");
const detailSections = document.querySelector("#detail-sections");
const detailForm = document.querySelector("#edit-testcase-form");
const detailMessage = document.querySelector("#detail-message");
const deleteButton = document.querySelector("#delete-button");
const sessionStorageKey = "testcase-manager-user";

function setDetailMessage(message, state) {
  // This updates the message under the edit form.
  detailMessage.textContent = message;
  detailMessage.classList.remove("is-success", "is-error");

  if (state) {
    detailMessage.classList.add(state);
  }
}

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function renderDetail(testCase) {
  // This prints the test case fields on the page.
  detailTitle.textContent = testCase.title || "Test case";
  detailSubtitle.textContent = `${testCase.status || "Pending"} · Updated ${formatDate(testCase.updated_at)}`;

  detailSections.innerHTML = `
    <article class="detail-card">
      <h3>Summary</h3>
      <p>${testCase.summary || ""}</p>
    </article>
    <article class="detail-card">
      <h3>Description</h3>
      <p>${testCase.description || ""}</p>
    </article>
    <article class="detail-card">
      <h3>Preconditions</h3>
      <p>${testCase.preconditions || ""}</p>
    </article>
    <article class="detail-card">
      <h3>Steps to reproduce</h3>
      <p>${testCase.steps_to_reproduce || ""}</p>
    </article>
    <article class="detail-card">
      <h3>Expected result</h3>
      <p>${testCase.expected_result || ""}</p>
    </article>
    <article class="detail-card">
      <h3>Actual result</h3>
      <p>${testCase.actual_result || ""}</p>
    </article>
    <article class="detail-card">
      <h3>Meta</h3>
      <p>Status: ${testCase.status || ""}</p>
      <p>Priority: ${testCase.priority || ""}</p>
      <p>Severity: ${testCase.severity || ""}</p>
      <p>Tags: ${testCase.tags || ""}</p>
      <p>Created by: ${testCase.created_by || ""}</p>
      <p>Updated by: ${testCase.updated_by || ""}</p>
    </article>
  `;
}

function fillForm(testCase) {
  // This fills the edit form with saved values.
  detailForm.title.value = testCase.title || "";
  detailForm.summary.value = testCase.summary || "";
  detailForm.description.value = testCase.description || "";
  detailForm.preconditions.value = testCase.preconditions || "";
  detailForm.stepsToReproduce.value = testCase.steps_to_reproduce || "";
  detailForm.expectedResult.value = testCase.expected_result || "";
  detailForm.actualResult.value = testCase.actual_result || "";
  detailForm.status.value = testCase.status || "Pending";
  detailForm.priority.value = testCase.priority || "Medium";
  detailForm.severity.value = testCase.severity || "Medium";
  detailForm.tags.value = testCase.tags || "";
  detailForm.createdBy.value = testCase.created_by || "";
  detailForm.updatedBy.value = testCase.updated_by || testCase.created_by || "";
}

async function loadTestCase() {
  if (!testCaseId) {
    setDetailMessage("Test case not found.", "is-error");
    return;
  }

  try {
    const response = await fetch(`/testcases/${testCaseId}`);
    const data = await response.json();

    if (!response.ok) {
      setDetailMessage(data.message || "Unable to load test case.", "is-error");
      return;
    }

    renderDetail(data);
    fillForm(data);
    setDetailMessage("");
  } catch (error) {
    setDetailMessage("Unable to load test case.", "is-error");
  }
}

if (detailForm) {
  const savedUser = localStorage.getItem(sessionStorageKey);

  if (savedUser) {
    // This fills the updater email from the saved user.
    const user = JSON.parse(savedUser);
    detailForm.updatedBy.value = user.email || "";
  }

  detailForm.addEventListener("submit", async (event) => {
    // This sends the edited values to the API.
    event.preventDefault();

    const payload = Object.fromEntries(new FormData(detailForm).entries());
    setDetailMessage("Saving changes...");

    try {
      const response = await fetch(`/testcases/${testCaseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        setDetailMessage(data.message || "Unable to save changes.", "is-error");
        return;
      }

      setDetailMessage("Changes saved.", "is-success");
      loadTestCase();
    } catch (error) {
      setDetailMessage("Unable to save changes.", "is-error");
    }
  });
}

if (deleteButton) {
  deleteButton.addEventListener("click", async () => {
    // This sends the delete request to the API.
    try {
      const response = await fetch(`/testcases/${testCaseId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        setDetailMessage(data.message || "Unable to delete test case.", "is-error");
        return;
      }

      window.location.href = data.redirectTo || "/testcases.html";
    } catch (error) {
      setDetailMessage("Unable to delete test case.", "is-error");
    }
  });
}

loadTestCase();
