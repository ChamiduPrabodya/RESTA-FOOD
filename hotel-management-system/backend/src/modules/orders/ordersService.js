const crypto = require("node:crypto");

const { httpError } = require("../../shared/errors");
const { parsePriceNumber } = require("../../shared/utils/loyalty");
const { computeFinalPaidAndPoints } = require("../../shared/utils/checkoutPricing");
const { formatAmount, generateCheckoutHash, getCheckoutActionUrl, safeAppendQuery } = require("../../shared/utils/payhere");
const { findMenuItemsByIds, findMenuItemsByNames } = require("../menu/menuStore");
const { getLoyaltySummaryForUser, addPurchasesForUser, updatePurchaseStatus } = require("../loyalty/loyaltyService");
const { findUserByEmail } = require("../auth/authStore");
const { addOrder, findOrderById, listOrdersForUser, listAllOrders, updateOrderById } = require("./ordersStore");
const {
  PAYHERE_MERCHANT_ID,
  PAYHERE_MERCHANT_SECRET,
  PAYHERE_CURRENCY,
  PAYHERE_SANDBOX,
  PAYHERE_RETURN_URL,
  PAYHERE_CANCEL_URL,
  PAYHERE_NOTIFY_URL,
} = require("../../config/env");

function normalizeOrderType(value) {
  const lower = String(value || "").trim().toLowerCase();
  if (!lower || lower === "delivery") return "Delivery";
  if (lower === "takeaway" || lower === "pickup" || lower === "pick up") return "Takeaway";
  if (lower === "dinein" || lower === "dine-in" || lower === "dine in") return "DineIn";
  return "";
}

function normalizePaymentMethod(value) {
  const lower = String(value || "").trim().toLowerCase();
  if (!lower || lower === "cash") return "Cash";
  if (lower === "card" || lower === "online") return "Card";
  return "";
}

function resolvePortionPrice(portions, size) {
  if (!portions || typeof portions !== "object") return null;
  const entries = Object.entries(portions).filter(([key]) => String(key || "").trim());
  if (entries.length === 0) return null;

  const normalizedSize = String(size || "").trim().toLowerCase();
  if (normalizedSize) {
    const match = entries.find(([key]) => String(key || "").trim().toLowerCase() === normalizedSize);
    if (!match) return null;
    return parsePriceNumber(match[1]);
  }

  if (entries.length === 1) {
    return parsePriceNumber(entries[0][1]);
  }

  return null;
}

async function resolveMenuForLineItems(items) {
  const lineItems = Array.isArray(items) ? items : [];
  const ids = [...new Set(lineItems.map((i) => String(i && i.menuItemId ? i.menuItemId : "").trim()).filter(Boolean))];
  const names = [
    ...new Set(lineItems.map((i) => String(i && i.itemName ? i.itemName : "").trim().toLowerCase()).filter(Boolean)),
  ];
  const [byId, byName] = await Promise.all([findMenuItemsByIds(ids), findMenuItemsByNames(names)]);
  const menuItems = [...byId, ...byName];

  const menuById = new Map(menuItems.map((row) => [String(row && row.id ? row.id : "").trim(), row]).filter(([k]) => Boolean(k)));
  const menuByNameLower = new Map(
    menuItems
      .flatMap((row) => {
        const name = String(row && row.name ? row.name : "").trim().toLowerCase();
        const lower = String(row && row.nameLower ? row.nameLower : "").trim().toLowerCase();
        return [
          [name, row],
          [lower, row],
        ];
      })
      .filter(([k]) => Boolean(k))
  );

  return { menuById, menuByNameLower };
}

