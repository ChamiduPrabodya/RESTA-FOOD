const { CartItemModel } = require("../../models/Cart");
const { OrderModel } = require("../../models/Order");
const { PurchaseModel } = require("../../models/Purchase");
const { DeliveryDetailsModel } = require("../../models/DeliveryDetails");

async function listCartItems() {
  return CartItemModel.find({}).sort({ createdAt: -1 }).lean();
}

async function saveCartItems(items) {
  await CartItemModel.deleteMany({});
  if (Array.isArray(items) && items.length > 0) {
    await CartItemModel.insertMany(items, { ordered: false });
  }
}

async function listOrders() {
  return OrderModel.find({}).sort({ createdAt: -1 }).lean();
}

async function saveOrders(orders) {
  await OrderModel.deleteMany({});
  if (Array.isArray(orders) && orders.length > 0) {
    await OrderModel.insertMany(orders, { ordered: false });
  }
}

async function listPurchases() {
  return PurchaseModel.find({}).sort({ createdAt: -1 }).lean();
}

async function savePurchases(purchases) {
  await PurchaseModel.deleteMany({});
  if (Array.isArray(purchases) && purchases.length > 0) {
    await PurchaseModel.insertMany(purchases, { ordered: false });
  }
}

async function readDeliveryDetailsByUser() {
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
  saveCartItems,
  listOrders,
  saveOrders,
  listPurchases,
  savePurchases,
  readDeliveryDetailsByUser,
  saveDeliveryDetailsByUser,
};
