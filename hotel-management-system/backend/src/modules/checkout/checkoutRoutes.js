const express = require("express");

const { requireAuth } = require("../../shared/middlewares/requireAuth");
const {
  getMyCart,
  addCartItem,
  updateCartItem,
  deleteCartItem,
  getCheckoutSummary,
  placeOrder,
  initPayHerePayment,
  getOrders,
  getOrderById,
  getPurchases,
  updatePurchaseStatus,
  updateOrderStatus,
  notifyPayHere,
} = require("./checkoutController");

const checkoutRouter = express.Router();

checkoutRouter.post("/payhere/notify", notifyPayHere);

checkoutRouter.use(requireAuth());

checkoutRouter.get("/cart", getMyCart);
checkoutRouter.post("/cart/items", addCartItem);
checkoutRouter.patch("/cart/items/:cartItemId", updateCartItem);
checkoutRouter.delete("/cart/items/:cartItemId", deleteCartItem);
checkoutRouter.post("/summary", getCheckoutSummary);
checkoutRouter.post("/place-order", placeOrder);
checkoutRouter.post("/payhere/init", initPayHerePayment);
checkoutRouter.get("/orders", getOrders);
checkoutRouter.get("/orders/:orderId", getOrderById);
checkoutRouter.get("/purchases", getPurchases);
checkoutRouter.patch("/orders/:orderId/status", updateOrderStatus);
checkoutRouter.patch("/purchases/:purchaseId/status", updatePurchaseStatus);

module.exports = { checkoutRouter };