async function createOrderForUser(userEmail, input, meta = {}) {
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email) throw httpError(401, "Unauthorized.");

  const orderType = normalizeOrderType(input && input.orderType !== undefined ? input.orderType : "");
  if (!orderType) throw httpError(400, "orderType must be Delivery, Takeaway, or DineIn.");

  const paymentMethod = normalizePaymentMethod(input && input.paymentMethod !== undefined ? input.paymentMethod : "");
  if (!paymentMethod) throw httpError(400, "paymentMethod must be Cash or Card.");

  const promotionDiscount = Math.max(0, Number(input && input.promotionDiscount !== undefined ? input.promotionDiscount : 0) || 0);

  const deliveryAddress = String(input && input.deliveryAddress !== undefined ? input.deliveryAddress : "").trim();
  const deliveryCityTown = String(input && input.deliveryCityTown !== undefined ? input.deliveryCityTown : "").trim();

  if (orderType === "Delivery" && !deliveryCityTown && !deliveryAddress) {
    throw httpError(400, "deliveryCityTown or deliveryAddress is required for delivery orders.");
  }

  const tableId = String(input && input.tableId !== undefined ? input.tableId : "").trim();
  const tableSessionId = String(input && input.tableSessionId !== undefined ? input.tableSessionId : input && input.sessionId !== undefined ? input.sessionId : "").trim();
  if (orderType === "DineIn") {
    if (!tableId) throw httpError(400, "tableId is required for dine-in orders.");
    if (!tableSessionId) throw httpError(400, "tableSessionId is required for dine-in orders.");

    const { Table } = require("../../models/Table");
    const { TableSession } = require("../../models/TableSession");

    const table = await Table.findOne({ id: tableId }).lean();
    if (!table) throw httpError(404, "Table not found.");

    const session = await TableSession.findOne({ id: tableSessionId }).lean();
    if (!session) throw httpError(404, "Table session not found.");
    if (String(session.tableId || "").trim() !== tableId) {
      throw httpError(400, "tableSessionId does not belong to tableId.");
    }
    if (String(session.status || "").trim() !== "active") {
      throw httpError(409, "Table session is not active.");
    }
  }

  const items = Array.isArray(input && input.items ? input.items : []) ? input.items : [];
  if (items.length === 0) throw httpError(400, "items must be a non-empty array.");

  const { menuById, menuByNameLower } = await resolveMenuForLineItems(items);

  const resolvedItems = items.map((item) => {
    const menuItemId = String(item && item.menuItemId ? item.menuItemId : "").trim();
    const itemName = String(item && item.itemName ? item.itemName : "").trim();
    const quantity = Math.max(1, Math.round(Number(item && item.quantity !== undefined ? item.quantity : 1) || 1));
    const size = String(item && item.size ? item.size : "").trim();

    const keyName = itemName.trim().toLowerCase();
    const menu = (menuItemId && menuById.get(menuItemId)) || (keyName && menuByNameLower.get(keyName)) || null;
    if (!menu) {
      throw httpError(400, `Menu item not found: ${menuItemId || itemName || "unknown"}`);
    }
    if (menu && menu.outOfStock === true) {
      throw httpError(400, `Out of stock: ${String(menu.name || itemName || menuItemId).trim()}`);
    }

    const unitPrice = resolvePortionPrice(menu.portions, size);
    if (!unitPrice || unitPrice <= 0) {
      const requiresSize = menu && menu.portions && typeof menu.portions === "object" && Object.keys(menu.portions).length > 1;
      const message = requiresSize
        ? `size is required for menu item: ${String(menu.name || itemName || menuItemId).trim()}`
        : `Unable to resolve unit price for menu item: ${String(menu.name || itemName || menuItemId).trim()}`;
      throw httpError(400, message);
    }

    return {
      menuItemId: String(menu.id || menuItemId).trim(),
      itemName: String(menu.name || itemName).trim(),
      quantity,
      size,
      unitPrice: Math.max(0, Math.round(Number(unitPrice) || 0)),
    };
  });

  const subtotal = resolvedItems.reduce((sum, row) => sum + (Number(row.unitPrice) || 0) * (Number(row.quantity) || 0), 0);
  const loyaltySummary = await getLoyaltySummaryForUser(email);
  const discountPercent = Math.max(0, Number(loyaltySummary && loyaltySummary.discountPercent !== undefined ? loyaltySummary.discountPercent : 0) || 0);

  const pricing = computeFinalPaidAndPoints({
    subtotal,
    promotionDiscount,
    discountPercent,
    orderType,
    deliveryAddress,
    deliveryCityTown,
  });

  if (orderType === "Delivery" && pricing.deliveryAllowed === false) {
    throw httpError(400, "Delivery is not available for this area. Please choose Takeaway.");
  }

  const now = new Date().toISOString();
  const order = {
    id: crypto.randomUUID(),
    userEmail: email,
    status: "Pending",
    statusUpdatedAt: now,
    cancelReason: "",
    cancelledBy: "",
    orderType,
    paymentMethod,
    paymentStatus: "Unpaid",
    payment: null,
    tableId: orderType === "DineIn" ? tableId : undefined,
    tableSessionId: orderType === "DineIn" ? tableSessionId : undefined,
    items: resolvedItems,
    deliveryAddress: deliveryAddress || undefined,
    deliveryCityTown: deliveryCityTown || undefined,
    subtotal: pricing.subtotal,
    promotionDiscount: pricing.promotionDiscount,
    loyaltyPercentUsed: pricing.loyaltyPercentUsed,
    loyaltyDiscount: pricing.loyaltyDiscount,
    deliveryZone: pricing.deliveryZone,
    deliveryFee: pricing.deliveryFee,
    finalPaid: pricing.finalPaid,
    pointsEarned: pricing.pointsEarned,
    createdAt: now,
    updatedAt: now,
  };

  const created = await addOrder(order);

  // Keep loyalty purchase records in sync (idempotent; duplicates are skipped by the service/store).
  if (!meta || meta.skipLoyaltySync !== true) {
    try {
      await addPurchasesForUser(
        email,
        [
          {
            id: created.id,
            orderId: created.id,
            subtotal: created.subtotal,
            promotionDiscount: created.promotionDiscount,
            orderType: created.orderType,
            status: created.status,
            items: created.items,
            deliveryAddress: created.deliveryAddress || "",
            deliveryCityTown: created.deliveryCityTown || "",
            price: `SLR ${Math.round(Number(created.finalPaid) || 0)}`,
            createdAt: created.createdAt,
            paymentMethod: created.paymentMethod,
            paymentStatus: created.paymentStatus,
          },
        ],
        meta
      );
    } catch {
      // ignore sync failures; order creation should still succeed
    }
  }

  return created;
}

