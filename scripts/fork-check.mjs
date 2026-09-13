/**
 * Fails when this fork carries anything FORK.md says it removed — so an upstream merge that brings
 * telemetry, the cloud brain, agent wiring or an install-time script back cannot pass CI.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const REMOVED_PATHS = [
  "src/telemetry",
  "src/brain",
  "src/app",
  "src/hosts",
  "src/claude",
  "src/upkeep.ts",
  "src/upkeep-run.ts",
  "src/cli-picker.ts",
  "src/cli-epilogue.ts",
  "TELEMETRY.md",
  "Dockerfile",
  "scripts/postinstall.mjs",
  "scripts/stamp-telemetry-key.mjs",
  ".claude",
];

const FORBIDDEN_TEXT = [
  { pattern: /posthog/i, reason: "analytics client" },
  { pattern: /events\.nanonets\.com|agents\.nanonets\.com/i, reason: "hosted collector or brain endpoint" },
  { pattern: /@nanonets\/graft/, reason: "upstream package name" },
  { pattern: /dotenv/, reason: "loads the working directory's .env into every process" },
];

const INSTALL_SCRIPTS = ["preinstall", "install", "postinstall"];
const SCANNED_ROOTS = ["src", "scripts", "viewer", "test"];
const SCANNED_EXTENSIONS = [".ts", ".tsx", ".js", ".mjs", ".cjs", ".json"];
const SKIPPED_DIRS = new Set(["node_modules", "dist"]);
const SELF = relative(repoRoot, fileURLToPath(import.meta.url));

const violations = [];

for (const path of REMOVED_PATHS) {
  if (existsSync(join(repoRoot, path))) violations.push(`${path}: removed in this fork, but present`);
}

const pkg = JSON.parse(readFileSync(join(repoRoot, "package.json"), "utf8"));
if (pkg.name !== "@aylith/graft") violations.push(`package.json: name is "${pkg.name}", expected "@aylith/graft"`);
for (const script of INSTALL_SCRIPTS) {
  if (pkg.scripts?.[script] !== undefined) violations.push(`package.json: "${script}" script runs on install`);
}
if (pkg.scripts?.prepare !== "npm run build") {
  violations.push(`package.json: prepare is "${pkg.scripts?.prepare}", expected "npm run build"`);
}
for (const field of ["dependencies", "devDependencies", "optionalDependencies"]) {
  if (pkg[field]?.dotenv !== undefined) violations.push(`package.json: dotenv in ${field}`);
}

function walk(dir, files) {
  for (const entry of readdirSync(dir)) {
    if (SKIPPED_DIRS.has(entry)) continue;
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, files);
    else if (SCANNED_EXTENSIONS.some((extension) => entry.endsWith(extension))) files.push(full);
  }
  return files;
}

const files = SCANNED_ROOTS.filter((root) => existsSync(join(repoRoot, root))).flatMap((root) =>
  walk(join(repoRoot, root), []),
);
let scanned = 0;
for (const file of files) {
  const rel = relative(repoRoot, file);
  if (rel === SELF) continue;
  scanned++;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((line, index) => {
    for (const { pattern, reason } of FORBIDDEN_TEXT) {
      if (pattern.test(line)) violations.push(`${rel}:${index + 1}: ${reason} — ${line.trim().slice(0, 100)}`);
    }
  });
}

const REMOVED_DIST_DIRS = ["telemetry", "brain", "app", "hosts", "claude"];
for (const dir of REMOVED_DIST_DIRS) {
  if (existsSync(join(repoRoot, "dist", dir))) violations.push(`dist/${dir}: stale build output of a removed module — rebuild`);
}
for (const file of ["upkeep.js", "upkeep-run.js", "cli-picker.js", "cli-epilogue.js"]) {
  if (existsSync(join(repoRoot, "dist", file))) violations.push(`dist/${file}: stale build output of a removed module — rebuild`);
}

if (scanned === 0) {
  console.error("✗ fork-check scanned no files — the scan roots are wrong, so nothing was verified");
  process.exit(1);
}
if (violations.length > 0) {
  console.error(`✗ fork-check: ${violations.length} violation(s)`);
  for (const violation of violations) console.error(`  ${violation}`);
  process.exit(1);
}
console.log(`✓ fork-check: ${REMOVED_PATHS.length} removed paths absent, package clean, ${scanned} files scanned`);
