const express = require("express");

const { all, get } = require("../config/database");

const router = express.Router();

router.get("/api/dashboard", async (req, res) => {
  try {
    // This loads the numbers for the top cards.
    const totals = await get(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'Passed' THEN 1 ELSE 0 END) AS passed,
        SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) AS failed,
        SUM(CASE WHEN status = 'Pending' THEN 1 ELSE 0 END) AS pending
      FROM test_cases
    `);

    // This loads the latest test case updates.
    const recentActivity = await all(`
      SELECT title, status, priority, updated_at
      FROM test_cases
      ORDER BY updated_at DESC, id DESC
      LIMIT 5
    `);

    res.json({
      metrics: {
        total: totals.total || 0,
        passed: totals.passed || 0,
        failed: totals.failed || 0,
        pending: totals.pending || 0,
      },
      recentActivity,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to load dashboard data.",
    });
  }
});

module.exports = router;
