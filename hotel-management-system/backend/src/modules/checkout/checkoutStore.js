const { CartItemModel } = require("../../models/Cart");
const { OrderModel } = require("../../models/Order");
const { PurchaseModel } = require("../../models/Purchase");
const { DeliveryDetailsModel } = require("../../models/DeliveryDetails");
const { connectMongo } = require("../../shared/db/mongo");

async function listCartItems() {
  await connectMongo();
  return CartItemModel.find({}).sort({ createdAt: -1 }).lean();
}

async function listCartItemsByUser(userEmail) {
  await connectMongo();
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  return CartItemModel.find({ userEmail: normalizedEmail }).sort({ createdAt: -1 }).lean();
}

async function findCartItemByUserAndKey(userEmail, itemName, size) {
  await connectMongo();
  return CartItemModel.findOne({
    userEmail: String(userEmail || "").trim().toLowerCase(),
    itemName: String(itemName || "").trim(),
    size: String(size || "Small").trim(),
  }).lean();
}

async function createCartItem(item) {
  await connectMongo();
  const created = await CartItemModel.create({ ...(item || {}) });
  return created.toObject();
}

async function updateCartItemByIdForUser(userEmail, cartItemId, updates = {}) {
  await connectMongo();
  return CartItemModel.findOneAndUpdate(
    {
      id: String(cartItemId || "").trim(),
      userEmail: String(userEmail || "").trim().toLowerCase(),
    },
    { $set: { ...(updates || {}) } },
    { new: true }
  ).lean();
}

async function deleteCartItemByIdForUser(userEmail, cartItemId) {
  await connectMongo();
  const deleted = await CartItemModel.findOneAndDelete({
    id: String(cartItemId || "").trim(),
    userEmail: String(userEmail || "").trim().toLowerCase(),
  }).lean();
  return deleted;
}

async function deleteCartItemsByUser(userEmail) {
  await connectMongo();
  await CartItemModel.deleteMany({ userEmail: String(userEmail || "").trim().toLowerCase() });
}

async function saveCartItems(items) {
  await connectMongo();
  await CartItemModel.deleteMany({});
  if (Array.isArray(items) && items.length > 0) {
    await CartItemModel.insertMany(items, { ordered: false });
  }
}

async function listOrders() {
  await connectMongo();
  return OrderModel.find({}).sort({ createdAt: -1 }).lean();
}

async function saveOrders(orders) {
  await connectMongo();
  await OrderModel.deleteMany({});
  if (Array.isArray(orders) && orders.length > 0) {
    await OrderModel.insertMany(orders, { ordered: false });
  }
}

async function listPurchases() {
  await connectMongo();
  return PurchaseModel.find({}).sort({ createdAt: -1 }).lean();
}

async function savePurchases(purchases) {
  await connectMongo();
  await PurchaseModel.deleteMany({});
  if (Array.isArray(purchases) && purchases.length > 0) {
    await PurchaseModel.insertMany(purchases, { ordered: false });
  }
}

async function readDeliveryDetailsByUser() {
  await connectMongo();
  const rows = await DeliveryDetailsModel.find({}).lean();
  return rows.reduce((accumulator, row) => {
    accumulator[String(row.userEmail || "").trim().toLowerCase()] = {
      name: row.name || "",
      phone: row.phone || "",
      streetAddress1: row.streetAddress1 || "",
      streetAddress2: row.streetAddress2 || "",
      cityTown: row.cityTown || "",
      location: row.location || "",
    };
    return accumulator;
  }, {});
}

async function saveDeliveryDetailsByUser(users) {
  await connectMongo();
  const entries = Object.entries(users && typeof users === "object" ? users : {}).map(([userEmail, details]) => ({
    userEmail: String(userEmail || "").trim().toLowerCase(),
    name: String(details && details.name ? details.name : "").trim(),
    phone: String(details && details.phone ? details.phone : "").trim(),
    streetAddress1: String(details && details.streetAddress1 ? details.streetAddress1 : "").trim(),
    streetAddress2: String(details && details.streetAddress2 ? details.streetAddress2 : "").trim(),
    cityTown: String(details && details.cityTown ? details.cityTown : "").trim(),
    location: String(details && details.location ? details.location : "").trim(),
  }));

  await DeliveryDetailsModel.deleteMany({});
  if (entries.length > 0) {
    await DeliveryDetailsModel.insertMany(entries, { ordered: false });
  }
}

module.exports = {
  listCartItems,
  listCartItemsByUser,
  findCartItemByUserAndKey,
  createCartItem,
  updateCartItemByIdForUser,
  deleteCartItemByIdForUser,
  deleteCartItemsByUser,
  saveCartItems,
  listOrders,
  saveOrders,
  listPurchases,
  savePurchases,
  readDeliveryDetailsByUser,
  saveDeliveryDetailsByUser,
};
