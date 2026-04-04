const assert = require("node:assert/strict");

const { normalizeIncomingMenuItems } = require("../src/modules/menu/menuService");
const { normalizeCategoryNames } = require("../src/modules/menu/menuCategoryService");

module.exports = [
  {
    name: "normalizeIncomingMenuItems: drops items without id/name",
    fn: () => {
      const out = normalizeIncomingMenuItems([{ id: "", name: "x" }, { id: "a", name: "" }]);
      assert.equal(out.length, 0);
    },
  },
  {
    name: "normalizeIncomingMenuItems: adds nameLower and normalizes loyaltyPoints",
    fn: () => {
      const out = normalizeIncomingMenuItems([
        { id: "m1", name: "Cheese Kottu", loyaltyPoints: "12.4", outOfStock: "truthy", portions: null },
      ]);
      assert.equal(out.length, 1);
      assert.equal(out[0].nameLower, "cheese kottu");
      assert.equal(out[0].loyaltyPoints, 12);
      assert.equal(out[0].outOfStock, true);
      assert.deepEqual(out[0].portions, {});
      assert.ok(out[0].updatedAt);
    },
  },
  {
    name: "normalizeCategoryNames: trims and dedupes",
    fn: () => {
      const out = normalizeCategoryNames(["  Rice ", "Rice", "", "  ", "Kottu"]);
      assert.deepEqual(out, ["Rice", "Kottu"]);
    },
  },
];

