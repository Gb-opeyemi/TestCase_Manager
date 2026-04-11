const express = require("express");

const { all, run } = require("../config/database");
const { requireAuthenticated } = require("../middleware/auth");
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
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/testcases/:id/comments", async (req, res) => {
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
    // This comment insert has no CSRF protection
    // This insert uses parameterized queries to avoid SQL Injection.
    await run(
      `
        INSERT INTO comments (test_case_id, author_email, content)
        VALUES (?, ?, ?)
      `,
      [id, authorEmail, content]
    );

    res.status(201).json({
      message: "Comment added.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
