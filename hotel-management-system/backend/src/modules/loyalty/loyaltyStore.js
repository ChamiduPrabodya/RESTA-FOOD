const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "../../../.data");
const RULES_FILE = path.join(DATA_DIR, "loyaltyRules.json");
const PURCHASES_FILE = path.join(DATA_DIR, "purchases.json");
const AUDIT_FILE = path.join(DATA_DIR, "loyaltyAudit.json");

const DEFAULT_RULES = [
  { id: "r1", threshold: "2000", discount: "1" },
  { id: "r2", threshold: "5000", discount: "3" },
  { id: "r3", threshold: "10000", discount: "5" },
];

async function ensureFile(filePath, initialValue) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(filePath);
  } catch {
    await fs.writeFile(filePath, JSON.stringify(initialValue, null, 2), "utf8");
  }
}

async function readJson(filePath, fallback) {
  await ensureFile(filePath, fallback);
  const raw = await fs.readFile(filePath, "utf8");
  try {
    return JSON.parse(raw || "{}");
  } catch {
    return fallback;
  }
}

async function writeJson(filePath, value) {
  await ensureFile(filePath, value);
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), "utf8");
}

async function readRules() {
  const parsed = await readJson(RULES_FILE, { rules: DEFAULT_RULES });
  return Array.isArray(parsed.rules) ? parsed.rules : [];
}

async function writeRules(rules) {
  await writeJson(RULES_FILE, { rules: Array.isArray(rules) ? rules : [] });
}

async function listPurchases() {
  const parsed = await readJson(PURCHASES_FILE, { purchases: [] });
  return Array.isArray(parsed.purchases) ? parsed.purchases : [];
}

async function appendPurchases(purchases) {
  const current = await listPurchases();
  const next = [...(Array.isArray(purchases) ? purchases : []), ...current];
  await writeJson(PURCHASES_FILE, { purchases: next });
  return next;
}

async function listAuditEntries() {
  const parsed = await readJson(AUDIT_FILE, { entries: [] });
  return Array.isArray(parsed.entries) ? parsed.entries : [];
}

async function appendAuditEntry(entry, { maxEntries = 2000 } = {}) {
  const current = await listAuditEntries();
  const next = [entry, ...current].slice(0, Math.max(1, Number(maxEntries) || 2000));
  await writeJson(AUDIT_FILE, { entries: next });
  return next;
}

module.exports = {
  readRules,
  writeRules,
  listPurchases,
  appendPurchases,
  listAuditEntries,
  appendAuditEntry,
};
