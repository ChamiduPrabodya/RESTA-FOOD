const express = require("express");

const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { requireRole } = require("../../shared/middlewares/requireRole");
const { ROLES } = require("../../shared/constants/roles");
const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

const {
  getRules,
  replaceRules,
  getMyLoyaltySummary,
  addMyPurchases,
  listMyPurchases,
  listAllPurchases,
  listAudit,
} = require("./loyaltyController");

const loyaltyRouter = express.Router();

// Public (frontend needs this for pricing calculations).
loyaltyRouter.get("/rules", asyncHandler(getRules));

// Admin: configure loyalty tiers.
loyaltyRouter.put("/rules", requireAuth(), requireRole([ROLES.ADMIN]), asyncHandler(replaceRules));

// User: view points / discount summary.
loyaltyRouter.get("/me", requireAuth(), asyncHandler(getMyLoyaltySummary));

// User: record purchases so points can accumulate server-side.
loyaltyRouter.post("/purchases", requireAuth(), asyncHandler(addMyPurchases));
loyaltyRouter.get("/purchases/me", requireAuth(), asyncHandler(listMyPurchases));

// Admin: audit purchases.
loyaltyRouter.get("/purchases", requireAuth(), requireRole([ROLES.ADMIN]), asyncHandler(listAllPurchases));
// Admin: audit trail for purchase sync (idempotency, duplicates, etc).
loyaltyRouter.get("/audit", requireAuth(), requireRole([ROLES.ADMIN]), asyncHandler(listAudit));

module.exports = { loyaltyRouter };
