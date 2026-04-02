const express = require("express");

const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { requireRole } = require("../../shared/middlewares/requireRole");
const { ROLES } = require("../../shared/constants/roles");

const {
  getRules,
  replaceRules,
  getMyLoyaltySummary,
  addMyPurchases,
  listMyPurchases,
  listAllPurchases,
} = require("./loyaltyController");

const loyaltyRouter = express.Router();

// Public (frontend needs this for pricing calculations).
loyaltyRouter.get("/rules", getRules);

// Admin: configure loyalty tiers.
loyaltyRouter.put("/rules", requireAuth(), requireRole([ROLES.ADMIN]), replaceRules);

// User: view points / discount summary.
loyaltyRouter.get("/me", requireAuth(), getMyLoyaltySummary);

// User: record purchases so points can accumulate server-side.
loyaltyRouter.post("/purchases", requireAuth(), addMyPurchases);
loyaltyRouter.get("/purchases/me", requireAuth(), listMyPurchases);

// Admin: audit purchases.
loyaltyRouter.get("/purchases", requireAuth(), requireRole([ROLES.ADMIN]), listAllPurchases);

module.exports = { loyaltyRouter };
