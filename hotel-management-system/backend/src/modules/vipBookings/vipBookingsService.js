const crypto = require("node:crypto");

const { httpError } = require("../../shared/errors");
const { ROLES } = require("../../shared/constants/roles");
const {
  addVipBooking,
  findVipBookingById,
  listVipBookingsForUser,
  listAllVipBookings,
  updateVipBookingById,
  findVipBookingSlotConflict,
} = require("./vipBookingsStore");

const VIP_SUITE_CAPACITY = Object.freeze({
  platinum: 15,
  gold: 6,
});

const LEGACY_SLOT_MAP = Object.freeze({
  "10:00-12:00": "11:00-14:00",
  "11:00-13:00": "11:00-14:00",
  "12:00-15:00": "14:00-17:00",
  "13:00-16:00": "14:00-17:00",
  "15:00-18:00": "17:00-20:00",
  "16:00-19:00": "17:00-20:00",
  "18:00-21:00": "20:00-23:00",
  "19:00-22:00": "20:00-23:00",
  "10:00": "11:00-14:00",
  "11:00": "11:00-14:00",
  "12:00": "14:00-17:00",
  "13:00": "14:00-17:00",
  "15:00": "17:00-20:00",
  "16:00": "17:00-20:00",
  "18:00": "20:00-23:00",
  "19:00": "20:00-23:00",
});

const ALLOWED_SLOT_ORDER = Object.freeze(["11:00-14:00", "14:00-17:00", "17:00-20:00", "20:00-23:00"]);
const SLOT_INDEX_BY_VALUE = Object.freeze(
  ALLOWED_SLOT_ORDER.reduce((acc, value, index) => {
    acc[value] = index;
    return acc;
  }, {})
);

function normalizeSlotValue(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (Object.prototype.hasOwnProperty.call(LEGACY_SLOT_MAP, text)) return LEGACY_SLOT_MAP[text];
  return text;
}

