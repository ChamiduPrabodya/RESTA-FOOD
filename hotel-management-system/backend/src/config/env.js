const dotenv = require("dotenv");
const path = require("node:path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_ORIGIN: String(process.env.CLIENT_ORIGIN || "http://localhost:5173").trim(),
  JWT_SECRET: String(process.env.JWT_SECRET || "dev_secret_change_me").trim(),
  ADMIN_EMAIL: String(process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  ADMIN_PASSWORD: String(process.env.ADMIN_PASSWORD || ""),
  GOOGLE_CLIENT_ID: String(process.env.GOOGLE_CLIENT_ID || "").trim(),
  MONGODB_URI: String(process.env.MONGODB_URI || process.env.DATABASE_URI || "").trim(),
  MONGODB_DB_NAME: String(process.env.MONGODB_DB_NAME || "").trim(),
};
