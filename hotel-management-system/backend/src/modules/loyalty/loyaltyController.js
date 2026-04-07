const { ROLES } = require("../../shared/constants/roles");
const { isCompletedPurchase, parsePriceNumber } = require("../../shared/utils/loyalty");
const {
  listRules,
  saveRules,
  getLoyaltySummaryForUser,
  addPurchasesForUser,
  listPurchasesForUser,
  listAllPurchases: listAllPurchasesFromStore,
  listAuditEntries,
  updatePurchaseStatus: updatePurchaseStatusInService,
} = require("./loyaltyService");
const { validateReplaceRules, validateAddPurchases, validateUpdatePurchaseStatus } = require("./validators/loyaltyValidator");

async function getRules(_req, res) {
  const rules = await listRules();
  return res.json({ success: true, rules });
}

async function replaceRules(req, res) {
  const validation = validateReplaceRules(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const rules = await saveRules(validation.value.rules);
  return res.json({ success: true, rules });
}

async function getMyLoyaltySummary(req, res) {
  const email = String(req.auth && req.auth.email ? req.auth.email : "").trim().toLowerCase();
  const role = req.auth && req.auth.role ? req.auth.role : undefined;

  if (!email) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  if (role === ROLES.ADMIN) {
    return res.json({
      success: true,
      summary: {
        email,
        points: 0,
        discountPercent: 0,
        rules: await listRules(),
      },
    });
  }

  const summary = await getLoyaltySummaryForUser(email);
  return res.json({ success: true, summary });
}

async function addMyPurchases(req, res) {
  const email = String(req.auth && req.auth.email ? req.auth.email : "").trim().toLowerCase();
  const role = req.auth && req.auth.role ? req.auth.role : undefined;

  if (!email) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }
  if (role !== ROLES.USER) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const validation = validateAddPurchases(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const result = await addPurchasesForUser(email, validation.value.purchases, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  return res.json({ success: true, ...result });
}

async function listMyPurchases(req, res) {
  const email = String(req.auth && req.auth.email ? req.auth.email : "").trim().toLowerCase();
  const role = req.auth && req.auth.role ? req.auth.role : undefined;

  if (!email) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }
  if (role !== ROLES.USER) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const purchases = await listPurchasesForUser(email);
  return res.json({ success: true, purchases });
}

async function listAllPurchases(req, res) {
  try {
    const purchases = await listAllPurchasesFromStore();

    const pointsByEmail = {};
    purchases.forEach((purchase) => {
      const email = String(purchase && purchase.userEmail ? purchase.userEmail : "").trim().toLowerCase();
      if (!email) return;
      if (!isCompletedPurchase(purchase)) return;

      const earned = purchase && Object.prototype.hasOwnProperty.call(purchase, "pointsEarned")
        ? Number(purchase.pointsEarned) || 0
        : parsePriceNumber(purchase ? purchase.price : "");
      pointsByEmail[email] = (Number(pointsByEmail[email]) || 0) + (Number(earned) || 0);
    });

    return res.json({ success: true, purchases, pointsByEmail });
  } catch (error) {
    const status = Number(error && error.status ? error.status : 500);
    const message = status === 500 ? "Unable to list purchases." : String(error.message || "Error");
    return res.status(status).json({ success: false, message });
  }
}

async function listAudit(req, res) {
  try {
    const entries = await listAuditEntries();
    return res.json({ success: true, entries });
  } catch (error) {
    const status = Number(error && error.status ? error.status : 500);
    const message = status === 500 ? "Unable to list audit entries." : String(error.message || "Error");
    return res.status(status).json({ success: false, message });
  }
}

async function updatePurchaseStatus(req, res) {
  const email = String(req.auth && req.auth.email ? req.auth.email : "").trim().toLowerCase();
  const role = req.auth && req.auth.role ? req.auth.role : undefined;
  const purchaseId = String(req.params && req.params.id ? req.params.id : "").trim();

  if (!email) return res.status(401).json({ success: false, message: "Unauthorized." });
  if (!purchaseId) return res.status(400).json({ success: false, message: "Missing purchase id." });

  const validation = validateUpdatePurchaseStatus(req.body);
  if (!validation.ok) return res.status(400).json({ success: false, message: validation.message });

  const targetUserEmail = validation.value.userEmail || (role === ROLES.USER ? email : "");
  if (role === ROLES.USER && targetUserEmail && targetUserEmail !== email) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }
  if (role === ROLES.USER && validation.value.status !== "Cancelled") {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const updated = await updatePurchaseStatusInService({
    id: purchaseId,
    userEmail: targetUserEmail,
    status: validation.value.status,
    cancelReason: validation.value.cancelReason,
    updatedBy: role === ROLES.ADMIN ? "admin" : "user",
  });

  if (!updated) return res.status(404).json({ success: false, message: "Purchase not found." });

  return res.json({ success: true, purchase: updated });
}

module.exports = {
  getRules,
  replaceRules,
  getMyLoyaltySummary,
  addMyPurchases,
  listMyPurchases,
  listAllPurchases,
  listAudit,
  updatePurchaseStatus,
};
