const crypto = require("node:crypto");
const {
  PAYHERE_MERCHANT_ID,
  PAYHERE_MERCHANT_SECRET,
  PAYHERE_SANDBOX,
  PAYHERE_NOTIFY_URL,
  PAYHERE_RETURN_URL,
  PAYHERE_CANCEL_URL,
} = require("../../config/env");

const { normalizeCartItem } = require("../../models/Cart");
const { normalizeOrderStatus } = require("../../models/Order");
const { normalizePurchaseStatus } = require("../../models/Purchase");
const { findUserByEmail } = require("../auth/authStore");
const { readRules } = require("../loyalty/loyaltyStore");
const {
  listCartItemsByUser,
  findCartItemByUserAndKey,
  createCartItem,
  updateCartItemByIdForUser,
  deleteCartItemByIdForUser,
  deleteCartItemsByUser,
  listOrders,
  saveOrders,
  listPurchases,
  savePurchases,
  readDeliveryDetailsByUser,
  saveDeliveryDetailsByUser,
} = require("./checkoutStore");
const { calculateCheckoutPricing, formatSLR, normalizeLoyaltyRules } = require("../../shared/utils/checkoutPricing");

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function createMd5(value) {
  return crypto.createHash("md5").update(String(value || ""), "utf8").digest("hex");
}

function formatPayHereAmount(amount) {
  return Number(amount || 0).toLocaleString("en-us", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: false,
  });
}

function getPayHereActionUrl() {
  return PAYHERE_SANDBOX ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout";
}

function buildPayHereHash({ merchantId, orderId, amount, currency, merchantSecret }) {
  const hashedSecret = createMd5(merchantSecret).toUpperCase();
  return createMd5(`${merchantId}${orderId}${formatPayHereAmount(amount)}${currency}${hashedSecret}`).toUpperCase();
}

function buildPayHereNotifySignature({ merchantId, orderId, amount, currency, statusCode, merchantSecret }) {
  const hashedSecret = createMd5(merchantSecret).toUpperCase();
  return createMd5(`${merchantId}${orderId}${amount}${currency}${statusCode}${hashedSecret}`).toUpperCase();
}

function formatAddress({ streetAddress1, streetAddress2, cityTown } = {}) {
  return [streetAddress1, streetAddress2, cityTown].map((value) => String(value || "").trim()).filter(Boolean).join(", ");
}

function resolveUserProfileSnapshot(email, authUser, storedUser) {
  const normalizedEmail = normalizeEmail(email);
  if (storedUser) {
    return storedUser;
  }

  if (normalizedEmail === "user@gmail.com") {
    return {
      email: normalizedEmail,
      fullName: "John Doe",
      phone: "+94 71 987 6543",
      streetAddress1: "No. 25, Galle Road",
      streetAddress2: "",
      cityTown: "Colombo 03",
      address: "No. 25, Galle Road, Colombo 03",
    };
  }

  return authUser || {};
}

async function getCartForUser(email) {
  const normalizedEmail = normalizeEmail(email);
  return listCartItemsByUser(normalizedEmail);
}

async function addCartItemForUser(email, input) {
  const normalizedEmail = normalizeEmail(email);
  const existing = await findCartItemByUserAndKey(normalizedEmail, input.itemName, input.size || "Small");
  if (existing) {
    await updateCartItemByIdForUser(normalizedEmail, existing.id, {
      quantity: existing.quantity + Math.max(1, Math.round(Number(input.quantity) || 1)),
      updatedAt: new Date().toISOString(),
    });
  } else {
    await createCartItem(normalizeCartItem(input, normalizedEmail));
  }
  return getCartForUser(normalizedEmail);
}

