const mongoose = require("mongoose");

async function connectMongo(uri) {
  if (!String(uri || "").trim()) {
    throw new Error("MONGODB_URI is missing.");
  }

  mongoose.set("strictQuery", true);

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
  });

  return mongoose.connection;
}

module.exports = { connectMongo };

