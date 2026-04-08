const assert = require("node:assert/strict");

const { getUserPointsFromPurchases, isCompletedPurchase, computePointsFromLineItems } = require("../src/shared/utils/loyalty");

module.exports = [
  {
    name: "isCompletedPurchase: legacy purchase without status counts as completed",
    fn: () => {
      assert.equal(isCompletedPurchase({ userEmail: "a@b.com", price: "SLR 100" }), true);
    },
  },
  {
    name: "isCompletedPurchase: only Delivered/Completed/Paid count",
    fn: () => {
      assert.equal(isCompletedPurchase({ status: "Pending" }), false);
      assert.equal(isCompletedPurchase({ status: "Preparing" }), false);
      assert.equal(isCompletedPurchase({ status: "Out for Delivery" }), false);
      assert.equal(isCompletedPurchase({ status: "Delivered" }), true);
      assert.equal(isCompletedPurchase({ status: "Completed" }), true);
      assert.equal(isCompletedPurchase({ status: "Paid" }), true);
      assert.equal(isCompletedPurchase({ status: "Cancelled" }), false);
    },
  },
  {
    name: "getUserPointsFromPurchases: sums only completed purchases for user",
    fn: () => {
      const purchases = [
        { userEmail: "u@example.com", status: "Pending", pointsEarned: 100 },
        { userEmail: "u@example.com", status: "Delivered", pointsEarned: 200 },
        { userEmail: "u@example.com", status: "Cancelled", pointsEarned: 500 },
        { userEmail: "other@example.com", status: "Delivered", pointsEarned: 999 },
        // Legacy record (no status) should count
        { userEmail: "u@example.com", price: "SLR 50" },
      ];

      assert.equal(getUserPointsFromPurchases(purchases, "u@example.com"), 250);
    },
  },
  {
    name: "computePointsFromLineItems: uses menu loyaltyPoints when available",
    fn: () => {
      const menuItems = [
        { id: "m1", name: "Cheese Kottu", loyaltyPoints: 25 },
      ];
      const lineItems = [
        { menuItemId: "m1", itemName: "Cheese Kottu", quantity: 2, unitPrice: 999 },
      ];
      assert.equal(computePointsFromLineItems(lineItems, menuItems), 50);
    },
  },
  {
    name: "computePointsFromLineItems: falls back to unitPrice when menu item missing",
    fn: () => {
      const lineItems = [{ menuItemId: "missing", itemName: "Unknown", quantity: 3, unitPrice: 10.2 }];
      assert.equal(computePointsFromLineItems(lineItems, []), 30);
    },
  },
];
