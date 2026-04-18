const { httpError } = require("../../shared/errors");
const { formatAmount, generateNotifyMd5Sig } = require("../../shared/utils/payhere");
const {
  PAYHERE_MERCHANT_ID,
  PAYHERE_MERCHANT_SECRET,
  PAYHERE_CURRENCY,
} = require("../../config/env");
const { findOrderById, updateOrderById } = require("../orders/ordersStore");

function mapStatusCodeToPaymentStatus(statusCode) {
  const code = Number.parseInt(String(statusCode ?? ""), 10);
  if (code === 2) return "Paid";
  if (code === 0) return "Pending";
  if (code === -1) return "Cancelled";
  if (code === -2) return "Failed";
  if (code === -3) return "ChargedBack";
  return "Unknown";
}

function normalizePayload(body) {
  const payload = body && typeof body === "object" ? body : {};
  return {
    merchant_id: String(payload.merchant_id || "").trim(),
    order_id: String(payload.order_id || "").trim(),
    payment_id: String(payload.payment_id || "").trim(),
    payhere_amount: String(payload.payhere_amount || "").trim(),
    payhere_currency: String(payload.payhere_currency || "").trim(),
    status_code: String(payload.status_code || "").trim(),
    status_message: String(payload.status_message || "").trim(),
    method: String(payload.method || "").trim(),
    card_holder_name: String(payload.card_holder_name || "").trim(),
    card_no: String(payload.card_no || "").trim(),
    custom_1: String(payload.custom_1 || "").trim(),
    custom_2: String(payload.custom_2 || "").trim(),
    md5sig: String(payload.md5sig || "").trim().toUpperCase(),
  };
}

function verifyPayhereMd5Sig(payload) {
  const merchantId = String(PAYHERE_MERCHANT_ID || "").trim();
  const merchantSecret = String(PAYHERE_MERCHANT_SECRET || "").trim();
  if (!merchantId || !merchantSecret) {
    throw httpError(500, "PayHere is not configured on this server.");
  }

  if (!payload || typeof payload !== "object") return false;
  if (!payload.merchant_id || !payload.order_id || !payload.payhere_amount || !payload.payhere_currency || !payload.status_code || !payload.md5sig) {
    return false;
  }
  if (payload.merchant_id !== merchantId) return false;

  const expected = generateNotifyMd5Sig({
    merchantId,
    merchantSecret,
    orderId: payload.order_id,
    payhereAmount: payload.payhere_amount,
    payhereCurrency: payload.payhere_currency,
    statusCode: payload.status_code,
  });

  return payload.md5sig === expected;
}

async function applyPayhereNotification(body) {
  const payload = normalizePayload(body);
  if (!verifyPayhereMd5Sig(payload)) {
    throw httpError(400, "Invalid PayHere signature.");
  }

  const order = await findOrderById(payload.order_id);
  if (!order) return null;

  const expectedCurrency = String(PAYHERE_CURRENCY || "LKR").trim() || "LKR";
  if (payload.payhere_currency !== expectedCurrency) {
    throw httpError(400, "PayHere currency mismatch.");
  }

  const expectedAmount = formatAmount(order.finalPaid);
  if (formatAmount(payload.payhere_amount) !== expectedAmount) {
    throw httpError(400, "PayHere amount mismatch.");
  }

  const paymentStatus = mapStatusCodeToPaymentStatus(payload.status_code);
  const now = new Date().toISOString();

  const updated = await updateOrderById(order.id, (current) => {
    const prev = current && typeof current === "object" ? current.payment : null;
    const nextPayment = {
      ...(prev && typeof prev === "object" ? prev : {}),
      provider: "payhere",
      method: "checkout",
      status: paymentStatus,
      paymentId: payload.payment_id || undefined,
      statusCode: payload.status_code,
      statusMessage: payload.status_message || undefined,
      payhereAmount: payload.payhere_amount,
      payhereCurrency: payload.payhere_currency,
      methodName: payload.method || undefined,
      cardHolderName: payload.card_holder_name || undefined,
      cardNo: payload.card_no || undefined,
      md5sig: payload.md5sig,
      notifiedAt: now,
    };

    return {
      ...current,
      payment: nextPayment,
      paymentStatus,
      updatedAt: now,
    };
  });

  return { order: updated, paymentStatus };
}

module.exports = {
  mapStatusCodeToPaymentStatus,
  applyPayhereNotification,
};

