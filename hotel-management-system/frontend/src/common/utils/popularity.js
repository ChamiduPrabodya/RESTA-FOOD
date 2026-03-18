const normalizeOrderStatus = (status) => String(status || "").trim().toLowerCase();

const isCancelledOrder = (status) => normalizeOrderStatus(status) === "cancelled";

const normalizeNameKey = (name) => String(name || "").trim().toLowerCase();

export const buildPurchaseCounts = (purchases) => {
  const countsByMenuItemId = new Map();
  const countsByItemName = new Map();

  (Array.isArray(purchases) ? purchases : []).forEach((purchase) => {
    if (!purchase || isCancelledOrder(purchase.status)) return;
    const qty = Math.max(0, Math.round(Number(purchase.quantity) || 1));
    if (!qty) return;

    const menuItemId = String(purchase.menuItemId || "").trim();
    if (menuItemId) {
      countsByMenuItemId.set(menuItemId, (countsByMenuItemId.get(menuItemId) || 0) + qty);
    }

    const nameKey = normalizeNameKey(purchase.itemName);
    if (nameKey) {
      countsByItemName.set(nameKey, (countsByItemName.get(nameKey) || 0) + qty);
    }
  });

  return { countsByMenuItemId, countsByItemName };
};

export const getMenuItemPurchasedCount = (menuItem, counts) => {
  if (!menuItem) return 0;
  const countsByMenuItemId = counts?.countsByMenuItemId;
  const countsByItemName = counts?.countsByItemName;
  if (!countsByMenuItemId || !countsByItemName) return 0;

  const id = String(menuItem.id || "").trim();
  if (id && countsByMenuItemId.has(id)) return countsByMenuItemId.get(id) || 0;

  const nameKey = normalizeNameKey(menuItem.name);
  if (nameKey && countsByItemName.has(nameKey)) return countsByItemName.get(nameKey) || 0;

  return 0;
};

export const getMostBoughtMenuItems = ({
  menuItems,
  purchases,
  limit = 3,
  excludeOutOfStock = true,
} = {}) => {
  const sourceItems = Array.isArray(menuItems) ? menuItems : [];
  const availableItems = excludeOutOfStock ? sourceItems.filter((item) => !item?.outOfStock) : sourceItems;
  const safeLimit = Math.max(1, Math.round(Number(limit) || 3));

  const counts = buildPurchaseCounts(purchases);
  const ranked = availableItems
    .map((item) => ({ item, sold: getMenuItemPurchasedCount(item, counts) }))
    .sort((a, b) => {
      if (b.sold !== a.sold) return b.sold - a.sold;
      return String(a.item?.name || "").localeCompare(String(b.item?.name || ""));
    });

  const hasAnySales = ranked.some((entry) => entry.sold > 0);
  const base = hasAnySales ? ranked : availableItems.map((item) => ({ item, sold: 0 }));

  return base.slice(0, safeLimit).map((entry) => ({ ...entry.item, soldCount: entry.sold }));
};

