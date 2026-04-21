const mongoose = require("mongoose");

const promotionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true, trim: true },
    type: { type: String, default: "food", trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true, trim: true },
    discountType: { type: String, default: "percentage", trim: true },
    discountValue: { type: Number, required: true },
    maxDiscount: { type: Number, default: 0 },
    minOrderValue: { type: Number, default: 0 },
    promoCode: { type: String, default: "", trim: true },
    startDate: { type: String, required: true, trim: true },
    endDate: { type: String, required: true, trim: true },
    imageUrl: { type: String, default: "", trim: true },
    displayInHomeHeader: { type: Boolean, default: false },
    discountText: { type: String, default: "", trim: true },
    active: { type: Boolean, default: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updatedAt: { type: String, default: "" },
  },
  {
    collection: "promotions",
    versionKey: false,
    strict: false,
  }
);

module.exports = {
  PromotionModel: mongoose.models.Promotion || mongoose.model("Promotion", promotionSchema),
};
