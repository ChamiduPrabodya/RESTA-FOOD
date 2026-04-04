const fs = require("node:fs/promises");
const path = require("node:path");

const mongoose = require("mongoose");

// Loads backend/.env via config/env side effect.
// eslint-disable-next-line no-unused-vars
const _env = require("../config/env");
const { connectMongo } = require("../shared/db/mongo");

// Legacy JSON store location (used only for one-time migration).
const DATA_DIR = path.join(__dirname, "../../.data");

const DEFAULT_RULES = [
  { id: "r1", threshold: "2000", discount: "1" },
  { id: "r2", threshold: "5000", discount: "3" },
  { id: "r3", threshold: "10000", discount: "5" },
];

async function readJson(fileName, fallback) {
  const filePath = path.join(DATA_DIR, fileName);
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

async function upsertUsers(db, users) {
  const collection = db.collection("users");
  const rows = Array.isArray(users) ? users : [];
  const ops = rows
    .map((user) => {
      const email = normalizeEmail(user && user.email ? user.email : "");
      if (!email) return null;
      const doc = { ...(user || {}), email };
      return {
        updateOne: {
          filter: { email },
          update: { $set: doc },
          upsert: true,
        },
      };
    })
    .filter(Boolean);

  if (ops.length === 0) return { attempted: 0, upserted: 0 };
  const result = await collection.bulkWrite(ops, { ordered: false });
  return { attempted: ops.length, upserted: result.upsertedCount || 0 };
}

async function replaceRules(db, rules) {
  const collection = db.collection("loyalty_rules");
  const rows = Array.isArray(rules) && rules.length > 0 ? rules : DEFAULT_RULES;

  await collection.deleteMany({});
  if (rows.length > 0) {
    await collection.insertMany(
      rows.map((rule) => ({
        id: String(rule && rule.id ? rule.id : "").trim(),
        threshold: String(rule && rule.threshold !== undefined ? rule.threshold : "").trim(),
        discount: String(rule && rule.discount !== undefined ? rule.discount : "").trim(),
      })),
      { ordered: true }
    );
  }
  return { inserted: rows.length };
}

async function upsertPurchases(db, purchases) {
  const collection = db.collection("loyalty_purchases");
  const rows = Array.isArray(purchases) ? purchases : [];

  const ops = rows
    .map((purchase) => {
      const id = String(purchase && purchase.id ? purchase.id : "").trim();
      const userEmail = normalizeEmail(purchase && purchase.userEmail ? purchase.userEmail : "");
      if (!id || !userEmail) return null;
      const doc = { ...(purchase || {}), id, userEmail };
      return {
        updateOne: {
          filter: { userEmail, id },
          update: { $setOnInsert: doc },
          upsert: true,
        },
      };
    })
    .filter(Boolean);

  if (ops.length === 0) return { attempted: 0, upserted: 0 };
  const result = await collection.bulkWrite(ops, { ordered: false });
  return { attempted: ops.length, upserted: result.upsertedCount || 0 };
}

async function appendAudit(db, entries, { maxEntries = 2000 } = {}) {
  const collection = db.collection("loyalty_audit");
  const rows = (Array.isArray(entries) ? entries : []).filter((row) => row && typeof row === "object");

  if (rows.length > 0) {
    await collection.insertMany(rows, { ordered: false });
  }

  const limit = Math.max(1, Number(maxEntries) || 2000);
  const stale = await collection.find({}).project({ _id: 1 }).sort({ at: -1, _id: -1 }).skip(limit).toArray();
  if (stale.length > 0) {
    await collection.deleteMany({ _id: { $in: stale.map((row) => row._id) } });
  }

  return { inserted: rows.length, trimmed: stale.length };
}

async function wipeCollections(db) {
  await Promise.all([
    db.collection("users").deleteMany({}),
    db.collection("loyalty_rules").deleteMany({}),
    db.collection("loyalty_purchases").deleteMany({}),
    db.collection("loyalty_audit").deleteMany({}),
  ]);
}

async function main() {
  const shouldWipe = process.argv.includes("--wipe");

  await connectMongo();
  const db = mongoose.connection.db;
  if (!db) throw new Error("MongoDB connection not ready.");

  if (shouldWipe) {
    await wipeCollections(db);
  }

  const usersJson = await readJson("users.json", { users: [] });
  const purchasesJson = await readJson("purchases.json", { purchases: [] });
  const rulesJson = await readJson("loyaltyRules.json", { rules: DEFAULT_RULES });
  const auditJson = await readJson("loyaltyAudit.json", { entries: [] });

  const usersResult = await upsertUsers(db, usersJson.users);
  const rulesResult = await replaceRules(db, rulesJson.rules);
  const purchasesResult = await upsertPurchases(db, purchasesJson.purchases);
  const auditResult = await appendAudit(db, auditJson.entries, { maxEntries: 2000 });

  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      {
        wiped: shouldWipe,
        users: usersResult,
        rules: rulesResult,
        purchases: purchasesResult,
        audit: auditResult,
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
    console.error("Migration failed:", error && error.message ? error.message : error);
    process.exit(1);
  });
