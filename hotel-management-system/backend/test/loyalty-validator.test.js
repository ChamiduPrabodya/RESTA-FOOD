const assert = require("node:assert/strict");

const {
  validateReplaceRules,
  validateAddPurchases,
  validateUpdatePurchaseStatus,
} = require("../src/modules/loyalty/validators/loyaltyValidator");

module.exports = [
  {
    name: "validateReplaceRules: rejects discounts above 100",
    fn: () => {
      const result = validateReplaceRules({
        rules: [{ threshold: 1000, discount: 150 }],
      });
      assert.equal(result.ok, false);
    },
  },
  {
    name: "validateReplaceRules: rejects empty rules",
    fn: () => {
      const result = validateReplaceRules({ rules: [] });
      assert.equal(result.ok, false);
    },
  },
  {
    name: "validateReplaceRules: rejects duplicate thresholds",
    fn: () => {
      const result = validateReplaceRules({
        rules: [
          { threshold: 1000, discount: 5 },
          { threshold: 1000, discount: 10 },
        ],
      });
      assert.equal(result.ok, false);
    },
  },
  {
    name: "validateAddPurchases: rejects loyaltyPointsEarned from client",
    fn: () => {
      const result = validateAddPurchases({
        purchases: [{ id: "p1", price: "SLR 100", loyaltyPointsEarned: 999 }],
      });
      assert.equal(result.ok, false);
    },
  },
  {
    name: "validateAddPurchases: accepts status when valid",
    fn: () => {
      const result = validateAddPurchases({
        purchases: [{ id: "p1", subtotal: 100, status: "Pending" }],
      });
      assert.equal(result.ok, true);
    },
  },
  {
    name: "validateAddPurchases: accepts dine-in order type",
    fn: () => {
      const result = validateAddPurchases({
        purchases: [{ id: "p1", subtotal: 100, orderType: "DineIn" }],
      });
      assert.equal(result.ok, true);
    },
  },
  {
    name: "validateUpdatePurchaseStatus: requires cancelReason when cancelling",
    fn: () => {
      const result = validateUpdatePurchaseStatus({ status: "Cancelled" });
      assert.equal(result.ok, false);
    },
  },
  {
    name: "validateUpdatePurchaseStatus: normalizes statuses",
    fn: () => {
      const delivered = validateUpdatePurchaseStatus({ status: "delivered" });
      assert.equal(delivered.ok, true);
      assert.equal(delivered.value.status, "Delivered");

      const cancelled = validateUpdatePurchaseStatus({ status: "canceled", cancelReason: "test" });
      assert.equal(cancelled.ok, true);
      assert.equal(cancelled.value.status, "Cancelled");

      const prepared = validateUpdatePurchaseStatus({ status: "prepared (ready)" });
      assert.equal(prepared.ok, true);
      assert.equal(prepared.value.status, "Prepared (Ready)");
    },
  },
];
