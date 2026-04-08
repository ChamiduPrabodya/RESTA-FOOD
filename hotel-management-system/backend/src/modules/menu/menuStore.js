const mongoose = require("mongoose");

const { connectMongo } = require("../../shared/db/mongo");

const menuItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true, index: true, unique: true },
    name: { type: String, required: true, trim: true },
    nameLower: { type: String, required: true, trim: true, index: true },
    category: { type: String, trim: true },
    description: { type: String, trim: true },
    portions: { type: Object, default: {} },
    image: { type: String, trim: true },
    outOfStock: { type: Boolean, default: false },
    loyaltyPoints: { type: Number },
    createdAt: { type: String, trim: true },
    updatedAt: { type: String, trim: true },
  },
  { collection: "menu_items", versionKey: false, strict: false }
);

const MenuItemModel = mongoose.models.MenuItem || mongoose.model("MenuItem", menuItemSchema);

const stripMongoFields = (doc) => {
  if (!doc) return null;
  // eslint-disable-next-line no-unused-vars
  const { _id, ...rest } = doc;
  return rest;
};

async function listMenuItems() {
  await connectMongo();
  const items = await MenuItemModel.find({}).sort({ category: 1, name: 1, _id: 1 }).lean();
  return items.map(stripMongoFields);
}

async function replaceMenuItems(items) {
  await connectMongo();
  const list = Array.isArray(items) ? items : [];
  await MenuItemModel.deleteMany({});
  if (list.length > 0) {
    await MenuItemModel.insertMany(list, { ordered: true });
  }
  return list.length;
}

async function findMenuItemsByIds(ids) {
  await connectMongo();
  const list = (Array.isArray(ids) ? ids : []).map((id) => String(id || "").trim()).filter(Boolean);
  if (list.length === 0) return [];
  const items = await MenuItemModel.find({ id: { $in: list } }).lean();
  return items.map(stripMongoFields);
}

async function findMenuItemsByNames(names) {
  await connectMongo();
  const list = (Array.isArray(names) ? names : [])
    .map((name) => String(name || "").trim().toLowerCase())
    .filter(Boolean);
  if (list.length === 0) return [];
  const items = await MenuItemModel.find({ nameLower: { $in: list } }).lean();
  return items.map(stripMongoFields);
}

module.exports = {
  listMenuItems,
  replaceMenuItems,
  findMenuItemsByIds,
  findMenuItemsByNames,
};
