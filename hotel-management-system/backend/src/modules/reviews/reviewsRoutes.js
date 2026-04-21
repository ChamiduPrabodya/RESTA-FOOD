const express = require("express");

const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { createReviewController, listReviewsController } = require("./reviewsController");

const reviewsRouter = express.Router();

reviewsRouter.get("/", asyncHandler(listReviewsController));
reviewsRouter.post("/", requireAuth(), asyncHandler(createReviewController));

module.exports = { reviewsRouter };
