const express = require("express");

const { all, get, run } = require("../config/database");
const { requireAuthenticated, requireRole } = require("../middleware/auth");
const { hashPassword } = require("../utils/passwords");

const router = express.Router();

router.use(requireAuthenticated);
router.use(requireRole("Admin"));

function readValue(value, fallback = "") {
  return value?.toString().trim() || fallback;
}

router.get("/users", async (req, res) => {
  // This loads all users for the table.
  try {
    const users = await all(`
      SELECT id, full_name, email, role, created_at
      FROM users
      ORDER BY id DESC
    `);

    res.json(users);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/users/:id", async (req, res) => {
  // This loads one user by id.
  const { id } = req.params;

  try {
    // This lookup uses parameterized queries to avoid SQL Injection.
    const user = await get(
      `
        SELECT id, full_name, email, role, created_at
        FROM users
        WHERE id = ?
      `,
      [id]
    );

    if (!user) {
      res.status(404).json({
        message: "User not found.",
      });
      return;
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.post("/users", async (req, res) => {
  // This creates a new user from the form data.
  const fullName = readValue(req.body.fullName);
  const email = readValue(req.body.email).toLowerCase();
  const password = readValue(req.body.password);
  const role = readValue(req.body.role);

  if (!fullName || !email || !password || !role) {
    res.status(400).json({
      message: "Name, email, password, and role are required.",
    });
    return;
  }

  try {
    // This hashes the password before saving the new user.
    // This insert uses parameterized queries to avoid SQL Injection.
    const result = await run(
      `
        INSERT INTO users (full_name, email, password, role)
        VALUES (?, ?, ?, ?)
      `,
      [fullName, email, hashPassword(password), role]
    );

    res.status(201).json({
      id: result.id,
      message: "User created successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.patch("/users/:id", async (req, res) => {
  // This updates the selected user.
  const { id } = req.params;
  const fullName = readValue(req.body.fullName);
  const email = readValue(req.body.email).toLowerCase();
  const password = readValue(req.body.password);
  const role = readValue(req.body.role);

  if (!fullName || !email || !role) {
    res.status(400).json({
      message: "Name, email, and role are required.",
    });
    return;
  }

  try {
    // This lookup uses parameterized queries to avoid SQL Injection.
    const savedUser = await get(
      `
        SELECT password
        FROM users
        WHERE id = ?
      `,
      [id]
    );

    if (!savedUser) {
      res.status(404).json({
        message: "User not found.",
      });
      return;
    }

    // This keeps the old password unless a new one is entered.
    const nextPassword = password ? hashPassword(password) : savedUser.password;

    // This update uses parameterized queries to avoid SQL Injection.
    await run(
      `
        UPDATE users
        SET
          full_name = ?,
          email = ?,
          password = ?,
          role = ?
        WHERE id = ?
      `,
      [fullName, email, nextPassword, role, id]
    );

    res.json({
      message: "User updated successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.delete("/users/:id", async (req, res) => {
  // This removes a user by id.
  const { id } = req.params;

  try {
    // This delete uses parameterized queries to avoid SQL Injection.
    await run(
      `
        DELETE FROM users
        WHERE id = ?
      `,
      [id]
    );

    res.json({
      message: "User deleted successfully.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
