const express = require("express");

const { signup, login, googleLogin } = require("./authController");
const { requireAuth } = require("../../shared/middlewares/requireAuth");

const authRouter = express.Router();

authRouter.post("/signup", signup);
authRouter.post("/login", login);
authRouter.post("/google", googleLogin);
authRouter.get("/me", requireAuth(), (req, res) => {
  return res.json({ success: true, auth: req.auth });
});

module.exports = { authRouter };
