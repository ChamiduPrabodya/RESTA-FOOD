const assert = require("node:assert/strict");
const path = require("node:path");

function loadServiceWithStubs({
  menuItems = [],
  loyaltySummary = { points: 0, discountPercent: 0 },
  existingOrder = null,
} = {}) {
  const menuStoreId = require.resolve(path.join(__dirname, "../src/modules/menu/menuStore"));
  const loyaltyServiceId = require.resolve(path.join(__dirname, "../src/modules/loyalty/loyaltyService"));
  const ordersStoreId = require.resolve(path.join(__dirname, "../src/modules/orders/ordersStore"));
  const serviceId = require.resolve(path.join(__dirname, "../src/modules/orders/ordersService"));

  delete require.cache[serviceId];
  delete require.cache[ordersStoreId];
  delete require.cache[menuStoreId];
  delete require.cache[loyaltyServiceId];

  let addedOrder = null;
  let updatedOrder = null;

  require.cache[menuStoreId] = {
    id: menuStoreId,
    filename: menuStoreId,
    loaded: true,
    exports: {
      findMenuItemsByIds: async () => menuItems,
      findMenuItemsByNames: async () => menuItems,
    },
  };

  require.cache[loyaltyServiceId] = {
    id: loyaltyServiceId,
    filename: loyaltyServiceId,
    loaded: true,
    exports: {
      getLoyaltySummaryForUser: async () => loyaltySummary,
      addPurchasesForUser: async () => ({ purchasesAdded: 1 }),
      updatePurchaseStatus: async () => null,
    },
  };

  require.cache[ordersStoreId] = {
    id: ordersStoreId,
    filename: ordersStoreId,
    loaded: true,
    exports: {
      addOrder: async (order) => {
        addedOrder = order;
        return order;
      },
      hasActiveOrderForTable: async () => false,
      findOrderById: async () => existingOrder,
      listOrdersForUser: async () => [],
      listAllOrders: async () => [],
      updateOrderById: async (_id, updater) => {
        const next = updater(existingOrder);
        updatedOrder = next;
        return next;
      },
    },
  };

  // eslint-disable-next-line global-require
  const service = require(path.join(__dirname, "../src/modules/orders/ordersService"));

  return {
    service,
    getAddedOrder: () => addedOrder,
    getUpdatedOrder: () => updatedOrder,
    cleanup: () => {
      delete require.cache[serviceId];
      delete require.cache[ordersStoreId];
      delete require.cache[menuStoreId];
      delete require.cache[loyaltyServiceId];
    },
  };
}

module.exports = [
  {
    name: "ordersService.createOrderForUser: computes totals from menu portions + loyalty + delivery fee",
    fn: async () => {
      const { service, getAddedOrder, cleanup } = loadServiceWithStubs({
        menuItems: [
          {
            id: "m1",
            name: "Cheese Kottu",
            nameLower: "cheese kottu",
            portions: { Small: "SLR 500", Large: "SLR 900" },
            outOfStock: false,
          },
        ],
        loyaltySummary: { points: 5000, discountPercent: 5 },
      });

      try {
        const order = await service.createOrderForUser("u@example.com", {
          orderType: "Delivery",
          paymentMethod: "Cash",
          promotionDiscount: 100,
          deliveryCityTown: "Gonapola",
          items: [{ menuItemId: "m1", itemName: "Cheese Kottu", quantity: 2, size: "Small" }],
        });

        assert.ok(order);
        const added = getAddedOrder();
        assert.ok(added);

        assert.equal(order.userEmail, "u@example.com");
        assert.equal(order.orderType, "Delivery");
        assert.equal(order.status, "Pending");

        assert.equal(order.subtotal, 1000);
        assert.equal(order.promotionDiscount, 100);
        assert.equal(order.loyaltyPercentUsed, 5);
        assert.equal(order.loyaltyDiscount, 45);
        assert.equal(order.deliveryFee, 100);
        assert.equal(order.finalPaid, 955);
        assert.equal(order.pointsEarned, 955);

        assert.ok(Array.isArray(order.items));
        assert.equal(order.items.length, 1);
        assert.equal(order.items[0].unitPrice, 500);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "ordersService mock payment: initiate + confirm sets paymentStatus to Paid",
    fn: async () => {
      const existingOrder = {
        id: "o1",
        userEmail: "u@example.com",
        status: "Pending",
        finalPaid: 955,
        paymentStatus: "Unpaid",
        payment: null,
        createdAt: "2026-04-08T00:00:00.000Z",
        updatedAt: "2026-04-08T00:00:00.000Z",
      };

      const { service, getUpdatedOrder, cleanup } = loadServiceWithStubs({ existingOrder });

      try {
        const actor = { email: "u@example.com", role: "user" };
        const started = await service.initiateMockPaymentForActor(actor, "o1", { provider: "mock", method: "card" });
        assert.ok(started);
        assert.equal(started.order.paymentStatus, "Pending");
        assert.ok(started.order.payment);
        assert.equal(started.order.payment.status, "Pending");

        // Update stub's "DB" copy so confirm sees the pending payment.
        existingOrder.paymentStatus = started.order.paymentStatus;
        existingOrder.payment = started.order.payment;

        const confirmed = await service.confirmMockPaymentForActor(actor, "o1");
        assert.ok(confirmed);
        assert.equal(confirmed.order.paymentStatus, "Paid");
        assert.equal(confirmed.order.payment.status, "Paid");

        const updated = getUpdatedOrder();
        assert.ok(updated);
        assert.equal(updated.paymentStatus, "Paid");
      } finally {
        cleanup();
      }
    },
  },
];
