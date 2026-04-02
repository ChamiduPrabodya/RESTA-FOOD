const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const { JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD, GOOGLE_CLIENT_ID } = require("../../config/env");
const { sanitizeUser } = require("../../models/User");
const { ROLES } = require("../../shared/constants/roles");
const { validateLogin, validateSignup } = require("./validators/authValidator");
const { addUser, findUserByEmail, updateUserByEmail } = require("./authStore");

const DEMO_USER_EMAIL = "user@gmail.com";
const DEMO_USER_PASSWORD = "user123";

function signToken({ email, role }) {
  return jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "7d" });
}

let googleClient = null;
function loadGoogleAuthLibrary() {
  try {
    // Lazy require so the backend can run even if dependency isn't installed yet.
    // Install with: npm install google-auth-library
    // eslint-disable-next-line global-require
    return require("google-auth-library");
  } catch {
    return null;
  }
}

function getGoogleClient() {
  if (!googleClient) {
    const lib = loadGoogleAuthLibrary();
    if (!lib || !lib.OAuth2Client) return null;
    googleClient = new lib.OAuth2Client(GOOGLE_CLIENT_ID || undefined);
  }
  return googleClient;
}

async function verifyGoogleIdToken(idToken) {
  const client = getGoogleClient();
  if (!client) {
    const error = new Error("Google login is not installed.");
    error.status = 501;
    throw error;
  }
  if (!GOOGLE_CLIENT_ID) {
    const error = new Error("Missing GOOGLE_CLIENT_ID.");
    error.status = 500;
    throw error;
  }
  const ticket = await client.verifyIdToken({
    idToken,
    audience: GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
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
    role: ROLES.USER,
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
    const token = signToken({ email: ADMIN_EMAIL, role: ROLES.ADMIN });
    return res.json({
      success: true,
      role: ROLES.ADMIN,
      token,
      user: { email: ADMIN_EMAIL, role: ROLES.ADMIN, fullName: "Admin" },
    });
  }

  if (email === String(DEMO_USER_EMAIL || "").trim().toLowerCase() && password === DEMO_USER_PASSWORD) {
    const now = new Date().toISOString();
    const demoUser = {
      email: DEMO_USER_EMAIL,
      role: ROLES.USER,
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

  if (!user.passwordHash) {
    return res.status(401).json({ success: false, message: "This account uses Google login." });
  }

  const ok = await bcrypt.compare(password, String(user.passwordHash || ""));
  if (!ok) {
    return res.status(401).json({ success: false, message: "Invalid credentials." });
  }

  const now = new Date().toISOString();
  await updateUserByEmail(email, (current) => ({ ...current, lastActiveAt: now }));

  const token = signToken({ email: user.email, role: user.role || ROLES.USER });
  return res.json({
    success: true,
    role: user.role || ROLES.USER,
    token,
    user: sanitizeUser({ ...user, lastActiveAt: now }),
  });
}

module.exports = {
  signup,
  login,
  googleLogin,
};

async function googleLogin(req, res) {
  const idToken = String(req.body && req.body.idToken ? req.body.idToken : "").trim();
  if (!idToken) {
    return res.status(400).json({ success: false, message: "Missing Google idToken." });
  }

  let payload;
  try {
    payload = await verifyGoogleIdToken(idToken);
  } catch (error) {
    const status = Number(error && error.status ? error.status : 401);
    return res.status(status).json({ success: false, message: "Invalid Google token." });
  }

  const email = String(payload && payload.email ? payload.email : "").trim().toLowerCase();
  const emailVerified = Boolean(payload && payload.email_verified);
  if (!email || !emailVerified) {
    return res.status(401).json({ success: false, message: "Google account email not verified." });
  }

  if (email === String(ADMIN_EMAIL || "").trim().toLowerCase()) {
    return res.status(400).json({ success: false, message: "Admin must login with password." });
  }

  const now = new Date().toISOString();
  const existing = await findUserByEmail(email);
  if (existing) {
    await updateUserByEmail(email, (current) => ({
      ...current,
      role: current.role || ROLES.USER,
      authProvider: current.authProvider || "google",
      googleSub: current.googleSub || (payload && payload.sub ? String(payload.sub) : undefined),
      lastActiveAt: now,
    }));

    const nextUser = await findUserByEmail(email);
    const token = signToken({ email, role: (nextUser && nextUser.role) || ROLES.USER });
    return res.json({ success: true, role: (nextUser && nextUser.role) || ROLES.USER, token, user: sanitizeUser(nextUser) });
  }

  const fullName = String(payload && payload.name ? payload.name : "").trim() || "Google User";
  const createdUser = await addUser({
    email,
    role: ROLES.USER,
    fullName,
    phone: "",
    streetAddress1: "",
    streetAddress2: "",
    cityTown: "",
    address: "",
    authProvider: "google",
    googleSub: payload && payload.sub ? String(payload.sub) : undefined,
    createdAt: now,
    lastActiveAt: now,
  });

  const token = signToken({ email: createdUser.email, role: createdUser.role });
  return res.json({ success: true, role: createdUser.role, token, user: sanitizeUser(createdUser) });
}
