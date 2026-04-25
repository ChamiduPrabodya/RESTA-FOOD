const crypto = require("node:crypto");

const DEFAULT_LOYALTY_RULES = [
  { id: "r1", threshold: "2000", discount: "1" },
  { id: "r2", threshold: "5000", discount: "3" },
  { id: "r3", threshold: "10000", discount: "5" },
];

const DELIVERY_ZONE_FEES = Object.freeze({
  gonapola: 100,
  koralima: 150,
  olaboduwa: 150,
  kubuka: 150,
});

function parsePriceNumber(value) {
  return Number(String(value ?? "").replace(/[^\d.]/g, "")) || 0;
}

function formatSLR(value) {
  return `SLR ${Math.round(Number(value) || 0).toLocaleString()}`;
}

function normalizeLoyaltyRules(rules) {
  const source = Array.isArray(rules) ? rules : DEFAULT_LOYALTY_RULES;
  const deduped = new Map();

  source.forEach((rule) => {
    const thresholdNumber = Number(rule && rule.threshold !== undefined ? rule.threshold : NaN);
    const discountNumber = Number(rule && rule.discount !== undefined ? rule.discount : NaN);
    if (!Number.isFinite(thresholdNumber) || thresholdNumber < 0) return;
    if (!Number.isFinite(discountNumber) || discountNumber < 0 || discountNumber > 100) return;

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

  const matched = sortedRules.reduce(
    (best, rule) => (normalizedPoints >= rule.threshold ? rule : best),
    null
  );

  return Math.min(
    100,
    Math.max(
      0,
      Number(matched && matched.discount !== undefined ? matched.discount : 0) || 0
    )
  );
}

function getUserPointsFromPurchases(purchases, userEmail) {
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  if (!normalizedEmail) return 0;

  return (Array.isArray(purchases) ? purchases : [])
    .filter(
      (purchase) =>
        String(purchase && purchase.userEmail ? purchase.userEmail : "")
          .trim()
          .toLowerCase() === normalizedEmail
    )
    .reduce((sum, purchase) => {
      if (purchase && Object.prototype.hasOwnProperty.call(purchase, "loyaltyPointsEarned")) {
        return sum + (Number(purchase.loyaltyPointsEarned) || 0);
      }
      return sum + parsePriceNumber(purchase ? purchase.price : "");
    }, 0);
}

function parsePromotionDate(dateText, endOfDay = false) {
  const normalized = String(dateText || "").trim();
  if (!normalized) return null;

  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;

  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }

  return date;
}

function isPromotionActiveNow(promotion, now) {
  if (!promotion || !promotion.active) return false;

  const start = parsePromotionDate(promotion.startDate, false);
  const end = parsePromotionDate(promotion.endDate, true);
  if (!start || !end) return false;

  const nowTime = (now instanceof Date ? now : new Date()).getTime();
  return start.getTime() <= nowTime && nowTime <= end.getTime();
}

function calculatePromotionDiscount(subtotal, promotion) {
  const subtotalValue = Number(subtotal) || 0;
  if (subtotalValue <= 0 || !promotion) return 0;

  const discountType = promotion.discountType === "fixed" ? "fixed" : "percentage";
  const discountValue = Number(promotion.discountValue) || 0;
  const maxDiscount = Math.max(0, Number(promotion.maxDiscount) || 0);

  if (discountValue <= 0) return 0;

  const rawDiscount =
    discountType === "fixed"
      ? discountValue
      : (subtotalValue * discountValue) / 100;

  const capped = maxDiscount > 0 ? Math.min(rawDiscount, maxDiscount) : rawDiscount;
  return Math.max(0, Math.round(capped));
}

function pickBestPromotion(promotions, { subtotal, now, type = "food" } = {}) {
  const subtotalValue = Number(subtotal) || 0;
  const clock = now instanceof Date ? now : new Date();
  const list = Array.isArray(promotions) ? promotions : [];

  const eligible = list.filter((promotion) => {
    if (!promotion) return false;
    if (String(promotion.type || "food") !== type) return false;
    if (!isPromotionActiveNow(promotion, clock)) return false;

    const minOrderValue = Math.max(0, Number(promotion.minOrderValue) || 0);
    return subtotalValue >= minOrderValue;
  });

  let best = null;
  let bestAmount = 0;

  eligible.forEach((promotion) => {
    const amount = calculatePromotionDiscount(subtotalValue, promotion);
    if (amount > bestAmount) {
      best = promotion;
      bestAmount = amount;
    }
  });

  return best ? { promotion: best, amount: bestAmount } : null;
}

function calculateCartSubtotal(cartItems) {
  return (Array.isArray(cartItems) ? cartItems : []).reduce(
    (sum, item) =>
      sum + (Number(item && item.unitPrice) || 0) * (Number(item && item.quantity) || 0),
    0
  );
}

function detectDeliveryZoneFromAddress(address, zoneFees = DELIVERY_ZONE_FEES) {
  const normalizedAddress = String(address || "").trim().toLowerCase();
  if (!normalizedAddress) return null;

  for (const [zone] of Object.entries(zoneFees || {})) {
    if (zone && normalizedAddress.includes(String(zone).toLowerCase())) {
      return zone;
    }
  }

  return null;
}

function calculateDeliveryFee({ orderType, deliveryAddress, deliveryCityTown } = {}) {
  const type = String(orderType || "").trim().toLowerCase();

  if (type && type !== "delivery") {
    return { deliveryZone: null, deliveryFee: 0, deliveryAllowed: true };
  }

  const zone = detectDeliveryZoneFromAddress(deliveryCityTown || deliveryAddress);
  const allowed = Boolean(zone);
  const fee = allowed ? Math.max(0, Number(DELIVERY_ZONE_FEES[zone]) || 0) : 0;

  return {
    deliveryZone: zone,
    deliveryFee: fee,
    deliveryAllowed: allowed,
  };
}

function calculateDeliveryFeeFromAddress({ orderType, address, cityTown, zoneFees } = {}) {
  if (String(orderType || "").trim().toLowerCase() !== "delivery") {
    return { deliveryZone: null, deliveryFee: 0, deliveryAllowed: true };
  }

  const fees = zoneFees || DELIVERY_ZONE_FEES;
  const deliveryZone = detectDeliveryZoneFromAddress(cityTown || address, fees);
  const deliveryAllowed = Boolean(deliveryZone);
  const deliveryFee = deliveryAllowed ? Math.max(0, Number(fees[deliveryZone]) || 0) : 0;

  return { deliveryZone, deliveryFee, deliveryAllowed };
}

function computeFinalPaidAndPoints({
  subtotal,
  promotionDiscount,
  discountPercent,
  orderType,
  deliveryAddress,
  deliveryCityTown,
} = {}) {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const safePromotionDiscount = Math.min(
    safeSubtotal,
    Math.max(0, Number(promotionDiscount) || 0)
  );

  const afterPromotion = Math.max(0, safeSubtotal - safePromotionDiscount);
  const percent = Math.min(100, Math.max(0, Number(discountPercent) || 0));
  const loyaltyDiscount = Math.min(
    afterPromotion,
    Math.max(0, Math.round((afterPromotion * percent) / 100))
  );
  const discountedTotal = Math.max(0, afterPromotion - loyaltyDiscount);

  const delivery = calculateDeliveryFee({
    orderType,
    deliveryAddress,
    deliveryCityTown,
  });

  const finalPaid = Math.max(
    0,
    discountedTotal + (Number(delivery.deliveryFee) || 0)
  );

  const pointsEarned = Math.max(0, Math.round(finalPaid));

  return {
    subtotal: safeSubtotal,
    promotionDiscount: safePromotionDiscount,
    loyaltyPercentUsed: percent,
    loyaltyDiscount,
    discountedTotal,
    deliveryZone: delivery.deliveryZone,
    deliveryFee: delivery.deliveryFee,
    deliveryAllowed: delivery.deliveryAllowed,
    finalPaid,
    pointsEarned,
  };
}

function calculateCheckoutPricing({
  cartItems,
  userEmail,
  purchases,
  promotions,
  loyaltyRules,
  orderType,
  deliveryAddress,
  deliveryCityTown,
  now,
} = {}) {
  const subtotal = calculateCartSubtotal(cartItems);
  const points = getUserPointsFromPurchases(purchases, userEmail);
  const loyaltyPercent = getLoyaltyDiscountPercent(points, loyaltyRules);
  const bestPromotion = pickBestPromotion(promotions, { subtotal, now, type: "food" });
  const promotionDiscount = (bestPromotion && bestPromotion.amount) || 0;

  const afterPromotion = Math.max(0, subtotal - promotionDiscount);
  const loyaltyDiscount = Math.max(
    0,
    Math.round((afterPromotion * loyaltyPercent) / 100)
  );
  const totalDiscount = Math.min(subtotal, promotionDiscount + loyaltyDiscount);
  const total = Math.max(0, subtotal - totalDiscount);

  const delivery = calculateDeliveryFeeFromAddress({
    orderType,
    address: deliveryAddress,
    cityTown: deliveryCityTown,
  });

  const grandTotal = Math.max(0, total + (Number(delivery.deliveryFee) || 0));

  return {
    subtotal,
    points,
    promotion: (bestPromotion && bestPromotion.promotion) || null,
    promotionDiscount,
    loyaltyPercent,
    loyaltyDiscount,
    totalDiscount,
    total,
    deliveryZone: delivery.deliveryZone,
    deliveryFee: delivery.deliveryFee,
    deliveryAllowed: delivery.deliveryAllowed,
    grandTotal,
  };
}

module.exports = {
  DEFAULT_LOYALTY_RULES,
  DELIVERY_ZONE_FEES,
  parsePriceNumber,
  formatSLR,
  normalizeLoyaltyRules,
  getLoyaltyDiscountPercent,
  getUserPointsFromPurchases,
  isPromotionActiveNow,
  pickBestPromotion,
  calculateDeliveryFee,
  calculateDeliveryFeeFromAddress,
  computeFinalPaidAndPoints,
  calculateCheckoutPricing,
};
