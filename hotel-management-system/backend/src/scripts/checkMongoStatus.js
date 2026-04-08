const mongoose = require("mongoose");

// Loads backend/.env via config/env side effect.
// eslint-disable-next-line no-unused-vars
const _env = require("../config/env");
const { connectMongo } = require("../shared/db/mongo");

async function getCounts(db) {
  const collections = ["users", "loyalty_rules", "loyalty_purchases", "loyalty_audit"];
  const entries = await Promise.all(
    collections.map(async (name) => {
      try {
        const count = await db.collection(name).countDocuments();
        return [name, count];
      } catch {
        return [name, 0];
      }
    })
  );
  return Object.fromEntries(entries);
}

async function getLatestPurchase(db) {
  try {
    const doc = await db
      .collection("loyalty_purchases")
      .find({})
      .project({ _id: 0 })
      .sort({ createdAt: -1, id: 1 })
      .limit(1)
      .next();
    return doc || null;
  } catch {
    return null;
  }
}

async function main() {
  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection not ready.");

  const counts = await getCounts(db);
  const latestPurchase = await getLatestPurchase(db);

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        connected: true,
        db: db.databaseName,
        counts,
        latestPurchase,
      },
      null,
      2
    )
  );
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error("Status check failed:", error && error.message ? error.message : error);
    process.exit(1);
  });