async function updateCartItemQuantityForUser(email, cartItemId, quantity) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedId = String(cartItemId || "").trim();

  // Clamp the value so the stored cart quantity never drops below one.
  const nextQuantity = Math.max(1, Math.round(Number(quantity) || 1));

  const updated = await updateCartItemByIdForUser(normalizedEmail, normalizedId, {
    quantity: nextQuantity,
    updatedAt: new Date().toISOString(),
  });
  if (!updated) {
    const error = new Error("Cart item not found.");
    error.status = 404;
    throw error;
  }
  return getCartForUser(normalizedEmail);
}

async function removeCartItemForUser(email, cartItemId) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedId = String(cartItemId || "").trim();
  await deleteCartItemByIdForUser(normalizedEmail, normalizedId);
  return getCartForUser(normalizedEmail);
}

async function getCheckoutSummaryForUser(email, options = {}) {
  const normalizedEmail = normalizeEmail(email);
  const cartItems = await getCartForUser(normalizedEmail);
  const purchases = await listPurchases();
  const loyaltyRules = options.loyaltyRules && options.loyaltyRules.length > 0
    ? normalizeLoyaltyRules(options.loyaltyRules)
    : normalizeLoyaltyRules(await readRules());

  const pricing = calculateCheckoutPricing({
    cartItems,
    userEmail: normalizedEmail,
    purchases,
    promotions: options.promotions || [],
    loyaltyRules,
    orderType: options.orderType || "Delivery",
    deliveryAddress: options.deliveryAddress,
    deliveryCityTown: options.deliveryCityTown,
  });

  return { cartItems, pricing, loyaltyRules };
}

async function buildCheckoutContext(email, authUser, options = {}) {
  const normalizedEmail = normalizeEmail(email);
  const userCart = await getCartForUser(normalizedEmail);

  if (userCart.length === 0) {
    const error = new Error("Your cart is empty.");
    error.status = 400;
    throw error;
  }

  const outOfStockItems = userCart
    .filter((cartItem) => {
      const menuItem = (Array.isArray(options.menuItems) ? options.menuItems : []).find(
        (item) =>
          (cartItem.menuItemId && String(item.id || "").trim() === String(cartItem.menuItemId || "").trim()) ||
          String(item.name || "").trim() === String(cartItem.itemName || "").trim()
      );
      return Boolean(menuItem && menuItem.outOfStock);
    })
    .map((item) => item.itemName);

  if (outOfStockItems.length > 0) {
    const error = new Error(`Out of stock: ${[...new Set(outOfStockItems)].join(", ")}. Remove them from cart to continue.`);
    error.status = 400;
    throw error;
  }

  const orderType = options.orderType || "Delivery";
  const paymentMethod = options.paymentMethod || "Cash";
  const deliveryInput = options.deliveryDetails && typeof options.deliveryDetails === "object" ? options.deliveryDetails : null;
  const storedUser = await findUserByEmail(normalizedEmail);
  const userProfile = resolveUserProfileSnapshot(normalizedEmail, authUser, storedUser);
  const resolvedDeliveryDetails = orderType === "Delivery"
    ? {
        name: String((userProfile && userProfile.fullName) || "").trim(),
        phone: String((deliveryInput && deliveryInput.phone) || (userProfile && userProfile.phone) || "").trim(),
        streetAddress1: String((deliveryInput && deliveryInput.streetAddress1) || (userProfile && userProfile.streetAddress1) || "").trim(),
        streetAddress2: String((deliveryInput && deliveryInput.streetAddress2) || (userProfile && userProfile.streetAddress2) || "").trim(),
        cityTown: String((deliveryInput && deliveryInput.cityTown) || (userProfile && userProfile.cityTown) || "").trim(),
        location:
          formatAddress({
            streetAddress1: (deliveryInput && deliveryInput.streetAddress1) || (userProfile && userProfile.streetAddress1),
            streetAddress2: (deliveryInput && deliveryInput.streetAddress2) || (userProfile && userProfile.streetAddress2),
            cityTown: (deliveryInput && deliveryInput.cityTown) || (userProfile && userProfile.cityTown),
          }) ||
          String((deliveryInput && deliveryInput.location) || (userProfile && userProfile.address) || "").trim(),
      }
    : null;

  if (orderType === "Delivery") {
    const hasAllDeliveryFields =
      resolvedDeliveryDetails &&
      String(resolvedDeliveryDetails.name || "").trim() &&
      String(resolvedDeliveryDetails.phone || "").trim() &&
      (String(resolvedDeliveryDetails.streetAddress1 || "").trim() || String(resolvedDeliveryDetails.location || "").trim()) &&
      (String(resolvedDeliveryDetails.cityTown || "").trim() || String(resolvedDeliveryDetails.location || "").trim());
    if (!hasAllDeliveryFields) {
      const error = new Error("Please complete your profile details before placing a delivery order.");
      error.status = 400;
      throw error;
    }
  }

  const purchases = await listPurchases();
  const loyaltyRules = options.loyaltyRules && options.loyaltyRules.length > 0
    ? normalizeLoyaltyRules(options.loyaltyRules)
    : normalizeLoyaltyRules(await readRules());
  const pricing = calculateCheckoutPricing({
    cartItems: userCart,
    userEmail: normalizedEmail,
    purchases,
    promotions: options.promotions || [],
    loyaltyRules,
    orderType,
    deliveryAddress: resolvedDeliveryDetails && resolvedDeliveryDetails.location,
    deliveryCityTown: resolvedDeliveryDetails && resolvedDeliveryDetails.cityTown,
  });

  if (orderType === "Delivery" && pricing.deliveryAllowed === false) {
    const error = new Error("Delivery is not available for this area. Please choose Takeaway.");
    error.status = 400;
    throw error;
  }

  return {
    normalizedEmail,
    userCart,
    orderType,
    paymentMethod,
    resolvedDeliveryDetails,
    pricing,
    purchases,
    userProfile,
  };
}

