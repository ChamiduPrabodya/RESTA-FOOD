const { sanitizeUser } = require("../../models/User");
const { findUserByEmail } = require("../auth/authStore");
const { ADMIN_EMAIL } = require("../../config/env");
const { ROLES } = require("../../shared/constants/roles");

async function getMe(req, res) {
  const email = String(req.auth && req.auth.email ? req.auth.email : "").trim().toLowerCase();
  if (!email) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  if (email === String(ADMIN_EMAIL || "").trim().toLowerCase() && req.auth.role === ROLES.ADMIN) {
    return res.json({
      success: true,
      user: { email, role: ROLES.ADMIN, fullName: "Admin" },
    });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  return res.json({ success: true, user: sanitizeUser(user) });
}

module.exports = { getMe };

