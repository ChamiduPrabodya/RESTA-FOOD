const assert = require("node:assert/strict");
const path = require("node:path");

function loadServiceWithStubs({ menuItems = [], existingPurchases = [], rules = [] } = {}) {
  const loyaltyStoreId = require.resolve(path.join(__dirname, "../src/modules/loyalty/loyaltyStore"));
  const menuStoreId = require.resolve(path.join(__dirname, "../src/modules/menu/menuStore"));
  const serviceId = require.resolve(path.join(__dirname, "../src/modules/loyalty/loyaltyService"));

  delete require.cache[serviceId];
  delete require.cache[loyaltyStoreId];
  delete require.cache[menuStoreId];

  let appendedRows = null;

  require.cache[loyaltyStoreId] = {
    id: loyaltyStoreId,
    filename: loyaltyStoreId,
    loaded: true,
    exports: {
      readRules: async () => rules,
      writeRules: async () => undefined,
      listPurchases: async () => existingPurchases,
      appendPurchases: async (rows) => {
        appendedRows = rows;
        return rows;
      },
      updatePurchaseStatus: async () => null,
      appendAuditEntry: async () => undefined,
      listAuditEntries: async () => [],
    },
  };

  require.cache[menuStoreId] = {
    id: menuStoreId,
    filename: menuStoreId,
    loaded: true,
    exports: {
      findMenuItemsByIds: async () => menuItems,
      findMenuItemsByNames: async () => menuItems,
    },
  };

  // eslint-disable-next-line global-require
  const service = require(path.join(__dirname, "../src/modules/loyalty/loyaltyService"));

  return {
    service,
    getAppendedRows: () => appendedRows,
    cleanup: () => {
      delete require.cache[serviceId];
      delete require.cache[loyaltyStoreId];
      delete require.cache[menuStoreId];
    },
  };
}

module.exports = [
  {
    name: "loyaltyService.addPurchasesForUser: pointsEarned uses menu item loyaltyPoints * quantity",
    fn: async () => {
      const { service, getAppendedRows, cleanup } = loadServiceWithStubs({
        menuItems: [{ id: "m1", name: "Cheese Kottu", nameLower: "cheese kottu", loyaltyPoints: 25 }],
        existingPurchases: [],
        rules: [{ id: "r1", threshold: "0", discount: "0" }],
      });

      try {
        await service.addPurchasesForUser(
          "u@example.com",
          [
            {
              id: "order-1",
              orderId: "order-1",
              subtotal: 1500,
              promotionDiscount: 0,
              orderType: "Takeaway",
              status: "Delivered",
              items: [{ menuItemId: "m1", itemName: "Cheese Kottu", quantity: 2, unitPrice: 999 }],
              createdAt: "2026-04-03T00:00:00.000Z",
            },
          ],
          { ip: "1.1.1.1", userAgent: "test" }
        );

        const rows = getAppendedRows();
        assert.ok(Array.isArray(rows));
        assert.equal(rows.length, 1);
        assert.equal(rows[0].pointsEarned, 50);
        assert.equal(rows[0].status, "Delivered");
      } finally {
        cleanup();
      }
    },
  },
];