async function placeOrderForUser(email, authUser, options = {}) {
  const {
    normalizedEmail,
    userCart,
    orderType,
    paymentMethod,
    resolvedDeliveryDetails,
    pricing,
    purchases,
  } = await buildCheckoutContext(email, authUser, options);

  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  let remainingDiscount = Math.min(pricing.totalDiscount, pricing.subtotal);

  const orderRows = userCart.map((item, index) => {
    const rowSubtotal = item.unitPrice * item.quantity;
    const matchingMenuItem = (Array.isArray(options.menuItems) ? options.menuItems : []).find(
      (menuItem) =>
        (item.menuItemId && String(menuItem.id || "").trim() === String(item.menuItemId || "").trim()) ||
        String(menuItem.name || "").trim() === String(item.itemName || "").trim()
    );
    const loyaltyPointsPerUnit =
      typeof (matchingMenuItem && matchingMenuItem.loyaltyPoints) === "number"
        ? matchingMenuItem.loyaltyPoints
        : Math.max(0, Math.round(Number(item.unitPrice) || 0));
    const loyaltyPointsEarned = Math.max(0, Math.round(loyaltyPointsPerUnit * (Number(item.quantity) || 0)));
    const share =
      pricing.totalDiscount > 0 && pricing.subtotal > 0
        ? index === userCart.length - 1
          ? remainingDiscount
          : Math.min(
              remainingDiscount,
              Math.min(rowSubtotal, Math.max(0, Math.round((rowSubtotal / pricing.subtotal) * pricing.totalDiscount)))
            )
        : 0;
    const safeShare = Math.min(rowSubtotal, Math.max(0, share));
    remainingDiscount -= safeShare;
    const finalRowTotal = Math.max(0, rowSubtotal - safeShare);

    return {
      id: crypto.randomUUID(),
      orderId,
      menuItemId: item.menuItemId,
      image: item.image,
      itemName: item.itemName,
      originalPrice: formatSLR(rowSubtotal),
      discountAmount: safeShare,
      finalAmount: finalRowTotal,
      price: formatSLR(finalRowTotal),
      size: item.size,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      status: "Pending",
      userEmail: normalizedEmail,
      orderType,
      paymentMethod,
      deliveryDetails: resolvedDeliveryDetails,
      createdAt: now,
      orderSubtotal: pricing.subtotal,
      orderTotalDiscount: pricing.totalDiscount,
      deliveryZone: pricing.deliveryZone,
      deliveryFee: pricing.deliveryFee,
      orderTotal: pricing.grandTotal,
      promotionId: pricing.promotion ? pricing.promotion.id || null : null,
      promotionTitle: pricing.promotion ? pricing.promotion.title || null : null,
      promotionDiscount: pricing.promotionDiscount,
      loyaltyPointsAtPurchase: pricing.points,
      loyaltyDiscountPercent: pricing.loyaltyPercent,
      loyaltyDiscount: pricing.loyaltyDiscount,
      loyaltyPointsPerUnit,
      loyaltyPointsEarned,
    };
  });

  const order = {
    id: orderId,
    orderId,
    userEmail: normalizedEmail,
    orderType,
    paymentMethod,
    status: "Pending",
    deliveryDetails: resolvedDeliveryDetails,
    items: orderRows.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      menuItemId: item.menuItemId,
      image: item.image,
      size: item.size,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      price: item.price,
      finalAmount: item.finalAmount,
      status: item.status,
    })),
    pricing,
    createdAt: now,
    updatedAt: now,
  };

  const [orders, deliveryDetailsByUser] = await Promise.all([
    listOrders(),
    readDeliveryDetailsByUser(),
  ]);

  await Promise.all([
    saveOrders([order, ...orders]),
    savePurchases([...orderRows, ...purchases]),
    deleteCartItemsByUser(normalizedEmail),
    saveDeliveryDetailsByUser(
      resolvedDeliveryDetails
        ? {
            ...deliveryDetailsByUser,
            [normalizedEmail]: {
              name: resolvedDeliveryDetails.name,
              phone: resolvedDeliveryDetails.phone,
              streetAddress1: resolvedDeliveryDetails.streetAddress1,
              streetAddress2: resolvedDeliveryDetails.streetAddress2,
              cityTown: resolvedDeliveryDetails.cityTown,
              location: resolvedDeliveryDetails.location,
            },
          }
        : deliveryDetailsByUser
    ),
  ]);

  return { order, purchases: orderRows, pricing };
}

