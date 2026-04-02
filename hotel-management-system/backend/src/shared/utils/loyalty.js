const crypto = require("node:crypto");

function parsePriceNumber(value) {
  return Number(String(value ?? "").replace(/[^\d.]/g, "")) || 0;
}

function normalizeLoyaltyRules(rules) {
  const source = Array.isArray(rules) ? rules : [];
  return source.map((rule) => ({
    id: String(rule && rule.id ? rule.id : crypto.randomUUID()),
    threshold: String(rule && rule.threshold !== undefined ? rule.threshold : "").trim(),
    discount: String(rule && rule.discount !== undefined ? rule.discount : "").trim(),
  }));
}

function getLoyaltyDiscountPercent(points, rules) {
  const normalizedPoints = Number(points) || 0;
  const sortedRules = normalizeLoyaltyRules(rules)
    .map((rule) => ({
      threshold: Number(rule.threshold) || 0,
      discount: Number(rule.discount) || 0,
    }))
    .sort((a, b) => a.threshold - b.threshold);

  const matched = sortedRules.reduce((best, rule) => (normalizedPoints >= rule.threshold ? rule : best), null);
  return Math.max(0, Number(matched && matched.discount !== undefined ? matched.discount : 0) || 0);
}

function getUserPointsFromPurchases(purchases, userEmail) {
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  if (!normalizedEmail) return 0;

  return (Array.isArray(purchases) ? purchases : [])
    .filter((purchase) => String(purchase && purchase.userEmail ? purchase.userEmail : "").trim().toLowerCase() === normalizedEmail)
    .reduce((sum, purchase) => {
      return sum + parsePriceNumber(purchase ? purchase.price : "");
    }, 0);
}

module.exports = {
  parsePriceNumber,
  normalizeLoyaltyRules,
  getLoyaltyDiscountPercent,
  getUserPointsFromPurchases,
};