function normalizeSuiteId(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeDate(value) {
  return String(value || "").trim();
}

function getTodayDateText() {
  return new Date().toISOString().slice(0, 10);
}

function resolveVipBookingStartTime(value) {
  const text = String(value || "").trim();
  if (!text) return "";
  if (text.includes("-")) return text.split("-")[0].trim();
  if (text.includes("|")) return text.split("|")[0].split("-")[0].trim();
  return text;
}

function assertBookingDateNotPast(normalizedDate) {
  const bookingDay = new Date(`${normalizedDate}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  if (Number.isNaN(bookingDay.getTime()) || bookingDay.getTime() < today.getTime()) {
    throw httpError(400, "Please select a booking date from today onwards.");
  }
}

function assertSlotNotStartedIfToday(normalizedDate, slotValue) {
  if (normalizedDate !== getTodayDateText()) return;
  const startTime = resolveVipBookingStartTime(slotValue);
  const startTimeText = /^\d{2}:\d{2}$/.test(startTime) ? `${startTime}:00` : startTime;
  const bookingDateTime = new Date(`${normalizedDate}T${startTimeText}`);
  if (!Number.isNaN(bookingDateTime.getTime()) && Date.now() >= bookingDateTime.getTime()) {
    throw httpError(400, "Selected time slot has already started. Please choose a later slot.");
  }
}

function normalizeAndValidateSlots(rawSlots) {
  const uniqueRequestedSlots = [...new Set((Array.isArray(rawSlots) ? rawSlots : []).map(normalizeSlotValue).filter(Boolean))];
  if (uniqueRequestedSlots.length === 0) {
    throw httpError(400, "Please select a valid VIP time slot.");
  }

  const slotIndexes = uniqueRequestedSlots
    .map((slotValue) => SLOT_INDEX_BY_VALUE[slotValue])
    .filter((index) => typeof index === "number");

  if (slotIndexes.length !== uniqueRequestedSlots.length) {
    throw httpError(400, "Please select a valid VIP time slot.");
  }

  const sortedIndexes = [...slotIndexes].sort((a, b) => a - b);
  const isConsecutiveRange = sortedIndexes.every((value, i) => i === 0 || value === sortedIndexes[i - 1] + 1);
  if (!isConsecutiveRange) {
    throw httpError(400, "Please select consecutive time slots only.");
  }

  const orderedSlots = sortedIndexes.map((index) => ALLOWED_SLOT_ORDER[index]);
  return { orderedSlots, firstSlot: orderedSlots[0] || "" };
}

async function createVipBookingForUser(userEmail, input) {
  const email = String(userEmail || "").trim().toLowerCase();
  if (!email) throw httpError(401, "Unauthorized.");

  const suiteId = normalizeSuiteId(input && input.suiteId !== undefined ? input.suiteId : "");
  const date = normalizeDate(input && input.date !== undefined ? input.date : "");
  const guestsCount = Number(input && input.guests !== undefined ? input.guests : NaN);

  if (!suiteId || !date) {
    throw httpError(400, "Please add room type, date, and time.");
  }

  if (!Object.prototype.hasOwnProperty.call(VIP_SUITE_CAPACITY, suiteId)) {
    throw httpError(400, "Invalid VIP room type.");
  }

  if (!Number.isFinite(guestsCount) || guestsCount <= 0) {
    throw httpError(400, "Please enter a valid guest count.");
  }

  const maxGuests = Math.max(1, Number(VIP_SUITE_CAPACITY[suiteId]) || 0);
  if (guestsCount > maxGuests) {
    throw httpError(400, `Guest count exceeds the suite capacity (${maxGuests}).`);
  }

  const rawSlots = Array.isArray(input && input.timeSlots ? input.timeSlots : [])
    ? input.timeSlots
    : input && input.time
      ? [input.time]
      : [];

  const { orderedSlots, firstSlot } = normalizeAndValidateSlots(rawSlots);

  assertBookingDateNotPast(date);
  assertSlotNotStartedIfToday(date, firstSlot);

  const conflict = await findVipBookingSlotConflict({ suiteId, date, timeSlots: orderedSlots });
  if (conflict) {
    throw httpError(400, "This time slot is already booked for the selected room. Please choose another time.");
  }

  const now = new Date().toISOString();
  const booking = {
    id: crypto.randomUUID(),
    suiteId,
    date,
    time: firstSlot,
    timeSlots: orderedSlots,
    guests: Math.round(guestsCount),
    status: "Pending",
    userEmail: email,
    cancelReason: "",
    cancelledBy: "",
    cancelledAt: "",
    statusUpdatedAt: "",
    createdAt: now,
    updatedAt: now,
  };

  return addVipBooking(booking);
}

async function listVipBookingsForActor(actor) {
  const email = String(actor && actor.email ? actor.email : "").trim().toLowerCase();
  const role = String(actor && actor.role ? actor.role : "").trim();
  if (!email) throw httpError(401, "Unauthorized.");

  if (role === ROLES.ADMIN) {
    return listAllVipBookings();
  }
  return listVipBookingsForUser(email);
}

async function getVipBookingForActor(actor, id) {
  const email = String(actor && actor.email ? actor.email : "").trim().toLowerCase();
  const role = String(actor && actor.role ? actor.role : "").trim();
  if (!email) throw httpError(401, "Unauthorized.");

  const booking = await findVipBookingById(id);
  if (!booking) return null;
  if (role === ROLES.ADMIN) return booking;
  if (String(booking.userEmail || "").trim().toLowerCase() === email) return booking;
  throw httpError(403, "Forbidden.");
}

function assertUserCanCancelBooking(booking) {
  const status = String(booking && booking.status ? booking.status : "Pending").trim().toLowerCase();
  if (status === "cancelled") {
    throw httpError(400, "This booking is already cancelled.");
  }
  if (status === "confirmed") {
    throw httpError(400, "Bookings cannot be cancelled after admin approval.");
  }

  const startSlot = Array.isArray(booking.timeSlots) && booking.timeSlots.length > 0 ? booking.timeSlots[0] : booking.time;
  const startTime = resolveVipBookingStartTime(startSlot);
  const startTimeText = /^\d{2}:\d{2}$/.test(startTime) ? `${startTime}:00` : startTime;
  const bookingDateTime = new Date(`${booking.date}T${startTimeText}`);
  if (Number.isNaN(bookingDateTime.getTime())) {
    throw httpError(400, "Booking time is invalid.");
  }

  const threeHoursMs = 3 * 60 * 60 * 1000;
  const timeUntilBooking = bookingDateTime.getTime() - Date.now();
  if (timeUntilBooking < threeHoursMs) {
    throw httpError(400, "Bookings can only be cancelled at least 3 hours before the reserved time.");
  }
}

async function setVipBookingStatusForActor(actor, id, input) {
  const email = String(actor && actor.email ? actor.email : "").trim().toLowerCase();
  const role = String(actor && actor.role ? actor.role : "").trim();
  if (!email) throw httpError(401, "Unauthorized.");

  const booking = await findVipBookingById(id);
  if (!booking) return null;

  const nextStatus = String(input && input.status ? input.status : "").trim();
  const cancelReason = String(input && input.cancelReason ? input.cancelReason : "").trim();
  if (!nextStatus) throw httpError(400, "status is required.");

  if (role === ROLES.ADMIN) {
    if (nextStatus === "Cancelled" && !cancelReason) {
      throw httpError(400, "Please provide a cancellation reason.");
    }

    return updateVipBookingById(id, (current) => {
      const now = new Date().toISOString();
      if (nextStatus === "Cancelled") {
        return {
          ...current,
          status: "Cancelled",
          cancelReason,
          cancelledBy: "admin",
          cancelledAt: now,
          statusUpdatedAt: now,
          updatedAt: now,
        };
      }
      return {
        ...current,
        status: nextStatus,
        cancelReason: "",
        cancelledBy: "",
        cancelledAt: "",
        statusUpdatedAt: now,
        updatedAt: now,
      };
    });
  }

  // User flow: only cancel own booking, with time constraints.
  if (String(booking.userEmail || "").trim().toLowerCase() !== email) {
    throw httpError(403, "Forbidden.");
  }
  if (nextStatus !== "Cancelled") {
    throw httpError(403, "Forbidden.");
  }

  assertUserCanCancelBooking(booking);

  return updateVipBookingById(id, (current) => {
    const now = new Date().toISOString();
    return {
      ...current,
      status: "Cancelled",
      cancelReason: "",
      cancelledBy: "user",
      cancelledAt: now,
      statusUpdatedAt: now,
      updatedAt: now,
    };
  });
}

module.exports = {
  createVipBookingForUser,
  listVipBookingsForActor,
  getVipBookingForActor,
  setVipBookingStatusForActor,
  VIP_SUITE_CAPACITY,
  ALLOWED_SLOT_ORDER,
};

