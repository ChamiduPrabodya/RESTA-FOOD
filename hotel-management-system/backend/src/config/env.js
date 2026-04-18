const dotenv = require("dotenv");
const path = require("node:path");

dotenv.config({ path: path.join(__dirname, "../../.env") });

module.exports = {
  HOST: String(process.env.HOST || "0.0.0.0").trim(),
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_ORIGIN: String(process.env.CLIENT_ORIGIN || "http://localhost:5173").trim(),
  CLIENT_ORIGINS: String(process.env.CLIENT_ORIGINS || "").trim(),
  PUBLIC_FRONTEND_ORIGIN: String(process.env.PUBLIC_FRONTEND_ORIGIN || "").trim(),
  JWT_SECRET: String(process.env.JWT_SECRET || "dev_secret_change_me").trim(),
  ADMIN_EMAIL: String(process.env.ADMIN_EMAIL || "").trim().toLowerCase(),
  ADMIN_PASSWORD: String(process.env.ADMIN_PASSWORD || ""),
  GOOGLE_CLIENT_ID: String(process.env.GOOGLE_CLIENT_ID || "").trim(),
  MONGODB_URI: String(process.env.MONGODB_URI || process.env.DATABASE_URI || "").trim(),
  MONGODB_URI_FALLBACK: String(process.env.MONGODB_URI_FALLBACK || "").trim(),
  MONGODB_DB_NAME: String(process.env.MONGODB_DB_NAME || "").trim(),
  MONGODB_DNS_SERVERS: String(process.env.MONGODB_DNS_SERVERS || "").trim(),

  // PayHere (Checkout API)
  PAYHERE_MERCHANT_ID: String(process.env.PAYHERE_MERCHANT_ID || "").trim(),
  PAYHERE_MERCHANT_SECRET: String(process.env.PAYHERE_MERCHANT_SECRET || "").trim(),
  PAYHERE_CURRENCY: String(process.env.PAYHERE_CURRENCY || "LKR").trim(),
  PAYHERE_SANDBOX: String(process.env.PAYHERE_SANDBOX || "").trim().toLowerCase() === "true",
  PAYHERE_RETURN_URL: String(process.env.PAYHERE_RETURN_URL || "").trim(),
  PAYHERE_CANCEL_URL: String(process.env.PAYHERE_CANCEL_URL || "").trim(),
  PAYHERE_NOTIFY_URL: String(process.env.PAYHERE_NOTIFY_URL || "").trim(),
};
