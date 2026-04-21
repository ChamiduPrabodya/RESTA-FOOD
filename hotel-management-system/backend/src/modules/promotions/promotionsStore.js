const mongoose = require("mongoose");

const { PromotionModel } = require("../../models/Promotion");
const { connectMongo } = require("../../shared/db/mongo");

function stripMongoFields(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: String(rest.id || (_id ? _id.toString() : "")).trim(),
  };
}

async function listPromotions() {
  await connectMongo();
  const rows = await PromotionModel.find({}).sort({ createdAt: -1, _id: -1 }).lean();
  return rows.map(stripMongoFields);
}

async function createPromotion(promotion) {
  await connectMongo();
  const created = await PromotionModel.create(promotion);
  return stripMongoFields(created.toObject());
}

function buildPromotionIdQuery(id) {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) return null;
  const clauses = [{ id: normalizedId }];
  if (mongoose.Types.ObjectId.isValid(normalizedId)) {
    clauses.push({ _id: normalizedId });
  }
  return { $or: clauses };
}

async function findPromotionById(id) {
  await connectMongo();
  const query = buildPromotionIdQuery(id);
  if (!query) return null;
  const row = await PromotionModel.findOne(query).lean();
  return stripMongoFields(row);
}

async function updatePromotionById(id, updater) {
  await connectMongo();
  const normalizedId = String(id || "").trim();
  if (!normalizedId) return null;

  const doc = await PromotionModel.findOne(buildPromotionIdQuery(normalizedId));
  if (!doc) return null;

  const current = stripMongoFields(doc.toObject());
  const next = typeof updater === "function" ? updater(current) : updater;
  if (!next || typeof next !== "object") return current;

  Object.entries({ ...next, id: normalizedId }).forEach(([key, value]) => {
    if (key === "_id") return;
    doc.set(key, value);
  });
  await doc.save();
  return stripMongoFields(doc.toObject());
}

async function deletePromotionById(id) {
  await connectMongo();
  const query = buildPromotionIdQuery(id);
  if (!query) return false;
  const result = await PromotionModel.deleteOne(query);
  return result.deletedCount > 0;
}

module.exports = {
  createPromotion,
  deletePromotionById,
  findPromotionById,
  listPromotions,
  updatePromotionById,
};
