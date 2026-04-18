const mongoose = require("mongoose");
const dns = require("node:dns");

const { MONGODB_URI, MONGODB_URI_FALLBACK, MONGODB_DB_NAME, MONGODB_DNS_SERVERS } = require("../../config/env");

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

function parseCsv(value) {
  return String(value || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function redactMongoUri(uri) {
  return String(uri || "").replace(/(mongodb(?:\+srv)?:\/\/)([^@/]+@)/i, "$1<redacted>@");
}

function buildHelpfulMongoError(error, { uri }) {
  const safeUri = redactMongoUri(uri);
  const baseMessage = `MongoDB connection failed for ${safeUri}.`;

  const isSrvUri = String(uri || "")
    .trim()
    .toLowerCase()
    .startsWith("mongodb+srv://");
  const isSrvLookupError = error && (error.syscall === "querySrv" || error.syscall === "queryTxt");
  const isCommonDnsError = error && (error.code === "ECONNREFUSED" || error.code === "ENOTFOUND" || error.code === "ETIMEOUT");

  if (isSrvUri && isSrvLookupError && isCommonDnsError) {
    const hint = [
      baseMessage,
      "DNS SRV lookup failed (mongodb+srv requires SRV records).",
      "Fix options:",
      "- Set MONGODB_DNS_SERVERS=1.1.1.1,8.8.8.8 in backend/.env (bypass a broken/blocked DNS resolver).",
      "- Or use a non-SRV Atlas URI (starts with mongodb://...) as MONGODB_URI (or put it in MONGODB_URI_FALLBACK).",
      "- Or point MONGODB_URI to a local MongoDB instance (e.g. mongodb://127.0.0.1:27017/<db>).",
    ].join("\n");

    const next = new Error(hint);
    next.cause = error;
    return next;
  }

  const rawMessage = error && error.message ? error.message : String(error);
  const isAtlasNetworkAccessHint =
    /Could not connect to any servers in your MongoDB Atlas cluster/i.test(rawMessage) ||
    /IP that isn'?t whitelisted/i.test(rawMessage) ||
    /whitelist/i.test(rawMessage);

  if (isAtlasNetworkAccessHint) {
    const hint = [
      baseMessage,
      rawMessage,
      "",
      "Atlas checklist:",
      "- In MongoDB Atlas, go to Network Access -> IP Access List and add your current public IP (or 0.0.0.0/0 for dev only).",
      "- Ensure the cluster is running (not paused).",
      "- If you're on a restricted network, outbound traffic to MongoDB ports may be blocked; try another network (hotspot/VPN) or use local MongoDB.",
    ].join("\n");
    const next = new Error(hint);
    next.cause = error;
    return next;
  }

  const next = new Error(`${baseMessage} ${rawMessage}`);
  next.cause = error;
  return next;
}

async function connectMongo() {
  if (mongoose.connection && mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (connectPromise) return connectPromise;

  const primaryUri = String(MONGODB_URI || "").trim();
  const fallbackUri = String(MONGODB_URI_FALLBACK || "").trim();
  if (!primaryUri && !fallbackUri) {
    throw new Error("Missing MONGODB_URI. Set it in backend/.env (MongoDB connection string).");
  }

  const fallbackDbName = String(MONGODB_DB_NAME || "").trim();
  const uris = [primaryUri, fallbackUri].filter(Boolean);

  const dnsServers = parseCsv(MONGODB_DNS_SERVERS);
  if (dnsServers.length > 0) {
    dns.setServers(dnsServers);
  }

  connectPromise = (async () => {
    let lastError = null;

    for (const uri of uris) {
      const uriDbName = getDbNameFromUri(uri);
      const dbName = uriDbName || fallbackDbName;

      if (!dbName) {
        throw new Error("MongoDB database name missing. Add a db name to MONGODB_URI (...mongodb.net/<dbName>) or set MONGODB_DB_NAME.");
      }

      try {
        await mongoose.connect(uri, {
          dbName: uriDbName ? undefined : dbName,
          autoIndex: true,
          serverSelectionTimeoutMS: 10_000,
        });
        return mongoose.connection;
      } catch (error) {
        lastError = error;
        try {
          await mongoose.disconnect();
        } catch {
          // ignore
        }
      }
    }

    throw buildHelpfulMongoError(lastError, { uri: uris[0] || "" });
  })().finally(() => {
    connectPromise = null;
  });

  return connectPromise;
}

module.exports = { connectMongo };
