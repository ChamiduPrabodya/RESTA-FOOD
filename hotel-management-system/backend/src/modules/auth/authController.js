const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const https = require("https");

const { JWT_SECRET, ADMIN_EMAIL, GOOGLE_CLIENT_ID } = require("../../config/env");
const { sanitizeUser } = require("../../models/User");
const { ROLES } = require("../../shared/constants/roles");
const { validateLogin, validateSignup } = require("./validators/authValidator");
const { addUser, findUserByEmail, updateUserByEmail } = require("./authStore");

const DEMO_USER_EMAIL = "user@gmail.com";
const DEMO_USER_PASSWORD = "user123";

function signToken({ email, role }) {
  return jwt.sign({ email, role }, JWT_SECRET, { expiresIn: "7d" });
}

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function fetchJson(url, options = {}) {
  const method = options.method || "GET";
  const headers = options.headers || {};
  const body = options.body;

  if (typeof fetch === "function") {
    const res = await fetch(url, { method, headers, body });
    let data = null;
    const contentType = String(res.headers.get("content-type") || "");
    if (contentType.includes("application/json")) {
      data = await res.json();
    } else {
      const text = await res.text();
      data = text ? { message: text } : null;
    }

    if (!res.ok) {
      const err = new Error((data && data.error_description) || (data && data.error) || "Request failed");
      err.status = res.status;
      err.response = { data };
      throw err;
    }

    return data;
  }

  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const req = https.request(
      {
        method,
        protocol: parsed.protocol,
        hostname: parsed.hostname,
        port: parsed.port,
        path: `${parsed.pathname}${parsed.search}`,
        headers,
      },
      (res) => {
        let raw = "";
        res.setEncoding("utf8");
        res.on("data", (chunk) => {
          raw += chunk;
        });
        res.on("end", () => {
          const status = res.statusCode || 0;
          let data = null;
          try {
            data = raw ? JSON.parse(raw) : null;
          } catch {
            data = raw ? { message: raw } : null;
          }

          if (status < 200 || status >= 300) {
            const err = new Error((data && data.error_description) || (data && data.error) || "Request failed");
            err.status = status;
            err.response = { data };
            reject(err);
            return;
          }

          resolve(data);
        });
      }
    );

    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

function getAllowedGoogleClientIds() {
  return String(GOOGLE_CLIENT_ID || "")
    .split(",")
    .map((value) => String(value || "").trim())
    .filter(Boolean);
}

function looksLikeJwt(token) {
  const parts = String(token || "").split(".");
  return parts.length === 3 && parts.every((p) => p.length > 0);
}

let googleClient = null;
function loadGoogleAuthLibrary() {
  try {
   
    return require("google-auth-library");
  } catch {
    return null;
  }
}

function getGoogleClient() {
  if (!googleClient) {
    const lib = loadGoogleAuthLibrary();
    if (!lib || !lib.OAuth2Client) return null;
    const allowedClientIds = getAllowedGoogleClientIds();
    googleClient = new lib.OAuth2Client(allowedClientIds[0] || undefined);
  }
  return googleClient;
}

function enforceGoogleAudience({ tokenAudience, allowedClientIds }) {
  const aud = String(tokenAudience || "").trim();
  if (aud && Array.isArray(allowedClientIds) && allowedClientIds.length > 0 && !allowedClientIds.includes(aud)) {
    throw createHttpError(
      401,
      "Google token audience mismatch. Ensure the frontend uses the same Google OAuth Client ID as GOOGLE_CLIENT_ID on the backend."
    );
  }
}

async function verifyGoogleIdTokenViaTokenInfo(idToken, allowedClientIds) {
  const data = await fetchJson(
    `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(String(idToken || "").trim())}`
  );
  enforceGoogleAudience({ tokenAudience: data && data.aud, allowedClientIds });
  return data;
}

async function verifyGoogleAccessTokenViaTokenInfo(accessToken, allowedClientIds) {
  const data = await fetchJson(
    `https://oauth2.googleapis.com/tokeninfo?access_token=${encodeURIComponent(String(accessToken || "").trim())}`
  );
  enforceGoogleAudience({ tokenAudience: (data && (data.aud || data.audience || data.issued_to)) || "", allowedClientIds });
  return data;
}

async function fetchGoogleUserInfo(accessToken) {
  return fetchJson("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${String(accessToken || "").trim()}`,
    },
  });
}

