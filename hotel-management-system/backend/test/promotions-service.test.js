const assert = require("node:assert/strict");
const path = require("node:path");

function loadServiceWithStoreStub(storeStub = {}) {
  const storeId = require.resolve(path.join(__dirname, "../src/modules/promotions/promotionsStore"));
  const serviceId = require.resolve(path.join(__dirname, "../src/modules/promotions/promotionsService"));

  delete require.cache[serviceId];
  delete require.cache[storeId];

  require.cache[storeId] = {
    id: storeId,
    filename: storeId,
    loaded: true,
    exports: {
      listPromotions: async () => [],
      createPromotion: async (promotion) => promotion,
      findPromotionById: async () => null,
      updatePromotionById: async (_id, promotion) => promotion,
      deletePromotionById: async () => true,
      ...storeStub,
    },
  };

  // eslint-disable-next-line global-require
  const service = require(path.join(__dirname, "../src/modules/promotions/promotionsService"));
  return {
    service,
    cleanup: () => {
      delete require.cache[serviceId];
      delete require.cache[storeId];
    },
  };
}

module.exports = [
  {
    name: "promotionsService.addPromotion: normalizes payload and discount text",
    fn: async () => {
      let created = null;
      const { service, cleanup } = loadServiceWithStoreStub({
        createPromotion: async (promotion) => {
          created = promotion;
          return promotion;
        },
      });

      try {
        const result = await service.addPromotion({
          title: " Weekend Deal ",
          description: "Save more",
          type: "vip",
          discountType: "fixed",
          discountValue: "1500",
          startDate: "2026-04-20",
          endDate: "2026-04-25",
          activateNow: true,
        });

        assert.equal(result.title, "Weekend Deal");
        assert.equal(result.type, "vip");
        assert.equal(result.discountType, "fixed");
        assert.equal(result.discountValue, 1500);
        assert.equal(result.discountText, "SLR 1,500 OFF");
        assert.equal(result.active, true);
        assert.ok(created.id);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "promotionsService.addPromotion: rejects invalid date range",
    fn: async () => {
      const { service, cleanup } = loadServiceWithStoreStub();
      try {
        await assert.rejects(
          () =>
            service.addPromotion({
              title: "Bad",
              description: "Bad dates",
              discountValue: 10,
              startDate: "2026-04-25",
              endDate: "2026-04-20",
            }),
          /endDate must be after startDate/
        );
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "promotionsService.addPromotion: rejects negative numeric fields",
    fn: async () => {
      const { service, cleanup } = loadServiceWithStoreStub();
      try {
        await assert.rejects(
          () =>
            service.addPromotion({
              title: "Bad",
              description: "Negative max discount",
              discountValue: 10,
              maxDiscount: -1,
              startDate: "2026-04-20",
              endDate: "2026-04-25",
            }),
          /maxDiscount cannot be negative/
        );

        await assert.rejects(
          () =>
            service.addPromotion({
              title: "Bad",
              description: "Negative min order value",
              discountValue: 10,
              minOrderValue: -50,
              startDate: "2026-04-20",
              endDate: "2026-04-25",
            }),
          /minOrderValue cannot be negative/
        );
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "promotionsService.editPromotion: updates existing promotion",
    fn: async () => {
      let seenId = "";
      const { service, cleanup } = loadServiceWithStoreStub({
        findPromotionById: async () => ({
          id: "p1",
          title: "Old",
          description: "Old",
          type: "food",
          discountType: "percentage",
          discountValue: 5,
          startDate: "2026-04-20",
          endDate: "2026-04-25",
          active: true,
        }),
        updatePromotionById: async (id, promotion) => {
          seenId = id;
          return promotion;
        },
      });

      try {
        const result = await service.editPromotion("p1", { active: false, discountValue: 20 });
        assert.equal(seenId, "p1");
        assert.equal(result.id, "p1");
        assert.equal(result.discountValue, 20);
        assert.equal(result.discountText, "20% OFF");
        assert.equal(result.active, false);
      } finally {
        cleanup();
      }
    },
  },
];
