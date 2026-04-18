const mongoose = require("mongoose");

const { connectMongo } = require("../../shared/db/mongo");

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true, index: true, unique: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    status: { type: String, default: "Pending", trim: true, index: true },
    cancelReason: { type: String, default: "", trim: true },
    cancelledBy: { type: String, default: "", trim: true },
    statusUpdatedAt: { type: String, trim: true },

    orderType: { type: String, trim: true },
    paymentMethod: { type: String, trim: true },
    paymentStatus: { type: String, default: "Unpaid", trim: true, index: true },
    payment: { type: Object, default: null },

    items: { type: Array, default: [] },
    deliveryAddress: { type: String, trim: true },
    deliveryCityTown: { type: String, trim: true },

    subtotal: { type: Number },
    promotionDiscount: { type: Number },
    loyaltyPercentUsed: { type: Number },
    loyaltyDiscount: { type: Number },
    deliveryZone: { type: String, trim: true },
    deliveryFee: { type: Number },
    finalPaid: { type: Number },
    pointsEarned: { type: Number },

    createdAt: { type: String, required: true, trim: true, index: true },
    updatedAt: { type: String, required: true, trim: true, index: true },
  },
  { collection: "orders", versionKey: false, strict: false }
);

orderSchema.index({ userEmail: 1, createdAt: -1, id: -1 });

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

const stripMongoFields = (doc) => {
  if (!doc) return null;
  // eslint-disable-next-line no-unused-vars
  const { _id, ...rest } = doc;
  return rest;
};

async function addOrder(order) {
  await connectMongo();
  const created = await OrderModel.create(order);
  return stripMongoFields(created.toObject());
}

async function findOrderById(id) {
  await connectMongo();
  const orderId = String(id || "").trim();
  if (!orderId) return null;
  const doc = await OrderModel.findOne({ id: orderId }).lean();
  return stripMongoFields(doc);
}

async function listOrdersForUser(email) {
  await connectMongo();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return [];
  const docs = await OrderModel.find({ userEmail: normalizedEmail }).sort({ createdAt: -1, _id: -1 }).lean();
  return docs.map(stripMongoFields);
}

async function listAllOrders() {
  await connectMongo();
  const docs = await OrderModel.find({}).sort({ createdAt: -1, _id: -1 }).lean();
  return docs.map(stripMongoFields);
}

async function updateOrderById(id, updater) {
  await connectMongo();
  const orderId = String(id || "").trim();
  if (!orderId) return null;

  const doc = await OrderModel.findOne({ id: orderId });
  if (!doc) return null;

  const current = stripMongoFields(doc.toObject());
  const next = typeof updater === "function" ? updater(current) : null;
  if (!next || typeof next !== "object") return stripMongoFields(doc.toObject());

  for (const [key, value] of Object.entries(next)) {
    if (key === "_id") continue;
    doc.set(key, value);
  }
  await doc.save();
  return stripMongoFields(doc.toObject());
}

async function hasActiveOrderForTable(tableId) {
  await connectMongo();
  const normalized = String(tableId || "").trim();
  if (!normalized) return false;

  const inactive = ["Delivered", "Completed", "Cancelled"];
  const exists = await OrderModel.exists({ tableId: normalized, status: { $nin: inactive } });
  return Boolean(exists);
}

module.exports = {
  addOrder,
  findOrderById,
  listOrdersForUser,
  listAllOrders,
  updateOrderById,
  hasActiveOrderForTable,
};
