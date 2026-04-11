const express = require("express");

const { all, get, run } = require("../config/database");
const { requireAuthenticated, requireRole } = require("../middleware/auth");
const {
  LEVEL_OPTIONS,
  STATUS_OPTIONS,
  hasMaxLength,
  isValidEmail,
  isValidId,
  isValidMediaUrl,
  isValidOption,
  readValue,
} = require("../utils/validation");

const router = express.Router();

router.use(requireAuthenticated);

router.get("/testcases", async (req, res) => {
  // This builds the list query from the search input.
  const search = readValue(req.query.search);
  const searchTerm = `%${search}%`;

  if (!hasMaxLength(search, 100)) {
    res.status(400).json({
      message: "Search text is too long.",
    });
    return;
  }

  try {
    // This search uses parameterized queries to avoid SQL Injection.
    const rows = await all(
      `
        SELECT
          id,
          title,
          summary,
          status,
          priority,
          severity,
          created_by,
          updated_at
        FROM test_cases
        WHERE
          title LIKE ?
          OR status LIKE ?
          OR priority LIKE ?
        ORDER BY id DESC
      `,
      [searchTerm, searchTerm, searchTerm]
    );

    res.json(rows);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/testcases/:id", async (req, res) => {
  // This loads a test case by its id.
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({
      message: "Test case id is invalid.",
    });
    return;
  }

  try {
    // This lookup uses a placeholder to avoid SQL Injection.
    const testCase = await get(
      `
        SELECT *
        FROM test_cases
        WHERE id = ?
      `,
      [id]
    );

    if (!testCase) {
      res.status(404).json({
        message: "Test case not found.",
      });
      return;
    }

    res.json(testCase);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/testcases", requireRole("Admin", "Tester"), async (req, res) => {
  // This builds the insert query from the form values.
  const title = readValue(req.body.title);
  const summary = readValue(req.body.summary);
  const description = readValue(req.body.description);
  const preconditions = readValue(req.body.preconditions);
  const stepsToReproduce = readValue(req.body.stepsToReproduce);
  const expectedResult = readValue(req.body.expectedResult);
  const actualResult = readValue(req.body.actualResult);
  const priority = readValue(req.body.priority, "Medium");
  const severity = readValue(req.body.severity, "Medium");
  const status = readValue(req.body.status, "Pending");
  const tags = readValue(req.body.tags);
  const mediaUrl = readValue(req.body.mediaUrl);
  const createdBy = readValue(req.body.createdBy);
  const updatedBy = readValue(req.body.updatedBy, createdBy);

  if (!title) {
    res.status(400).json({
      message: "Title is required.",
    });
    return;
  }

  if (!hasMaxLength(title, 150)) {
    res.status(400).json({
      message: "Title is too long.",
    });
    return;
  }

  if (!hasMaxLength(summary, 255)) {
    res.status(400).json({
      message: "Summary is too long.",
    });
    return;
  }

  if (
    !hasMaxLength(description, 5000)
    || !hasMaxLength(preconditions, 3000)
    || !hasMaxLength(stepsToReproduce, 5000)
    || !hasMaxLength(expectedResult, 3000)
    || !hasMaxLength(actualResult, 3000)
    || !hasMaxLength(tags, 255)
  ) {
    res.status(400).json({
      message: "One or more fields are too long.",
    });
    return;
  }

  if (!isValidOption(status, STATUS_OPTIONS)) {
    res.status(400).json({
      message: "Status is invalid.",
    });
    return;
  }

  if (!isValidOption(priority, LEVEL_OPTIONS) || !isValidOption(severity, LEVEL_OPTIONS)) {
    res.status(400).json({
      message: "Priority or severity is invalid.",
    });
    return;
  }

  if (createdBy && !isValidEmail(createdBy)) {
    res.status(400).json({
      message: "Created by must be a valid email.",
    });
    return;
  }

  if (updatedBy && !isValidEmail(updatedBy)) {
    res.status(400).json({
      message: "Updated by must be a valid email.",
    });
    return;
  }

  if (mediaUrl && !isValidMediaUrl(mediaUrl)) {
    res.status(400).json({
      message: "Media link must use http or https.",
    });
    return;
  }

  try {
    // This saves the new test case record.
    // This insert uses parameterized queries to avoid SQL Injection.
    const result = await run(
      `
        INSERT INTO test_cases (
          title,
          summary,
          description,
          preconditions,
          steps_to_reproduce,
          expected_result,
          actual_result,
          priority,
          severity,
          status,
          tags,
          media_url,
          created_by,
          updated_by,
          updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `,
      [
        title,
        summary,
        description,
        preconditions,
        stepsToReproduce,
        expectedResult,
        actualResult,
        priority,
        severity,
        status,
        tags,
        mediaUrl,
        createdBy,
        updatedBy,
      ]
    );

    res.status(201).json({
      id: result.id,
      redirectTo: `/testcase-detail.html?id=${result.id}`,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.patch("/testcases/:id", requireRole("Admin", "Tester"), async (req, res) => {
  // This updates a test case with the new form values.
  const { id } = req.params;
  const title = readValue(req.body.title);
  const summary = readValue(req.body.summary);
  const description = readValue(req.body.description);
  const preconditions = readValue(req.body.preconditions);
  const stepsToReproduce = readValue(req.body.stepsToReproduce);
  const expectedResult = readValue(req.body.expectedResult);
  const actualResult = readValue(req.body.actualResult);
  const priority = readValue(req.body.priority, "Medium");
  const severity = readValue(req.body.severity, "Medium");
  const status = readValue(req.body.status, "Pending");
  const tags = readValue(req.body.tags);
  const mediaUrl = readValue(req.body.mediaUrl);
  const createdBy = readValue(req.body.createdBy);
  const updatedBy = readValue(req.body.updatedBy, createdBy);

  if (!isValidId(id)) {
    res.status(400).json({
      message: "Test case id is invalid.",
    });
    return;
  }

  if (!title) {
    res.status(400).json({
      message: "Title is required.",
    });
    return;
  }

  if (!hasMaxLength(title, 150)) {
    res.status(400).json({
      message: "Title is too long.",
    });
    return;
  }

  if (!hasMaxLength(summary, 255)) {
    res.status(400).json({
      message: "Summary is too long.",
    });
    return;
  }

  if (
    !hasMaxLength(description, 5000)
    || !hasMaxLength(preconditions, 3000)
    || !hasMaxLength(stepsToReproduce, 5000)
    || !hasMaxLength(expectedResult, 3000)
    || !hasMaxLength(actualResult, 3000)
    || !hasMaxLength(tags, 255)
  ) {
    res.status(400).json({
      message: "One or more fields are too long.",
    });
    return;
  }

  if (!isValidOption(status, STATUS_OPTIONS)) {
    res.status(400).json({
      message: "Status is invalid.",
    });
    return;
  }

  if (!isValidOption(priority, LEVEL_OPTIONS) || !isValidOption(severity, LEVEL_OPTIONS)) {
    res.status(400).json({
      message: "Priority or severity is invalid.",
    });
    return;
  }

  if (createdBy && !isValidEmail(createdBy)) {
    res.status(400).json({
      message: "Created by must be a valid email.",
    });
    return;
  }

  if (updatedBy && !isValidEmail(updatedBy)) {
    res.status(400).json({
      message: "Updated by must be a valid email.",
    });
    return;
  }

  if (mediaUrl && !isValidMediaUrl(mediaUrl)) {
    res.status(400).json({
      message: "Media link must use http or https.",
    });
    return;
  }

  try {
    // This saves the changed test case record.
    // This update uses parameterized queries to avoid SQL Injection.
    await run(
      `
        UPDATE test_cases
        SET
          title = ?,
          summary = ?,
          description = ?,
          preconditions = ?,
          steps_to_reproduce = ?,
          expected_result = ?,
          actual_result = ?,
          priority = ?,
          severity = ?,
          status = ?,
          tags = ?,
          media_url = ?,
          created_by = ?,
          updated_by = ?,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
      [
        title,
        summary,
        description,
        preconditions,
        stepsToReproduce,
        expectedResult,
        actualResult,
        priority,
        severity,
        status,
        tags,
        mediaUrl,
        createdBy,
        updatedBy,
        id,
      ]
    );

    res.json({
      redirectTo: `/testcase-detail.html?id=${id}`,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.delete("/testcases/:id", requireRole("Admin", "Tester"), async (req, res) => {
  // This removes a test case by its id.
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({
      message: "Test case id is invalid.",
    });
    return;
  }

  try {
    // This delete uses parameterized queries to avoid SQL Injection.
    await run(
      `
        DELETE FROM test_cases
        WHERE id = ?
      `,
      [id]
    );

    res.json({
      redirectTo: "/testcases.html",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
