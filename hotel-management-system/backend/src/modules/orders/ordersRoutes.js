const express = require("express");

const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { requireAuth } = require("../../shared/middlewares/requireAuth");

const {
  createGuestDineInOrder,
  createMyOrder,
  listMyOrders,
  getOrderById,
  updateOrderStatus,
  initiatePayment,
  confirmPayment,
} = require("./ordersController");

const ordersRouter = express.Router();

// Public (guest): dine-in orders created after scanning table QR.
ordersRouter.post("/dine-in", asyncHandler(createGuestDineInOrder));

// Everything else requires auth.
ordersRouter.use(requireAuth());

// User/admin: create an order (checkout).
ordersRouter.post("/", asyncHandler(createMyOrder));

// User: list own orders. Admin: list all orders.
ordersRouter.get("/", asyncHandler(listMyOrders));

// User/admin: view order by id (users can only see their own).
ordersRouter.get("/:id", asyncHandler(getOrderById));

// User/admin: update status (users can only cancel).
ordersRouter.patch("/:id/status", asyncHandler(updateOrderStatus));

// User/admin: start a mock payment (dev).
ordersRouter.post("/:id/payments", asyncHandler(initiatePayment));
ordersRouter.post("/:id/payments/mock/confirm", asyncHandler(confirmPayment));

module.exports = { ordersRouter };