function normalizeGoogleAuthError(error) {
  const baseMessage = String((error && error.message) || "");
  const details =
    (error && error.response && error.response.data && JSON.stringify(error.response.data)) ||
    (error && error.response && error.response.statusText) ||
    baseMessage;

  const msg = String(details || baseMessage || "").toLowerCase();
  const code = String((error && error.code) || "").toLowerCase();

  if (
    code.includes("econn") ||
    code.includes("etimedout") ||
    code.includes("eai_again") ||
    code.includes("enotfound") ||
    msg.includes("fetch failed") ||
    msg.includes("network") ||
    msg.includes("getaddrinfo")
  ) {
    return { status: 503, message: "Unable to contact Google to verify the token. Check server internet access and try again." };
  }

  if (error && (error.status === 500 || error.status === 501)) {
    return { status: error.status, message: baseMessage || "Google login is misconfigured." };
  }

  if (msg.includes("wrong recipient") || msg.includes("audience") || msg.includes("aud")) {
    return {
      status: 401,
      message:
        "Google token audience mismatch. Ensure the frontend uses the same Google OAuth Client ID as GOOGLE_CLIENT_ID on the backend.",
    };
  }

  if (msg.includes("expired") || msg.includes("used too late") || msg.includes("invalid_grant")) {
    return { status: 401, message: "Google token expired. Please try again." };
  }

  return { status: 401, message: "Invalid Google token." };
}

async function verifyGoogleIdToken(idToken) {
  const allowedClientIds = getAllowedGoogleClientIds();
  if (allowedClientIds.length === 0) {
    throw createHttpError(500, "Missing GOOGLE_CLIENT_ID.");
  }

  const client = getGoogleClient();
  if (client) {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: allowedClientIds,
    });
    return ticket.getPayload();
  }

  // Fallback when google-auth-library isn't installed (or cannot be required).
  return verifyGoogleIdTokenViaTokenInfo(idToken, allowedClientIds);
}

async function verifyGoogleAccessToken(accessToken) {
  const client = getGoogleClient();
  const allowedClientIds = getAllowedGoogleClientIds();
  if (allowedClientIds.length === 0) {
    throw createHttpError(500, "Missing GOOGLE_CLIENT_ID.");
  }

  if (client) {
    const tokenInfo = await client.getTokenInfo(accessToken);
    const tokenAudience = String(
      tokenInfo && (tokenInfo.aud || tokenInfo.audience) ? tokenInfo.aud || tokenInfo.audience : ""
    ).trim();
    enforceGoogleAudience({ tokenAudience, allowedClientIds });

    client.setCredentials({ access_token: accessToken });
    const response = await client.request({ url: "https://openidconnect.googleapis.com/v1/userinfo" });
    return response && response.data ? response.data : null;
  }

  await verifyGoogleAccessTokenViaTokenInfo(accessToken, allowedClientIds);
  return fetchGoogleUserInfo(accessToken);
}

async function verifyGoogleToken(token) {
  if (looksLikeJwt(token)) {
    return verifyGoogleIdToken(token);
  }
  return verifyGoogleAccessToken(token);
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
    authProvider: "local",
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
  getAuthMe,
};

