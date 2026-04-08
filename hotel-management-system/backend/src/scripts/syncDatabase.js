const { connectToDatabase } = require("../config/database");
const { UserModel } = require("../models/User");
const { LoyaltyRuleModel } = require("../models/LoyaltyRule");
const { PurchaseModel } = require("../models/Purchase");
const { OrderModel } = require("../models/Order");
const { CartItemModel } = require("../models/Cart");
const { DeliveryDetailsModel } = require("../models/DeliveryDetails");
const { readRules } = require("../modules/loyalty/loyaltyStore");

const MODELS = [
  { name: "users", model: UserModel },
  { name: "loyalty_rules", model: LoyaltyRuleModel },
  { name: "purchases", model: PurchaseModel },
  { name: "orders", model: OrderModel },
  { name: "cart_items", model: CartItemModel },
  { name: "delivery_details", model: DeliveryDetailsModel },
];

async function syncDatabase() {
  const connection = await connectToDatabase();
  const indexSummary = {};

  for (const entry of MODELS) {
    const indexes = await entry.model.syncIndexes();
    indexSummary[entry.name] = indexes;
  }

  const loyaltyRules = await readRules();
  const counts = {};

  for (const entry of MODELS) {
    counts[entry.name] = await entry.model.countDocuments();
  }

  return {
    database: connection.db.databaseName,
    indexSummary,
    counts,
    loyaltyRules: loyaltyRules.length,
  };
}

syncDatabase()
  .then((result) => {
    console.log(JSON.stringify({ success: true, ...result }, null, 2));
    process.exit(0);
  })
  .catch((error) => {
    console.error(
      JSON.stringify(
        {
          success: false,
          name: error.name,
          message: error.message,
        },
        null,
        2
      )
    );
    process.exit(1);
  });
