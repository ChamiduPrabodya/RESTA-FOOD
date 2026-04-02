function httpError(status, message) {
  const error = new Error(String(message || "Error"));
  error.status = Number(status) || 500;
  return error;
}

module.exports = { httpError };

