const crypto = require("node:crypto");

function parsePriceNumber(value) {
  return Number(String(value ?? "").replace(/[^\d.]/g, "")) || 0;
}

function isCompletedPurchase(purchase) {
  if (!purchase || typeof purchase !== "object") return false;
  if (!Object.prototype.hasOwnProperty.call(purchase, "status")) {
    // Legacy records (before status support) count as completed.
    return true;
  }
  const status = String(purchase.status || "").trim().toLowerCase();
  return status === "delivered" || status === "completed" || status === "paid";
}

function computePointsFromLineItems(lineItems, menuItems = []) {
  const items = Array.isArray(lineItems) ? lineItems : [];
  if (items.length === 0) return null;

  const menuList = Array.isArray(menuItems) ? menuItems : [];
  const byId = new Map(
    menuList
      .map((row) => [String(row && row.id ? row.id : "").trim(), row])
      .filter(([key]) => Boolean(key))
  );
  const byName = new Map(
    menuList
      .flatMap((row) => {
        const nameKey = String(row && row.name ? row.name : "").trim().toLowerCase();
        const lowerKey = String(row && row.nameLower ? row.nameLower : "").trim().toLowerCase();
        return [
          [nameKey, row],
          [lowerKey, row],
        ];
      })
      .filter(([key]) => Boolean(key))
  );

  let total = 0;
  let usedAny = false;

  for (const item of items) {
    const quantity = Math.max(0, Math.round(Number(item && item.quantity !== undefined ? item.quantity : 0) || 0));
    if (!quantity) continue;

    const id = String(item && item.menuItemId ? item.menuItemId : "").trim();
    const name = String(item && item.itemName ? item.itemName : "").trim().toLowerCase();
    const menu = (id && byId.get(id)) || (name && byName.get(name)) || null;

    if (menu && typeof menu.loyaltyPoints === "number" && Number.isFinite(menu.loyaltyPoints)) {
      total += Math.max(0, Math.round(menu.loyaltyPoints)) * quantity;
      usedAny = true;
      continue;
    }

    // Fallback to unit price if provided.
    const unitPrice = Number(item && item.unitPrice !== undefined ? item.unitPrice : NaN);
    if (Number.isFinite(unitPrice) && unitPrice > 0) {
      total += Math.max(0, Math.round(unitPrice)) * quantity;
      usedAny = true;
    }
  }

  return usedAny ? Math.max(0, total) : null;
}

function normalizeLoyaltyRules(rules) {
  const source = Array.isArray(rules) ? rules : [];
  const deduped = new Map();

  source.forEach((rule) => {
    const thresholdNumber = Number(rule && rule.threshold !== undefined ? rule.threshold : NaN);
    const discountNumber = Number(rule && rule.discount !== undefined ? rule.discount : NaN);
    if (!Number.isFinite(thresholdNumber) || thresholdNumber < 0) return;
    if (!Number.isFinite(discountNumber) || discountNumber < 0) return;

    const threshold = String(Math.round(thresholdNumber));
    const discount = String(Math.round(discountNumber));
    const existing = deduped.get(threshold);

    if (!existing || Number(discount) >= Number(existing.discount)) {
      deduped.set(threshold, {
        id: String(rule && rule.id ? rule.id : existing && existing.id ? existing.id : crypto.randomUUID()),
        threshold,
        discount,
      });
    }
  });

  return [...deduped.values()].sort((a, b) => Number(a.threshold) - Number(b.threshold));
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
    .filter(isCompletedPurchase)
    .reduce((sum, purchase) => {
      if (purchase && Object.prototype.hasOwnProperty.call(purchase, "pointsEarned")) {
        return sum + (Number(purchase.pointsEarned) || 0);
      }
      return sum + parsePriceNumber(purchase ? purchase.price : "");
    }, 0);
}

module.exports = {
  parsePriceNumber,
  isCompletedPurchase,
  computePointsFromLineItems,
  normalizeLoyaltyRules,
  getLoyaltyDiscountPercent,
  getUserPointsFromPurchases,
};
