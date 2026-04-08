function notFound(req, res, _next) {
  return res.status(404).json({
    success: false,
    message: `Not Found: ${req.method} ${req.originalUrl}`,
  });
}

module.exports = { notFound };

