function validateCreateOrder(body) {
  const payload = body && typeof body === "object" ? body : {};

  const items = Object.prototype.hasOwnProperty.call(payload, "items") ? payload.items : null;
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, message: "items must be a non-empty array." };
  }

  const orderType = String(payload.orderType || "").trim();
  const paymentMethod = String(payload.paymentMethod || "").trim();

  const promotionDiscount = payload.promotionDiscount !== undefined ? Number(payload.promotionDiscount) : 0;
  if (!Number.isFinite(promotionDiscount) || promotionDiscount < 0) {
    return { ok: false, message: "promotionDiscount must be a number (0 or more)." };
  }

  const deliveryAddress = payload.deliveryAddress !== undefined ? String(payload.deliveryAddress || "").trim() : "";
  const deliveryCityTown = payload.deliveryCityTown !== undefined ? String(payload.deliveryCityTown || "").trim() : "";
  const tableId = payload.tableId !== undefined ? String(payload.tableId || "").trim() : "";
  const tableSessionId = payload.tableSessionId !== undefined ? String(payload.tableSessionId || "").trim() : "";

  const normalizedItems = [];
  for (const item of items) {
    const menuItemId = item && Object.prototype.hasOwnProperty.call(item, "menuItemId") ? String(item.menuItemId || "").trim() : "";
    const itemName = item && Object.prototype.hasOwnProperty.call(item, "itemName") ? String(item.itemName || "").trim() : "";
    if (!menuItemId && !itemName) {
      return { ok: false, message: "Each items entry must include menuItemId or itemName." };
    }

    const quantity = Number(item && Object.prototype.hasOwnProperty.call(item, "quantity") ? item.quantity : NaN);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, message: "Each items entry must include quantity (> 0)." };
    }

    const size = item && Object.prototype.hasOwnProperty.call(item, "size") ? String(item.size || "").trim() : "";
    normalizedItems.push({
      menuItemId,
      itemName,
      quantity: Math.round(quantity),
      size,
    });
  }

  return {
    ok: true,
    value: {
      items: normalizedItems,
      orderType,
      paymentMethod,
      promotionDiscount,
      deliveryAddress,
      deliveryCityTown,
      tableId,
      tableSessionId,
    },
  };
}

function validateUpdateOrderStatus(body) {
  const payload = body && typeof body === "object" ? body : {};
  const status = String(payload.status || "").trim();
  if (!status) return { ok: false, message: "status is required." };

  const normalized = status.trim().toLowerCase();
  const allowed = {
    pending: "Pending",
    preparing: "Preparing",
    prepared: "Prepared",
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

  return { ok: true, value: { status: allowed[normalized], cancelReason } };
}

function validateInitiatePayment(body) {
  const payload = body && typeof body === "object" ? body : {};
  const provider = String(payload.provider || "mock").trim().toLowerCase();
  if (provider !== "mock" && provider !== "payhere") {
    return { ok: false, message: "Unsupported payment provider." };
  }

  if (provider === "mock") {
    const method = String(payload.method || "card").trim().toLowerCase();
    if (method !== "card") {
      return { ok: false, message: "Unsupported payment method." };
    }
    return { ok: true, value: { provider: "mock", method: "card" } };
  }

  const customer = payload && typeof payload.customer === "object" ? payload.customer : null;
  const normalizedCustomer = customer
    ? {
        firstName: String(customer.firstName || "").trim(),
        lastName: String(customer.lastName || "").trim(),
        email: String(customer.email || "").trim(),
        phone: String(customer.phone || "").trim(),
        address: String(customer.address || "").trim(),
        city: String(customer.city || "").trim(),
        country: String(customer.country || "").trim(),
      }
    : null;

  return { ok: true, value: { provider: "payhere", customer: normalizedCustomer } };
}

module.exports = {
  validateCreateOrder,
  validateUpdateOrderStatus,
  validateInitiatePayment,
};
