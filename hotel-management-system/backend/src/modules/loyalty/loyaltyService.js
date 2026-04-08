const { normalizeLoyaltyRules, parsePriceNumber, getUserPointsFromPurchases, getLoyaltyDiscountPercent, computePointsFromLineItems } = require("../../shared/utils/loyalty");
const {
  readRules,
  writeRules,
  listPurchases,
  appendPurchases,
  updatePurchaseStatus: updatePurchaseStatusInStore,
  appendAuditEntry,
  listAuditEntries,
} = require("./loyaltyStore");
const { findMenuItemsByIds, findMenuItemsByNames } = require("../menu/menuStore");

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

function formatPrice(value) {
  return `SLR ${Math.round(Number(value) || 0)}`;
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

async function listRules() {
  const rules = await readRules();
  return normalizeLoyaltyRules(rules);
}

async function saveRules(rules) {
  const normalized = normalizeLoyaltyRules(rules);
  await writeRules(normalized);
  return normalized;
}

async function getLoyaltySummaryForUser(email) {
  const [rules, purchases] = await Promise.all([listRules(), listPurchases()]);
  const points = getUserPointsFromPurchases(purchases, email);
  const discountPercent = getLoyaltyDiscountPercent(points, rules);

  return {
    email,
    points,
    discountPercent,
    rules,
  };
}

async function addPurchasesForUser(email, purchasesInput, meta = {}) {
  const purchases = Array.isArray(purchasesInput) ? purchasesInput : [];
  const now = new Date().toISOString();

  const existing = await listPurchases();
  const rules = await listRules();
  const pointsBefore = getUserPointsFromPurchases(existing, email);
  const discountPercent = getLoyaltyDiscountPercent(pointsBefore, rules);

  const allLineItems = purchases.flatMap((purchase) => (Array.isArray(purchase && purchase.items ? purchase.items : []) ? purchase.items : []));
  const menuItemIds = [...new Set(allLineItems.map((item) => String(item && item.menuItemId ? item.menuItemId : "").trim()).filter(Boolean))];
  const menuItemNames = [
    ...new Set(allLineItems.map((item) => String(item && item.itemName ? item.itemName : "").trim().toLowerCase()).filter(Boolean)),
  ];
  const [menuById, menuByName] = await Promise.all([findMenuItemsByIds(menuItemIds), findMenuItemsByNames(menuItemNames)]);
  const menuItems = [...menuById, ...menuByName];
  const existingKeys = new Set(
    existing
      .map((row) => {
        const id = String(row && row.id ? row.id : "").trim();
        const userEmail = String(row && row.userEmail ? row.userEmail : "").trim().toLowerCase();
        if (!id || !userEmail) return "";
        return `${userEmail}:${id}`;
      })
      .filter(Boolean)
  );

  const seenIncoming = new Set();
  const rows = purchases
    .map((purchase) => {
      const id = String(purchase && purchase.id ? purchase.id : "").trim();
      if (!id) return null;

      const hasSubtotal = purchase && Object.prototype.hasOwnProperty.call(purchase, "subtotal");
      const subtotal = hasSubtotal ? Number(purchase.subtotal) : null;
      const promotionDiscount =
        purchase && Object.prototype.hasOwnProperty.call(purchase, "promotionDiscount")
          ? Number(purchase.promotionDiscount)
          : 0;

      const orderType = purchase && Object.prototype.hasOwnProperty.call(purchase, "orderType") ? String(purchase.orderType) : "";
      const deliveryAddress =
        purchase && Object.prototype.hasOwnProperty.call(purchase, "deliveryAddress") ? String(purchase.deliveryAddress) : "";
      const deliveryCityTown =
        purchase && Object.prototype.hasOwnProperty.call(purchase, "deliveryCityTown") ? String(purchase.deliveryCityTown) : "";

      let computed = null;
      if (typeof subtotal === "number" && Number.isFinite(subtotal)) {
        computed = computeFinalPaidAndPoints({
          subtotal,
          promotionDiscount,
          discountPercent,
          orderType,
          deliveryAddress,
          deliveryCityTown,
        });
      }

      const items = Array.isArray(purchase && purchase.items ? purchase.items : []) ? purchase.items : undefined;
      const pointsFromItems = items ? computePointsFromLineItems(items, menuItems) : null;
      const resolvedPointsEarned =
        pointsFromItems !== null && pointsFromItems !== undefined
          ? pointsFromItems
          : computed
            ? computed.pointsEarned
            : undefined;

      return {
        id,
        orderId: String(purchase && purchase.orderId ? purchase.orderId : "").trim() || null,
        userEmail: email,
        orderType: String(orderType || "").trim() || undefined,
        status: String(purchase && Object.prototype.hasOwnProperty.call(purchase, "status") ? purchase.status : "").trim() || "Pending",
        statusUpdatedAt: now,
        items: items && Array.isArray(items) ? items : undefined,
        deliveryAddress: String(deliveryAddress || "").trim() || undefined,
        deliveryCityTown: String(deliveryCityTown || "").trim() || undefined,
        subtotal: computed ? computed.subtotal : undefined,
        promotionDiscount: computed ? computed.promotionDiscount : undefined,
        loyaltyPercentUsed: computed ? computed.loyaltyPercentUsed : undefined,
        loyaltyDiscount: computed ? computed.loyaltyDiscount : undefined,
        deliveryZone: computed ? computed.deliveryZone : undefined,
        deliveryFee: computed ? computed.deliveryFee : undefined,
        finalPaid: computed ? computed.finalPaid : undefined,
        pointsEarned: resolvedPointsEarned,
        price: computed ? formatPrice(computed.finalPaid) : String(purchase && purchase.price !== undefined ? purchase.price : "").trim(),
        createdAt: String(purchase && purchase.createdAt ? purchase.createdAt : "").trim() || now,
      };
    })
    .filter(Boolean)
    .filter((row) => {
      const key = `${String(email).trim().toLowerCase()}:${row.id}`;
      if (existingKeys.has(key)) return false;
      if (seenIncoming.has(key)) return false;
      seenIncoming.add(key);
      return true;
    });

  if (rows.length > 0) {
    await appendPurchases(rows);
  }

  await appendAuditEntry(
    {
      at: now,
      userEmail: String(email || "").trim().toLowerCase(),
      ip: String(meta && meta.ip ? meta.ip : "").trim(),
      userAgent: String(meta && meta.userAgent ? meta.userAgent : "").trim(),
      discountPercentUsed: discountPercent,
      purchasesAttempted: purchases.length,
      purchasesAdded: rows.length,
      purchasesSkipped: Math.max(0, purchases.length - rows.length),
      orderIds: [...new Set(purchases.map((p) => String(p && p.orderId ? p.orderId : "").trim()).filter(Boolean))].slice(0, 20),
      addedPurchaseIds: rows.map((row) => row.id).slice(0, 50),
      pointsEarnedAdded: rows.reduce((sum, row) => sum + (Number(row.pointsEarned) || parsePriceNumber(row.price)), 0),
    },
    { maxEntries: 2000 }
  );

  const summary = await getLoyaltySummaryForUser(email);
  return { purchasesAdded: rows.length, summary, purchasesSkipped: Math.max(0, purchases.length - rows.length) };
}

async function listPurchasesForUser(email) {
  const purchases = await listPurchases();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return purchases.filter(
    (purchase) => String(purchase && purchase.userEmail ? purchase.userEmail : "").trim().toLowerCase() === normalizedEmail
  );
}

async function listAllPurchases() {
  return listPurchases();
}

async function updatePurchaseStatus({ id, userEmail, status, cancelReason, updatedBy } = {}) {
  const purchaseId = String(id || "").trim();
  if (!purchaseId) return null;
  const normalizedEmail = String(userEmail || "").trim().toLowerCase();
  const nextStatus = String(status || "").trim();
  if (!nextStatus) return null;

  return updatePurchaseStatusInStore({
    id: purchaseId,
    userEmail: normalizedEmail,
    status: nextStatus,
    cancelReason: String(cancelReason || "").trim(),
    cancelledBy: nextStatus === "Cancelled" ? String(updatedBy || "").trim() : "",
    statusUpdatedAt: new Date().toISOString(),
  });
}

module.exports = {
  listRules,
  saveRules,
  getLoyaltySummaryForUser,
  addPurchasesForUser,
  listPurchasesForUser,
  listAllPurchases,
  listAuditEntries,
  updatePurchaseStatus,
};
