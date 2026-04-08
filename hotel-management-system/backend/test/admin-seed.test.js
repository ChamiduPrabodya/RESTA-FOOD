const assert = require("node:assert/strict");
const path = require("node:path");

function loadSeedWithStubs({ env, authStoreStub, bcryptStub } = {}) {
  const envId = require.resolve(path.join(__dirname, "../src/config/env"));
  const authStoreId = require.resolve(path.join(__dirname, "../src/modules/auth/authStore"));
  const bcryptId = require.resolve("bcryptjs");
  const seedId = require.resolve(path.join(__dirname, "../src/modules/auth/seedAdminUser"));

  delete require.cache[seedId];
  delete require.cache[envId];
  delete require.cache[authStoreId];
  delete require.cache[bcryptId];

  require.cache[envId] = {
    id: envId,
    filename: envId,
    loaded: true,
    exports: env || { ADMIN_EMAIL: "", ADMIN_PASSWORD: "" },
  };

  require.cache[authStoreId] = {
    id: authStoreId,
    filename: authStoreId,
    loaded: true,
    exports:
      authStoreStub ||
      ({
        findUserByEmail: async () => null,
        addUser: async (u) => u,
        updateUserByEmail: async () => undefined,
      }),
  };

  require.cache[bcryptId] = {
    id: bcryptId,
    filename: bcryptId,
    loaded: true,
    exports:
      bcryptStub ||
      ({
        hash: async () => "hash",
      }),
  };

  // eslint-disable-next-line global-require
  const seed = require(path.join(__dirname, "../src/modules/auth/seedAdminUser"));
  return {
    ensureAdminUser: seed.ensureAdminUser,
    cleanup: () => {
      delete require.cache[seedId];
      delete require.cache[envId];
      delete require.cache[authStoreId];
      delete require.cache[bcryptId];
    },
  };
}

module.exports = [
  {
    name: "ensureAdminUser: skips when env missing",
    fn: async () => {
      const { ensureAdminUser, cleanup } = loadSeedWithStubs({ env: { ADMIN_EMAIL: "", ADMIN_PASSWORD: "" } });
      try {
        const res = await ensureAdminUser();
        assert.equal(res.seeded, false);
        assert.equal(res.reason, "missing_admin_env");
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "ensureAdminUser: creates admin when missing",
    fn: async () => {
      let created = null;
      const { ensureAdminUser, cleanup } = loadSeedWithStubs({
        env: { ADMIN_EMAIL: "admin@example.com", ADMIN_PASSWORD: "Secret123" },
        authStoreStub: {
          findUserByEmail: async () => null,
          addUser: async (u) => {
            created = u;
            return u;
          },
          updateUserByEmail: async () => undefined,
        },
      });
      try {
        const res = await ensureAdminUser();
        assert.equal(res.seeded, true);
        assert.equal(res.created, true);
        assert.equal(created.email, "admin@example.com");
        assert.equal(created.role, "admin");
        assert.ok(created.passwordHash);
      } finally {
        cleanup();
      }
    },
  },
];

