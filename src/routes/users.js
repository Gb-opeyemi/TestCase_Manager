const express = require("express");

const { all, get, run } = require("../config/database");
const { requireAuthenticated, requireCsrfToken, requireRole } = require("../middleware/auth");
const { createAuditLog } = require("../utils/audit");
const { sendServerError } = require("../utils/errors");
const { hashPassword } = require("../utils/passwords");
const {
  ROLE_OPTIONS,
  hasMaxLength,
  isValidEmail,
  isValidId,
  isValidOption,
  readValue,
} = require("../utils/validation");

const router = express.Router();

router.use(requireAuthenticated);
router.use(requireRole("Admin"));

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
    sendServerError(res, "users:list", error, "Unable to load users.");
  }
});

router.get("/users/:id", async (req, res) => {
  // This loads one user by id.
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({
      message: "User id is invalid.",
    });
    return;
  }

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
    sendServerError(res, "users:detail", error, "Unable to load user.");
  }
});

router.post("/users", requireCsrfToken, async (req, res) => {
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

  if (!hasMaxLength(fullName, 100)) {
    res.status(400).json({
      message: "Name is too long.",
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({
      message: "Email is invalid.",
    });
    return;
  }

  if (!hasMaxLength(password, 100) || password.length < 6) {
    res.status(400).json({
      message: "Password must be at least 6 characters.",
    });
    return;
  }

  if (!isValidOption(role, ROLE_OPTIONS)) {
    res.status(400).json({
      message: "Role is invalid.",
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

    createAuditLog(req, {
      action: "USER_CREATE",
      entityType: "USER",
      entityId: result.id,
      details: {
        email,
        role,
      },
    });
  } catch (error) {
    sendServerError(res, "users:create", error, "Unable to create user.");
  }
});

router.patch("/users/:id", requireCsrfToken, async (req, res) => {
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

  if (!isValidId(id)) {
    res.status(400).json({
      message: "User id is invalid.",
    });
    return;
  }

  if (!hasMaxLength(fullName, 100)) {
    res.status(400).json({
      message: "Name is too long.",
    });
    return;
  }

  if (!isValidEmail(email)) {
    res.status(400).json({
      message: "Email is invalid.",
    });
    return;
  }

  if (password && (!hasMaxLength(password, 100) || password.length < 6)) {
    res.status(400).json({
      message: "Password must be at least 6 characters.",
    });
    return;
  }

  if (!isValidOption(role, ROLE_OPTIONS)) {
    res.status(400).json({
      message: "Role is invalid.",
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

    createAuditLog(req, {
      action: "USER_UPDATE",
      entityType: "USER",
      entityId: id,
      details: {
        email,
        role,
      },
    });
  } catch (error) {
    sendServerError(res, "users:update", error, "Unable to update user.");
  }
});

router.delete("/users/:id", requireCsrfToken, async (req, res) => {
  // This removes a user by id.
  const { id } = req.params;

  if (!isValidId(id)) {
    res.status(400).json({
      message: "User id is invalid.",
    });
    return;
  }

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

    createAuditLog(req, {
      action: "USER_DELETE",
      entityType: "USER",
      entityId: id,
    });
  } catch (error) {
    sendServerError(res, "users:delete", error, "Unable to delete user.");
  }
});

module.exports = router;
