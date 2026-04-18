const mongoose = require("mongoose");

const { connectMongo } = require("../../shared/db/mongo");

const vipBookingSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, trim: true, index: true, unique: true },
    userEmail: { type: String, required: true, trim: true, lowercase: true, index: true },

    suiteId: { type: String, required: true, trim: true, lowercase: true, index: true },
    date: { type: String, required: true, trim: true, index: true },
    time: { type: String, required: true, trim: true },
    timeSlots: { type: Array, default: [] },
    guests: { type: Number, required: true },

    status: { type: String, default: "Pending", trim: true, index: true },
    cancelReason: { type: String, default: "", trim: true },
    cancelledBy: { type: String, default: "", trim: true },
    cancelledAt: { type: String, default: "", trim: true },
    statusUpdatedAt: { type: String, default: "", trim: true },

    createdAt: { type: String, required: true, trim: true, index: true },
    updatedAt: { type: String, required: true, trim: true, index: true },
  },
  { collection: "vip_bookings", versionKey: false, strict: false }
);

vipBookingSchema.index({ userEmail: 1, createdAt: -1, id: -1 });
vipBookingSchema.index({ suiteId: 1, date: 1, status: 1, createdAt: -1 });

const VipBookingModel = mongoose.models.VipBooking || mongoose.model("VipBooking", vipBookingSchema);

const stripMongoFields = (doc) => {
  if (!doc) return null;
  // eslint-disable-next-line no-unused-vars
  const { _id, ...rest } = doc;
  return rest;
};

async function addVipBooking(booking) {
  await connectMongo();
  const created = await VipBookingModel.create(booking);
  return stripMongoFields(created.toObject());
}

async function findVipBookingById(id) {
  await connectMongo();
  const bookingId = String(id || "").trim();
  if (!bookingId) return null;
  const doc = await VipBookingModel.findOne({ id: bookingId }).lean();
  return stripMongoFields(doc);
}

async function listVipBookingsForUser(email) {
  await connectMongo();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  if (!normalizedEmail) return [];
  const docs = await VipBookingModel.find({ userEmail: normalizedEmail }).sort({ createdAt: -1, _id: -1 }).lean();
  return docs.map(stripMongoFields);
}

async function listAllVipBookings() {
  await connectMongo();
  const docs = await VipBookingModel.find({}).sort({ createdAt: -1, _id: -1 }).lean();
  return docs.map(stripMongoFields);
}

async function updateVipBookingById(id, updater) {
  await connectMongo();
  const bookingId = String(id || "").trim();
  if (!bookingId) return null;

  const doc = await VipBookingModel.findOne({ id: bookingId });
  if (!doc) return null;

  const current = stripMongoFields(doc.toObject());
  const next = typeof updater === "function" ? updater(current) : null;
  if (!next || typeof next !== "object") return stripMongoFields(doc.toObject());

  for (const [key, value] of Object.entries(next)) {
    if (key === "_id") continue;
    doc.set(key, value);
  }

  await doc.save();
  return stripMongoFields(doc.toObject());
}

async function findVipBookingSlotConflict({ suiteId, date, timeSlots }) {
  await connectMongo();
  const normalizedSuite = String(suiteId || "").trim().toLowerCase();
  const normalizedDate = String(date || "").trim();
  const slots = Array.isArray(timeSlots)
    ? timeSlots.map((value) => String(value || "").trim()).filter(Boolean)
    : [];

  if (!normalizedSuite || !normalizedDate || slots.length === 0) return null;

  const doc = await VipBookingModel.findOne({
    suiteId: normalizedSuite,
    date: normalizedDate,
    status: { $ne: "Cancelled" },
    timeSlots: { $in: slots },
  }).lean();

  return stripMongoFields(doc);
}

module.exports = {
  addVipBooking,
  findVipBookingById,
  listVipBookingsForUser,
  listAllVipBookings,
  updateVipBookingById,
  findVipBookingSlotConflict,
};

