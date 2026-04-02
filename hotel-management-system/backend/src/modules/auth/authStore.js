const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "../../../.data");
const USERS_FILE = path.join(DATA_DIR, "users.json");

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(USERS_FILE);
  } catch {
    await fs.writeFile(USERS_FILE, JSON.stringify({ users: [] }, null, 2), "utf8");
  }
}

async function readUsers() {
  await ensureStore();
  const raw = await fs.readFile(USERS_FILE, "utf8");
  const parsed = JSON.parse(raw || "{}");
  const users = Array.isArray(parsed.users) ? parsed.users : [];
  return users;
}

async function listUsers() {
  return readUsers();
}

async function writeUsers(users) {
  await ensureStore();
  await fs.writeFile(USERS_FILE, JSON.stringify({ users }, null, 2), "utf8");
}

async function findUserByEmail(email) {
  const users = await readUsers();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  return users.find((user) => String(user.email || "").trim().toLowerCase() === normalizedEmail) || null;
}

async function addUser(user) {
  const users = await readUsers();
  users.push(user);
  await writeUsers(users);
  return user;
}

async function updateUserByEmail(email, updater) {
  const users = await readUsers();
  const normalizedEmail = String(email || "").trim().toLowerCase();
  const nextUsers = users.map((user) => {
    if (String(user.email || "").trim().toLowerCase() !== normalizedEmail) return user;
    return updater(user);
  });
  await writeUsers(nextUsers);
}

module.exports = {
  addUser,
  findUserByEmail,
  listUsers,
  updateUserByEmail,
};
