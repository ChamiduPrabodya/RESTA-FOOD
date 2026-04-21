const express = require("express");

const { authRouter } = require("../modules/auth/authRoutes");
const { userRouter } = require("../modules/user/userRoutes");
const { adminRouter } = require("../modules/admin/adminRoutes");
const { loyaltyRouter } = require("../modules/loyalty/loyaltyRoutes");
const { menuRouter } = require("../modules/menu/menuRoutes");
const { ordersRouter } = require("../modules/orders/ordersRoutes");
const { payhereRouter } = require("../modules/payhere/payhereRoutes");
const { promotionsRouter } = require("../modules/promotions/promotionsRoutes");
const { reviewsRouter } = require("../modules/reviews/reviewsRoutes");
const { vipBookingsRouter } = require("../modules/vipBookings/vipBookingsRoutes");
const { tablesRouter } = require("../modules/tables/tablesRoutes");
const { sessionsRouter } = require("../modules/sessions/sessionsRoutes");

const apiRouter = express.Router();

apiRouter.get("/health", (_req, res) => res.json({ ok: true }));
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/loyalty", loyaltyRouter);
apiRouter.use("/menu", menuRouter);
apiRouter.use("/orders", ordersRouter);
apiRouter.use("/payhere", payhereRouter);
apiRouter.use("/promotions", promotionsRouter);
apiRouter.use("/reviews", reviewsRouter);
apiRouter.use("/vip-bookings", vipBookingsRouter);
apiRouter.use("/tables", tablesRouter);
apiRouter.use("/sessions", sessionsRouter);

module.exports = { apiRouter };
