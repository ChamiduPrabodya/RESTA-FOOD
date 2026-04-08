const { sanitizeUser } = require("../../models/User");
const { listUsers } = require("../auth/authStore");

async function listAllUsers(_req, res) {
  const users = await listUsers();
  return res.json({ success: true, users: users.map(sanitizeUser) });
}

module.exports = { listAllUsers };