async function initPayHerePaymentForUser(email, authUser, options = {}) {
  if (!PAYHERE_MERCHANT_ID || !PAYHERE_MERCHANT_SECRET) {
    const error = new Error("PayHere merchant credentials are not configured.");
    error.status = 500;
    throw error;
  }
  if (!PAYHERE_NOTIFY_URL || !PAYHERE_RETURN_URL || !PAYHERE_CANCEL_URL) {
    const error = new Error("PayHere URLs are not configured.");
    error.status = 500;
    throw error;
  }

  const { normalizedEmail, userCart, orderType, resolvedDeliveryDetails, pricing, userProfile } = await buildCheckoutContext(
    email,
    authUser,
    { ...options, paymentMethod: "Card (Online)" }
  );

  const orderId = crypto.randomUUID();
  const now = new Date().toISOString();
  const orders = await listOrders();
  const order = {
    id: orderId,
    orderId,
    userEmail: normalizedEmail,
    orderType,
    paymentMethod: "Card (Online)",
    paymentProvider: "PayHere",
    paymentStatus: "pending",
    status: "Pending Payment",
    deliveryDetails: resolvedDeliveryDetails,
    items: userCart.map((item) => ({
      id: item.id,
      itemName: item.itemName,
      menuItemId: item.menuItemId,
      image: item.image,
      size: item.size,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      rowTotal: item.unitPrice * item.quantity,
    })),
    pricing,
    createdAt: now,
    updatedAt: now,
  };

  await saveOrders([order, ...orders]);

  const customerName = String((resolvedDeliveryDetails && resolvedDeliveryDetails.name) || userProfile.fullName || "Customer").trim();
  const [firstName, ...rest] = customerName.split(/\s+/).filter(Boolean);
  const lastName = rest.join(" ").trim() || "-";

  return {
    orderId,
    payment: {
      sandbox: PAYHERE_SANDBOX,
      action: getPayHereActionUrl(),
      merchant_id: PAYHERE_MERCHANT_ID,
      return_url: PAYHERE_RETURN_URL,
      cancel_url: PAYHERE_CANCEL_URL,
      notify_url: PAYHERE_NOTIFY_URL,
      first_name: firstName || "Customer",
      last_name: lastName,
      email: normalizedEmail,
      phone: String((resolvedDeliveryDetails && resolvedDeliveryDetails.phone) || userProfile.phone || "").trim(),
      address: String((resolvedDeliveryDetails && resolvedDeliveryDetails.location) || userProfile.address || "").trim() || "N/A",
      city: String((resolvedDeliveryDetails && resolvedDeliveryDetails.cityTown) || userProfile.cityTown || "").trim() || "N/A",
      country: "Sri Lanka",
      order_id: orderId,
      items: `RESTA FAST FOOD ORDER ${orderId}`,
      currency: "LKR",
      amount: formatPayHereAmount(pricing.grandTotal),
      custom_1: normalizedEmail,
      custom_2: orderType,
      hash: buildPayHereHash({
        merchantId: PAYHERE_MERCHANT_ID,
        orderId,
        amount: pricing.grandTotal,
        currency: "LKR",
        merchantSecret: PAYHERE_MERCHANT_SECRET,
      }),
    },
  };
}

