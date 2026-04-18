const express = require("express");

const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { requireRole } = require("../../shared/middlewares/requireRole");
const { ROLES } = require("../../shared/constants/roles");

const { getTableQrCode, getTables, patchTableStatus, postTable, removeTable } = require("./tablesController");

const tablesRouter = express.Router();

tablesRouter.use(requireAuth());
tablesRouter.use(requireRole([ROLES.ADMIN]));

tablesRouter.get("/", asyncHandler(getTables));
tablesRouter.post("/", asyncHandler(postTable));
tablesRouter.get("/qr/:id", asyncHandler(getTableQrCode));
tablesRouter.patch("/:id/status", asyncHandler(patchTableStatus));
tablesRouter.delete("/:id", asyncHandler(removeTable));

module.exports = { tablesRouter };

