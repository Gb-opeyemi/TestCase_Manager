const express = require("express");

const { all, run } = require("../config/database");

const router = express.Router();

function readValue(value, fallback = "") {
  return value?.toString().trim() || fallback;
}

function escapeSingleQuotes(value) {
  // This keeps single quotes from breaking the SQL string
  return value.replace(/'/g, "''");
}

router.get("/testcases/:id/comments", async (req, res) => {
  // This loads the comments for a test case.
  const { id } = req.params;

  try {
    // This direct object lookup allows IDOR
    const comments = await all(`
      SELECT id, test_case_id, author_email, content, created_at
      FROM comments
      WHERE test_case_id = ${id}
      ORDER BY id DESC
    `);

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
  const authorEmail = escapeSingleQuotes(readValue(req.body.authorEmail));
  const content = escapeSingleQuotes(readValue(req.body.content));

  if (!content) {
    res.status(400).json({
      message: "Comment is required.",
    });
    return;
  }

  try {
    // This comment insert has no CSRF protection
    await run(`
      INSERT INTO comments (test_case_id, author_email, content)
      VALUES (${id}, '${authorEmail}', '${content}')
    `);

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
