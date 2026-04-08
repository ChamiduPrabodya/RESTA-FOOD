const mongoose = require("mongoose");

const { connectMongo } = require("../../shared/db/mongo");

const DEFAULT_RULES = [
  { id: "r1", threshold: "2000", discount: "1" },
  { id: "r2", threshold: "5000", discount: "3" },
  { id: "r3", threshold: "10000", discount: "5" },
];

const ruleSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, index: true, unique: true, trim: true },
    threshold: { type: String, required: true, trim: true },
    discount: { type: String, required: true, trim: true },
  },
  { collection: "loyalty_rules", versionKey: false, strict: true }
);

const purchaseSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true },
    orderId: { type: String, trim: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true, index: true },
    orderType: { type: String, trim: true },
    status: { type: String, trim: true },
    statusUpdatedAt: { type: String, trim: true },
    cancelReason: { type: String, trim: true },
    cancelledBy: { type: String, trim: true },
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
    price: { type: String, trim: true },
    createdAt: { type: String, required: true, trim: true, index: true },
  },
  { collection: "loyalty_purchases", versionKey: false, strict: false }
);

purchaseSchema.index({ userEmail: 1, id: 1 }, { unique: true });

const auditSchema = new mongoose.Schema(
  {
    at: { type: String, required: true, trim: true, index: true },
    userEmail: { type: String, trim: true, lowercase: true, index: true },
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    discountPercentUsed: { type: Number },
    purchasesAttempted: { type: Number },
    purchasesAdded: { type: Number },
    purchasesSkipped: { type: Number },
    orderIds: { type: [String], default: [] },
    addedPurchaseIds: { type: [String], default: [] },
    pointsEarnedAdded: { type: Number },
  },
  { collection: "loyalty_audit", versionKey: false, strict: false }
);

const RuleModel = mongoose.models.LoyaltyRule || mongoose.model("LoyaltyRule", ruleSchema);
const PurchaseModel = mongoose.models.LoyaltyPurchase || mongoose.model("LoyaltyPurchase", purchaseSchema);
const AuditModel = mongoose.models.LoyaltyAudit || mongoose.model("LoyaltyAudit", auditSchema);

const stripMongoFields = (doc) => {
  if (!doc) return null;
  // eslint-disable-next-line no-unused-vars
  const { _id, ...rest } = doc;
  return rest;
};

async function readRules() {
  await connectMongo();
  const count = await RuleModel.estimatedDocumentCount();
  if (!count) {
    await RuleModel.insertMany(DEFAULT_RULES, { ordered: true });
  }
  const rules = await RuleModel.find({}).sort({ threshold: 1, id: 1 }).lean();
  return rules.map(stripMongoFields);
}

async function writeRules(rules) {
  await connectMongo();
  const next = Array.isArray(rules) ? rules : [];
  await RuleModel.deleteMany({});
  if (next.length > 0) {
    await RuleModel.insertMany(
      next.map((rule) => ({
        id: String(rule && rule.id ? rule.id : "").trim(),
        threshold: String(rule && rule.threshold !== undefined ? rule.threshold : "").trim(),
        discount: String(rule && rule.discount !== undefined ? rule.discount : "").trim(),
      })),
      { ordered: true }
    );
  }
}

async function listPurchases() {
  await connectMongo();
  const purchases = await PurchaseModel.find({}).sort({ createdAt: -1, _id: -1 }).lean();
  return purchases.map(stripMongoFields);
}

async function appendPurchases(purchases) {
  await connectMongo();
  const rows = Array.isArray(purchases) ? purchases : [];
  if (rows.length === 0) return listPurchases();

  const ops = rows
    .map((row) => {
      const id = String(row && row.id ? row.id : "").trim();
      const userEmail = String(row && row.userEmail ? row.userEmail : "").trim().toLowerCase();
      if (!id || !userEmail) return null;

      const status = row && Object.prototype.hasOwnProperty.call(row, "status") ? String(row.status || "").trim() : "";
      const normalizedStatus = status || "Pending";

      return {
        updateOne: {
          filter: { userEmail, id },
          update: { $setOnInsert: { ...(row || {}), id, userEmail, status: normalizedStatus } },
          upsert: true,
        },
      };
    })
    .filter(Boolean);

  if (ops.length > 0) {
    await PurchaseModel.bulkWrite(ops, { ordered: false });
  }

  return listPurchases();
}

async function updatePurchaseStatus({ id, userEmail, status, cancelReason, cancelledBy, statusUpdatedAt } = {}) {
  await connectMongo();
  const purchaseId = String(id || "").trim();
  if (!purchaseId) return null;

  const filter = { id: purchaseId };
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  if (normalizedEmail) filter.userEmail = normalizedEmail;

  const updates = {
    status: String(status || "").trim(),
    statusUpdatedAt: String(statusUpdatedAt || new Date().toISOString()).trim(),
  };
  if (updates.status === "Cancelled") {
    updates.cancelReason = String(cancelReason || "").trim();
    updates.cancelledBy = String(cancelledBy || "").trim();
  } else {
    updates.cancelReason = "";
    updates.cancelledBy = "";
  }

  const updated = await PurchaseModel.findOneAndUpdate(filter, { $set: updates }, { new: true }).lean();
  return stripMongoFields(updated);
}

async function listAuditEntries() {
  await connectMongo();
  const entries = await AuditModel.find({}).sort({ at: -1, _id: -1 }).lean();
  return entries.map(stripMongoFields);
}

async function appendAuditEntry(entry, { maxEntries = 2000 } = {}) {
  await connectMongo();
  if (entry && typeof entry === "object") {
    await AuditModel.create({ ...entry });
  }

  const limit = Math.max(1, Number(maxEntries) || 2000);
  const toDelete = await AuditModel.find({}).sort({ at: -1, _id: -1 }).skip(limit).select({ _id: 1 }).lean();
  if (toDelete.length > 0) {
    await AuditModel.deleteMany({ _id: { $in: toDelete.map((row) => row._id) } });
  }

  return listAuditEntries();
}

module.exports = {
  readRules,
  writeRules,
  listPurchases,
  appendPurchases,
  updatePurchaseStatus,
  listAuditEntries,
  appendAuditEntry,
};
