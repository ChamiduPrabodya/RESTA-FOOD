const { ROLES } = require("../../shared/constants/roles");
const {
  listRules,
  saveRules,
  getLoyaltySummaryForUser,
  addPurchasesForUser,
  listPurchasesForUser,
  listAllPurchases: listAllPurchasesFromStore,
} = require("./loyaltyService");
const { validateReplaceRules, validateAddPurchases } = require("./validators/loyaltyValidator");

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

  const result = await addPurchasesForUser(email, validation.value.purchases);
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
    return res.json({ success: true, purchases });
  } catch (error) {
    const status = Number(error && error.status ? error.status : 500);
    const message = status === 500 ? "Unable to list purchases." : String(error.message || "Error");
    return res.status(status).json({ success: false, message });
  }
}

module.exports = {
  getRules,
  replaceRules,
  getMyLoyaltySummary,
  addMyPurchases,
  listMyPurchases,
  listAllPurchases,
};
