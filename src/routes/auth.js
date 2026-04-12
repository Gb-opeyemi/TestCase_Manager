const express = require("express");

const { get } = require("../config/database");
const { requireCsrfToken } = require("../middleware/auth");
const { sendServerError } = require("../utils/errors");
const { verifyPassword } = require("../utils/passwords");
const {
  clearFailedAttempts,
  getClientKey,
  isRateLimited,
  recordFailedAttempt,
  WINDOW_MS,
} = require("../utils/rate-limit");
const { isValidEmail, readValue } = require("../utils/validation");

const router = express.Router();

router.post("/login", async (req, res) => {
  // This reads the login form values.
  const email = readValue(req.body.email).toLowerCase();
  const password = readValue(req.body.password);
  const attemptKey = getClientKey(req, email);

  if (!email || !password || !isValidEmail(email)) {
    res.status(400).json({
      message: "Enter a valid email and password.",
    });
    return;
  }

  if (isRateLimited(attemptKey)) {
    res.status(429).json({
      message: "Too many login attempts. Please try again later.",
      retryAfterMinutes: Math.ceil(WINDOW_MS / 60000),
    });
    return;
  }

  try {
    // This loads the user first, then checks the password hash in code.
    // This query uses parameterized queries to avoid SQL Injection.
    const user = await get(
      `
        SELECT id, full_name, email, password, role
        FROM users
        WHERE email = ?
      `,
      [email]
    );

    if (!user || !verifyPassword(password, user.password)) {
      recordFailedAttempt(attemptKey);
      res.status(401).json({
        message: "Invalid email or password.",
      });
      return;
    }

    clearFailedAttempts(attemptKey);

    // This regenerates the session after a good login.
    req.session.regenerate((sessionError) => {
      if (sessionError) {
        sendServerError(res, "auth:login:session", sessionError, "Unable to sign in right now.");
        return;
      }

      req.session.user = {
        id: user.id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
      };

      req.session.save((saveError) => {
        if (saveError) {
          sendServerError(res, "auth:login:save", saveError, "Unable to sign in right now.");
          return;
        }

        res.json({
          user: req.session.user,
          redirectTo: "/dashboard.html",
        });
      });
    });
  } catch (error) {
    sendServerError(res, "auth:login", error, "Unable to sign in right now.");
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
    csrfToken: req.session.csrfToken,
  });
});

router.post("/logout", requireCsrfToken, (req, res) => {
  // This clears the current session from the server.
  req.session.destroy((error) => {
    if (error) {
      sendServerError(res, "auth:logout", error, "Unable to sign out right now.");
      return;
    }

    res.clearCookie("connect.sid");
    res.json({
      redirectTo: "/login.html",
    });
  });
});

module.exports = router;
