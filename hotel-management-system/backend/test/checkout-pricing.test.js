const assert = require("node:assert/strict");

const { getLoyaltyDiscountPercent, computeFinalPaidAndPoints } = require("../src/shared/utils/checkoutPricing");

module.exports = [
  {
    name: "checkout pricing: ignores loyalty rules above 100 percent",
    fn: () => {
      const percent = getLoyaltyDiscountPercent(2000, [
        { id: "r1", threshold: "1000", discount: "150" },
      ]);
      assert.equal(percent, 0);
    },
  },
  {
    name: "checkout pricing: caps applied loyalty percent at 100",
    fn: () => {
      const result = computeFinalPaidAndPoints({
        subtotal: 1000,
        promotionDiscount: 0,
        discountPercent: 150,
      });

      assert.equal(result.loyaltyPercentUsed, 100);
      assert.equal(result.loyaltyDiscount, 1000);
      assert.equal(result.finalPaid, 0);
    },
  },
];
