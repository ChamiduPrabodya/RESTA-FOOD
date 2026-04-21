const { addReviewForUser, getReviews } = require("./reviewsService");

async function listReviewsController(_req, res) {
  const reviews = await getReviews();
  return res.json({ success: true, reviews });
}

async function createReviewController(req, res) {
  const review = await addReviewForUser(req.auth, req.body || {});
  return res.status(201).json({ success: true, review });
}

module.exports = {
  createReviewController,
  listReviewsController,
};
