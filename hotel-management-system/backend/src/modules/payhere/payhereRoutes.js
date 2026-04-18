const express = require("express");

const { asyncHandler } = require("../../shared/middlewares/asyncHandler");
const { payhereNotify } = require("./payhereController");

const payhereRouter = express.Router();

// Public: PayHere notify_url callback.
payhereRouter.post("/notify", asyncHandler(payhereNotify));

module.exports = { payhereRouter };

