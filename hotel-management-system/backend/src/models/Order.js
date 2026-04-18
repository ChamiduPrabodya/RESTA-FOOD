const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true },
    orderId: { type: String, required: true, unique: true, index: true },
    userEmail: { type: String, required: true, index: true, lowercase: true, trim: true },
    orderType: { type: String, default: "Delivery", trim: true },
    paymentMethod: { type: String, default: "Cash", trim: true },
    status: { type: String, default: "Pending", trim: true },
    paymentProvider: { type: String, default: "", trim: true },
    paymentStatus: { type: String, default: "", trim: true },
    deliveryDetails: { type: mongoose.Schema.Types.Mixed, default: null },
    items: { type: [mongoose.Schema.Types.Mixed], default: [] },
    pricing: { type: mongoose.Schema.Types.Mixed, default: {} },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: "orders",
    versionKey: false,
    strict: false,
  }
);

const OrderModel = mongoose.models.Order || mongoose.model("Order", orderSchema);

function normalizeOrderStatus(status) {
  const text = String(status || "").trim();
  if (!text) return "";

  const lower = text.toLowerCase();
  if (lower === "pending") return "Pending";
  if (lower === "preparing") return "Preparing";
  if (lower === "prepared" || lower === "prepared (ready)" || lower === "ready") return "Prepared (Ready)";
  if (lower === "out for delivery" || lower === "outfordelivery") return "Out for Delivery";
  if (lower === "delivered") return "Delivered";
  if (lower === "cancelled" || lower === "canceled" || lower === "canceled by admin" || lower === "cancelled by admin") {
    return "Cancelled";
  }

  return text;
}

module.exports = { OrderModel, normalizeOrderStatus };
