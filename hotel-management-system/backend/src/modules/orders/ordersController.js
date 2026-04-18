const { ROLES } = require("../../shared/constants/roles");
const { httpError } = require("../../shared/errors");
const { validateCreateOrder, validateUpdateOrderStatus, validateInitiatePayment } = require("./validators/ordersValidator");
const {
  createOrderForUser,
  getOrderForActor,
  listOrdersForActor,
  setOrderStatusForActor,
  initiateMockPaymentForActor,
  confirmMockPaymentForActor,
  initiatePayhereCheckoutForActor,
} = require("./ordersService");
const { Table } = require("../../models/Table");
const { TableSession } = require("../../models/TableSession");

function getActor(req) {
  return {
    email: req && req.auth ? req.auth.email : "",
    role: req && req.auth ? req.auth.role : "",
  };
}

function buildGuestEmail({ tableId, sessionId } = {}) {
  const safeTableId = String(tableId || "").trim() || "table";
  const safeSessionId = String(sessionId || "").trim() || "session";
  return `guest+${encodeURIComponent(safeTableId)}+${encodeURIComponent(safeSessionId)}@dinein.local`;
}

async function createGuestDineInOrder(req, res) {
  const payload = req.body && typeof req.body === "object" ? req.body : {};
  const tableId = String(payload.tableId || "").trim();
  const tableToken = String(payload.tableToken || "").trim();
  const tableSessionId = String(payload.tableSessionId || payload.sessionId || "").trim();

  if (!tableId) return res.status(400).json({ success: false, message: "tableId is required." });
  if (!tableSessionId) return res.status(400).json({ success: false, message: "tableSessionId is required." });

  const table = await Table.findOne({ id: tableId }).lean();
  if (!table) return res.status(404).json({ success: false, message: "Table not found." });

  const expectedToken = String(table.qrToken || "").trim();
  if (expectedToken && tableToken !== expectedToken) {
    return res.status(401).json({ success: false, message: "Invalid table token." });
  }

  const session = await TableSession.findOne({ id: tableSessionId }).lean();
  if (!session) return res.status(404).json({ success: false, message: "Table session not found." });
  if (String(session.tableId || "").trim() !== tableId) {
    return res.status(400).json({ success: false, message: "tableSessionId does not belong to tableId." });
  }
  if (String(session.status || "").trim() !== "active") {
    return res.status(409).json({ success: false, message: "Table session is not active." });
  }

  const bodyForValidation = {
    ...(payload || {}),
    orderType: "DineIn",
    paymentMethod: "Cash",
    promotionDiscount: 0,
    deliveryAddress: "",
    deliveryCityTown: "",
    tableId,
    tableSessionId,
  };
  const validation = validateCreateOrder(bodyForValidation);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const guestEmail = buildGuestEmail({ tableId, sessionId: tableSessionId });
  const order = await createOrderForUser(guestEmail, validation.value, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
    skipLoyaltySync: true,
  });

  return res.status(201).json({ success: true, order });
}

async function createMyOrder(req, res) {
  const actor = getActor(req);
  if (actor.role !== ROLES.USER && actor.role !== ROLES.ADMIN) {
    throw httpError(403, "Forbidden.");
  }

  const validation = validateCreateOrder(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const order = await createOrderForUser(String(actor.email || "").trim().toLowerCase(), validation.value, {
    ip: req.ip,
    userAgent: req.headers["user-agent"],
  });
  return res.status(201).json({ success: true, order });
}

async function listMyOrders(req, res) {
  const actor = getActor(req);
  const orders = await listOrdersForActor(actor);
  // For non-admins, listOrdersForActor returns only their orders.
  return res.json({ success: true, orders });
}

async function getOrderById(req, res) {
  const actor = getActor(req);
  const id = String(req.params && req.params.id ? req.params.id : "").trim();
  if (!id) return res.status(400).json({ success: false, message: "Missing order id." });

  const order = await getOrderForActor(actor, id);
  if (!order) return res.status(404).json({ success: false, message: "Order not found." });
  return res.json({ success: true, order });
}

async function updateOrderStatus(req, res) {
  const actor = getActor(req);
  const id = String(req.params && req.params.id ? req.params.id : "").trim();
  if (!id) return res.status(400).json({ success: false, message: "Missing order id." });

  const validation = validateUpdateOrderStatus(req.body);
  if (!validation.ok) return res.status(400).json({ success: false, message: validation.message });

  const updated = await setOrderStatusForActor(actor, id, validation.value);
  if (!updated) return res.status(404).json({ success: false, message: "Order not found." });
  return res.json({ success: true, order: updated });
}

async function initiatePayment(req, res) {
  const actor = getActor(req);
  const id = String(req.params && req.params.id ? req.params.id : "").trim();
  if (!id) return res.status(400).json({ success: false, message: "Missing order id." });

  const validation = validateInitiatePayment(req.body);
  if (!validation.ok) return res.status(400).json({ success: false, message: validation.message });

  if (validation.value.provider === "mock") {
    const result = await initiateMockPaymentForActor(actor, id, validation.value);
    if (!result) return res.status(404).json({ success: false, message: "Order not found." });
    return res.json({ success: true, payment: result.payment, order: result.order });
  }

  const result = await initiatePayhereCheckoutForActor(actor, id, validation.value);
  if (!result) return res.status(404).json({ success: false, message: "Order not found." });
  return res.json({ success: true, order: result.order, checkout: result.checkout });
}

async function confirmPayment(req, res) {
  const actor = getActor(req);
  const id = String(req.params && req.params.id ? req.params.id : "").trim();
  if (!id) return res.status(400).json({ success: false, message: "Missing order id." });

  const result = await confirmMockPaymentForActor(actor, id);
  if (!result) return res.status(404).json({ success: false, message: "Order not found." });
  return res.json({ success: true, payment: result.payment, order: result.order });
}

module.exports = {
  createGuestDineInOrder,
  createMyOrder,
  listMyOrders,
  getOrderById,
  updateOrderStatus,
  initiatePayment,
  confirmPayment,
};
