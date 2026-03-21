const dotenv = require("dotenv");

dotenv.config();

const required = ["MONGODB_URI"];
const missing = required.filter((key) => !String(process.env[key] || "").trim());

module.exports = {
  PORT: Number(process.env.PORT) || 5000,
  MONGODB_URI: String(process.env.MONGODB_URI || "").trim(),
  CLIENT_ORIGIN: String(process.env.CLIENT_ORIGIN || "http://localhost:5173").trim(),
  missingEnvKeys: missing,
};

