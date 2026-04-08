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

function loadUserControllerWithAuthStoreStub({ authStoreStub } = {}) {
  const storeId = require.resolve(path.join(__dirname, "../src/modules/auth/authStore"));
  const controllerId = require.resolve(path.join(__dirname, "../src/modules/user/userController"));

  delete require.cache[controllerId];
  delete require.cache[storeId];

  require.cache[storeId] = {
    id: storeId,
    filename: storeId,
    loaded: true,
    exports:
      authStoreStub ||
      ({
        findUserByEmail: async () => null,
        updateUserByEmail: async () => undefined,
      }),
  };

  // eslint-disable-next-line global-require
  const controller = require(path.join(__dirname, "../src/modules/user/userController"));
  return {
    controller,
    cleanup: () => {
      delete require.cache[controllerId];
      delete require.cache[storeId];
    },
  };
}

module.exports = [
  {
    name: "userController.updateMe: forbids non-user role",
    fn: async () => {
      const { controller, cleanup } = loadUserControllerWithAuthStoreStub();
      try {
        const req = { auth: { email: "a@b.com", role: "admin" }, body: {} };
        const res = createRes();
        await controller.updateMe(req, res);
        assert.equal(res.statusCode, 403);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "userController.updateMe: validates phone number",
    fn: async () => {
      const { controller, cleanup } = loadUserControllerWithAuthStoreStub();
      try {
        const req = {
          auth: { email: "u@example.com", role: "user" },
          body: { fullName: "User", phone: "bad", streetAddress1: "No 1", streetAddress2: "", cityTown: "Colombo" },
        };
        const res = createRes();
        await controller.updateMe(req, res);
        assert.equal(res.statusCode, 400);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "userController.getMe: returns sanitized user",
    fn: async () => {
      const { controller, cleanup } = loadUserControllerWithAuthStoreStub({
        authStoreStub: {
          findUserByEmail: async () => ({ email: "u@example.com", role: "user", passwordHash: "hash", fullName: "U" }),
          updateUserByEmail: async () => undefined,
        },
      });

      try {
        const req = { auth: { email: "u@example.com", role: "user" } };
        const res = createRes();
        await controller.getMe(req, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.equal(res.body.user.email, "u@example.com");
        assert.equal("passwordHash" in res.body.user, false);
      } finally {
        cleanup();
      }
    },
  },
];

