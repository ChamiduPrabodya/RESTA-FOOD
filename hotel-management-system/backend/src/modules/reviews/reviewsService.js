const crypto = require("node:crypto");

const { httpError } = require("../../shared/errors");
const { findUserByEmail } = require("../auth/authStore");
const { createReview, listReviews } = require("./reviewsStore");

async function getReviews() {
  const reviews = await listReviews();
  return reviews.map((review) => ({
    ...review,
    id: String(review.id || "").trim(),
    userEmail: String(review.userEmail || review.email || "").trim().toLowerCase(),
    userName: String(review.userName || review.name || review.customerName || review.userEmail || review.email || "Customer").trim(),
    rating: Math.max(1, Math.min(5, Math.round(Number(review.rating) || 1))),
    message: String(review.message || review.comment || review.feedback || review.text || "").trim(),
    createdAt: String(review.createdAt || "").trim(),
  }));
}

async function addReviewForUser(actor, input = {}) {
  const email = String(actor && actor.email ? actor.email : "").trim().toLowerCase();
  if (!email) throw httpError(401, "Unauthorized.");

  const rating = Number(input.rating);
  const message = String(input.message || "").trim();
  if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
    throw httpError(400, "rating must be between 1 and 5.");
  }
  if (!message) throw httpError(400, "message is required.");

  const storedUser = await findUserByEmail(email);
  const now = new Date().toISOString();
  return createReview({
    id: crypto.randomUUID(),
    userEmail: email,
    userName: String(storedUser?.fullName || input.userName || email).trim(),
    rating: Math.round(rating),
    message,
    createdAt: now,
  });
}

module.exports = {
  addReviewForUser,
  getReviews,
};
