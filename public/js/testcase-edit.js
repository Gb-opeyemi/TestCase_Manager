const params = new URLSearchParams(window.location.search);
const testCaseId = params.get("id");
const editForm = document.querySelector("#edit-testcase-form");
const backToDetailLink = document.querySelector("#back-to-detail");

function fillForm(testCase) {
  // This fills the edit form with saved values.
  editForm.title.value = testCase.title || "";
  editForm.summary.value = testCase.summary || "";
  editForm.description.value = testCase.description || "";
  editForm.preconditions.value = testCase.preconditions || "";
  editForm.stepsToReproduce.value = testCase.steps_to_reproduce || "";
  editForm.expectedResult.value = testCase.expected_result || "";
  editForm.actualResult.value = testCase.actual_result || "";
  editForm.mediaUrl.value = testCase.media_url || "";
  editForm.status.value = testCase.status || "Pending";
  editForm.priority.value = testCase.priority || "Medium";
  editForm.severity.value = testCase.severity || "Medium";
  editForm.tags.value = testCase.tags || "";
  editForm.createdBy.value = testCase.created_by || "";
  editForm.updatedBy.value = testCase.updated_by || testCase.created_by || "";
}

async function loadTestCase() {
  const currentUser = await window.requireCurrentUser();

  if (!currentUser) {
    return;
  }

  if (!window.canManageTestCases(currentUser)) {
    window.showNotification("You do not have access to this page.", "error");
    window.location.href = `/testcase-detail.html?id=${testCaseId}`;
    return;
  }

  if (!testCaseId) {
    window.showNotification("Test case not found.", "error");
    return;
  }

  try {
    const response = await fetch(`/testcases/${testCaseId}`);
    const data = await response.json();

    if (!response.ok) {
      window.showNotification(data.message || "Unable to load test case.", "error");
      return;
    }

    fillForm(data);
    backToDetailLink.href = `/testcase-detail.html?id=${testCaseId}`;
  } catch (error) {
    window.showNotification("Unable to load test case.", "error");
  }
}

if (editForm) {
  editForm.addEventListener("submit", async (event) => {
    // This sends the edited values to the API.
    event.preventDefault();

    const currentUser = await window.requireCurrentUser();

    if (!currentUser) {
      return;
    }

    if (!window.canManageTestCases(currentUser)) {
      window.showNotification("You do not have permission to edit test cases.", "error");
      return;
    }

    const payload = Object.fromEntries(new FormData(editForm).entries());

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
        window.showNotification(data.message || "Unable to save changes.", "error");
        return;
      }

      window.saveNotification("Test case updated successfully.", "success");
      window.location.href = data.redirectTo || `/testcase-detail.html?id=${testCaseId}`;
    } catch (error) {
      window.showNotification("Unable to save changes.", "error");
    }
  });
}

loadTestCase();
