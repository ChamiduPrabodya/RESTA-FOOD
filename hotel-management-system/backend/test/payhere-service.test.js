const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const path = require("node:path");

const md5Upper = (value) => crypto.createHash("md5").update(String(value ?? ""), "utf8").digest("hex").toUpperCase();

function loadPayhereServiceWithStubs({
  merchantId = "1211149",
  merchantSecret = "secret",
  currency = "LKR",
  order = null,
} = {}) {
  const envId = require.resolve(path.join(__dirname, "../src/config/env"));
  const ordersStoreId = require.resolve(path.join(__dirname, "../src/modules/orders/ordersStore"));
  const serviceId = require.resolve(path.join(__dirname, "../src/modules/payhere/payhereService"));

  delete require.cache[serviceId];
  delete require.cache[ordersStoreId];
  delete require.cache[envId];

  let updatedOrder = null;

  require.cache[envId] = {
    id: envId,
    filename: envId,
    loaded: true,
    exports: {
      PAYHERE_MERCHANT_ID: merchantId,
      PAYHERE_MERCHANT_SECRET: merchantSecret,
      PAYHERE_CURRENCY: currency,
    },
  };

  require.cache[ordersStoreId] = {
    id: ordersStoreId,
    filename: ordersStoreId,
    loaded: true,
    exports: {
      findOrderById: async () => order,
      updateOrderById: async (_id, updater) => {
        updatedOrder = updater(order);
        return updatedOrder;
      },
    },
  };

  // eslint-disable-next-line global-require
  const service = require(path.join(__dirname, "../src/modules/payhere/payhereService"));
  // eslint-disable-next-line global-require
  const payhereUtils = require(path.join(__dirname, "../src/shared/utils/payhere"));

  return {
    service,
    payhereUtils,
    getUpdatedOrder: () => updatedOrder,
    cleanup: () => {
      delete require.cache[serviceId];
      delete require.cache[ordersStoreId];
      delete require.cache[envId];
    },
  };
}

module.exports = [
  {
    name: "payhere.generateCheckoutHash: matches documented MD5 formula",
    fn: async () => {
      // eslint-disable-next-line global-require
      const { generateCheckoutHash, formatAmount } = require(path.join(__dirname, "../src/shared/utils/payhere"));
      const merchantId = "1211149";
      const merchantSecret = "my_merchant_secret";
      const orderId = "order-123";
      const amount = 955;
      const currency = "LKR";

      const expected = md5Upper(
        `${merchantId}${orderId}${formatAmount(amount)}${currency}${md5Upper(merchantSecret)}`
      );

      assert.equal(
        generateCheckoutHash({ merchantId, merchantSecret, orderId, amount, currency }),
        expected
      );
    },
  },
  {
    name: "payhere.applyPayhereNotification: verifies md5sig and marks order paymentStatus",
    fn: async () => {
      const merchantId = "1211149";
      const merchantSecret = "my_merchant_secret";
      const order = { id: "o1", finalPaid: 955, payment: null, paymentStatus: "Unpaid", updatedAt: "2026-04-08T00:00:00.000Z" };

      const { service, payhereUtils, getUpdatedOrder, cleanup } = loadPayhereServiceWithStubs({
        merchantId,
        merchantSecret,
        order,
      });

      try {
        const payload = {
          merchant_id: merchantId,
          order_id: "o1",
          payment_id: "p1",
          payhere_amount: "955.00",
          payhere_currency: "LKR",
          status_code: "2",
          status_message: "Success",
        };
        payload.md5sig = payhereUtils.generateNotifyMd5Sig({
          merchantId,
          merchantSecret,
          orderId: payload.order_id,
          payhereAmount: payload.payhere_amount,
          payhereCurrency: payload.payhere_currency,
          statusCode: payload.status_code,
        });

        const result = await service.applyPayhereNotification(payload);
        assert.ok(result);
        assert.equal(result.paymentStatus, "Paid");

        const updated = getUpdatedOrder();
        assert.ok(updated);
        assert.equal(updated.paymentStatus, "Paid");
        assert.equal(updated.payment.provider, "payhere");
        assert.equal(updated.payment.paymentId, "p1");
        assert.equal(updated.payment.statusCode, "2");
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "payhere.applyPayhereNotification: rejects invalid md5sig",
    fn: async () => {
      const { service, cleanup } = loadPayhereServiceWithStubs({
        order: { id: "o1", finalPaid: 955, payment: null, paymentStatus: "Unpaid", updatedAt: "2026-04-08T00:00:00.000Z" },
      });

      try {
        await assert.rejects(
          () =>
            service.applyPayhereNotification({
              merchant_id: "1211149",
              order_id: "o1",
              payment_id: "p1",
              payhere_amount: "955.00",
              payhere_currency: "LKR",
              status_code: "2",
              md5sig: "BAD",
            }),
          (err) => Boolean(err && String(err.message || "").toLowerCase().includes("signature"))
        );
      } finally {
        cleanup();
      }
    },
  },
];

