const { addPromotion, editPromotion, getPromotions, removePromotion } = require("./promotionsService");

async function listPromotionsController(_req, res) {
  const promotions = await getPromotions();
  return res.json({ success: true, promotions });
}

async function createPromotionController(req, res) {
  const promotion = await addPromotion(req.body || {});
  return res.status(201).json({ success: true, promotion });
}

async function updatePromotionController(req, res) {
  const promotion = await editPromotion(req.params.id, req.body || {});
  return res.json({ success: true, promotion });
}

async function deletePromotionController(req, res) {
  await removePromotion(req.params.id);
  return res.json({ success: true });
}

module.exports = {
  createPromotionController,
  deletePromotionController,
  listPromotionsController,
  updatePromotionController,
};
