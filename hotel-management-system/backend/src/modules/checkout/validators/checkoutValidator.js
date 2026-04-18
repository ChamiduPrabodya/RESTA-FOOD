function validateCartItem(body) {
  // Make sure the cart row still identifies a real menu choice on the backend.
  const itemName = String(body && body.itemName ? body.itemName : "").trim();
  if (!itemName) {
    return { ok: false, message: "itemName is required." };
  }

  // Prices must always be numeric and non-negative before we store them.
  const unitPrice = Number(body && body.unitPrice);
  if (!Number.isFinite(unitPrice) || unitPrice < 0) {
    return { ok: false, message: "unitPrice must be a number (0 or more)." };
  }

  // Quantities must stay above zero so the cart cannot contain invalid rows.
  const quantity = Number(body && body.quantity !== undefined ? body.quantity : 1);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return { ok: false, message: "quantity must be greater than 0." };
  }

  return {
    ok: true,
    value: {
      id: body && body.id,
      menuItemId: body && body.menuItemId,
      itemName,
      size: body && body.size,
      image: body && body.image,
      unitPrice,
      quantity,
      createdAt: body && body.createdAt,
    },
  };
}

function validatePlaceOrder(body) {
  // The checkout flow only supports the same two order modes used by the frontend.
  const orderType = String(body && body.orderType ? body.orderType : "Delivery").trim();
  if (!["Delivery", "Takeaway"].includes(orderType)) {
    return { ok: false, message: "orderType must be Delivery or Takeaway." };
  }

  const paymentMethod = String(body && body.paymentMethod ? body.paymentMethod : "Cash").trim() || "Cash";
  const deliveryDetails = body && typeof body.deliveryDetails === "object" ? body.deliveryDetails : null;
  const promotions = Array.isArray(body && body.promotions) ? body.promotions : [];
  const loyaltyRules = Array.isArray(body && body.loyaltyRules) ? body.loyaltyRules : null;
  const menuItems = Array.isArray(body && body.menuItems) ? body.menuItems : [];

  return {
    ok: true,
    value: {
      orderType,
      paymentMethod,
      deliveryDetails,
      promotions,
      loyaltyRules,
      menuItems,
    },
  };
}

function validateStatusUpdate(body) {
  const status = String(body && body.status ? body.status : "").trim();
  const cancelReason = String(body && body.cancelReason ? body.cancelReason : "").trim();

  // Admin status updates need a target status before we can normalize or apply it.
  if (!status) {
    return { ok: false, message: "status is required." };
  }

  return { ok: true, value: { status, cancelReason } };
}

module.exports = {
  validateCartItem,
  validatePlaceOrder,
  validateStatusUpdate,
};
