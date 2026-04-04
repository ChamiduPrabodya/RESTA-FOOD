const express = require("express");
const cors = require("cors");

const { PORT, CLIENT_ORIGIN } = require("./config/env");
const { connectMongo } = require("./shared/db/mongo");
const { ensureAdminUser } = require("./modules/auth/seedAdminUser");
const { apiRouter } = require("./routes");
const { notFound } = require("./shared/middlewares/notFound");
const { errorHandler } = require("./shared/middlewares/errorHandler");

async function main() {
  await connectMongo();
  await ensureAdminUser();
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin: CLIENT_ORIGIN,
      credentials: true,
    })
  );

  app.use("/api", apiRouter);

  app.use(notFound);
  app.use(errorHandler);

  await new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`API listening on http://localhost:${PORT}`);
      resolve();
    });
    server.on("error", reject);
  });
}

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exitCode = 1;
});
