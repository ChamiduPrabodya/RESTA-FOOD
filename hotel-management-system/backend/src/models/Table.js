const mongoose = require("mongoose");

const TABLE_STATUSES = ["available", "unavailable", "occupied", "reserved", "cleaning"];

const tableSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, unique: true, index: true, trim: true },
    label: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, default: 1, min: 1 },
    location: { type: String, default: "", trim: true },
    status: {
      type: String,
      enum: TABLE_STATUSES,
      default: "available",
      index: true,
    },
    // Prevent people from guessing table ids and toggling occupancy.
    // Included in the QR URL as a query param.
    qrToken: { type: String, default: "", trim: true, index: true },
    qrUrl: { type: String, default: "", trim: true },
  },
  { collection: "tables", versionKey: false }
);

module.exports = {
  TABLE_STATUSES,
  Table: mongoose.models.Table || mongoose.model("Table", tableSchema),
};
