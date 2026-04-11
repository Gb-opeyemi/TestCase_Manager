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
    return null;
  }

  try {
    const parsedUrl = new URL(url);

    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return null;
    }
  } catch (error) {
    return null;
  }

  if (isVideo(url)) {
    const video = document.createElement("video");
    video.className = "media-preview";
    video.controls = true;

    const source = document.createElement("source");
    source.src = url;
    video.appendChild(source);
    return video;
  }

  const image = document.createElement("img");
  image.className = "media-preview";
  image.src = url;
  image.alt = "Test case media";
  return image;
}

function createDetailCard(title, value, options = {}) {
  // This builds one detail card with safe text content.
  const card = document.createElement("article");
  card.className = "detail-card";

  const heading = document.createElement("h3");
  heading.textContent = title;
  card.appendChild(heading);

  if (options.mediaUrl) {
    const mediaPreview = renderMedia(options.mediaUrl);

    if (mediaPreview) {
      card.appendChild(mediaPreview);
    }
  }

  if (Array.isArray(value)) {
    value.forEach((item) => {
      const line = document.createElement("p");
      line.textContent = item;
      card.appendChild(line);
    });
    return card;
  }

  const text = document.createElement("p");
  text.textContent = value || "";
  card.appendChild(text);
  return card;
}

function renderDetail(testCase) {
  // This prints the test case fields on the page.
  detailTitle.textContent = testCase.title || "Test case";
  detailSubtitle.textContent = `${testCase.status || "Pending"} · Updated ${formatDate(testCase.updated_at)}`;
  editButton.href = `/testcase-edit.html?id=${testCase.id}`;

  detailSections.innerHTML = "";
  detailSections.appendChild(createDetailCard("Summary", testCase.summary || ""));
  detailSections.appendChild(createDetailCard("Description", testCase.description || ""));
  detailSections.appendChild(createDetailCard("Preconditions", testCase.preconditions || ""));
  detailSections.appendChild(createDetailCard("Steps to reproduce", testCase.steps_to_reproduce || ""));
  detailSections.appendChild(createDetailCard("Expected result", testCase.expected_result || ""));
  detailSections.appendChild(createDetailCard("Actual result", testCase.actual_result || ""));
  detailSections.appendChild(createDetailCard("Media", testCase.media_url || "", { mediaUrl: testCase.media_url }));
  detailSections.appendChild(
    createDetailCard("Meta", [
      `Status: ${testCase.status || ""}`,
      `Priority: ${testCase.priority || ""}`,
      `Severity: ${testCase.severity || ""}`,
      `Tags: ${testCase.tags || ""}`,
      `Created by: ${testCase.created_by || ""}`,
      `Updated by: ${testCase.updated_by || ""}`,
    ])
  );
}

function renderComments(comments) {
  // This prints the comments under the test case.
  commentsList.innerHTML = "";

  if (!comments.length) {
    const emptyState = document.createElement("p");
    emptyState.className = "inline-message";
    emptyState.textContent = "No comments yet.";
    commentsList.appendChild(emptyState);
    return;
  }

  comments.forEach((comment) => {
    const item = document.createElement("article");
    item.className = "comment-item";

    const meta = document.createElement("div");
    meta.className = "comment-meta";

    const author = document.createElement("strong");
    author.textContent = comment.author_email || "Unknown user";

    const timestamp = document.createElement("span");
    timestamp.textContent = formatDate(comment.created_at);

    const content = document.createElement("p");
    content.textContent = comment.content || "";

    meta.append(author, timestamp);
    item.append(meta, content);
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

      // This comment request has CSRF protection.
      const response = await window.csrfFetch(`/testcases/${testCaseId}/comments`, {
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
      // This delete request has CSRF protection.
      const response = await window.csrfFetch(`/testcases/${testCaseId}`, {
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
