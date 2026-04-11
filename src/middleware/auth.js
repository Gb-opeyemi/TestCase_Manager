const crypto = require("crypto");

function requireAuthenticated(req, res, next) {
  // This blocks requests when no session user is present.
  if (!req.session?.user) {
    res.status(401).json({
      message: "Please sign in to continue.",
    });
    return;
  }

  next();
}

function ensureCsrfToken(req, res, next) {
  // This creates a CSRF token for the current session.
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString("hex");
  }

  next();
}

function requireCsrfToken(req, res, next) {
  // This blocks writes when the CSRF token is missing or wrong.
  const csrfHeader = req.get("x-csrf-token");

  if (!req.session?.csrfToken || !csrfHeader || csrfHeader !== req.session.csrfToken) {
    res.status(403).json({
      message: "CSRF token is missing or invalid.",
    });
    return;
  }

  next();
}

function requireRole(...allowedRoles) {
  // This blocks requests when the user role is not allowed.
  return (req, res, next) => {
    const userRole = req.session?.user?.role;

    if (!userRole || !allowedRoles.includes(userRole)) {
      res.status(403).json({
        message: "You do not have permission to perform this action.",
      });
      return;
    }

    next();
  };
}

module.exports = {
  ensureCsrfToken,
  requireCsrfToken,
  requireAuthenticated,
  requireRole,
};
