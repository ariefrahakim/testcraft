import { appendFileSync, existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * Lists the regression modules, TDD and BDD alike, so CI never needs a
 * hand-maintained matrix (CLAUDE.md §5a / §13).
 *
 * A module is discovered from the repo:
 *   TDD → a directory under `tests/e2e/`          (`tests/e2e/<module>/`)
 *   BDD → a feature file under `features/`        (`features/<area>/<module>.feature`)
 *
 * …and included only when `package.json` has its `test:<module>` script — that
 * script is what knows whether to run `bddgen` first. A module found without a
 * script is reported as a warning and listed on stderr; it is never silently
 * dropped.
 *
 * Usage:
 *   npx tsx scripts/list-modules.ts            → JSON array on stdout
 *   npx tsx scripts/list-modules.ts --lines    → one module per line
 * In GitHub Actions it also appends `modules=<json>` to `$GITHUB_OUTPUT` and
 * emits `::notice::` / `::warning::` annotations.
 */
const root = process.cwd();
const inActions = Boolean(process.env.GITHUB_ACTIONS);

function readScripts(): Record<string, string> {
  const pkg = JSON.parse(
    readFileSync(resolve(root, "package.json"), "utf8"),
  ) as { scripts?: Record<string, string> };
  return pkg.scripts ?? {};
}

/** `tests/e2e/<module>/` → module names. */
function tddModules(): string[] {
  const dir = resolve(root, "tests/e2e");
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** `features/**\/<module>.feature` → module names (any nesting depth). */
function bddModules(dir = resolve(root, "features")): string[] {
  if (!existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = resolve(dir, entry.name);
    if (entry.isDirectory()) out.push(...bddModules(path));
    else if (entry.name.endsWith(".feature")) {
      out.push(entry.name.replace(/\.feature$/, ""));
    }
  }
  return out;
}

const scripts = readScripts();
const found = [...new Set([...tddModules(), ...bddModules()])].sort();
const runnable = found.filter((module) => scripts[`test:${module}`]);
const missing = found.filter((module) => !scripts[`test:${module}`]);

// `login` first so auth.setup is exercised against a clean session.
runnable.sort((a, b) =>
  a === "login" ? -1 : b === "login" ? 1 : a.localeCompare(b),
);

for (const module of missing) {
  const message = `Module "${module}" has no "test:${module}" script in package.json — NOT covered by the regression sweep.`;
  process.stderr.write(`${inActions ? "::warning::" : "WARNING: "}${message}\n`);
}

if (inActions) {
  process.stderr.write(
    `::notice::Regression modules: ${runnable.join(", ") || "(none)"}\n`,
  );
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `modules=${JSON.stringify(runnable)}\n`,
    );
  }
}

process.stdout.write(
  process.argv.includes("--lines")
    ? `${runnable.join("\n")}\n`
    : `${JSON.stringify(runnable)}\n`,
);