async function getOrderForActor(actor, id) {
  const order = await findOrderById(id);
  if (!order) return null;

  const role = actor && actor.role ? actor.role : undefined;
  const email = String(actor && actor.email ? actor.email : "").trim().toLowerCase();

  if (role === "admin") return order;
  if (!email) return null;
  if (String(order.userEmail || "").trim().toLowerCase() !== email) return null;
  return order;
}

async function listOrdersForActor(actor) {
  const role = actor && actor.role ? actor.role : undefined;
  const email = String(actor && actor.email ? actor.email : "").trim().toLowerCase();
  if (!email) throw httpError(401, "Unauthorized.");
  if (role === "admin") return listAllOrders();
  return listOrdersForUser(email);
}

async function setOrderStatusForActor(actor, id, { status, cancelReason } = {}) {
  const role = actor && actor.role ? actor.role : undefined;
  const actorEmail = String(actor && actor.email ? actor.email : "").trim().toLowerCase();
  if (!actorEmail) throw httpError(401, "Unauthorized.");

  const order = await findOrderById(id);
  if (!order) return null;

  const ownerEmail = String(order.userEmail || "").trim().toLowerCase();
  if (role !== "admin" && ownerEmail !== actorEmail) {
    throw httpError(403, "Forbidden.");
  }

  if (role !== "admin" && status !== "Cancelled") {
    throw httpError(403, "Forbidden.");
  }

  const now = new Date().toISOString();
  const updated = await updateOrderById(order.id, (current) => {
    const next = { ...current };
    next.status = status;
    next.statusUpdatedAt = now;
    next.updatedAt = now;

    if (status === "Cancelled") {
      next.cancelReason = String(cancelReason || "").trim();
      next.cancelledBy = role === "admin" ? "admin" : "user";
      next.paymentStatus = next.paymentStatus === "Paid" ? "Paid" : next.paymentStatus;
    } else {
      next.cancelReason = "";
      next.cancelledBy = "";
    }

    return next;
  });

  // Keep loyalty purchase status in sync (best effort).
  try {
    await updatePurchaseStatus({
      id: updated.id,
      userEmail: ownerEmail,
      status: updated.status,
      cancelReason: updated.cancelReason,
      updatedBy: role === "admin" ? "admin" : "user",
    });
  } catch {
    // ignore
  }

  return updated;
}

