const express = require("express");
const cors = require("cors");

const { PORT, CLIENT_ORIGIN } = require("./config/env");
const { apiRouter } = require("./routes");

async function main() {
  const app = express();

  app.use(express.json({ limit: "1mb" }));
  app.use(
    cors({
      origin: CLIENT_ORIGIN,
      credentials: true,
    })
  );

  app.use("/api", apiRouter);

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error("Fatal startup error:", error);
  process.exitCode = 1;
});
