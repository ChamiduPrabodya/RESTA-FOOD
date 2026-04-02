const express = require("express");

const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { getMe } = require("./userController");
const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

const userRouter = express.Router();

userRouter.get("/me", requireAuth(), asyncHandler(getMe));

module.exports = { userRouter };