async function initiateMockPaymentForActor(actor, id, { provider, method } = {}) {
  const email = String(actor && actor.email ? actor.email : "").trim().toLowerCase();
  const role = actor && actor.role ? actor.role : undefined;
  if (!email) throw httpError(401, "Unauthorized.");

  const order = await findOrderById(id);
  if (!order) return null;

  const ownerEmail = String(order.userEmail || "").trim().toLowerCase();
  if (role !== "admin" && ownerEmail !== email) {
    throw httpError(403, "Forbidden.");
  }
  if (String(order.status || "").trim() === "Cancelled") {
    throw httpError(400, "Order is cancelled.");
  }

  const now = new Date().toISOString();
  const payment = {
    id: crypto.randomUUID(),
    provider: String(provider || "mock"),
    method: String(method || "card"),
    status: "Pending",
    currency: "LKR",
    amount: Math.max(0, Math.round(Number(order.finalPaid) || 0)),
    createdAt: now,
  };

  const updated = await updateOrderById(order.id, (current) => ({
    ...current,
    payment,
    paymentStatus: "Pending",
    updatedAt: now,
  }));

  return { order: updated, payment: updated.payment };
}

async function confirmMockPaymentForActor(actor, id) {
  const email = String(actor && actor.email ? actor.email : "").trim().toLowerCase();
  const role = actor && actor.role ? actor.role : undefined;
  if (!email) throw httpError(401, "Unauthorized.");

  const order = await findOrderById(id);
  if (!order) return null;

  const ownerEmail = String(order.userEmail || "").trim().toLowerCase();
  if (role !== "admin" && ownerEmail !== email) {
    throw httpError(403, "Forbidden.");
  }
  if (String(order.status || "").trim() === "Cancelled") {
    throw httpError(400, "Order is cancelled.");
  }

  const payment = order && order.payment ? order.payment : null;
  const provider = String(payment && payment.provider ? payment.provider : "").trim().toLowerCase();
  if (provider !== "mock") throw httpError(400, "No mock payment to confirm.");
  if (String(payment && payment.status ? payment.status : "").trim() !== "Pending") {
    throw httpError(400, "Payment is not pending.");
  }

  const now = new Date().toISOString();
  const updated = await updateOrderById(order.id, (current) => ({
    ...current,
    payment: { ...(current.payment || {}), status: "Paid", confirmedAt: now },
    paymentStatus: "Paid",
    updatedAt: now,
  }));

  // Best-effort: add paymentStatus into loyalty purchase record if it exists.
  try {
    await addPurchasesForUser(
      ownerEmail,
      [
        {
          id: updated.id,
          orderId: updated.id,
          subtotal: updated.subtotal,
          promotionDiscount: updated.promotionDiscount,
          orderType: updated.orderType,
          status: updated.status,
          items: updated.items,
          deliveryAddress: updated.deliveryAddress || "",
          deliveryCityTown: updated.deliveryCityTown || "",
          price: `SLR ${Math.round(Number(updated.finalPaid) || 0)}`,
          createdAt: updated.createdAt,
          paymentMethod: updated.paymentMethod,
          paymentStatus: updated.paymentStatus,
        },
      ],
    );
  } catch {
    // ignore
  }

  return { order: updated, payment: updated.payment };
}

function splitFullName(fullName) {
  const text = String(fullName || "").trim().replace(/\s+/g, " ");
  if (!text) return { firstName: "Customer", lastName: "HMS" };
  const [firstName, ...rest] = text.split(" ");
  return { firstName: firstName || "Customer", lastName: rest.join(" ").trim() || "HMS" };
}

function resolvePayhereCustomer({ actorEmail, order, overrideCustomer, storedUser } = {}) {
  const override = overrideCustomer && typeof overrideCustomer === "object" ? overrideCustomer : null;
  const user = storedUser && typeof storedUser === "object" ? storedUser : null;

  const nameParts = splitFullName((override && (override.firstName || override.lastName) && `${override.firstName} ${override.lastName}`) || user?.fullName);

  const firstName = String(override?.firstName || nameParts.firstName || "Customer").trim() || "Customer";
  const lastName = String(override?.lastName || nameParts.lastName || "HMS").trim() || "HMS";

  const email = String(override?.email || actorEmail || "").trim();
  const phone = String(override?.phone || user?.phone || "").trim() || "0000000000";

  const address = String(override?.address || order?.deliveryAddress || user?.address || "").trim() || "N/A";
  const city = String(override?.city || order?.deliveryCityTown || user?.cityTown || "").trim() || "N/A";
  const country = String(override?.country || "Sri Lanka").trim() || "Sri Lanka";

  return { firstName, lastName, email, phone, address, city, country };
}

