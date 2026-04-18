const { closeSession, getSessionForTable, startSession } = require("./sessionsService");

async function postStartSession(req, res) {
  const result = await startSession(req.body || {});
  return res.status(201).json({ success: true, ...result });
}

async function getSessionByTable(req, res) {
  const result = await getSessionForTable(req.params.tableId);
  return res.json({ success: true, ...result });
}

async function patchCloseSession(req, res) {
  const session = await closeSession(req.params.id);
  return res.json({ success: true, session });
}

module.exports = {
  getSessionByTable,
  patchCloseSession,
  postStartSession,
};

