const mongoose = require("mongoose");

const { connectMongo } = require("../shared/db/mongo");

const COLLECTION_GROUPS = [
  { canonical: "loyalty_rules", legacy: ["loyaltyrules"] },
  { canonical: "loyalty_purchases", legacy: ["loyaltypurchases"] },
  { canonical: "menu_items", legacy: ["menuitems"] },
  { canonical: "menu_categories", legacy: ["menucategories"] },
];

async function getCount(db, name) {
  try {
    return await db.collection(name).estimatedDocumentCount();
  } catch {
    return null;
  }
}

async function main() {
  await connectMongo();
  const db = mongoose.connection.db;

  const all = await db.listCollections({}, { nameOnly: true }).toArray();
  const existing = new Set(all.map((row) => row && row.name).filter(Boolean));

  const rows = [];
  for (const group of COLLECTION_GROUPS) {
    const canonicalExists = existing.has(group.canonical);
    const canonicalCount = canonicalExists ? await getCount(db, group.canonical) : null;
    rows.push({
      label: group.canonical,
      kind: "canonical",
      exists: canonicalExists,
      count: canonicalCount,
    });

    for (const legacyName of group.legacy) {
      const legacyExists = existing.has(legacyName);
      const legacyCount = legacyExists ? await getCount(db, legacyName) : null;
      rows.push({
        label: legacyName,
        kind: "legacy",
        exists: legacyExists,
        count: legacyCount,
      });
    }
  }

  // eslint-disable-next-line no-console
  console.log("Mongo collections report (canonical vs legacy):");
  rows.forEach((row) => {
    const status = row.exists ? "exists" : "missing";
    const count = row.exists ? `count=${row.count ?? "?"}` : "";
    // eslint-disable-next-line no-console
    console.log(`- ${row.kind.padEnd(9)} ${row.label.padEnd(18)} ${status} ${count}`.trim());
  });

  // eslint-disable-next-line no-console
  console.log("");
  // eslint-disable-next-line no-console
  console.log("How to fix duplicates:");
  // eslint-disable-next-line no-console
  console.log("- Keep the canonical *_* collections (used by the backend).");
  // eslint-disable-next-line no-console
  console.log("- If a legacy collection is empty, you can drop it in MongoDB UI.");
  // eslint-disable-next-line no-console
  console.log("- If a legacy collection has data and canonical is empty, migrate by renaming/copying legacy -> canonical, then drop legacy.");
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    try {
      await mongoose.disconnect();
    } catch {
      // ignore
    }
  });

