const params = new URLSearchParams(window.location.search);
const testCaseId = params.get("id");
const detailTitle = document.querySelector("#detail-title");
const detailSubtitle = document.querySelector("#detail-subtitle");
const detailSections = document.querySelector("#detail-sections");
const commentsList = document.querySelector("#comments-list");
const commentForm = document.querySelector("#comment-form");
const commentContent = document.querySelector("#comment-content");
const deleteButton = document.querySelector("#delete-button");
const editButton = document.querySelector("#edit-button");

function formatDate(value) {
  return new Date(value).toLocaleDateString("en-IE", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function isVideo(url = "") {
  return /\.(mp4|webm|ogg)$/i.test(url);
}

function renderMedia(url) {
  if (!url) {
    return "";
  }

  if (isVideo(url)) {
    return `
      <video class="media-preview" controls>
        <source src="${url}" />
      </video>
    `;
  }

  return `<img class="media-preview" src="${url}" alt="Test case media" />`;
}

function renderDetail(testCase) {
  // This prints the test case fields on the page.
  detailTitle.innerHTML = testCase.title || "Test case";
  detailSubtitle.textContent = `${testCase.status || "Pending"} · Updated ${formatDate(testCase.updated_at)}`;
  editButton.href = `/testcase-edit.html?id=${testCase.id}`;

  // Using innerHTML to render content allows stored XSS
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
      <h3>Media</h3>
      ${renderMedia(testCase.media_url)}
      <p>${testCase.media_url || ""}</p>
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

function renderComments(comments) {
  // This prints the comments under the test case.
  commentsList.innerHTML = "";

  if (!comments.length) {
    commentsList.innerHTML = '<p class="inline-message">No comments yet.</p>';
    return;
  }

  comments.forEach((comment) => {
    const item = document.createElement("article");
    item.className = "comment-item";
   // Using innerHTML to render content allows stored XSS
    item.innerHTML = `
      <div class="comment-meta">
        <strong>${comment.author_email || "Unknown user"}</strong>
        <span>${formatDate(comment.created_at)}</span>
      </div>
      <p>${comment.content}</p>
    `;
    commentsList.appendChild(item);
  });
}

async function loadComments() {
  const currentUser = await window.requireCurrentUser();

  if (!currentUser) {
    return;
  }

  try {
    const response = await fetch(`/testcases/${testCaseId}/comments`);
    const data = await response.json();

    if (!response.ok) {
      window.showNotification(data.message || "Unable to load comments.", "error");
      return;
    }

    renderComments(data);
  } catch (error) {
    window.showNotification("Unable to load comments.", "error");
  }
}

async function loadTestCase() {
  const currentUser = await window.requireCurrentUser();

  if (!currentUser) {
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

    renderDetail(data);

    // This shows edit and delete for admins and testers.
    if (window.canManageTestCases(currentUser)) {
      editButton.classList.remove("hidden");
      deleteButton.classList.remove("hidden");
    }
  } catch (error) {
    window.showNotification("Unable to load test case.", "error");
  }
}

if (commentForm) {
  commentForm.addEventListener("submit", async (event) => {
    // This sends the new comment to the API.
    event.preventDefault();

    try {
      const currentUser = await window.requireCurrentUser();

      if (!currentUser) {
        return;
      }

      if (!window.canCommentOnTestCases(currentUser)) {
        commentForm.style.display = "none";
        return;
      }

      // This comment request has no CSRF protection.
      const response = await fetch(`/testcases/${testCaseId}/comments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          authorEmail: currentUser?.email || "",
          content: commentContent.value,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        window.showNotification(data.message || "Unable to add comment.", "error");
        return;
      }

      commentForm.reset();
      window.showNotification("Comment added successfully.", "success");
      loadComments();
    } catch (error) {
      window.showNotification("Unable to add comment.", "error");
    }
  });
}

async function setCommentFormState() {
  const currentUser = await window.requireCurrentUser();

  if (!currentUser) {
    return;
  }

  if (!window.canCommentOnTestCases(currentUser)) {
    commentForm.style.display = "none";
  }
}

if (deleteButton) {
  deleteButton.addEventListener("click", async () => {
    // This sends the delete request to the API.
    try {
      // This delete request has no CSRF protection.
      const response = await fetch(`/testcases/${testCaseId}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        window.showNotification(data.message || "Unable to delete test case.", "error");
        return;
      }

      window.saveNotification("Test case deleted successfully.", "success");
      window.location.href = data.redirectTo || "/testcases.html";
    } catch (error) {
      window.showNotification("Unable to delete test case.", "error");
    }
  });
}

setCommentFormState();
loadTestCase();
loadComments();
