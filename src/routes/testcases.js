const express = require("express");

const { all, get, run } = require("../config/database");

const router = express.Router();

function readValue(value, fallback = "") {
  return value?.toString().trim() || fallback;
}

router.get("/testcases", async (req, res) => {
  // This builds the list query from the search input.
  const search = readValue(req.query.search);

  try {
    const rows = await all(`
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
        title LIKE '%${search}%'
        OR status LIKE '%${search}%'
        OR priority LIKE '%${search}%'
      ORDER BY id DESC
    `);

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

  try {
    const testCase = await get(`
      SELECT *
      FROM test_cases
      WHERE id = ${id}
    `);

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

router.post("/testcases", async (req, res) => {
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
  const createdBy = readValue(req.body.createdBy);
  const updatedBy = readValue(req.body.updatedBy, createdBy);

  if (!title) {
    res.status(400).json({
      message: "Title is required.",
    });
    return;
  }

  try {
    // This saves the new test case record.
    const result = await run(`
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
        created_by,
        updated_by,
        updated_at
      )
      VALUES (
        '${title}',
        '${summary}',
        '${description}',
        '${preconditions}',
        '${stepsToReproduce}',
        '${expectedResult}',
        '${actualResult}',
        '${priority}',
        '${severity}',
        '${status}',
        '${tags}',
        '${createdBy}',
        '${updatedBy}',
        CURRENT_TIMESTAMP
      )
    `);

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

router.patch("/testcases/:id", async (req, res) => {
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
  const createdBy = readValue(req.body.createdBy);
  const updatedBy = readValue(req.body.updatedBy, createdBy);

  try {
    // This saves the changed test case record.
    await run(`
      UPDATE test_cases
      SET
        title = '${title}',
        summary = '${summary}',
        description = '${description}',
        preconditions = '${preconditions}',
        steps_to_reproduce = '${stepsToReproduce}',
        expected_result = '${expectedResult}',
        actual_result = '${actualResult}',
        priority = '${priority}',
        severity = '${severity}',
        status = '${status}',
        tags = '${tags}',
        created_by = '${createdBy}',
        updated_by = '${updatedBy}',
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ${id}
    `);

    res.json({
      redirectTo: `/testcase-detail.html?id=${id}`,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.delete("/testcases/:id", async (req, res) => {
  // This removes a test case by its id.
  const { id } = req.params;

  try {
    await run(`
      DELETE FROM test_cases
      WHERE id = ${id}
    `);

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
