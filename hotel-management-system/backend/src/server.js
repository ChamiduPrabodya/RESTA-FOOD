const express = require("express");
const cors = require("cors");
const { PORT, MONGODB_URI, CLIENT_ORIGIN, missingEnvKeys } = require("./config/env");
const { connectMongo } = require("./database/connectMongo");

async function main() {
  if (missingEnvKeys.length > 0) {
    console.error(`Missing environment variables: ${missingEnvKeys.join(", ")}`);
    process.exitCode = 1;
    return;
  }

  await connectMongo(MONGODB_URI);

  const app = express();
  app.use(express.json({ limit: "2mb" }));
  app.use(
    cors({
      origin: CLIENT_ORIGIN,
      credentials: true,
    })
  );

  app.get("/api/health", (_req, res) => res.json({ ok: true }));

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exitCode = 1;
});
