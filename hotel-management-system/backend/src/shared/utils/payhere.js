const crypto = require("node:crypto");

function md5Upper(value) {
  return crypto.createHash("md5").update(String(value ?? ""), "utf8").digest("hex").toUpperCase();
}

function formatAmount(value) {
  const amount = Number(value) || 0;
  // PayHere docs expect 2 decimals and no commas.
  return amount.toFixed(2);
}

function generateCheckoutHash({ merchantId, merchantSecret, orderId, amount, currency }) {
  const hashedSecret = md5Upper(merchantSecret);
  const amountFormatted = formatAmount(amount);
  return md5Upper(`${merchantId}${orderId}${amountFormatted}${currency}${hashedSecret}`);
}

function generateNotifyMd5Sig({ merchantId, merchantSecret, orderId, payhereAmount, payhereCurrency, statusCode }) {
  const hashedSecret = md5Upper(merchantSecret);
  const amountFormatted = formatAmount(payhereAmount);
  return md5Upper(`${merchantId}${orderId}${amountFormatted}${payhereCurrency}${statusCode}${hashedSecret}`);
}

function getCheckoutActionUrl({ sandbox } = {}) {
  return sandbox ? "https://sandbox.payhere.lk/pay/checkout" : "https://www.payhere.lk/pay/checkout";
}

function safeAppendQuery(url, params = {}) {
  const raw = String(url || "").trim();
  if (!raw) return raw;
  try {
    const u = new URL(raw);
    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;
      u.searchParams.set(String(key), String(value));
    });
    return u.toString();
  } catch {
    return raw;
  }
}

module.exports = {
  formatAmount,
  generateCheckoutHash,
  generateNotifyMd5Sig,
  getCheckoutActionUrl,
  safeAppendQuery,
};

