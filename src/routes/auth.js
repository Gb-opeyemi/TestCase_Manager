const express = require("express");

const { get } = require("../config/database");

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
    // This query is built from user input to show SQL Injection
    const user = await get(`
      SELECT id, full_name, email, password, role
      FROM users
      WHERE email = '${email}' AND password = '${password}'
    `);

    if (!user) {
      res.status(401).json({
        message: "Invalid email or password.",
      });
      return;
    }

    res.json({
      user: {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        password: user.password,
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
