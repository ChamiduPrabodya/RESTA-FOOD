const bcrypt = require("bcryptjs");

const { ADMIN_EMAIL, ADMIN_PASSWORD } = require("../../config/env");
const { ROLES } = require("../../shared/constants/roles");
const { findUserByEmail, addUser, updateUserByEmail } = require("./authStore");

async function ensureAdminUser() {
  const email = String(ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(ADMIN_PASSWORD || "");

  if (!email || !password) {
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("Admin user seed skipped (set ADMIN_EMAIL and ADMIN_PASSWORD in backend/.env).");
    }
    return { seeded: false, reason: "missing_admin_env" };
  }

  const now = new Date().toISOString();
  const existing = await findUserByEmail(email);
  if (existing) {
    const hasPasswordHash = Boolean(existing.passwordHash);
    const updates = {
      ...existing,
      email,
      role: ROLES.ADMIN,
      authProvider: existing.authProvider || "local",
      fullName: String(existing.fullName || "").trim() || "Admin",
      lastActiveAt: existing.lastActiveAt || now,
    };

    if (!hasPasswordHash) {
      updates.passwordHash = await bcrypt.hash(password, 10);
    }

    await updateUserByEmail(email, () => updates);
    return { seeded: true, created: false, updated: true };
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await addUser({
    email,
    role: ROLES.ADMIN,
    fullName: "Admin",
    phone: "",
    streetAddress1: "",
    streetAddress2: "",
    cityTown: "",
    address: "",
    authProvider: "local",
    createdAt: now,
    lastActiveAt: now,
    passwordHash,
  });

  return { seeded: true, created: true, updated: false };
}

module.exports = { ensureAdminUser };

