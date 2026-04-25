const { httpError } = require("../../shared/errors");
const { TableSession } = require("../../models/TableSession");
const { Table } = require("../../models/Table");
const { requireTable } = require("../tables/tablesService");

const MAX_DINE_IN_GUESTS = 6;

function nowIso() {
  return new Date().toISOString();
}

function mapSession(session) {
  return {
    id: String(session.id || ""),
    tableId: String(session.tableId || ""),
    guestCount: Math.max(1, Math.min(MAX_DINE_IN_GUESTS, Math.round(Number(session.guestCount) || 1))),
    status: ["active", "closed", "expired"].includes(session.status) ? session.status : "active",
    createdAt: String(session.createdAt || nowIso()),
  };
}

function normalizeGuestCount(value) {
  const count = Math.round(Number(value));
  if (!Number.isFinite(count) || count < 1) {
    throw httpError(400, "guestCount must be at least 1.");
  }
  if (count > MAX_DINE_IN_GUESTS) {
    throw httpError(400, `guestCount cannot be more than ${MAX_DINE_IN_GUESTS}.`);
  }
  return count;
}

async function getNextSessionId() {
  const latest = await TableSession.findOne({ id: /^session_\d+$/ }).sort({ id: -1 }).lean();
  if (!latest || !latest.id) return "session_0001";
  const match = String(latest.id).match(/(\d+)$/);
  const nextValue = (match ? Number(match[1]) : 0) + 1;
  return `session_${String(nextValue).padStart(4, "0")}`;
}

async function getSessionById(sessionId) {
  return TableSession.findOne({ id: String(sessionId || "").trim() }).lean();
}

async function getActiveSessionByTableId(tableId) {
  return TableSession.findOne({ tableId: String(tableId || "").trim(), status: "active" }).lean();
}

async function startSession(payload = {}) {
  const tableId = String(payload.tableId || "").trim();
  const tableToken = String(payload.tableToken || "").trim();
  const guestCount = normalizeGuestCount(payload.guestCount);
  if (!tableId) {
    throw httpError(400, "tableId is required.");
  }

  const table = await requireTable(tableId);
  const expectedToken = String(table.qrToken || "").trim();
  if (expectedToken && tableToken !== expectedToken) {
    throw httpError(401, "Invalid table token.");
  }

  const existing = await getActiveSessionByTableId(table.id);
  if (existing) {
    throw httpError(409, `${table.label} is already in use. Please ask staff to close the current table session.`);
  }

  const { hasActiveOrderForTable } = require("../orders/ordersStore");
  if (await hasActiveOrderForTable(table.id)) {
    throw httpError(
      409,
      `${table.label} already has an active dine-in order. New sessions are blocked until it is completed.`
    );
  }

  if (table.status === "unavailable" || table.status === "cleaning" || table.status === "reserved") {
    throw httpError(409, `${table.label} is currently ${table.status}.`);
  }

  const session = await TableSession.create({
    id: await getNextSessionId(),
    tableId: table.id,
    guestCount,
    status: "active",
    createdAt: nowIso(),
  });

  await Table.updateOne({ id: table.id }, { $set: { status: "occupied" } });

  return {
    tableId: table.id,
    tableLabel: table.label,
    session: mapSession(session.toObject()),
    reused: false,
    message: `Session started for ${table.label}.`,
  };
}

async function getSessionForTable(tableId) {
  const table = await requireTable(tableId);
  const session = await getActiveSessionByTableId(table.id);
  return {
    tableId: table.id,
    tableLabel: table.label,
    session: session ? mapSession(session) : null,
  };
}

async function closeSession(sessionId) {
  const session = await getSessionById(sessionId);
  if (!session) {
    throw httpError(404, "Session not found.");
  }
  if (session.status !== "active") {
    return mapSession(session);
  }

  await TableSession.updateOne({ id: session.id }, { $set: { status: "closed" } });
  await Table.updateOne({ id: session.tableId }, { $set: { status: "available" } });
  return mapSession({ ...session, status: "closed" });
}

module.exports = {
  closeSession,
  getActiveSessionByTableId,
  getSessionById,
  getSessionForTable,
  MAX_DINE_IN_GUESTS,
  startSession,
};
