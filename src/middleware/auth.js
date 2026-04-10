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

module.exports = {
  requireAuthenticated,
};
