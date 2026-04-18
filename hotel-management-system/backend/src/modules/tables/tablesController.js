const { createTable, deleteTable, getTableQr, listTables, updateTableStatus } = require("./tablesService");

async function getTables(_req, res) {
  return res.json({ success: true, tables: await listTables() });
}

async function postTable(req, res) {
  const table = await createTable(req.body || {});
  return res.status(201).json({ success: true, table });
}

async function getTableQrCode(req, res) {
  const qr = await getTableQr(req.params.id);
  return res.json({ success: true, qr });
}

async function patchTableStatus(req, res) {
  const table = await updateTableStatus(req.params.id, req.body || {});
  return res.json({ success: true, table });
}

async function removeTable(req, res) {
  const table = await deleteTable(req.params.id);
  return res.json({ success: true, table });
}

module.exports = {
  getTableQrCode,
  getTables,
  patchTableStatus,
  postTable,
  removeTable,
};

