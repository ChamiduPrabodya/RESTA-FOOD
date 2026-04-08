const assert = require("node:assert/strict");
const path = require("node:path");

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function loadControllerWithServiceStub({ updatePurchaseStatusImpl } = {}) {
  const serviceId = require.resolve(path.join(__dirname, "../src/modules/loyalty/loyaltyService"));
  const controllerId = require.resolve(path.join(__dirname, "../src/modules/loyalty/loyaltyController"));

  delete require.cache[controllerId];
  delete require.cache[serviceId];

  require.cache[serviceId] = {
    id: serviceId,
    filename: serviceId,
    loaded: true,
    exports: {
      listRules: async () => [],
      saveRules: async () => [],
      getLoyaltySummaryForUser: async () => ({ points: 0, discountPercent: 0, rules: [] }),
      addPurchasesForUser: async () => ({ purchasesAdded: 0, purchasesSkipped: 0, summary: { points: 0, discountPercent: 0 } }),
      listPurchasesForUser: async () => [],
      listAllPurchases: async () => [],
      listAuditEntries: async () => [],
      updatePurchaseStatus:
        updatePurchaseStatusImpl ||
        (async () => ({
          id: "p1",
          userEmail: "u@example.com",
          status: "Delivered",
          statusUpdatedAt: new Date().toISOString(),
        })),
    },
  };

  // eslint-disable-next-line global-require
  const controller = require(path.join(__dirname, "../src/modules/loyalty/loyaltyController"));
  return {
    controller,
    cleanup: () => {
      delete require.cache[controllerId];
      delete require.cache[serviceId];
    },
  };
}

module.exports = [
  {
    name: "PATCH status: requires auth",
    fn: async () => {
      const { controller, cleanup } = loadControllerWithServiceStub();
      try {
        const req = { auth: null, params: { id: "p1" }, body: { status: "Delivered" } };
        const res = createRes();
        await controller.updatePurchaseStatus(req, res);
        assert.equal(res.statusCode, 401);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "PATCH status: user can only cancel",
    fn: async () => {
      const { controller, cleanup } = loadControllerWithServiceStub();
      try {
        const req = {
          auth: { email: "u@example.com", role: "user" },
          params: { id: "p1" },
          body: { status: "Delivered" },
        };
        const res = createRes();
        await controller.updatePurchaseStatus(req, res);
        assert.equal(res.statusCode, 403);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "PATCH status: cancelling requires cancelReason",
    fn: async () => {
      const { controller, cleanup } = loadControllerWithServiceStub();
      try {
        const req = {
          auth: { email: "u@example.com", role: "user" },
          params: { id: "p1" },
          body: { status: "Cancelled" },
        };
        const res = createRes();
        await controller.updatePurchaseStatus(req, res);
        assert.equal(res.statusCode, 400);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "PATCH status: user cancel calls service with own email",
    fn: async () => {
      let seen = null;
      const { controller, cleanup } = loadControllerWithServiceStub({
        updatePurchaseStatusImpl: async (payload) => {
          seen = payload;
          return { id: payload.id, userEmail: payload.userEmail, status: payload.status };
        },
      });

      try {
        const req = {
          auth: { email: "u@example.com", role: "user" },
          params: { id: "ord-1" },
          body: { status: "Cancelled", cancelReason: "changed my mind" },
        };
        const res = createRes();
        await controller.updatePurchaseStatus(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body && res.body.success, true);
        assert.deepEqual(seen, {
          id: "ord-1",
          userEmail: "u@example.com",
          status: "Cancelled",
          cancelReason: "changed my mind",
          updatedBy: "user",
        });
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "PATCH status: admin can mark delivered for specified user",
    fn: async () => {
      let seen = null;
      const { controller, cleanup } = loadControllerWithServiceStub({
        updatePurchaseStatusImpl: async (payload) => {
          seen = payload;
          return { id: payload.id, userEmail: payload.userEmail, status: payload.status };
        },
      });

      try {
        const req = {
          auth: { email: "admin@example.com", role: "admin" },
          params: { id: "ord-2" },
          body: { status: "Delivered", userEmail: "u@example.com" },
        };
        const res = createRes();
        await controller.updatePurchaseStatus(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body && res.body.success, true);
        assert.deepEqual(seen, {
          id: "ord-2",
          userEmail: "u@example.com",
          status: "Delivered",
          cancelReason: "",
          updatedBy: "admin",
        });
      } finally {
        cleanup();
      }
    },
  },
];
