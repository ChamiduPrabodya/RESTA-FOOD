function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles].filter(Boolean);

  return function requireRoleMiddleware(req, res, next) {
    const role = req && req.auth ? req.auth.role : undefined;
    if (!role) {
      return res.status(401).json({ success: false, message: "Unauthorized." });
    }
    if (roles.length > 0 && !roles.includes(role)) {
      return res.status(403).json({ success: false, message: "Forbidden." });
    }
    return next();
  };
}

module.exports = { requireRole };

