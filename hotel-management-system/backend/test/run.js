const fs = require("node:fs");
const path = require("node:path");

function listTestFiles() {
  const dir = __dirname;
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith(".test.js"))
    .map((name) => path.join(dir, name));
}

function loadTests(filePath) {
  // eslint-disable-next-line global-require, import/no-dynamic-require
  const exported = require(filePath);
  if (!Array.isArray(exported)) {
    throw new Error(`Test file must export an array of tests: ${path.basename(filePath)}`);
  }
  return exported.map((t) => ({
    file: path.basename(filePath),
    name: String(t && t.name ? t.name : "").trim(),
    fn: t && typeof t.fn === "function" ? t.fn : null,
  }));
}

async function main() {
  const startedAt = new Date();
  const files = listTestFiles();
  const tests = files.flatMap(loadTests).filter((t) => t.name && t.fn);

  let passed = 0;
  let failed = 0;
  const lines = [];
  lines.push(`Started: ${startedAt.toISOString()}`);
  lines.push(`Node: ${process.version}`);
  lines.push("");

  for (const t of tests) {
    try {
      // Support sync or async tests.
      // eslint-disable-next-line no-await-in-loop
      await t.fn();
      passed += 1;
      // eslint-disable-next-line no-console
      console.log(`PASS ${t.file} - ${t.name}`);
      lines.push(`PASS ${t.file} - ${t.name}`);
    } catch (error) {
      failed += 1;
      // eslint-disable-next-line no-console
      console.error(`FAIL ${t.file} - ${t.name}`);
      // eslint-disable-next-line no-console
      console.error(error && error.stack ? error.stack : error);
      lines.push(`FAIL ${t.file} - ${t.name}`);
      lines.push(String(error && error.stack ? error.stack : error));
      lines.push("");
    }
  }

  // eslint-disable-next-line no-console
  console.log(`\nSummary: ${passed} passed, ${failed} failed`);
  lines.push("");
  lines.push(`Summary: ${passed} passed, ${failed} failed`);

  const finishedAt = new Date();
  lines.push(`Finished: ${finishedAt.toISOString()}`);

  const outputPath = path.join(__dirname, "..", "test-results.txt");
  fs.writeFileSync(outputPath, `${lines.join("\n")}\n`, "utf8");
  // eslint-disable-next-line no-console
  console.log(`Wrote evidence: ${outputPath}`);

  const casesPath = path.join(__dirname, "..", "test-cases.txt");
  const caseLines = [];
  caseLines.push(`Generated: ${finishedAt.toISOString()}`);
  caseLines.push("");
  tests.forEach((t) => {
    caseLines.push(`${t.file} - ${t.name}`);
  });
  fs.writeFileSync(casesPath, `${caseLines.join("\n")}\n`, "utf8");
  // eslint-disable-next-line no-console
  console.log(`Wrote evidence: ${casesPath}`);
  process.exitCode = failed > 0 ? 1 : 0;
}

main().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Test runner failed:", error && error.stack ? error.stack : error);
  process.exit(1);
});
