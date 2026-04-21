const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true, trim: true },
    userEmail: { type: String, required: true, index: true, lowercase: true, trim: true },
    userName: { type: String, default: "", trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    message: { type: String, required: true, trim: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  {
    collection: "reviews",
    versionKey: false,
    strict: false,
  }
);

module.exports = {
  ReviewModel: mongoose.models.Review || mongoose.model("Review", reviewSchema),
};