async function listOrdersForUser(email, role) {
  const orders = await listOrders();
  if (role === "admin") return orders;
  const normalizedEmail = normalizeEmail(email);
  return orders.filter((order) => normalizeEmail(order.userEmail) === normalizedEmail);
}

async function getOrderForUserById(email, role, orderId) {
  const normalizedId = String(orderId || "").trim();
  const orders = await listOrders();
  const order = orders.find((item) => String(item.orderId || item.id || "").trim() === normalizedId) || null;
  if (!order) return null;
  if (role === "admin") return order;
  return normalizeEmail(order.userEmail) === normalizeEmail(email) ? order : null;
}

async function listPurchasesForUser(email, role) {
  const purchases = await listPurchases();
  if (role === "admin") return purchases;
  const normalizedEmail = normalizeEmail(email);
  return purchases.filter((purchase) => normalizeEmail(purchase.userEmail) === normalizedEmail);
}

async function updatePurchaseStatusById(purchaseId, status, cancelReason = "") {
  const normalizedId = String(purchaseId || "").trim();
  const nextStatus = normalizePurchaseStatus(status) || String(status || "").trim();
  const normalizedReason = String(cancelReason || "").trim();

  // Cancellation must carry a reason so the user and admin can both see why it happened.
  if (nextStatus === "Cancelled" && !normalizedReason) {
    const error = new Error("Please provide a cancellation reason.");
    error.status = 400;
    throw error;
  }

  const purchases = await listPurchases();

  // Fail fast if the requested purchase row is no longer in storage.
  const exists = purchases.some((purchase) => String(purchase.id || "").trim() === normalizedId);
  if (!exists) {
    const error = new Error("Purchase not found.");
    error.status = 404;
    throw error;
  }

  const now = new Date().toISOString();
  const nextPurchases = purchases.map((purchase) =>
    String(purchase.id || "").trim() === normalizedId
      ? {
          ...purchase,
          status: nextStatus,
          cancelReason: nextStatus === "Cancelled" ? normalizedReason : "",
          statusUpdatedAt: now,
        }
      : purchase
  );
  await savePurchases(nextPurchases);
  return nextPurchases.find((purchase) => String(purchase.id || "").trim() === normalizedId) || null;
}

