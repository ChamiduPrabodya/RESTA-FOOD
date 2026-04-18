const mongoose = require("mongoose");

const deliveryDetailsSchema = new mongoose.Schema(
  {
    userEmail: { type: String, required: true, unique: true, index: true, lowercase: true, trim: true },
    name: { type: String, default: "", trim: true },
    phone: { type: String, default: "", trim: true },
    streetAddress1: { type: String, default: "", trim: true },
    streetAddress2: { type: String, default: "", trim: true },
    cityTown: { type: String, default: "", trim: true },
    location: { type: String, default: "", trim: true },
  },
  {
    collection: "delivery_details",
    versionKey: false,
    strict: false,
  }
);

const DeliveryDetailsModel =
  mongoose.models.DeliveryDetails || mongoose.model("DeliveryDetails", deliveryDetailsSchema);

module.exports = { DeliveryDetailsModel };
