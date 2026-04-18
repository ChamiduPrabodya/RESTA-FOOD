const assert = require("node:assert/strict");
const path = require("node:path");

function loadServiceWithStubs({
  conflict = null,
  existingBooking = null,
} = {}) {
  const storeId = require.resolve(path.join(__dirname, "../src/modules/vipBookings/vipBookingsStore"));
  const serviceId = require.resolve(path.join(__dirname, "../src/modules/vipBookings/vipBookingsService"));

  delete require.cache[serviceId];
  delete require.cache[storeId];

  let addedBooking = null;
  let updatedBooking = null;

  require.cache[storeId] = {
    id: storeId,
    filename: storeId,
    loaded: true,
    exports: {
      addVipBooking: async (booking) => {
        addedBooking = booking;
        return booking;
      },
      findVipBookingById: async () => existingBooking,
      listVipBookingsForUser: async () => [],
      listAllVipBookings: async () => [],
      updateVipBookingById: async (_id, updater) => {
        const next = updater(existingBooking);
        updatedBooking = next;
        return next;
      },
      findVipBookingSlotConflict: async () => conflict,
    },
  };

  // eslint-disable-next-line global-require
  const service = require(path.join(__dirname, "../src/modules/vipBookings/vipBookingsService"));

  return {
    service,
    getAddedBooking: () => addedBooking,
    getUpdatedBooking: () => updatedBooking,
    cleanup: () => {
      delete require.cache[serviceId];
      delete require.cache[storeId];
    },
  };
}

module.exports = [
  {
    name: "vipBookingsService.createVipBookingForUser: normalizes legacy slots + enforces conflicts",
    fn: async () => {
      const { service, getAddedBooking, cleanup } = loadServiceWithStubs({ conflict: null });

      try {
        const booking = await service.createVipBookingForUser("u@example.com", {
          suiteId: "platinum",
          date: "2099-01-01",
          timeSlots: ["10:00-12:00"],
          guests: 2,
        });

        assert.ok(booking);
        const added = getAddedBooking();
        assert.ok(added);
        assert.equal(added.userEmail, "u@example.com");
        assert.equal(added.suiteId, "platinum");
        assert.deepEqual(added.timeSlots, ["11:00-14:00"]);
        assert.equal(added.time, "11:00-14:00");
        assert.equal(added.status, "Pending");
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "vipBookingsService.createVipBookingForUser: rejects non-consecutive slots",
    fn: async () => {
      const { service, cleanup } = loadServiceWithStubs({ conflict: null });

      try {
        await assert.rejects(
          () =>
            service.createVipBookingForUser("u@example.com", {
              suiteId: "platinum",
              date: "2099-01-01",
              timeSlots: ["11:00-14:00", "17:00-20:00"],
              guests: 2,
            }),
          (error) => {
            assert.equal(error.status, 400);
            assert.ok(String(error.message).includes("consecutive"));
            return true;
          }
        );
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "vipBookingsService.setVipBookingStatusForActor: admin cancel requires reason",
    fn: async () => {
      const existingBooking = {
        id: "b1",
        userEmail: "u@example.com",
        suiteId: "platinum",
        date: "2099-01-01",
        time: "11:00-14:00",
        timeSlots: ["11:00-14:00"],
        guests: 2,
        status: "Pending",
      };
      const { service, cleanup } = loadServiceWithStubs({ existingBooking });

      try {
        await assert.rejects(
          () => service.setVipBookingStatusForActor({ email: "admin@example.com", role: "admin" }, "b1", { status: "Cancelled", cancelReason: "" }),
          (error) => {
            assert.equal(error.status, 400);
            assert.ok(String(error.message).toLowerCase().includes("reason"));
            return true;
          }
        );
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "vipBookingsService.setVipBookingStatusForActor: user cannot cancel confirmed",
    fn: async () => {
      const existingBooking = {
        id: "b1",
        userEmail: "u@example.com",
        suiteId: "platinum",
        date: "2099-01-01",
        time: "11:00-14:00",
        timeSlots: ["11:00-14:00"],
        guests: 2,
        status: "Confirmed",
      };
      const { service, cleanup } = loadServiceWithStubs({ existingBooking });

      try {
        await assert.rejects(
          () => service.setVipBookingStatusForActor({ email: "u@example.com", role: "user" }, "b1", { status: "Cancelled" }),
          (error) => {
            assert.equal(error.status, 400);
            assert.ok(String(error.message).toLowerCase().includes("cannot be cancelled"));
            return true;
          }
        );
      } finally {
        cleanup();
      }
    },
  },
];

