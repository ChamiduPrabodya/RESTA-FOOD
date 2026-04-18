const assert = require("node:assert/strict");

const {
  validateCreateVipBooking,
  validateUpdateVipBookingStatus,
} = require("../src/modules/vipBookings/validators/vipBookingsValidator");

module.exports = [
  {
    name: "vipBookingsValidator.validateCreateVipBooking: normalizes timeSlots + guests",
    fn: async () => {
      const result = validateCreateVipBooking({
        suiteId: "Platinum",
        date: "2099-01-01",
        time: "11:00-14:00|14:00-17:00",
        guests: 4.2,
      });

      assert.equal(result.ok, true);
      assert.equal(result.value.suiteId, "Platinum");
      assert.equal(result.value.date, "2099-01-01");
      assert.deepEqual(result.value.timeSlots, ["11:00-14:00", "14:00-17:00"]);
      assert.equal(result.value.time, "11:00-14:00");
      assert.equal(result.value.guests, 4);
    },
  },
  {
    name: "vipBookingsValidator.validateUpdateVipBookingStatus: maps cancelled -> Cancelled",
    fn: async () => {
      const result = validateUpdateVipBookingStatus({ status: "canceled", cancelReason: "No show" });
      assert.equal(result.ok, true);
      assert.deepEqual(result.value, { status: "Cancelled", cancelReason: "No show" });
    },
  },
  {
    name: "vipBookingsValidator.validateUpdateVipBookingStatus: rejects invalid status",
    fn: async () => {
      const result = validateUpdateVipBookingStatus({ status: "done" });
      assert.equal(result.ok, false);
      assert.ok(String(result.message || "").toLowerCase().includes("invalid"));
    },
  },
];

