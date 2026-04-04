// Seeds MongoDB menu_categories from existing menu_items.
// Safe by default: only seeds when menu_categories is empty.
// Use --force to overwrite existing categories.

const mongoose = require("mongoose");

// Loads backend/.env via config/env side effect.
// eslint-disable-next-line no-unused-vars
const _env = require("../config/env");
const { connectMongo } = require("../shared/db/mongo");
const { getMenuItems } = require("../modules/menu/menuService");
const { getMenuCategories, saveMenuCategories } = require("../modules/menu/menuCategoryService");

async function main() {
  const force = process.argv.includes("--force");

  await connectMongo();

  const existing = await getMenuCategories();
  if (!force && existing.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        { seeded: false, reason: "already_has_categories", existingCount: existing.length, db: mongoose.connection.db.databaseName },
        null,
        2
      )
    );
    await mongoose.disconnect();
    return;
  }

  const items = await getMenuItems();
  const categories = [...new Set(items.map((item) => String(item.category || "").trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b)
  );

  const saved = await saveMenuCategories(categories);
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      { seeded: true, inserted: saved.length, db: mongoose.connection.db.databaseName, categories: saved },
      null,
      2
    )
  );
  await mongoose.disconnect();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Menu categories seed failed:", error && error.message ? error.message : error);
  process.exit(1);
});

