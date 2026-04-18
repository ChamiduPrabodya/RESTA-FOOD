const DELIVERY_ZONE_FEES = Object.freeze({
  gonapola: 100,
  koralima: 150,
  olaboduwa: 150,
  kubuka: 150,
});

function detectDeliveryZoneFromAddress(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) return null;
  const zones = Object.keys(DELIVERY_ZONE_FEES);
  for (const zone of zones) {
    if (zone && normalized.includes(zone)) return zone;
  }
  return null;
}

function calculateDeliveryFee({ orderType, deliveryAddress, deliveryCityTown } = {}) {
  const type = String(orderType || "").trim().toLowerCase();
  if (type && type !== "delivery") return { deliveryZone: null, deliveryFee: 0, deliveryAllowed: true };
  // Default to delivery when unspecified (backwards compatibility with older clients).
  const zone = detectDeliveryZoneFromAddress(deliveryCityTown || deliveryAddress);
  const allowed = Boolean(zone);
  const fee = allowed ? Math.max(0, Number(DELIVERY_ZONE_FEES[zone]) || 0) : 0;
  return { deliveryZone: zone, deliveryFee: fee, deliveryAllowed: allowed };
}

function computeFinalPaidAndPoints({ subtotal, promotionDiscount, discountPercent, orderType, deliveryAddress, deliveryCityTown } = {}) {
  const safeSubtotal = Math.max(0, Number(subtotal) || 0);
  const safePromotionDiscount = Math.min(safeSubtotal, Math.max(0, Number(promotionDiscount) || 0));

  // Stacking rule:
  // 1) Apply promotion discount on subtotal
  // 2) Apply loyalty % discount on (subtotal - promotionDiscount)
  // 3) Add delivery fee (if Delivery and zone allowed)
  const afterPromotion = Math.max(0, safeSubtotal - safePromotionDiscount);
  const percent = Math.max(0, Number(discountPercent) || 0);
  const loyaltyDiscount = Math.min(afterPromotion, Math.max(0, Math.round((afterPromotion * percent) / 100)));
  const discountedTotal = Math.max(0, afterPromotion - loyaltyDiscount);

  const delivery = calculateDeliveryFee({ orderType, deliveryAddress, deliveryCityTown });
  const finalPaid = Math.max(0, discountedTotal + (Number(delivery.deliveryFee) || 0));

  // Points rule: 1 point per SLR of final paid amount (rounded).
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

module.exports = {
  calculateDeliveryFee,
  computeFinalPaidAndPoints,
};

