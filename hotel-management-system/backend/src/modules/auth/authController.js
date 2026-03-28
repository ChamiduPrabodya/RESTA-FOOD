const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { JWT_SECRET } = require("../../config/env");
const { validateLogin, validateSignup } = require("./authUtils");
const { addUser, findUserByEmail, updateUserByEmail } = require("./authStore");

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123";
const DEMO_USER_EMAIL = "user@gmail.com";
const DEMO_USER_PASSWORD = "user123";

function signToken({ email, role }) {
  return jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "7d" });
}

function sanitizeUser(user) {
  if (!user) return null;
  // eslint-disable-next-line no-unused-vars
  const { passwordHash, ...rest } = user;
  return rest;
}

async function signup(req, res) {
  const validation = validateSignup(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const { fullName, email, password, phone, streetAddress1, streetAddress2, cityTown, address } = validation.value;

  if (email === String(ADMIN_EMAIL || "").trim().toLowerCase()) {
    return res.status(400).json({ success: false, message: "This email is reserved." });
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    return res.status(400).json({ success: false, message: "Email already registered." });
  }

  const now = new Date().toISOString();
  const passwordHash = await bcrypt.hash(password, 10);

  const createdUser = await addUser({
    email,
    role: "user",
    fullName,
    phone,
    streetAddress1,
    streetAddress2,
    cityTown,
    address,
    createdAt: now,
    lastActiveAt: now,
    passwordHash,
  });

  const token = signToken({ email: createdUser.email, role: createdUser.role });
  return res.json({ success: true, role: createdUser.role, token, user: sanitizeUser(createdUser) });
}

async function login(req, res) {
  const validation = validateLogin(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const { email, password } = validation.value;

  if (email === String(ADMIN_EMAIL || "").trim().toLowerCase() && password === ADMIN_PASSWORD) {
    const token = signToken({ email: ADMIN_EMAIL, role: "admin" });
    return res.json({ success: true, role: "admin", token, user: { email: ADMIN_EMAIL, role: "admin", fullName: "Admin" } });
  }

  if (email === String(DEMO_USER_EMAIL || "").trim().toLowerCase() && password === DEMO_USER_PASSWORD) {
    const now = new Date().toISOString();
    const demoUser = {
      email: DEMO_USER_EMAIL,
      role: "user",
      fullName: "John Doe",
      phone: "+94 71 987 6543",
      streetAddress1: "No. 25, Galle Road",
      streetAddress2: "",
      cityTown: "Colombo 03",
      address: "No. 25, Galle Road, Colombo 03",
      lastActiveAt: now,
    };
    const token = signToken({ email: demoUser.email, role: demoUser.role });
    return res.json({ success: true, role: demoUser.role, token, user: demoUser });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const ok = await bcrypt.compare(password, String(user.passwordHash || ""));
  if (!ok) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const now = new Date().toISOString();
  await updateUserByEmail(email, (current) => ({ ...current, lastActiveAt: now }));

  const token = signToken({ email: user.email, role: user.role || "user" });
  return res.json({ success: true, role: user.role || "user", token, user: sanitizeUser({ ...user, lastActiveAt: now }) });
}

module.exports = {
  signup,
  login,
};