async function updateOrderStatusById(orderId, status, cancelReason = "") {
  const normalizedId = String(orderId || "").trim();
  const nextStatus = normalizeOrderStatus(status) || String(status || "").trim();
  const normalizedReason = String(cancelReason || "").trim();

  // Require a human-readable reason whenever an entire order is cancelled.
  if (nextStatus === "Cancelled" && !normalizedReason) {
    const error = new Error("Please provide a cancellation reason.");
    error.status = 400;
    throw error;
  }

  const [orders, purchases] = await Promise.all([listOrders(), listPurchases()]);

  // Make sure the order still exists before updating both order and purchase records.
  const exists = orders.some((order) => String(order.orderId || order.id || "").trim() === normalizedId);
  if (!exists) {
    const error = new Error("Order not found.");
    error.status = 404;
    throw error;
  }

  const now = new Date().toISOString();
  const nextOrders = orders.map((order) =>
    String(order.orderId || order.id || "").trim() === normalizedId
      ? {
          ...order,
          status: nextStatus,
          cancelReason: nextStatus === "Cancelled" ? normalizedReason : "",
          updatedAt: now,
          items: (Array.isArray(order.items) ? order.items : []).map((item) => ({
            ...item,
            status: nextStatus,
            cancelReason: nextStatus === "Cancelled" ? normalizedReason : "",
            statusUpdatedAt: now,
          })),
        }
      : order
  );
  const nextPurchases = purchases.map((purchase) =>
    String(purchase.orderId || purchase.id || "").trim() === normalizedId
      ? {
          ...purchase,
          status: nextStatus,
          cancelReason: nextStatus === "Cancelled" ? normalizedReason : "",
          statusUpdatedAt: now,
        }
      : purchase
  );

  await Promise.all([saveOrders(nextOrders), savePurchases(nextPurchases)]);
  return nextOrders.find((order) => String(order.orderId || order.id || "").trim() === normalizedId) || null;
}

async function getLastDeliveryDetailsForUser(email) {
  const users = await readDeliveryDetailsByUser();
  return users[normalizeEmail(email)] || null;
}

