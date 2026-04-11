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
  requireAuthenticated,
  requireRole,
};
