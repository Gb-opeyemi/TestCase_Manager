const express = require("express");

const { get } = require("../config/database");
const { verifyPassword } = require("../utils/passwords");
const { escapeSqlValue } = require("../utils/sql");

const router = express.Router();

router.post("/login", async (req, res) => {
  // This reads the login form values.
  const email = req.body.email?.trim().toLowerCase();
  const password = req.body.password?.trim();

  if (!email || !password) {
    res.status(400).json({
      message: "Email and password are required.",
    });
    return;
  }

  try {
    // This loads the user first, then checks the password hash in code.
    const user = await get(`
      SELECT id, full_name, email, password, role
      FROM users
      WHERE email = '${escapeSqlValue(email)}'
    `);

    if (!user || !verifyPassword(password, user.password)) {
      res.status(401).json({
        message: "Invalid email or password.",
      });
      return;
    }

    // This sends only the user fields needed by the UI.
    res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      },
      redirectTo: "/dashboard.html",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

module.exports = router;
