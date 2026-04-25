export const DEFAULT_LOYALTY_RULES = [
  { id: "r1", threshold: "2000", discount: "1" },
  { id: "r2", threshold: "5000", discount: "3" },
  { id: "r3", threshold: "10000", discount: "5" },
];

export const DELIVERY_ZONE_FEES = Object.freeze({
  gonapola: 100,
  koralima: 150,
  olaboduwa: 150,
  kubuka: 150,
});

export const parsePriceNumber = (value) => Number(String(value ?? "").replace(/[^\d.]/g, "")) || 0;

export const formatSLR = (value) => `SLR ${Math.round(Number(value) || 0).toLocaleString()}`;

export const isCompletedPurchase = (purchase) => {
  if (!purchase || typeof purchase !== "object") return false;
  if (!Object.prototype.hasOwnProperty.call(purchase, "status")) {
    // Legacy records (before status support) count as completed.
    return true;
  }
  const status = String(purchase.status || "").trim().toLowerCase();
  return status === "delivered" || status === "completed" || status === "paid";
};

export const getPurchasePoints = (purchase) => {
  if (!purchase || typeof purchase !== "object") return 0;
  if (Object.prototype.hasOwnProperty.call(purchase, "pointsEarned")) {
    return Math.max(0, Number(purchase.pointsEarned) || 0);
  }
  if (Object.prototype.hasOwnProperty.call(purchase, "loyaltyPointsEarned")) {
    return Math.max(0, Number(purchase.loyaltyPointsEarned) || 0);
  }
  return Math.max(0, parsePriceNumber(purchase.price));
};

export const normalizeLoyaltyRules = (rules) => {
  const source = Array.isArray(rules) ? rules : DEFAULT_LOYALTY_RULES;
  const deduped = new Map();

  source.forEach((rule) => {
    const thresholdNumber = Number(rule?.threshold);
    const discountNumber = Number(rule?.discount);
    if (!Number.isFinite(thresholdNumber) || thresholdNumber < 0) return;
    if (!Number.isFinite(discountNumber) || discountNumber < 0) return;

    const threshold = String(Math.round(thresholdNumber));
    const discount = String(Math.round(discountNumber));
    const existing = deduped.get(threshold);

    if (!existing || Number(discount) >= Number(existing.discount)) {
      deduped.set(threshold, {
        id: String(rule?.id || existing?.id || crypto.randomUUID()),
        threshold,
        discount,
      });
    }
  });

  if (deduped.size === 0) {
    return DEFAULT_LOYALTY_RULES.map((rule) => ({ ...rule }));
  }

  return [...deduped.values()].sort((a, b) => Number(a.threshold) - Number(b.threshold));
};

export const getLoyaltyDiscountPercent = (points, rules) => {
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
  return Math.max(0, Number(matched?.discount) || 0);
};

export const getUserPointsFromPurchases = (purchases, userEmail) => {
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  if (!normalizedEmail) return 0;
  return (Array.isArray(purchases) ? purchases : [])
    .filter((purchase) => String(purchase?.userEmail || "").trim().toLowerCase() === normalizedEmail)
    .filter(isCompletedPurchase)
    .reduce((sum, purchase) => {
      return sum + getPurchasePoints(purchase);
    }, 0);
};

const parsePromotionDate = (dateText, endOfDay = false) => {
  const normalized = String(dateText || "").trim();
  if (!normalized) return null;
  const date = new Date(`${normalized}T00:00:00`);
  if (Number.isNaN(date.getTime())) return null;
  if (endOfDay) {
    date.setHours(23, 59, 59, 999);
  }
  return date;
};

export const isPromotionActiveNow = (promotion, now) => {
  if (!promotion || !promotion.active) return false;
  const start = parsePromotionDate(promotion.startDate, false);
  const end = parsePromotionDate(promotion.endDate, true);
  if (!start || !end) return false;
  const nowTime = (now instanceof Date ? now : new Date()).getTime();
  return start.getTime() <= nowTime && nowTime <= end.getTime();
};

