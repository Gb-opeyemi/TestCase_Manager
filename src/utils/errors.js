function logServerError(context, error) {
  // This logs the server error with a short label.
  console.error(`[${context}] ${error?.code || "ERROR"}: ${error?.message || "Unknown error"}`);
}

function sendServerError(res, context, error, fallbackMessage = "Something went wrong.") {
  // This sends a safe error message to the browser.
  logServerError(context, error);

  if (error?.code === "SQLITE_CONSTRAINT") {
    res.status(409).json({
      message: "That record already exists.",
    });
    return;
  }

  res.status(500).json({
    message: fallbackMessage,
  });
}

module.exports = {
  logServerError,
  sendServerError,
};
