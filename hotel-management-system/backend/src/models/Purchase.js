const mongoose = require("mongoose");
const { normalizeOrderStatus } = require("./Order");

const purchaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true },
    orderId: { type: String, default: null, index: true },
    userEmail: { type: String, required: true, index: true, lowercase: true, trim: true },
    itemName: { type: String, default: "", trim: true },
    status: { type: String, default: "Pending", trim: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: "purchases",
    versionKey: false,
    strict: false,
  }
);

const PurchaseModel = mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);

function normalizePurchaseStatus(status) {
  return normalizeOrderStatus(status);
}

module.exports = { PurchaseModel, normalizePurchaseStatus };
