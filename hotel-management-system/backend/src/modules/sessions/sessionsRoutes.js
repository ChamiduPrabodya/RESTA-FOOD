const express = require("express");

const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { requireRole } = require("../../shared/middlewares/requireRole");
const { ROLES } = require("../../shared/constants/roles");

const { getSessionByTable, patchCloseSession, postStartSession } = require("./sessionsController");

const sessionsRouter = express.Router();

// Public: scanning QR to create/reuse a session.
sessionsRouter.post("/start", asyncHandler(postStartSession));
sessionsRouter.get("/table/:tableId", asyncHandler(getSessionByTable));

// Admin/staff: close a session (table becomes available).
sessionsRouter.patch("/:id/close", requireAuth(), requireRole([ROLES.ADMIN]), asyncHandler(patchCloseSession));

module.exports = { sessionsRouter };
