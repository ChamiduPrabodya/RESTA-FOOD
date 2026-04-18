const { applyPayhereNotification } = require("./payhereService");

async function payhereNotify(req, res) {
  const result = await applyPayhereNotification(req.body);
  // PayHere expects a 200 OK response on success.
  if (!result) return res.status(200).send("OK");
  return res.status(200).send("OK");
}

module.exports = { payhereNotify };

