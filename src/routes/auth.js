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

    // This saves the signed-in user on the server session.
    req.session.user = {
      id: user.id,
      fullName: user.full_name,
      email: user.email,
      role: user.role,
    };

    req.session.save((sessionError) => {
      if (sessionError) {
        res.status(500).json({
          message: "Unable to start session.",
        });
        return;
      }

      res.json({
        user: req.session.user,
        redirectTo: "/dashboard.html",
      });
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/api/session", (req, res) => {
  // This returns the signed-in user from the server session.
  if (!req.session?.user) {
    res.status(401).json({
      message: "Please sign in to continue.",
    });
    return;
  }

  res.json({
    user: req.session.user,
  });
});

router.post("/logout", (req, res) => {
  // This clears the current session from the server.
  req.session.destroy((error) => {
    if (error) {
      res.status(500).json({
        message: "Unable to sign out.",
      });
      return;
    }

    res.clearCookie("connect.sid");
    res.json({
      redirectTo: "/login.html",
    });
  });
});

module.exports = router;
