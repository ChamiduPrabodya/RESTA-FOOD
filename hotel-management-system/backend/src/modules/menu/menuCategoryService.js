const { listCategories, replaceCategories } = require("./menuCategoryStore");

function normalizeCategoryNames(names) {
  const list = (Array.isArray(names) ? names : [])
    .map((name) => String(name || "").trim())
    .filter(Boolean);
  return [...new Set(list)];
}

async function getMenuCategories() {
  const rows = await listCategories();
  return rows.map((row) => row.name);
}

async function saveMenuCategories(names) {
  const normalized = normalizeCategoryNames(names);
  await replaceCategories(normalized);
  return normalized;
}

module.exports = { normalizeCategoryNames, getMenuCategories, saveMenuCategories };

