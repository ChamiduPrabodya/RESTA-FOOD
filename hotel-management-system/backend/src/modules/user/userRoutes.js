const express = require("express");

const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { getMe } = require("./userController");

const userRouter = express.Router();

userRouter.get("/me", requireAuth(), getMe);

module.exports = { userRouter };

