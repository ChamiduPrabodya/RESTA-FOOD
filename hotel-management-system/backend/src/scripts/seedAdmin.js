// One-off helper to (re)seed the admin user in MongoDB.
// Uses ADMIN_EMAIL + ADMIN_PASSWORD from backend/.env.

const mongoose = require("mongoose");

// Loads backend/.env via config/env side effect.
// eslint-disable-next-line no-unused-vars
const _env = require("../config/env");
const { connectMongo } = require("../shared/db/mongo");
const { ensureAdminUser } = require("../modules/auth/seedAdminUser");

async function main() {
  await connectMongo();
  const result = await ensureAdminUser();
  // eslint-disable-next-line no-console
  console.log(JSON.stringify(result, null, 2));
  await mongoose.disconnect();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Admin seed failed:", error && error.message ? error.message : error);
  process.exit(1);
});

