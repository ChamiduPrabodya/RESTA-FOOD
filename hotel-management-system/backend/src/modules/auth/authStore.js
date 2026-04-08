const mongoose = require("mongoose");

const { connectMongo } = require("../../shared/db/mongo");

const normalizeEmail = (value) => String(value || "").trim().toLowerCase();

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true, unique: true, trim: true, lowercase: true },
    role: { type: String, default: "user" },
    passwordHash: { type: String, default: "" },
    fullName: { type: String, default: "" },
    phone: { type: String, default: "" },
    streetAddress1: { type: String, default: "" },
    streetAddress2: { type: String, default: "" },
    cityTown: { type: String, default: "" },
    address: { type: String, default: "" },
    authProvider: { type: String, default: "local" },
    googleSub: { type: String },
    avatarUrl: { type: String },
    googleName: { type: String },
    googleGivenName: { type: String },
    googleFamilyName: { type: String },
    googleEmailVerified: { type: Boolean },
    createdAt: { type: String },
    lastActiveAt: { type: String },
  },
  { collection: "users", versionKey: false, strict: false }
);

const UserModel = mongoose.models.User || mongoose.model("User", userSchema);

const stripMongoFields = (doc) => {
  if (!doc) return null;
  // eslint-disable-next-line no-unused-vars
  const { _id, ...rest } = doc;
  return rest;
};

async function listUsers() {
  await connectMongo();
  const users = await UserModel.find({}).sort({ createdAt: -1, _id: -1 }).lean();
  return users.map(stripMongoFields);
}

async function findUserByEmail(email) {
  await connectMongo();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return null;
  const user = await UserModel.findOne({ email: normalizedEmail }).lean();
  return stripMongoFields(user);
}

async function addUser(user) {
  await connectMongo();
  const normalizedEmail = normalizeEmail(user && user.email ? user.email : "");
  if (!normalizedEmail) throw new Error("Email is required.");

  const created = await UserModel.create({ ...(user || {}), email: normalizedEmail });
  return stripMongoFields(created.toObject());
}

async function updateUserByEmail(email, updater) {
  await connectMongo();
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) return;

  const doc = await UserModel.findOne({ email: normalizedEmail });
  if (!doc) return;

  const current = doc.toObject();
  const next = typeof updater === "function" ? updater(stripMongoFields(current)) : null;
  if (!next || typeof next !== "object") return;

  const updates = { ...next, email: normalizedEmail };
  for (const [key, value] of Object.entries(updates)) {
    if (key === "_id") continue;
    doc.set(key, value);
  }

  await doc.save();
}

module.exports = {
  addUser,
  findUserByEmail,
  listUsers,
  updateUserByEmail,
};
