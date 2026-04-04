const express = require("express");

const { requireAuth } = require("../../shared/middlewares/requireAuth");
const { requireRole } = require("../../shared/middlewares/requireRole");
const { ROLES } = require("../../shared/constants/roles");
const { asyncHandler } = require("../../shared/middlewares/asyncHandler");

const { listMenuItemsController, replaceMenuItemsController } = require("./menuController");
const { listMenuCategoriesController, replaceMenuCategoriesController } = require("./menuCategoryController");

const menuRouter = express.Router();

// Public: frontend menu page uses this.
menuRouter.get("/items", asyncHandler(listMenuItemsController));
menuRouter.get("/categories", asyncHandler(listMenuCategoriesController));

// Admin: manage menu items server-side.
menuRouter.put("/items", requireAuth(), requireRole([ROLES.ADMIN]), asyncHandler(replaceMenuItemsController));
menuRouter.put("/categories", requireAuth(), requireRole([ROLES.ADMIN]), asyncHandler(replaceMenuCategoriesController));

module.exports = { menuRouter };