async function initiatePayhereCheckoutForActor(actor, id, { customer } = {}) {
  const email = String(actor && actor.email ? actor.email : "").trim().toLowerCase();
  const role = actor && actor.role ? actor.role : undefined;
  if (!email) throw httpError(401, "Unauthorized.");

  const order = await findOrderById(id);
  if (!order) return null;

  const ownerEmail = String(order.userEmail || "").trim().toLowerCase();
  if (role !== "admin" && ownerEmail !== email) {
    throw httpError(403, "Forbidden.");
  }
  if (String(order.status || "").trim() === "Cancelled") {
    throw httpError(400, "Order is cancelled.");
  }
  if (String(order.paymentStatus || "").trim() === "Paid") {
    throw httpError(400, "Order is already paid.");
  }

  const merchantId = String(PAYHERE_MERCHANT_ID || "").trim();
  const merchantSecret = String(PAYHERE_MERCHANT_SECRET || "").trim();
  const currency = String(PAYHERE_CURRENCY || "LKR").trim() || "LKR";
  const notifyUrl = String(PAYHERE_NOTIFY_URL || "").trim();
  const returnUrl = String(PAYHERE_RETURN_URL || "").trim();
  const cancelUrl = String(PAYHERE_CANCEL_URL || "").trim();

  if (!merchantId || !merchantSecret) {
    throw httpError(500, "PayHere is not configured. Set PAYHERE_MERCHANT_ID and PAYHERE_MERCHANT_SECRET in backend/.env.");
  }
  if (!notifyUrl) {
    throw httpError(500, "PayHere notify URL is missing. Set PAYHERE_NOTIFY_URL in backend/.env (must be publicly reachable).");
  }
  if (!returnUrl || !cancelUrl) {
    throw httpError(500, "PayHere return/cancel URLs are missing. Set PAYHERE_RETURN_URL and PAYHERE_CANCEL_URL in backend/.env.");
  }

  const storedUser = await findUserByEmail(ownerEmail);
  const customerDetails = resolvePayhereCustomer({ actorEmail: ownerEmail, order, overrideCustomer: customer, storedUser });

  const amount = formatAmount(order.finalPaid);
  const hash = generateCheckoutHash({
    merchantId,
    merchantSecret,
    orderId: String(order.id || "").trim(),
    amount,
    currency,
  });

  const fields = {
    merchant_id: merchantId,
    return_url: safeAppendQuery(returnUrl, { orderId: order.id }),
    cancel_url: safeAppendQuery(cancelUrl, { orderId: order.id }),
    notify_url: notifyUrl,
    first_name: customerDetails.firstName,
    last_name: customerDetails.lastName,
    email: customerDetails.email,
    phone: customerDetails.phone,
    address: customerDetails.address,
    city: customerDetails.city,
    country: customerDetails.country,
    order_id: String(order.id || "").trim(),
    items: `Order ${String(order.id || "").trim()}`,
    currency,
    amount,
    hash,
  };

  const now = new Date().toISOString();
  const updated = await updateOrderById(order.id, (current) => ({
    ...current,
    payment: {
      id: crypto.randomUUID(),
      provider: "payhere",
      method: "checkout",
      status: "Pending",
      currency,
      amount: Math.max(0, Math.round(Number(current.finalPaid) || 0)),
      createdAt: now,
    },
    paymentStatus: "Pending",
    updatedAt: now,
  }));

  return {
    order: updated,
    checkout: {
      provider: "payhere",
      actionUrl: getCheckoutActionUrl({ sandbox: PAYHERE_SANDBOX }),
      fields,
    },
  };
}

module.exports = {
  createOrderForUser,
  getOrderForActor,
  listOrdersForActor,
  setOrderStatusForActor,
  initiateMockPaymentForActor,
  confirmMockPaymentForActor,
  initiatePayhereCheckoutForActor,
};
