const mongoose = require("mongoose");

const loyaltyRuleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true },
    threshold: { type: String, required: true, trim: true },
    discount: { type: String, required: true, trim: true },
  },
  {
    collection: "loyalty_rules",
    versionKey: false,
    strict: false,
  }
);

const LoyaltyRuleModel = mongoose.models.LoyaltyRule || mongoose.model("LoyaltyRule", loyaltyRuleSchema);

module.exports = { LoyaltyRuleModel };
