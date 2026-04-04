const { getMenuCategories, saveMenuCategories } = require("./menuCategoryService");

async function listMenuCategoriesController(_req, res) {
  const categories = await getMenuCategories();
  return res.json({ success: true, categories });
}

async function replaceMenuCategoriesController(req, res) {
  const body = req.body && typeof req.body === "object" ? req.body : {};
  const categories = body && Object.prototype.hasOwnProperty.call(body, "categories") ? body.categories : null;
  if (!Array.isArray(categories)) {
    return res.status(400).json({ success: false, message: "categories must be an array." });
  }

  const saved = await saveMenuCategories(categories);
  return res.json({ success: true, categories: saved });
}

module.exports = { listMenuCategoriesController, replaceMenuCategoriesController };

