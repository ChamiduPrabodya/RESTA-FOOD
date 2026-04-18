const express = require("express");
const cors = require("cors");
const fs = require("node:fs");
const path = require("node:path");

const { HOST, PORT, CLIENT_ORIGIN, CLIENT_ORIGINS } = require("./config/env");
const { connectMongo } = require("./shared/db/mongo");
const { ensureAdminUser } = require("./modules/auth/seedAdminUser");
const { apiRouter } = require("./routes");
const { notFound } = require("./shared/middlewares/notFound");
const { errorHandler } = require("./shared/middlewares/errorHandler");

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function isPrivateIp(hostname) {
  const host = String(hostname || "").trim();
  if (!host) return false;
  const match = host.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (!match) return false;
  const a = Number(match[1]);
  const b = Number(match[2]);
  if (!Number.isFinite(a) || !Number.isFinite(b)) return false;

  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 192 && b === 168) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  return false;
}

function isAllowedDevOrigin(origin) {
  try {
    const url = new URL(String(origin || ""));
    if (!["http:", "https:"].includes(url.protocol)) return false;
    if (url.hostname === "localhost") return true;
    if (url.hostname.endsWith(".local")) return true;
    return isPrivateIp(url.hostname);
  } catch {
    return false;
  }
}

async function main() {
  await connectMongo();
  await ensureAdminUser();
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  // PayHere (and some gateways) send notify_url payloads as form-encoded POSTs.
  app.use(express.urlencoded({ extended: false }));
  app.use(
    cors({
      origin: (origin, callback) => {
        const allowed = [...parseCsv(CLIENT_ORIGINS), String(CLIENT_ORIGIN || "").trim()].filter(Boolean);
        const allowAll = allowed.includes("*") || allowed.includes("all");

        // Non-browser / same-origin scenarios.
        if (!origin) return callback(null, true);
        if (allowAll) return callback(null, true);
        if (allowed.length > 0 && allowed.includes(origin)) return callback(null, true);

        // Dev convenience: allow private-network origins by default.
        if (process.env.NODE_ENV !== "production" && isAllowedDevOrigin(origin)) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
    })
  );

  app.use("/api", apiRouter);

  // Production: serve the built frontend from the same Railway service.
  const frontendDist = path.join(__dirname, "..", "..", "frontend", "dist");
  const indexHtml = path.join(frontendDist, "index.html");
  if (fs.existsSync(frontendDist) && fs.existsSync(indexHtml)) {
    app.use(express.static(frontendDist));
    app.get("*", (req, res, next) => {
      if (String(req.path || "").startsWith("/api")) return next();
      return res.sendFile(indexHtml);
    });
  }

  app.use(notFound);
  app.use(errorHandler);

  await new Promise((resolve, reject) => {
    const server = app.listen(PORT, HOST, () => {
      console.log(`API listening on http://${HOST}:${PORT}`);
      resolve();
    });
    server.on("error", reject);
  });
}

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exitCode = 1;
});
