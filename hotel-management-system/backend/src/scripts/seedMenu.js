// Seeds MongoDB menu_items with a small starter set (id/name/category/portions/loyaltyPoints).
// Safe by default: only seeds when the collection is empty.
// Use --force to seed even when items exist.

const mongoose = require("mongoose");

// Loads backend/.env via config/env side effect.
// eslint-disable-next-line no-unused-vars
const _env = require("../config/env");
const { connectMongo } = require("../shared/db/mongo");
const { getMenuItems, saveMenuItems } = require("../modules/menu/menuService");

const SEED_ITEMS = [
  {
    id: "menu-cheese-kottu",
    name: "Cheese Kottu",
    category: "Kottu",
    description: "Freshly made paratha chopped with vegetables and creamy cheese sauce.",
    portions: { Small: "SLR 850", Medium: "SLR 1,150", Large: "SLR 1,450" },
    image: "/images/home/popular-01.svg",
    outOfStock: false,
    loyaltyPoints: 25,
  },
  {
    id: "menu-chicken-biriyani",
    name: "Chicken Biriyani",
    category: "Biriyani",
    description: "Fragrant basmati rice cooked with aromatic spices and tender chicken.",
    portions: { Small: "SLR 950", Medium: "SLR 1,250", Large: "SLR 1,550" },
    image: "/images/home/popular-02.svg",
    outOfStock: false,
    loyaltyPoints: 30,
  },
  {
    id: "menu-deviled-chicken",
    name: "Deviled Chicken",
    category: "Deviled",
    description: "Spicy and tangy chicken stir-fried with onions and peppers.",
    portions: { "300g": "SLR 1,200", "500g": "SLR 1,800", "1kg": "SLR 3,300" },
    image: "/images/home/popular-03.svg",
    outOfStock: false,
    loyaltyPoints: 35,
  },
];

async function main() {
  const force = process.argv.includes("--force");

  await connectMongo();

  const existing = await getMenuItems();
  if (!force && Array.isArray(existing) && existing.length > 0) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        { seeded: false, reason: "already_has_items", existingCount: existing.length, db: mongoose.connection.db.databaseName },
        null,
        2
      )
    );
    await mongoose.disconnect();
    return;
  }

  const saved = await saveMenuItems(SEED_ITEMS);
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify(
      { seeded: true, inserted: saved.length, db: mongoose.connection.db.databaseName, ids: saved.map((i) => i.id) },
      null,
      2
    )
  );
  await mongoose.disconnect();
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Menu seed failed:", error && error.message ? error.message : error);
  process.exit(1);
});

