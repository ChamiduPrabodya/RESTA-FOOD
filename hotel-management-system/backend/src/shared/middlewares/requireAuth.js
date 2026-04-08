const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../../config/env");

function requireAuth(requiredRole) {
  return function requireAuthMiddleware(req, res, next) {
    const header = String(req.headers.authorization || "").trim();
    const [, token] = header.split(" ");
    if (!header.toLowerCase().startsWith("bearer ") || !token) {
      return res.status(401).json({ success: false, message: "Missing Authorization token." });
    }

    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.auth = payload;
      if (requiredRole && payload.role !== requiredRole) {
        return res.status(403).json({ success: false, message: "Forbidden." });
      }
      return next();
    } catch {
      return res.status(401).json({ success: false, message: "Invalid token." });
    }
  };
}

module.exports = { requireAuth };

