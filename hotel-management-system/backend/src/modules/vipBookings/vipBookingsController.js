const { ROLES } = require("../../shared/constants/roles");
const { httpError } = require("../../shared/errors");
const { validateCreateVipBooking, validateUpdateVipBookingStatus } = require("./validators/vipBookingsValidator");
const {
  createVipBookingForUser,
  listVipBookingsForActor,
  getVipBookingForActor,
  setVipBookingStatusForActor,
} = require("./vipBookingsService");

function getActor(req) {
  return {
    email: req && req.auth ? req.auth.email : "",
    role: req && req.auth ? req.auth.role : "",
  };
}

async function createMyVipBooking(req, res) {
  const actor = getActor(req);
  if (actor.role !== ROLES.USER) {
    throw httpError(403, "Only logged-in users can book VIP rooms.");
  }

  const validation = validateCreateVipBooking(req.body);
  if (!validation.ok) {
    return res.status(400).json({ success: false, message: validation.message });
  }

  const booking = await createVipBookingForUser(String(actor.email || "").trim().toLowerCase(), validation.value);
  return res.status(201).json({ success: true, booking });
}

async function listVipBookings(req, res) {
  const actor = getActor(req);
  const bookings = await listVipBookingsForActor(actor);
  return res.json({ success: true, bookings });
}

async function getVipBookingById(req, res) {
  const actor = getActor(req);
  const id = String(req.params && req.params.id ? req.params.id : "").trim();
  if (!id) return res.status(400).json({ success: false, message: "Missing booking id." });

  const booking = await getVipBookingForActor(actor, id);
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
  return res.json({ success: true, booking });
}

async function updateVipBookingStatus(req, res) {
  const actor = getActor(req);
  const id = String(req.params && req.params.id ? req.params.id : "").trim();
  if (!id) return res.status(400).json({ success: false, message: "Missing booking id." });

  const validation = validateUpdateVipBookingStatus(req.body);
  if (!validation.ok) return res.status(400).json({ success: false, message: validation.message });

  const booking = await setVipBookingStatusForActor(actor, id, validation.value);
  if (!booking) return res.status(404).json({ success: false, message: "Booking not found." });
  return res.json({ success: true, booking });
}

module.exports = {
  createMyVipBooking,
  listVipBookings,
  getVipBookingById,
  updateVipBookingStatus,
};

