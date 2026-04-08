const crypto = require("node:crypto");
const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true },
    menuItemId: { type: String, default: null },
    itemName: { type: String, required: true, trim: true },
    size: { type: String, default: "Small", trim: true },
    image: { type: String, default: "", trim: true },
    unitPrice: { type: Number, default: 0 },
    quantity: { type: Number, default: 1 },
    userEmail: { type: String, required: true, index: true, lowercase: true, trim: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: "cart_items",
    versionKey: false,
    strict: false,
  }
);

const CartItemModel = mongoose.models.CartItem || mongoose.model("CartItem", cartItemSchema);

function normalizeCartItem(input = {}, userEmail) {
  const quantity = Math.max(1, Math.round(Number(input.quantity) || 1));
  const unitPrice = Math.max(0, Number(input.unitPrice) || 0);

  return {
    id: String(input.id || "").trim() || crypto.randomUUID(),
    menuItemId: input.menuItemId ? String(input.menuItemId).trim() : null,
    itemName: String(input.itemName || "").trim(),
    size: String(input.size || "Small").trim(),
    image: String(input.image || "").trim(),
    unitPrice,
    quantity,
    userEmail: String(userEmail || "").trim().toLowerCase(),
    createdAt: String(input.createdAt || "").trim() || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

module.exports = { CartItemModel, normalizeCartItem };
