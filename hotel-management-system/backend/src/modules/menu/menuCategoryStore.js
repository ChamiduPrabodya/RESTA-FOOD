const mongoose = require("mongoose");

const { connectMongo } = require("../../shared/db/mongo");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true, index: true },
    createdAt: { type: String, trim: true },
    updatedAt: { type: String, trim: true },
  },
  { collection: "menu_categories", versionKey: false, strict: true }
);

const MenuCategoryModel = mongoose.models.MenuCategory || mongoose.model("MenuCategory", categorySchema);

const stripMongoFields = (doc) => {
  if (!doc) return null;
  // eslint-disable-next-line no-unused-vars
  const { _id, ...rest } = doc;
  return rest;
};

async function listCategories() {
  await connectMongo();
  const rows = await MenuCategoryModel.find({}).sort({ name: 1, _id: 1 }).lean();
  return rows.map(stripMongoFields);
}

async function replaceCategories(names) {
  await connectMongo();
  const now = new Date().toISOString();
  const list = (Array.isArray(names) ? names : [])
    .map((name) => String(name || "").trim())
    .filter(Boolean);

  await MenuCategoryModel.deleteMany({});
  if (list.length > 0) {
    await MenuCategoryModel.insertMany(
      list.map((name) => ({ name, createdAt: now, updatedAt: now })),
      { ordered: true }
    );
  }
  return list.length;
}

module.exports = { listCategories, replaceCategories };

