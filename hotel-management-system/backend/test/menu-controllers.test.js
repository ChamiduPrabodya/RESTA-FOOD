const assert = require("node:assert/strict");
const path = require("node:path");

function createRes() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

function loadWithStubs({ menuServiceStub, categoryServiceStub } = {}) {
  const menuServiceId = require.resolve(path.join(__dirname, "../src/modules/menu/menuService"));
  const menuControllerId = require.resolve(path.join(__dirname, "../src/modules/menu/menuController"));
  const categoryServiceId = require.resolve(path.join(__dirname, "../src/modules/menu/menuCategoryService"));
  const categoryControllerId = require.resolve(path.join(__dirname, "../src/modules/menu/menuCategoryController"));

  delete require.cache[menuControllerId];
  delete require.cache[menuServiceId];
  delete require.cache[categoryControllerId];
  delete require.cache[categoryServiceId];

  require.cache[menuServiceId] = {
    id: menuServiceId,
    filename: menuServiceId,
    loaded: true,
    exports: menuServiceStub || {
      getMenuItems: async () => [{ id: "m1", name: "X", nameLower: "x" }],
      saveMenuItems: async (items) => items,
    },
  };

  require.cache[categoryServiceId] = {
    id: categoryServiceId,
    filename: categoryServiceId,
    loaded: true,
    exports: categoryServiceStub || {
      getMenuCategories: async () => ["Rice"],
      saveMenuCategories: async (names) => names,
    },
  };

  // eslint-disable-next-line global-require
  const menuController = require(path.join(__dirname, "../src/modules/menu/menuController"));
  // eslint-disable-next-line global-require
  const categoryController = require(path.join(__dirname, "../src/modules/menu/menuCategoryController"));

  return {
    menuController,
    categoryController,
    cleanup: () => {
      delete require.cache[menuControllerId];
      delete require.cache[menuServiceId];
      delete require.cache[categoryControllerId];
      delete require.cache[categoryServiceId];
    },
  };
}

module.exports = [
  {
    name: "menuController: listMenuItemsController returns success true",
    fn: async () => {
      const { menuController, cleanup } = loadWithStubs();
      try {
        const res = createRes();
        await menuController.listMenuItemsController({}, res);
        assert.equal(res.statusCode, 200);
        assert.equal(res.body.success, true);
        assert.ok(Array.isArray(res.body.items));
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "menuController: replaceMenuItemsController validates items array",
    fn: async () => {
      const { menuController, cleanup } = loadWithStubs();
      try {
        const res = createRes();
        await menuController.replaceMenuItemsController({ body: {} }, res);
        assert.equal(res.statusCode, 400);
      } finally {
        cleanup();
      }
    },
  },
  {
    name: "menuCategoryController: replaceMenuCategoriesController validates categories array",
    fn: async () => {
      const { categoryController, cleanup } = loadWithStubs();
      try {
        const res = createRes();
        await categoryController.replaceMenuCategoriesController({ body: { categories: "Rice" } }, res);
        assert.equal(res.statusCode, 400);
      } finally {
        cleanup();
      }
    },
  },
];

