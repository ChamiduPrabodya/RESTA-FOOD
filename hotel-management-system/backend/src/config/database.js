const mongoose = require("mongoose");

const { MONGODB_URI, MONGODB_DB_NAME } = require("./env");

async function connectToDatabase() {
  if (!MONGODB_URI) {
    throw new Error("Missing MONGODB_URI. Add your MongoDB connection string to backend/.env.");
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  await mongoose.connect(MONGODB_URI, {
    dbName: MONGODB_DB_NAME || undefined,
  });

  return mongoose.connection;
}

module.exports = { connectToDatabase };
