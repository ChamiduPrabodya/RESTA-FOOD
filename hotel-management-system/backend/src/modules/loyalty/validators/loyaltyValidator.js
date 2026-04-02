function validateReplaceRules(body) {
  const rules = body && Object.prototype.hasOwnProperty.call(body, "rules") ? body.rules : null;
  if (!Array.isArray(rules)) {
    return { ok: false, message: "rules must be an array." };
  }

  for (const rule of rules) {
    const threshold = Number(rule && rule.threshold !== undefined ? rule.threshold : NaN);
    const discount = Number(rule && rule.discount !== undefined ? rule.discount : NaN);
    if (!Number.isFinite(threshold) || threshold < 0) {
      return { ok: false, message: "Each rule.threshold must be a number (0 or more)." };
    }
    if (!Number.isFinite(discount) || discount < 0) {
      return { ok: false, message: "Each rule.discount must be a number (0 or more)." };
    }
  }

  return { ok: true, value: { rules } };
}

function validateAddPurchases(body) {
  const purchases = body && Object.prototype.hasOwnProperty.call(body, "purchases") ? body.purchases : null;
  if (!Array.isArray(purchases) || purchases.length === 0) {
    return { ok: false, message: "purchases must be a non-empty array." };
  }

  for (const purchase of purchases) {
    const id = purchase && Object.prototype.hasOwnProperty.call(purchase, "id") ? String(purchase.id).trim() : "";
    if (!id) {
      return { ok: false, message: "Each purchase must include id." };
    }

    const hasPrice = purchase && Object.prototype.hasOwnProperty.call(purchase, "price");
    if (!hasPrice) {
      return { ok: false, message: "Each purchase must include price." };
    }

    const createdAt = purchase && purchase.createdAt !== undefined ? String(purchase.createdAt) : "";
    if (createdAt && Number.isNaN(new Date(createdAt).getTime())) {
      return { ok: false, message: "Each purchase.createdAt must be a valid date string." };
    }

    if (purchase && Object.prototype.hasOwnProperty.call(purchase, "loyaltyPointsEarned")) {
      return { ok: false, message: "Do not send purchase.loyaltyPointsEarned. Server computes loyalty points." };
    }
  }

  return { ok: true, value: { purchases } };
}

module.exports = {
  validateReplaceRules,
  validateAddPurchases,
};
