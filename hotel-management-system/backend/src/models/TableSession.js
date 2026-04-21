const mongoose = require("mongoose");

const tableSessionSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true, trim: true },
    tableId: { type: String, required: true, index: true, trim: true },
    guestCount: { type: Number, default: 1, min: 1, max: 6 },
    status: {
      type: String,
      enum: ["active", "closed", "expired"],
      default: "active",
      index: true,
    },
    createdAt: { type: String, default: () => new Date().toISOString() },
  },
  { collection: "tableSessions", versionKey: false }
);

tableSessionSchema.index({ tableId: 1, status: 1, createdAt: -1 });

module.exports = {
  TableSession: mongoose.models.TableSession || mongoose.model("TableSession", tableSessionSchema),
};
