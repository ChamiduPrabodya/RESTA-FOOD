const crypto = require("node:crypto");

const { normalizeLoyaltyRules, getUserPointsFromPurchases, getLoyaltyDiscountPercent } = require("../../shared/utils/loyalty");
const {
  readRules,
  writeRules,
  listPurchases,
  appendPurchases,
} = require("./loyaltyStore");

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

async function addPurchasesForUser(email, purchasesInput) {
  const purchases = Array.isArray(purchasesInput) ? purchasesInput : [];
  const now = new Date().toISOString();

  const rows = purchases.map((purchase) => ({
    id: String(purchase.id || "").trim() || crypto.randomUUID(),
    orderId: String(purchase.orderId || "").trim() || null,
    userEmail: email,
    price: String(purchase.price ?? "").trim(),
    loyaltyPointsEarned:
      Object.prototype.hasOwnProperty.call(purchase, "loyaltyPointsEarned") && purchase.loyaltyPointsEarned !== undefined
        ? Math.max(0, Math.round(Number(purchase.loyaltyPointsEarned) || 0))
        : undefined,
    createdAt: String(purchase.createdAt || "").trim() || now,
  }));

  await appendPurchases(rows);
  const summary = await getLoyaltySummaryForUser(email);
  return { purchasesAdded: rows.length, summary };
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

module.exports = {
  listRules,
  saveRules,
  getLoyaltySummaryForUser,
  addPurchasesForUser,
  listPurchasesForUser,
  listAllPurchases,
};
