const express = require("express");

const { signup, login, googleLogin, getAuthMe } = require("./authController");
const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

const authRouter = express.Router();

authRouter.post("/signup", asyncHandler(signup));
authRouter.post("/login", asyncHandler(login));
authRouter.post("/google", asyncHandler(googleLogin));
authRouter.get("/me", requireAuth(), asyncHandler(getAuthMe));

module.exports = { authRouter };
