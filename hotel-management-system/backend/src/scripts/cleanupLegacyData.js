const fs = require("node:fs/promises");
const path = require("node:path");

const DATA_DIR = path.join(__dirname, "../../.data");

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const shouldDelete = process.argv.includes("--delete") || process.argv.includes("--force");

  const present = await exists(DATA_DIR);
  if (!present) {
    // eslint-disable-next-line no-console
    console.log("Legacy folder not found:", DATA_DIR);
    return;
  }

  if (!shouldDelete) {
    // eslint-disable-next-line no-console
    console.log("Legacy folder exists (no longer used by backend):", DATA_DIR);
    // eslint-disable-next-line no-console
    console.log("To delete it, run: node src/scripts/cleanupLegacyData.js --delete");
    return;
  }

  // Safety: ensure we only delete the expected legacy directory under backend.
  const normalized = path.normalize(DATA_DIR);
  if (!normalized.endsWith(`${path.sep}.data`)) {
    throw new Error(`Refusing to delete unexpected path: ${normalized}`);
  }

  await fs.rm(DATA_DIR, { recursive: true, force: true });
  // eslint-disable-next-line no-console
  console.log("Deleted legacy folder:", DATA_DIR);
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Cleanup failed:", error && error.message ? error.message : error);
  process.exit(1);
});

