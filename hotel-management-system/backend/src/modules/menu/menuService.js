const { listMenuItems, replaceMenuItems } = require("./menuStore");
const { replaceCategories } = require("./menuCategoryStore");

function normalizeIncomingMenuItems(items) {
  const now = new Date().toISOString();
  const list = Array.isArray(items) ? items : [];

  return list
    .map((item) => {
      const id = String(item && item.id ? item.id : "").trim();
      const name = String(item && item.name ? item.name : "").trim();
      if (!id || !name) return null;
      const nameLower = name.toLowerCase();

      const loyaltyPointsRaw =
        item && Object.prototype.hasOwnProperty.call(item, "loyaltyPoints") ? Number(item.loyaltyPoints) : undefined;
      const loyaltyPoints =
        loyaltyPointsRaw === undefined || loyaltyPointsRaw === null || !Number.isFinite(loyaltyPointsRaw)
          ? undefined
          : Math.max(0, Math.round(loyaltyPointsRaw));

      return {
        ...item,
        id,
        name,
        nameLower,
        category: String(item && item.category ? item.category : "").trim(),
        description: String(item && item.description ? item.description : "").trim(),
        portions: item && typeof item.portions === "object" && item.portions ? item.portions : {},
        image: String(item && item.image ? item.image : "").trim(),
        outOfStock: Boolean(item && item.outOfStock),
        loyaltyPoints,
        createdAt: String(item && item.createdAt ? item.createdAt : "").trim() || now,
        updatedAt: now,
      };
    })
    .filter(Boolean);
}

async function getMenuItems() {
  return listMenuItems();
}

async function saveMenuItems(items) {
  const normalized = normalizeIncomingMenuItems(items);
  await replaceMenuItems(normalized);
  const categories = [...new Set(normalized.map((item) => String(item.category || "").trim()).filter(Boolean))];
  await replaceCategories(categories);
  return normalized;
}

module.exports = {
  getMenuItems,
  saveMenuItems,
  normalizeIncomingMenuItems,
};