async function handlePayHereNotification(payload = {}) {
  const merchantId = String(payload.merchant_id || "").trim();
  const orderId = String(payload.order_id || "").trim();
  const payhereAmount = String(payload.payhere_amount || "").trim();
  const payhereCurrency = String(payload.payhere_currency || "").trim();
  const statusCode = String(payload.status_code || "").trim();
  const md5sig = String(payload.md5sig || "").trim().toUpperCase();

  if (!merchantId || !orderId || !payhereAmount || !payhereCurrency || !statusCode || !md5sig) {
    const error = new Error("Missing PayHere notification fields.");
    error.status = 400;
    throw error;
  }

  const localSignature = buildPayHereNotifySignature({
    merchantId,
    orderId,
    amount: payhereAmount,
    currency: payhereCurrency,
    statusCode,
    merchantSecret: PAYHERE_MERCHANT_SECRET,
  });
  if (merchantId !== PAYHERE_MERCHANT_ID || localSignature !== md5sig) {
    const error = new Error("Invalid PayHere notification signature.");
    error.status = 400;
    throw error;
  }

  const orders = await listOrders();
  const targetOrder = orders.find((order) => String(order.orderId || order.id || "").trim() === orderId);
  if (!targetOrder) {
    const error = new Error("Order not found.");
    error.status = 404;
    throw error;
  }

  const now = new Date().toISOString();
  let nextPaymentStatus = "failed";
  let nextOrderStatus = "Payment Failed";
  if (statusCode === "2") {
    nextPaymentStatus = "paid";
    nextOrderStatus = "Pending";
  } else if (statusCode === "0") {
    nextPaymentStatus = "pending";
    nextOrderStatus = "Pending Payment";
  } else if (statusCode === "-1") {
    nextPaymentStatus = "cancelled";
    nextOrderStatus = "Payment Cancelled";
  }

  let nextOrders = orders.map((order) =>
    String(order.orderId || order.id || "").trim() === orderId
      ? {
          ...order,
          paymentProvider: "PayHere",
          paymentStatus: nextPaymentStatus,
          paymentId: String(payload.payment_id || "").trim() || order.paymentId || "",
          paymentMethodCode: String(payload.method || "").trim() || order.paymentMethodCode || "",
          paymentStatusCode: statusCode,
          paymentStatusMessage: String(payload.status_message || "").trim(),
          paidAmount: payhereAmount,
          paidCurrency: payhereCurrency,
          status: nextOrderStatus,
          updatedAt: now,
        }
      : order
  );

  if (statusCode === "2") {
    const purchases = await listPurchases();
    const alreadyPersisted = purchases.some((purchase) => String(purchase.orderId || "").trim() === orderId);

    if (!alreadyPersisted) {
      let remainingDiscount = Math.min(targetOrder.pricing.totalDiscount, targetOrder.pricing.subtotal);
      const orderRows = (Array.isArray(targetOrder.items) ? targetOrder.items : []).map((item, index, items) => {
        const rowSubtotal = (Number(item.unitPrice) || 0) * (Number(item.quantity) || 0);
        const share =
          targetOrder.pricing.totalDiscount > 0 && targetOrder.pricing.subtotal > 0
            ? index === items.length - 1
              ? remainingDiscount
              : Math.min(
                  remainingDiscount,
                  Math.min(rowSubtotal, Math.max(0, Math.round((rowSubtotal / targetOrder.pricing.subtotal) * targetOrder.pricing.totalDiscount)))
                )
            : 0;
        const safeShare = Math.min(rowSubtotal, Math.max(0, share));
        remainingDiscount -= safeShare;
        const finalRowTotal = Math.max(0, rowSubtotal - safeShare);

        return {
          id: crypto.randomUUID(),
          orderId,
          menuItemId: item.menuItemId,
          image: item.image,
          itemName: item.itemName,
          originalPrice: formatSLR(rowSubtotal),
          discountAmount: safeShare,
          finalAmount: finalRowTotal,
          price: formatSLR(finalRowTotal),
          size: item.size,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          status: "Pending",
          userEmail: targetOrder.userEmail,
          orderType: targetOrder.orderType,
          paymentMethod: "Card (Online)",
          deliveryDetails: targetOrder.deliveryDetails,
          createdAt: targetOrder.createdAt || now,
          orderSubtotal: targetOrder.pricing.subtotal,
          orderTotalDiscount: targetOrder.pricing.totalDiscount,
          deliveryZone: targetOrder.pricing.deliveryZone,
          deliveryFee: targetOrder.pricing.deliveryFee,
          orderTotal: targetOrder.pricing.grandTotal,
          promotionId: targetOrder.pricing.promotion ? targetOrder.pricing.promotion.id || null : null,
          promotionTitle: targetOrder.pricing.promotion ? targetOrder.pricing.promotion.title || null : null,
          promotionDiscount: targetOrder.pricing.promotionDiscount,
          loyaltyPointsAtPurchase: targetOrder.pricing.points,
          loyaltyDiscountPercent: targetOrder.pricing.loyaltyPercent,
          loyaltyDiscount: targetOrder.pricing.loyaltyDiscount,
          loyaltyPointsPerUnit: Math.max(0, Math.round(Number(item.unitPrice) || 0)),
          loyaltyPointsEarned: Math.max(0, Math.round((Number(item.unitPrice) || 0) * (Number(item.quantity) || 0))),
          paymentProvider: "PayHere",
          paymentStatus: "paid",
          paymentId: String(payload.payment_id || "").trim(),
        };
      });

      await Promise.all([
        savePurchases([...orderRows, ...purchases]),
        deleteCartItemsByUser(targetOrder.userEmail),
      ]);
    }
  }

  await saveOrders(nextOrders);
  return nextOrders.find((order) => String(order.orderId || order.id || "").trim() === orderId) || null;
}

module.exports = {
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
};