export const calculatePromotionDiscount = (subtotal, promotion) => {
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
};

export const pickBestPromotion = (promotions, { subtotal, now, type = "food" } = {}) => {
  const subtotalValue = Number(subtotal) || 0;
  const clock = now instanceof Date ? now : new Date();
  const list = Array.isArray(promotions) ? promotions : [];

  const eligible = list.filter((promotion) => {
    if (!promotion) return false;
    if (String(promotion.type || "food") !== type) return false;
    if (!isPromotionActiveNow(promotion, clock)) return false;
    const minOrderValue = Math.max(0, Number(promotion.minOrderValue) || 0);
    if (subtotalValue < minOrderValue) return false;
    return true;
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
};

export const calculateCartSubtotal = (cartItems) =>
  (Array.isArray(cartItems) ? cartItems : []).reduce(
    (sum, item) => sum + (Number(item?.unitPrice) || 0) * (Number(item?.quantity) || 0),
    0
  );

export const detectDeliveryZoneFromAddress = (address, zoneFees = DELIVERY_ZONE_FEES) => {
  const normalizedAddress = String(address || "").trim().toLowerCase();
  if (!normalizedAddress) return null;

  const entries = Object.entries(zoneFees || {});
  for (const [zone] of entries) {
    if (!zone) continue;
    if (normalizedAddress.includes(String(zone).toLowerCase())) return zone;
  }

  return null;
};

export const calculateDeliveryFeeFromAddress = ({ orderType, address, cityTown, zoneFees } = {}) => {
  if (String(orderType || "").trim().toLowerCase() !== "delivery") {
    return { deliveryZone: null, deliveryFee: 0, deliveryAllowed: true };
  }

  const fees = zoneFees || DELIVERY_ZONE_FEES;
  const deliveryZone = detectDeliveryZoneFromAddress(cityTown || address, fees);
  const deliveryAllowed = Boolean(deliveryZone);
  const deliveryFee = deliveryAllowed ? Math.max(0, Number(fees?.[deliveryZone]) || 0) : 0;

  return { deliveryZone, deliveryFee, deliveryAllowed };
};

export const calculateCheckoutPricing = ({
  cartItems,
  userEmail,
  purchases,
  promotions,
  loyaltyRules,
  points,
  loyaltyPercent,
  orderType,
  deliveryAddress,
  deliveryCityTown,
  now,
} = {}) => {
  const subtotal = calculateCartSubtotal(cartItems);
  const resolvedPoints =
    points !== undefined && points !== null && String(points).trim() !== ""
      ? Math.max(0, Math.round(Number(points) || 0))
      : getUserPointsFromPurchases(purchases, userEmail);

  const resolvedLoyaltyPercent =
    loyaltyPercent !== undefined && loyaltyPercent !== null && String(loyaltyPercent).trim() !== ""
      ? Math.max(0, Number(loyaltyPercent) || 0)
      : getLoyaltyDiscountPercent(resolvedPoints, loyaltyRules);

  const bestPromotion = pickBestPromotion(promotions, { subtotal, now, type: "food" });
  const promotionDiscount = bestPromotion?.amount || 0;

  const afterPromotion = Math.max(0, subtotal - promotionDiscount);
  const loyaltyDiscount = Math.max(0, Math.round((afterPromotion * resolvedLoyaltyPercent) / 100));

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
    points: resolvedPoints,
    promotion: bestPromotion?.promotion || null,
    promotionDiscount,
    loyaltyPercent: resolvedLoyaltyPercent,
    loyaltyDiscount,
    totalDiscount,
    total,
    deliveryZone: delivery.deliveryZone,
    deliveryFee: delivery.deliveryFee,
    deliveryAllowed: delivery.deliveryAllowed,
    grandTotal,
  };
};
