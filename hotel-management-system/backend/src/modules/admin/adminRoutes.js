const express = require("express");

const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { requireRole } = require("../../shared/middlewares/requireRole");
const { ROLES } = require("../../shared/constants/roles");
const { listAllUsers } = require("./adminController");
const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

const adminRouter = express.Router();

adminRouter.use(requireAuth());
adminRouter.use(requireRole([ROLES.ADMIN]));

adminRouter.get("/users", asyncHandler(listAllUsers));

module.exports = { adminRouter };
