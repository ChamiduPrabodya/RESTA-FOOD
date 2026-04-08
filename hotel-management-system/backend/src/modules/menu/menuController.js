const { getMenuItems, saveMenuItems } = require("./menuService");

async function listMenuItemsController(_req, res) {
  const items = await getMenuItems();
  return res.json({ success: true, items });
}

async function replaceMenuItemsController(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const items = body && Object.prototype.hasOwnProperty.call(body, "items") ? body.items : null;
  if (!Array.isArray(items)) {
    return res.status(400).json({ success: false, message: "items must be an array." });
  }

  const saved = await saveMenuItems(items);
  return res.json({ success: true, items: saved });
}

module.exports = { listMenuItemsController, replaceMenuItemsController };

