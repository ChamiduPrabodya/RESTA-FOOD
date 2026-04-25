const assert = require("node:assert/strict");
const path = require("node:path");

function loadServiceWithStubs({ activeSession = null } = {}) {
  const tableSessionModelId = require.resolve(path.join(__dirname, "../src/models/TableSession"));
  const tableModelId = require.resolve(path.join(__dirname, "../src/models/Table"));
  const tablesServiceId = require.resolve(path.join(__dirname, "../src/modules/tables/tablesService"));
  const ordersStoreId = require.resolve(path.join(__dirname, "../src/modules/orders/ordersStore"));
  const serviceId = require.resolve(path.join(__dirname, "../src/modules/sessions/sessionsService"));

  delete require.cache[serviceId];
  delete require.cache[tableSessionModelId];
  delete require.cache[tableModelId];
  delete require.cache[tablesServiceId];
  delete require.cache[ordersStoreId];

  let createdSession = null;

  require.cache[tableSessionModelId] = {
    id: tableSessionModelId,
    filename: tableSessionModelId,
    loaded: true,
    exports: {
      TableSession: {
        findOne: () => ({
          sort: () => ({ lean: async () => null }),
          lean: async () => activeSession,
        }),
        create: async (session) => {
          createdSession = session;
          return { toObject: () => session };
        },
        updateOne: async () => ({ modifiedCount: 1 }),
      },
    },
  };

  require.cache[tableModelId] = {
    id: tableModelId,
    filename: tableModelId,
    loaded: true,
    exports: {
      Table: {
        updateOne: async () => ({ modifiedCount: 1 }),
      },
    },
  };

  require.cache[tablesServiceId] = {
    id: tablesServiceId,
    filename: tablesServiceId,
    loaded: true,
    exports: {
      requireTable: async () => ({
        id: "table_1",
        label: "Table 1",
        qrToken: "tok",
        status: "available",
      }),
    },
  };

  require.cache[ordersStoreId] = {
    id: ordersStoreId,
    filename: ordersStoreId,
    loaded: true,
    exports: {
      hasActiveOrderForTable: async () => false,
    },
  };

  // eslint-disable-next-line global-require
  const service = require(path.join(__dirname, "../src/modules/sessions/sessionsService"));
  return {
    service,
    getCreatedSession: () => createdSession,
    cleanup: () => {
      delete require.cache[serviceId];
      delete require.cache[tableSessionModelId];
      delete require.cache[tableModelId];
      delete require.cache[tablesServiceId];
      delete require.cache[ordersStoreId];
    },
  };
}

module.exports = [
  {
    name: "sessionsService.startSession: stores guestCount",
    fn: async () => {
      const { service, getCreatedSession, cleanup } = loadServiceWithStubs();
      try {
        const result = await service.startSession({ tableId: "table_1", tableToken: "tok", guestCount: 4 });
        assert.equal(result.success, undefined);
        assert.equal(result.session.guestCount, 4);
        assert.equal(getCreatedSession().guestCount, 4);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "sessionsService.startSession: rejects more than six guests",
    fn: async () => {
      const { service, cleanup } = loadServiceWithStubs();
      try {
        await assert.rejects(
          () => service.startSession({ tableId: "table_1", tableToken: "tok", guestCount: 7 }),
          /guestCount cannot be more than 6/
        );
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "sessionsService.startSession: rejects table when an active session already exists",
    fn: async () => {
      const { service, cleanup } = loadServiceWithStubs({
        activeSession: {
          id: "session_0001",
          tableId: "table_1",
          guestCount: 2,
          status: "active",
          createdAt: "2026-04-25T00:00:00.000Z",
        },
      });
      try {
        await assert.rejects(
          () => service.startSession({ tableId: "table_1", tableToken: "tok", guestCount: 4 }),
          /already in use/
        );
      } finally {
        cleanup();
      }
    },
  },
];
