const express = require("express");

const { authRouter } = require("../modules/auth/authRoutes");
const { userRouter } = require("../modules/user/userRoutes");
const { adminRouter } = require("../modules/admin/adminRoutes");
const { loyaltyRouter } = require("../modules/loyalty/loyaltyRoutes");

const apiRouter = express.Router();

apiRouter.get("/health", (_req, res) => res.json({ ok: true }));
apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/admin", adminRouter);
apiRouter.use("/loyalty", loyaltyRouter);

module.exports = { apiRouter };
