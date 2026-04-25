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
    if (!Number.isFinite(discount) || discount < 0 || discount > 100) {
      return { ok: false, message: "Each rule.discount must be a number between 0 and 100." };
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
    const hasSubtotal = purchase && Object.prototype.hasOwnProperty.call(purchase, "subtotal");
    if (!hasPrice && !hasSubtotal) {
      return { ok: false, message: "Each purchase must include price or subtotal." };
    }

    if (hasSubtotal) {
      const subtotal = Number(purchase.subtotal);
      if (!Number.isFinite(subtotal) || subtotal < 0) {
        return { ok: false, message: "purchase.subtotal must be a number (0 or more)." };
      }
      if (purchase && Object.prototype.hasOwnProperty.call(purchase, "promotionDiscount")) {
        const promo = Number(purchase.promotionDiscount);
        if (!Number.isFinite(promo) || promo < 0) {
          return { ok: false, message: "purchase.promotionDiscount must be a number (0 or more)." };
        }
      }
      if (purchase && Object.prototype.hasOwnProperty.call(purchase, "orderType")) {
        const orderType = String(purchase.orderType || "").trim().toLowerCase();
        if (orderType && orderType !== "delivery" && orderType !== "takeaway" && orderType !== "dinein" && orderType !== "dine-in" && orderType !== "dine in") {
          return { ok: false, message: "purchase.orderType must be Delivery, Takeaway, or DineIn." };
        }
      }
    }

    if (purchase && Object.prototype.hasOwnProperty.call(purchase, "status")) {
      const status = String(purchase.status || "").trim().toLowerCase();
      const allowed = ["pending", "preparing", "prepared", "out for delivery", "delivered", "completed", "paid", "cancelled", "canceled"];
      if (status && !allowed.includes(status)) {
        return { ok: false, message: "purchase.status is invalid." };
      }
    }

    if (purchase && Object.prototype.hasOwnProperty.call(purchase, "items")) {
      const items = purchase.items;
      if (!Array.isArray(items) || items.length === 0) {
        return { ok: false, message: "purchase.items must be a non-empty array when provided." };
      }
      for (const item of items) {
        const menuItemId = item && Object.prototype.hasOwnProperty.call(item, "menuItemId") ? String(item.menuItemId).trim() : "";
        const itemName = item && Object.prototype.hasOwnProperty.call(item, "itemName") ? String(item.itemName).trim() : "";
        if (!menuItemId && !itemName) {
          return { ok: false, message: "Each purchase.items entry must include menuItemId or itemName." };
        }
        const qty = Number(item && Object.prototype.hasOwnProperty.call(item, "quantity") ? item.quantity : NaN);
        if (!Number.isFinite(qty) || qty <= 0) {
          return { ok: false, message: "Each purchase.items entry must include quantity (> 0)." };
        }
        if (item && Object.prototype.hasOwnProperty.call(item, "unitPrice")) {
          const unitPrice = Number(item.unitPrice);
          if (!Number.isFinite(unitPrice) || unitPrice < 0) {
            return { ok: false, message: "purchase.items.unitPrice must be a number (0 or more)." };
          }
        }
      }
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

function validateUpdatePurchaseStatus(body) {
  const payload = body && typeof body === "object" ? body : {};
  const status = String(payload.status || "").trim();
  if (!status) return { ok: false, message: "status is required." };

  const normalized = status.trim().toLowerCase();
  const allowed = {
    pending: "Pending",
    preparing: "Preparing",
    prepared: "Prepared (Ready)",
    "prepared (ready)": "Prepared (Ready)",
    ready: "Prepared (Ready)",
    "out for delivery": "Out for Delivery",
    delivered: "Delivered",
    completed: "Completed",
    paid: "Paid",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };

  if (!allowed[normalized]) {
    return { ok: false, message: "Invalid status." };
  }

  const cancelReason = String(payload.cancelReason || "").trim();
  if (allowed[normalized] === "Cancelled" && !cancelReason) {
    return { ok: false, message: "cancelReason is required when cancelling." };
  }

  const userEmail = payload.userEmail !== undefined ? String(payload.userEmail || "").trim().toLowerCase() : "";

  return { ok: true, value: { status: allowed[normalized], cancelReason, userEmail } };
}

module.exports = {
  validateReplaceRules,
  validateAddPurchases,
  validateUpdatePurchaseStatus,
};
