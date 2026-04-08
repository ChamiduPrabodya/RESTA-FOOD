const express = require("express");

const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { getMe, updateMe } = require("./userController");
const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

const userRouter = express.Router();

userRouter.get("/me", requireAuth(), asyncHandler(getMe));
userRouter.put("/me", requireAuth(), asyncHandler(updateMe));

module.exports = { userRouter };
