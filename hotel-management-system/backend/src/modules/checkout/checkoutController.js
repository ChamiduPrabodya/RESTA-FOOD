const { ROLES } = require("../../shared/constants/roles");
const {
  getCartForUser,
  addCartItemForUser,
  updateCartItemQuantityForUser,
  removeCartItemForUser,
  getCheckoutSummaryForUser,
  placeOrderForUser,
  initPayHerePaymentForUser,
  listOrdersForUser,
  getOrderForUserById,
  listPurchasesForUser,
  updatePurchaseStatusById,
  updateOrderStatusById,
  getLastDeliveryDetailsForUser,
  handlePayHereNotification,
} = require("./checkoutService");
const { validateCartItem, validatePlaceOrder, validateStatusUpdate } = require("./validators/checkoutValidator");

function getAuthSnapshot(req) {
  return {
    email: req.auth && req.auth.email,
    role: req.auth && req.auth.role,
    fullName: req.auth && req.auth.fullName,
    phone: req.auth && req.auth.phone,
    streetAddress1: req.auth && req.auth.streetAddress1,
    streetAddress2: req.auth && req.auth.streetAddress2,
    cityTown: req.auth && req.auth.cityTown,
    address: req.auth && req.auth.address,
  };
}

async function getMyCart(req, res) {
  const items = await getCartForUser(req.auth.email);
  return res.json({ success: true, cartItems: items });
}

async function addCartItem(req, res) {
  const validation = validateCartItem(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const cartItems = await addCartItemForUser(req.auth.email, validation.value);
  return res.status(201).json({ success: true, cartItems });
}

async function updateCartItem(req, res) {
  const quantity = Number(req.body && req.body.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) {
    return res.status(400).json({ success: false, message: "quantity must be greater than 0." });
  }

  try {
    const cartItems = await updateCartItemQuantityForUser(req.auth.email, req.params.cartItemId, quantity);
    return res.json({ success: true, cartItems });
  } catch (error) {
    return res.status(Number(error.status || 500)).json({ success: false, message: String(error.message || "Unable to update cart item.") });
  }
}

async function deleteCartItem(req, res) {
  const cartItems = await removeCartItemForUser(req.auth.email, req.params.cartItemId);
  return res.json({ success: true, cartItems });
}

async function getCheckoutSummary(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const summary = await getCheckoutSummaryForUser(req.auth.email, {
    orderType: body.orderType,
    deliveryAddress: body.deliveryAddress,
    deliveryCityTown: body.deliveryCityTown,
    promotions: Array.isArray(body.promotions) ? body.promotions : [],
    loyaltyRules: Array.isArray(body.loyaltyRules) ? body.loyaltyRules : null,
  });
  const lastDeliveryDetails = await getLastDeliveryDetailsForUser(req.auth.email);

  return res.json({ success: true, ...summary, lastDeliveryDetails });
}

async function placeOrder(req, res) {
  const validation = validatePlaceOrder(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  try {
    const result = await placeOrderForUser(req.auth.email, getAuthSnapshot(req), validation.value);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return res.status(Number(error.status || 500)).json({ success: false, message: String(error.message || "Unable to place order.") });
  }
}

async function initPayHerePayment(req, res) {
  const validation = validatePlaceOrder(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  try {
    const result = await initPayHerePaymentForUser(req.auth.email, getAuthSnapshot(req), validation.value);
    return res.status(201).json({ success: true, ...result });
  } catch (error) {
    return res.status(Number(error.status || 500)).json({ success: false, message: String(error.message || "Unable to initialize PayHere payment.") });
  }
}

async function getOrders(req, res) {
  const orders = await listOrdersForUser(req.auth.email, req.auth.role);
  return res.json({ success: true, orders });
}

async function getOrderById(req, res) {
  const order = await getOrderForUserById(req.auth.email, req.auth.role, req.params.orderId);
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found." });
  }
  return res.json({ success: true, order });
}

async function getPurchases(req, res) {
  const purchases = await listPurchasesForUser(req.auth.email, req.auth.role);
  return res.json({ success: true, purchases });
}

async function updatePurchaseStatus(req, res) {
  if (req.auth.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const validation = validateStatusUpdate(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  try {
    const purchase = await updatePurchaseStatusById(
      req.params.purchaseId,
      validation.value.status,
      validation.value.cancelReason
    );
    return res.json({ success: true, purchase });
  } catch (error) {
    return res.status(Number(error.status || 500)).json({ success: false, message: String(error.message || "Unable to update purchase status.") });
  }
}

async function updateOrderStatus(req, res) {
  if (req.auth.role !== ROLES.ADMIN) {
    return res.status(403).json({ success: false, message: "Forbidden." });
  }

  const validation = validateStatusUpdate(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  try {
    const order = await updateOrderStatusById(
      req.params.orderId,
      validation.value.status,
      validation.value.cancelReason
    );
    return res.json({ success: true, order });
  } catch (error) {
    return res.status(Number(error.status || 500)).json({ success: false, message: String(error.message || "Unable to update order status.") });
  }
}

async function notifyPayHere(req, res) {
  try {
    await handlePayHereNotification(req.body || {});
    return res.status(200).send("OK");
  } catch (error) {
    return res.status(Number(error.status || 500)).send(String(error.message || "ERROR"));
  }
}

module.exports = {
  getMyCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  getCheckoutSummary,
  placeOrder,
  initPayHerePayment,
  getOrders,
  getOrderById,
  getPurchases,
  updatePurchaseStatus,
  updateOrderStatus,
  notifyPayHere,
};
