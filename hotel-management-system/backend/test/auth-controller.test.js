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

function loadAuthControllerWithStubs({ env, authStoreStub, bcryptStub, jwtStub } = {}) {
  const envId = require.resolve(path.join(__dirname, "../src/config/env"));
  const storeId = require.resolve(path.join(__dirname, "../src/modules/auth/authStore"));
  const bcryptId = require.resolve("bcryptjs");
  const jwtId = require.resolve("jsonwebtoken");
  const controllerId = require.resolve(path.join(__dirname, "../src/modules/auth/authController"));

  delete require.cache[controllerId];
  delete require.cache[envId];
  delete require.cache[storeId];
  delete require.cache[bcryptId];
  delete require.cache[jwtId];

  require.cache[envId] = {
    id: envId,
    filename: envId,
    loaded: true,
    exports:
      env || ({
        JWT_SECRET: "test_secret",
        ADMIN_EMAIL: "admin@example.com",
        ADMIN_PASSWORD: "Admin123",
        GOOGLE_CLIENT_ID: "",
      }),
  };

  const store =
    authStoreStub ||
    ({
      addUser: async (u) => u,
      findUserByEmail: async () => null,
      updateUserByEmail: async () => undefined,
      listUsers: async () => [],
    });

  require.cache[storeId] = { id: storeId, filename: storeId, loaded: true, exports: store };
  require.cache[bcryptId] = {
    id: bcryptId,
    filename: bcryptId,
    loaded: true,
    exports:
      bcryptStub ||
      ({
        hash: async () => "hash",
        compare: async () => true,
      }),
  };
  require.cache[jwtId] = {
    id: jwtId,
    filename: jwtId,
    loaded: true,
    exports:
      jwtStub ||
      ({
        sign: () => "token",
      }),
  };

  // eslint-disable-next-line global-require
  const controller = require(path.join(__dirname, "../src/modules/auth/authController"));
  return {
    controller,
    store,
    cleanup: () => {
      delete require.cache[controllerId];
      delete require.cache[envId];
      delete require.cache[storeId];
      delete require.cache[bcryptId];
      delete require.cache[jwtId];
    },
  };
}

module.exports = [
  {
    name: "authController.signup: rejects reserved admin email",
    fn: async () => {
      const { controller, cleanup } = loadAuthControllerWithStubs({
        env: { JWT_SECRET: "x", ADMIN_EMAIL: "admin@example.com", ADMIN_PASSWORD: "x", GOOGLE_CLIENT_ID: "" },
      });
      try {
        const req = {
          body: {
            fullName: "Test User",
            email: "admin@example.com",
            password: "Password1",
            phone: "0771234567",
            streetAddress1: "No 1",
            streetAddress2: "",
            cityTown: "Colombo",
          },
        };
        const res = createRes();
        await controller.signup(req, res);
        assert.equal(res.statusCode, 400);
        assert.equal(res.body.success, false);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "authController.signup: creates user when valid",
    fn: async () => {
      let created = null;
      const { controller, cleanup } = loadAuthControllerWithStubs({
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
        const req = {
          body: {
            fullName: "Test User",
            email: "user@example.com",
            password: "Password1",
            phone: "0771234567",
            streetAddress1: "No 1",
            streetAddress2: "",
            cityTown: "Colombo",
          },
        };
        const res = createRes();
        await controller.signup(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(created.email, "user@example.com");
        assert.ok(created.passwordHash);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "authController.login: rejects invalid credentials when user not found",
    fn: async () => {
      const { controller, cleanup } = loadAuthControllerWithStubs({
        authStoreStub: { findUserByEmail: async () => null, updateUserByEmail: async () => undefined },
      });
      try {
        const req = { body: { email: "missing@example.com", password: "x" } };
        const res = createRes();
        await controller.login(req, res);
        assert.equal(res.statusCode, 401);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "authController.login: rejects google-only account (no passwordHash)",
    fn: async () => {
      const { controller, cleanup } = loadAuthControllerWithStubs({
        authStoreStub: {
          findUserByEmail: async () => ({ email: "u@example.com", role: "user", passwordHash: "" }),
          updateUserByEmail: async () => undefined,
        },
      });
      try {
        const req = { body: { email: "u@example.com", password: "x" } };
        const res = createRes();
        await controller.login(req, res);
        assert.equal(res.statusCode, 401);
        assert.ok(String(res.body.message || "").toLowerCase().includes("google"));
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "authController.login: succeeds and returns token when password matches",
    fn: async () => {
      let updatedEmail = null;
      const { controller, cleanup } = loadAuthControllerWithStubs({
        authStoreStub: {
          findUserByEmail: async () => ({ email: "u@example.com", role: "user", passwordHash: "hash" }),
          updateUserByEmail: async (email) => {
            updatedEmail = email;
          },
        },
        bcryptStub: { compare: async () => true, hash: async () => "hash" },
        jwtStub: { sign: () => "token123" },
      });
      try {
        const req = { body: { email: "u@example.com", password: "Password1" } };
        const res = createRes();
        await controller.login(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.token, "token123");
        assert.equal(updatedEmail, "u@example.com");
      } finally {
        cleanup();
      }
    },
  },
];

