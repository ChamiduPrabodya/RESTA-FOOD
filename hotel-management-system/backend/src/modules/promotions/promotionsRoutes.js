const express = require("express");

const { ROLES } = require("../../shared/constants/roles");
const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { requireRole } = require("../../shared/middlewares/requireRole");
const {
  createPromotionController,
  deletePromotionController,
  listPromotionsController,
  updatePromotionController,
} = require("./promotionsController");

const promotionsRouter = express.Router();

promotionsRouter.get("/", asyncHandler(listPromotionsController));
promotionsRouter.post("/", requireAuth(), requireRole([ROLES.ADMIN]), asyncHandler(createPromotionController));
promotionsRouter.patch("/:id", requireAuth(), requireRole([ROLES.ADMIN]), asyncHandler(updatePromotionController));
promotionsRouter.delete("/:id", requireAuth(), requireRole([ROLES.ADMIN]), asyncHandler(deletePromotionController));

module.exports = { promotionsRouter };
