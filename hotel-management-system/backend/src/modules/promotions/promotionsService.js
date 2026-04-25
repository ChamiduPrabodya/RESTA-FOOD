const crypto = require("node:crypto");

const { httpError } = require("../../shared/errors");
const {
  createPromotion,
  deletePromotionById,
  findPromotionById,
  listPromotions,
  updatePromotionById,
} = require("./promotionsStore");

function normalizeType(value) {
  return String(value || "").trim().toLowerCase() === "vip" ? "vip" : "food";
}

function normalizeDiscountType(value) {
  return String(value || "").trim().toLowerCase() === "fixed" ? "fixed" : "percentage";
}

function formatDiscountText({ discountType, discountValue }) {
  const value = Number(discountValue) || 0;
  if (discountType === "fixed") return `SLR ${Math.round(value).toLocaleString()} OFF`;
  return `${value}% OFF`;
}

function normalizePromotionPayload(input = {}, existing = {}) {
  const title = String(input.title ?? existing.title ?? "").trim();
  const description = String(input.description ?? existing.description ?? "").trim();
  const type = normalizeType(input.type ?? existing.type);
  const discountType = normalizeDiscountType(input.discountType ?? existing.discountType);
  const discountValue = Number(input.discountValue ?? existing.discountValue);
  const maxDiscount = Number(input.maxDiscount ?? existing.maxDiscount ?? 0);
  const minOrderValue = Number(input.minOrderValue ?? existing.minOrderValue ?? 0);
  const promoCode = String(input.promoCode ?? existing.promoCode ?? "").trim().toUpperCase();
  const startDate = String(input.startDate ?? existing.startDate ?? "").trim();
  const endDate = String(input.endDate ?? existing.endDate ?? "").trim();
  const imageUrl = String(input.imageUrl ?? existing.imageUrl ?? "").trim();
  const displayInHomeHeader =
    typeof input.displayInHomeHeader === "boolean"
      ? input.displayInHomeHeader
      : typeof existing.displayInHomeHeader === "boolean"
        ? existing.displayInHomeHeader
        : false;
  const active =
    typeof input.active === "boolean"
      ? input.active
      : typeof input.activateNow === "boolean"
        ? input.activateNow
        : typeof existing.active === "boolean"
          ? existing.active
          : true;

  if (!title) throw httpError(400, "title is required.");
  if (!description) throw httpError(400, "description is required.");
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    throw httpError(400, "discountValue must be greater than zero.");
  }
  if (!Number.isFinite(maxDiscount) || maxDiscount < 0) {
    throw httpError(400, "maxDiscount cannot be negative.");
  }
  if (!Number.isFinite(minOrderValue) || minOrderValue < 0) {
    throw httpError(400, "minOrderValue cannot be negative.");
  }
  if (!startDate) throw httpError(400, "startDate is required.");
  if (!endDate) throw httpError(400, "endDate is required.");
  if (new Date(endDate).getTime() < new Date(startDate).getTime()) {
    throw httpError(400, "endDate must be after startDate.");
  }

  return {
    type,
    title,
    description,
    discountType,
    discountValue,
    maxDiscount,
    minOrderValue,
    promoCode,
    startDate,
    endDate,
    imageUrl,
    displayInHomeHeader,
    discountText: formatDiscountText({ discountType, discountValue }),
    active,
  };
}

function normalizePromotionForRead(promotion = {}) {
  const discountType = normalizeDiscountType(promotion.discountType);
  const discountValue = Number(promotion.discountValue ?? promotion.discount ?? 0) || 0;
  return {
    ...promotion,
    id: String(promotion.id || "").trim(),
    type: normalizeType(promotion.type),
    title: String(promotion.title || "").trim(),
    description: String(promotion.description || "").trim(),
    discountType,
    discountValue,
    maxDiscount: Math.max(0, Number(promotion.maxDiscount || 0) || 0),
    minOrderValue: Math.max(0, Number(promotion.minOrderValue || 0) || 0),
    promoCode: String(promotion.promoCode || "").trim().toUpperCase(),
    startDate: String(promotion.startDate || "").trim(),
    endDate: String(promotion.endDate || "").trim(),
    imageUrl: String(promotion.imageUrl || "").trim(),
    displayInHomeHeader: Boolean(promotion.displayInHomeHeader),
    discountText: String(promotion.discountText || "").trim() || formatDiscountText({ discountType, discountValue }),
    active: typeof promotion.active === "boolean" ? promotion.active : true,
  };
}

async function getPromotions() {
  const promotions = await listPromotions();
  return promotions.map(normalizePromotionForRead);
}

async function addPromotion(input) {
  const now = new Date().toISOString();
  const normalized = normalizePromotionPayload(input);
  return createPromotion({
    id: crypto.randomUUID(),
    ...normalized,
    createdAt: now,
    updatedAt: now,
  });
}

async function editPromotion(id, input) {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) throw httpError(400, "Promotion id is required.");

  const existing = await findPromotionById(normalizedId);
  if (!existing) throw httpError(404, "Promotion not found.");

  const normalized = normalizePromotionPayload(input, existing);
  return updatePromotionById(normalizedId, {
    ...existing,
    ...normalized,
    updatedAt: new Date().toISOString(),
  });
}

async function removePromotion(id) {
  const normalizedId = String(id || "").trim();
  if (!normalizedId) throw httpError(400, "Promotion id is required.");
  const deleted = await deletePromotionById(normalizedId);
  if (!deleted) throw httpError(404, "Promotion not found.");
  return true;
}

module.exports = {
  addPromotion,
  editPromotion,
  getPromotions,
  normalizePromotionForRead,
  normalizePromotionPayload,
  removePromotion,
};