async function googleLogin(req, res) {
  const body = req.body || {};
  const googleToken =
    String(
      body.idToken ||
        body.credential ||
        body.accessToken ||
        body.access_token ||
        body.token ||
        ""
    ).trim();
  if (!googleToken) {
    return res.status(400).json({
      success: false,
      message: "Missing Google token (expected body.idToken, body.credential, or body.accessToken).",
    });
  }

  let payload;
  try {
    payload = await verifyGoogleToken(googleToken);
  } catch (error) {
    const normalized = normalizeGoogleAuthError(error);
    if (process.env.NODE_ENV !== "production") {
      // eslint-disable-next-line no-console
      console.warn("Google login failed:", error && error.message ? error.message : error);
    }
    return res.status(normalized.status).json({ success: false, message: normalized.message });
  }

  const email = String(payload && payload.email ? payload.email : "").trim().toLowerCase();
  const emailVerified = payload && (payload.email_verified === true || payload.email_verified === "true");
  if (!email || !emailVerified) {
    return res.status(401).json({ success: false, message: "Google account email not verified." });
  }

  const payloadName = String(payload && payload.name ? payload.name : "").trim();
  const payloadGiven = payload && payload.given_name ? String(payload.given_name) : "";
  const payloadFamily = payload && payload.family_name ? String(payload.family_name) : "";
  const derivedName = payloadName || `${payloadGiven} ${payloadFamily}`.trim();

  if (email === String(ADMIN_EMAIL || "").trim().toLowerCase()) {
    return res.status(400).json({ success: false, message: "Admin must login with password." });
  }

  const now = new Date().toISOString();
  const existing = await findUserByEmail(email);
  if (existing) {
    await updateUserByEmail(email, (current) => ({
      ...current,
      role: current.role || ROLES.USER,
      authProvider: "google",
      googleSub: payload && payload.sub ? String(payload.sub) : current.googleSub,
      avatarUrl: payload && payload.picture ? String(payload.picture) : current.avatarUrl,
      googleName: derivedName || current.googleName,
      googleGivenName: payloadGiven ? payloadGiven : current.googleGivenName,
      googleFamilyName: payloadFamily ? payloadFamily : current.googleFamilyName,
      googleEmailVerified: emailVerified,
      fullName: derivedName || String(current.fullName || "").trim() || "Google User",
      lastActiveAt: now,
    }));

    const nextUser = await findUserByEmail(email);
    const token = signToken({ email, role: (nextUser && nextUser.role) || ROLES.USER });
    return res.json({ success: true, role: (nextUser && nextUser.role) || ROLES.USER, token, user: sanitizeUser(nextUser) });
  }

  const createdUser = await addUser({
    email,
    role: ROLES.USER,
    fullName: derivedName || "Google User",
    phone: "",
    streetAddress1: "",
    streetAddress2: "",
    cityTown: "",
    address: "",
    authProvider: "google",
    googleSub: payload && payload.sub ? String(payload.sub) : undefined,
    avatarUrl: payload && payload.picture ? String(payload.picture) : undefined,
    googleName: derivedName || undefined,
    googleGivenName: payload && payload.given_name ? String(payload.given_name) : undefined,
    googleFamilyName: payload && payload.family_name ? String(payload.family_name) : undefined,
    googleEmailVerified: emailVerified,
    createdAt: now,
    lastActiveAt: now,
  });

  const token = signToken({ email: createdUser.email, role: createdUser.role });
  return res.json({ success: true, role: createdUser.role, token, user: sanitizeUser(createdUser) });
}

async function getAuthMe(req, res) {
  const email = String(req.auth && req.auth.email ? req.auth.email : "").trim().toLowerCase();
  const role = req.auth && req.auth.role ? req.auth.role : undefined;

  if (!email) {
    return res.status(401).json({ success: false, message: "Unauthorized." });
  }

  if (email === String(DEMO_USER_EMAIL || "").trim().toLowerCase()) {
    const demoUser = {
      email: DEMO_USER_EMAIL,
      role: ROLES.USER,
      fullName: "John Doe",
      phone: "+94 71 987 6543",
      streetAddress1: "No. 25, Galle Road",
      streetAddress2: "",
      cityTown: "Colombo 03",
      address: "No. 25, Galle Road, Colombo 03",
      authProvider: "local",
    };
    return res.json({ success: true, auth: req.auth, user: demoUser });
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return res.json({ success: true, auth: req.auth, user: { email, role: role || ROLES.USER } });
  }

  return res.json({ success: true, auth: req.auth, user: sanitizeUser(user) });
}
