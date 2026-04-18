const crypto = require("node:crypto");

const { httpError } = require("../../shared/errors");
const { CLIENT_ORIGIN, PUBLIC_FRONTEND_ORIGIN } = require("../../config/env");
const { Table, TABLE_STATUSES } = require("../../models/Table");
const { TableSession } = require("../../models/TableSession");
const { hasActiveOrderForTable } = require("../orders/ordersStore");

const TABLE_STATUS_SET = new Set(TABLE_STATUSES);

function normalizeString(value) {
  return String(value || "").trim();
}

function escapeRegex(source) {
  return String(source || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolvePublicFrontendBaseUrl() {
  const base = String(PUBLIC_FRONTEND_ORIGIN || CLIENT_ORIGIN || "").trim();
  return base || "http://localhost:5173";
}

function buildTableMenuPath(tableId, qrToken) {
  const normalizedTableId = String(tableId || "").trim();
  const normalizedToken = String(qrToken || "").trim();
  const params = new URLSearchParams();
  if (normalizedTableId) params.set("tableId", normalizedTableId);
  if (normalizedToken) params.set("tableToken", normalizedToken);

  const baseUrl = resolvePublicFrontendBaseUrl();
  const url = new URL(baseUrl);
  url.hash = `#/menu?${params.toString()}`;
  return url.toString();
}

function patchTableMenuUrl(existingUrl, tableId, qrToken) {
  const fallback = buildTableMenuPath(tableId, qrToken);
  const raw = String(existingUrl || "").trim();
  if (!raw) return fallback;
  try {
    const url = new URL(raw);
    const params = new URLSearchParams();
    params.set("tableId", String(tableId || "").trim());
    params.set("tableToken", String(qrToken || "").trim());
    url.hash = `#/menu?${params.toString()}`;
    return url.toString();
  } catch {
    return fallback;
  }
}

function normalizeTable(table) {
  return {
    id: String(table.id || ""),
    label: String(table.label || "").trim(),
    capacity: Math.max(1, Number(table.capacity) || 1),
    location: String(table.location || "").trim(),
    status: TABLE_STATUS_SET.has(table.status) ? table.status : "available",
    qrUrl: String(table.qrUrl || buildTableMenuPath(table.id, table.qrToken)),
  };
}

function buildTableId(value) {
  return `table_${String(value).padStart(4, "0")}`;
}

async function ensureTableQr(table) {
  if (!table || !table.id) return table;
  const currentToken = String(table.qrToken || "").trim();
  const currentUrl = String(table.qrUrl || "").trim();

  const nextToken = currentToken || crypto.randomUUID();
  const nextUrl = buildTableMenuPath(table.id, nextToken);

  const shouldUpdate = nextToken !== currentToken || nextUrl !== currentUrl;
  if (shouldUpdate) {
    await Table.updateOne({ id: table.id }, { $set: { qrToken: nextToken, qrUrl: nextUrl } });
  }

  return { ...table, qrToken: nextToken, qrUrl: nextUrl };
}

async function getNextTableNumber() {
  const latest = await Table.findOne({ id: /^table_\d+$/ }).sort({ id: -1 }).lean();
  if (!latest || !latest.id) return 1;
  const match = String(latest.id).match(/(\d+)$/);
  return (match ? Number(match[1]) : 0) + 1;
}

async function listTables() {
  const tables = await Table.find({}).sort({ label: 1, id: 1 }).lean();
  const ensured = [];
  for (const row of tables) {
    // eslint-disable-next-line no-await-in-loop
    ensured.push(await ensureTableQr(row));
  }
  return ensured.map(normalizeTable);
}

async function getTableById(tableId) {
  return Table.findOne({ id: String(tableId || "").trim() }).lean();
}

async function requireTable(tableId) {
  const table = await getTableById(tableId);
  if (!table) {
    throw httpError(404, "Table not found.");
  }
  return ensureTableQr(table);
}

async function createTable(payload = {}) {
  const nextNumber = await getNextTableNumber();
  const label = normalizeString(payload.label) || `Table ${nextNumber}`;

  const duplicate = await Table.findOne({
    label: { $regex: `^${escapeRegex(label)}$`, $options: "i" },
  }).lean();
  if (duplicate) {
    throw httpError(409, "A table with this label already exists.");
  }

  const capacity = Math.max(1, Number(payload.capacity) || 1);
  const location = normalizeString(payload.location);
  const id = buildTableId(nextNumber);
  const qrToken = crypto.randomUUID();

  const table = await Table.create({
    id,
    label,
    capacity,
    location,
    status: "available",
    qrToken,
    qrUrl: buildTableMenuPath(id, qrToken),
  });

  return normalizeTable(table.toObject());
}

async function updateTableStatus(tableId, payload = {}) {
  const table = await requireTable(tableId);
  const nextStatus = normalizeString(payload.status).toLowerCase();
  if (!TABLE_STATUS_SET.has(nextStatus)) {
    throw httpError(400, "Invalid table status.");
  }
  await Table.updateOne({ id: table.id }, { $set: { status: nextStatus } });
  return normalizeTable({ ...table, status: nextStatus });
}

async function deleteTable(tableId) {
  const table = await requireTable(tableId);

  const hasActiveSession = await TableSession.exists({ tableId: table.id, status: "active" });
  if (hasActiveSession) {
    throw httpError(409, "Cannot delete a table with an active ordering session.");
  }

  if (await hasActiveOrderForTable(table.id)) {
    throw httpError(409, "Cannot delete a table with active orders.");
  }

  await Table.deleteOne({ id: table.id });
  return normalizeTable(table);
}

async function getTableQr(tableId) {
  const table = await requireTable(tableId);
  return {
    tableId: table.id,
    tableLabel: table.label,
    targetUrl: String(table.qrUrl || buildTableMenuPath(table.id, table.qrToken)),
  };
}

module.exports = {
  createTable,
  deleteTable,
  getTableById,
  getTableQr,
  listTables,
  requireTable,
  updateTableStatus,
};
