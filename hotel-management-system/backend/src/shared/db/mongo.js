const mongoose = require("mongoose");

const { MONGODB_URI, MONGODB_DB_NAME } = require("../../config/env");

let connectPromise = null;

function getDbNameFromUri(uri) {
  const value = String(uri || "").trim();
  if (!value) return "";
  try {
    const parsed = new URL(value);
    const pathname = String(parsed.pathname || "");
    const dbName = pathname.startsWith("/") ? pathname.slice(1) : pathname;
    return decodeURIComponent(dbName || "").trim();
  } catch {
    return "";
  }
}

async function connectMongo() {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) return connectPromise;

  const uri = String(MONGODB_URI || "").trim();
  if (!uri) {
    throw new Error("Missing MONGODB_URI. Set it in backend/.env (MongoDB Atlas connection string).");
  }

  const uriDbName = getDbNameFromUri(uri);
  const fallbackDbName = String(MONGODB_DB_NAME || "").trim();
  const dbName = uriDbName || fallbackDbName;

  if (!dbName) {
    throw new Error("MongoDB database name missing. Add a db name to MONGODB_URI (…mongodb.net/<dbName>) or set MONGODB_DB_NAME.");
  }

  connectPromise = mongoose
    .connect(uri, {
      dbName: uriDbName ? undefined : dbName,
      autoIndex: true,
      serverSelectionTimeoutMS: 10_000,
    })
    .then(() => mongoose.connection)
    .finally(() => {
      connectPromise = null;
    });

  return connectPromise;
}

module.exports = { connectMongo };

