const { ReviewModel } = require("../../models/Review");
const { connectMongo } = require("../../shared/db/mongo");

function stripMongoFields(doc) {
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return {
    ...rest,
    id: String(rest.id || (_id ? _id.toString() : "")).trim(),
  };
}

async function listReviews() {
  await connectMongo();
  const rows = await ReviewModel.find({}).sort({ createdAt: -1, _id: -1 }).lean();
  return rows.map(stripMongoFields);
}

async function createReview(review) {
  await connectMongo();
  const created = await ReviewModel.create(review);
  return stripMongoFields(created.toObject());
}

module.exports = {
  createReview,
  listReviews,
};
