const { sanitizeUser } = require("../../models/User");
const { findUserByEmail } = require("../auth/authStore");
const { updateUserByEmail } = require("../auth/authStore");
const { ROLES } = require("../../shared/constants/roles");

const isValidPhone = (value) => /^[0-9+\-\s]{9,15}$/.test(String(value || "").trim());
const formatAddress = ({ streetAddress1, streetAddress2, cityTown } = {}) => {
  const parts = [
    String(streetAddress1 || "").trim(),
    String(streetAddress2 || "").trim(),
    String(cityTown || "").trim(),
  ].filter(Boolean);
  return parts.join(", ");
};

async function getMe(req, res) {
  const email = String(req.auth && req.auth.email ? req.auth.email : "").trim().toLowerCase();
  if (!email) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(404).json({ success: false, message: "User not found." });
  }

  return res.json({ success: true, user: sanitizeUser(user) });
}

async function updateMe(req, res) {
  const email = String(req.auth && req.auth.email ? req.auth.email : "").trim().toLowerCase();
  const role = req.auth && req.auth.role ? req.auth.role : undefined;

  if (!email) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }
  if (role !== ROLES.USER) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const body = req.body && typeof req.body === "object" ? req.body : {};
  const fullName = String(body.fullName || "").trim();
  const phone = String(body.phone || "").trim();
  const streetAddress1 = String(body.streetAddress1 || "").trim();
  const streetAddress2 = String(body.streetAddress2 || "").trim();
  const cityTown = String(body.cityTown || "").trim();
  const address = String(body.address || "").trim() || formatAddress({ streetAddress1, streetAddress2, cityTown });

  if (fullName.length < 2) {
    return res.status(400).json({ success: false, message: "Full name must be at least 2 characters." });
  }
  if (!isValidPhone(phone)) {
    return res.status(400).json({ success: false, message: "Please enter a valid phone number." });
  }
  if (streetAddress1.length < 3) {
    return res.status(400).json({ success: false, message: "Please enter a valid street address." });
  }
  if (cityTown.length < 2) {
    return res.status(400).json({ success: false, message: "Please enter a valid town/city." });
  }

  const now = new Date().toISOString();
  await updateUserByEmail(email, (current) => ({
    ...current,
    fullName,
    phone,
    streetAddress1,
    streetAddress2,
    cityTown,
    address,
    lastActiveAt: now,
  }));

  const next = await findUserByEmail(email);
  return res.json({ success: true, user: sanitizeUser(next) });
}

module.exports = { getMe, updateMe };

