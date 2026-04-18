const assert = require("node:assert/strict");
const path = require("node:path");

const express = require("express");

function installRequireStub(modulePath, exports) {
  const id = require.resolve(modulePath);
  require.cache[id] = { id, filename: id, loaded: true, exports };
  return id;
}

function createInMemoryVipBookingsStore() {
  const bookings = [];

  const clone = (value) => (value ? JSON.parse(JSON.stringify(value)) : value);

  return {
    addVipBooking: async (booking) => {
      bookings.unshift(clone(booking));
      return clone(booking);
    },
    findVipBookingById: async (id) => {
      const key = String(id || "").trim();
      return clone(bookings.find((b) => String(b.id || "").trim() === key) || null);
    },
    listVipBookingsForUser: async (email) => {
      const e = String(email || "").trim().toLowerCase();
      return clone(bookings.filter((b) => String(b.userEmail || "").trim().toLowerCase() === e));
    },
    listAllVipBookings: async () => clone(bookings),
    updateVipBookingById: async (id, updater) => {
      const key = String(id || "").trim();
      const index = bookings.findIndex((b) => String(b.id || "").trim() === key);
      if (index < 0) return null;
      const current = clone(bookings[index]);
      const next = updater(current);
      bookings[index] = clone(next);
      return clone(next);
    },
    findVipBookingSlotConflict: async ({ suiteId, date, timeSlots }) => {
      const normalizedSuite = String(suiteId || "").trim().toLowerCase();
      const normalizedDate = String(date || "").trim();
      const slots = new Set((Array.isArray(timeSlots) ? timeSlots : []).map((s) => String(s || "").trim()).filter(Boolean));
      if (!normalizedSuite || !normalizedDate || slots.size === 0) return null;

      const found = bookings.find((b) => {
        if (String(b.suiteId || "").trim().toLowerCase() !== normalizedSuite) return false;
        if (String(b.date || "").trim() !== normalizedDate) return false;
        if (String(b.status || "").trim().toLowerCase() === "cancelled") return false;
        const existing = Array.isArray(b.timeSlots) ? b.timeSlots : [];
        return existing.some((s) => slots.has(String(s || "").trim()));
      });
      return clone(found || null);
    },
  };
}

async function startServerWithStubs() {
  const requireAuthId = installRequireStub(path.join(__dirname, "../src/shared/middlewares/requireAuth"), {
    requireAuth: () => (req, res, next) => {
      const header = String(req.headers.authorization || "").trim();
      const [, token] = header.split(" ");
      if (!header.toLowerCase().startsWith("bearer ") || !token) {
        return res.status(401).json({ success: false, message: "Missing Authorization token." });
      }

      const [role, email] = String(token || "").split(":");
      if (!role || !email) {
        return res.status(401).json({ success: false, message: "Invalid token." });
      }

      req.auth = { role: String(role).trim().toLowerCase(), email: String(email).trim().toLowerCase() };
      return next();
    },
  });

  const storeId = installRequireStub(path.join(__dirname, "../src/modules/vipBookings/vipBookingsStore"), createInMemoryVipBookingsStore());

  const routesId = require.resolve(path.join(__dirname, "../src/modules/vipBookings/vipBookingsRoutes"));
  delete require.cache[routesId];
  // eslint-disable-next-line global-require
  const { vipBookingsRouter } = require(path.join(__dirname, "../src/modules/vipBookings/vipBookingsRoutes"));

  const { errorHandler } = require(path.join(__dirname, "../src/shared/middlewares/errorHandler"));

  const app = express();
  app.use(express.json({ limit: "1mb" }));
  app.use("/api/vip-bookings", vipBookingsRouter);
  app.use(errorHandler);

  const server = await new Promise((resolve, reject) => {
    const s = app.listen(0, () => resolve(s));
    s.on("error", reject);
  });

  const address = server.address();
  const port = address && typeof address === "object" ? address.port : null;
  assert.ok(port);

  const baseUrl = `http://127.0.0.1:${port}`;

  return {
    baseUrl,
    close: async () =>
      new Promise((resolve, reject) => {
        server.close((err) => (err ? reject(err) : resolve()));
      }),
    cleanup: () => {
      delete require.cache[requireAuthId];
      delete require.cache[storeId];
      delete require.cache[routesId];
    },
  };
}

async function readJson(res) {
  let data = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }
  return data;
}

module.exports = [
  {
    name: "vipBookings endpoints: POST/GET/PATCH work with auth + validations",
    fn: async () => {
      const { baseUrl, close, cleanup } = await startServerWithStubs();
      try {
        const createRes = await fetch(`${baseUrl}/api/vip-bookings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer user:u@example.com",
          },
          body: JSON.stringify({
            suiteId: "platinum",
            date: "2099-01-01",
            timeSlots: ["11:00-14:00"],
            guests: 2,
          }),
        });
        const createData = await readJson(createRes);
        assert.equal(createRes.status, 201);
        assert.equal(createData.success, true);
        assert.ok(createData.booking && createData.booking.id);
        assert.equal(createData.booking.userEmail, "u@example.com");

        const bookingId = createData.booking.id;

        const listRes = await fetch(`${baseUrl}/api/vip-bookings`, {
          headers: { Authorization: "Bearer user:u@example.com" },
        });
        const listData = await readJson(listRes);
        assert.equal(listRes.status, 200);
        assert.equal(listData.success, true);
        assert.ok(Array.isArray(listData.bookings));
        assert.equal(listData.bookings.length, 1);

        const approveRes = await fetch(`${baseUrl}/api/vip-bookings/${encodeURIComponent(bookingId)}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer admin:admin@example.com",
          },
          body: JSON.stringify({ status: "Confirmed" }),
        });
        const approveData = await readJson(approveRes);
        assert.equal(approveRes.status, 200);
        assert.equal(approveData.success, true);
        assert.equal(approveData.booking.status, "Confirmed");

        const userCancelRes = await fetch(`${baseUrl}/api/vip-bookings/${encodeURIComponent(bookingId)}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer user:u@example.com",
          },
          body: JSON.stringify({ status: "Cancelled" }),
        });
        const userCancelData = await readJson(userCancelRes);
        assert.equal(userCancelRes.status, 400);
        assert.equal(userCancelData.success, false);
      } finally {
        await close();
        cleanup();
      }
    },
  },
];

