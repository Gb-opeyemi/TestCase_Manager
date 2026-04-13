const express = require("express");

const { all, run } = require("../config/database");
const { requireAuthenticated, requireCsrfToken } = require("../middleware/auth");
const { createAuditLog } = require("../utils/audit");
const { sendServerError } = require("../utils/errors");
const { hasMaxLength, isValidEmail, isValidId, readValue } = require("../utils/validation");

const router = express.Router();

router.use(requireAuthenticated);

router.get("/testcases/:id/comments", async (req, res) => {
  // This loads the comments for a test case.
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({
      message: "Test case id is invalid.",
    });
    return;
  }

  try {
    // This lookup uses parameterized queries to avoid SQL Injection.
    const comments = await all(
      `
        SELECT id, test_case_id, author_email, content, created_at
        FROM comments
        WHERE test_case_id = ?
        ORDER BY id DESC
      `,
      [id]
    );

    res.json(comments);
  } catch (error) {
    sendServerError(res, "comments:list", error, "Unable to load comments.");
  }
});

router.post("/testcases/:id/comments", requireCsrfToken, async (req, res) => {
  // This saves a new comment for a test case.
  const { id } = req.params;
  const authorEmail = readValue(req.body.authorEmail);
  const content = readValue(req.body.content);

  if (!isValidId(id)) {
    res.status(400).json({
      message: "Test case id is invalid.",
    });
    return;
  }

  if (!content) {
    res.status(400).json({
      message: "Comment is required.",
    });
    return;
  }

  if (authorEmail && !isValidEmail(authorEmail)) {
    res.status(400).json({
      message: "Author email is invalid.",
    });
    return;
  }

  if (!hasMaxLength(content, 1000)) {
    res.status(400).json({
      message: "Comment is too long.",
    });
    return;
  }

  try {
    // This insert uses parameterized queries to avoid SQL Injection.
    const result = await run(
      `
        INSERT INTO comments (test_case_id, author_email, content)
        VALUES (?, ?, ?)
      `,
      [id, authorEmail, content]
    );

    res.status(201).json({
      message: "Comment added.",
    });

    createAuditLog(req, {
      action: "COMMENT_CREATE",
      entityType: "COMMENT",
      entityId: result.id,
      details: {
        testCaseId: id,
      },
    });
  } catch (error) {
    sendServerError(res, "comments:create", error, "Unable to add comment.");
  }
});

module.exports = router;
