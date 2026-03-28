const dotenv = require("dotenv");

dotenv.config();

module.exports = {
  PORT: Number(process.env.PORT) || 5000,
  CLIENT_ORIGIN: String(process.env.CLIENT_ORIGIN || "http://localhost:5173").trim(),
  JWT_SECRET: String(process.env.JWT_SECRET || "dev_secret_change_me").trim(),
  // Included for compatibility with earlier backend versions (not used by this auth-only backend yet)
  MONGODB_URI: String(process.env.MONGODB_URI || process.env.DATABASE_URI || "").trim(),
};

