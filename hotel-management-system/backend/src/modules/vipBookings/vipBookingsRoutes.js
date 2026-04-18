const express = require("express");

const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { requireAuth } = require("../../shared/middlewares/requireAuth");
const {
  createMyVipBooking,
  listVipBookings,
  getVipBookingById,
  updateVipBookingStatus,
} = require("./vipBookingsController");

const vipBookingsRouter = express.Router();

vipBookingsRouter.use(requireAuth());

// User: create a booking request.
vipBookingsRouter.post("/", asyncHandler(createMyVipBooking));

// User: list own bookings. Admin: list all bookings.
vipBookingsRouter.get("/", asyncHandler(listVipBookings));

// User/admin: view booking by id (users can only see their own).
vipBookingsRouter.get("/:id", asyncHandler(getVipBookingById));

// User/admin: update status (users can only cancel).
vipBookingsRouter.patch("/:id/status", asyncHandler(updateVipBookingStatus));

module.exports = { vipBookingsRouter };

