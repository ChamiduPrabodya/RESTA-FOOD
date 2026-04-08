function errorHandler(err, req, res, _next) {
  if (res.headersSent) {
    return;
  }

  const status = Number(err && err.status ? err.status : 500) || 500;
  const isServerError = status >= 500;

  const isBadJson =
    err &&
    (err.type === "entity.parse.failed" ||
      err.type === "entity.too.large" ||
      err.name === "SyntaxError");

  const resolvedStatus = isBadJson ? 400 : status;
  const message = isBadJson
    ? "Invalid JSON body."
    : isServerError
      ? "Internal server error."
      : String((err && err.message) || "Error");

  if (isServerError && process.env.NODE_ENV !== "production") {
    // eslint-disable-next-line no-console
    console.error("Unhandled error:", err);
  }

  return res.status(resolvedStatus).json({ success: false, message });
}

module.exports = { errorHandler };

