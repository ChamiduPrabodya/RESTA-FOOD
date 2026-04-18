function validateCreateVipBooking(body) {
  const payload = body && typeof body === "object" ? body : {};

  const suiteId = String(payload.suiteId || "").trim();
  const date = String(payload.date || "").trim();
  const guests = Number(payload.guests);

  const rawSlots = Object.prototype.hasOwnProperty.call(payload, "timeSlots")
    ? payload.timeSlots
    : Object.prototype.hasOwnProperty.call(payload, "time")
      ? payload.time
      : null;

  const timeSlots = Array.isArray(rawSlots)
    ? rawSlots.map((value) => String(value || "").trim()).filter(Boolean)
    : typeof rawSlots === "string"
      ? String(rawSlots || "")
        .split("|")
        .map((value) => value.trim())
        .filter(Boolean)
      : rawSlots
        ? [String(rawSlots || "").trim()].filter(Boolean)
        : [];

  if (!suiteId || !date || timeSlots.length === 0) {
    return { ok: false, message: "Please add room type, date, and time." };
  }
  if (!Number.isFinite(guests) || guests <= 0) {
    return { ok: false, message: "Please enter a valid guest count." };
  }

  return {
    ok: true,
    value: {
      suiteId,
      date,
      timeSlots,
      time: timeSlots[0] || "",
      guests: Math.round(guests),
    },
  };
}

function validateUpdateVipBookingStatus(body) {
  const payload = body && typeof body === "object" ? body : {};
  const status = String(payload.status || "").trim();
  if (!status) return { ok: false, message: "status is required." };

  const normalized = status.toLowerCase();
  const allowed = {
    pending: "Pending",
    confirmed: "Confirmed",
    cancelled: "Cancelled",
    canceled: "Cancelled",
  };

  if (!allowed[normalized]) {
    return { ok: false, message: "Invalid status." };
  }

  const cancelReason = String(payload.cancelReason || "").trim();
  return { ok: true, value: { status: allowed[normalized], cancelReason } };
}

module.exports = {
  validateCreateVipBooking,
  validateUpdateVipBookingStatus,
};
