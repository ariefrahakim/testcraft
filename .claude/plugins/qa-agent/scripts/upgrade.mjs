#!/usr/bin/env node
/**
 * qa-agent upgrade — refresh the framework files this repo gets from the plugin.
 *
 *   node "$CLAUDE_PLUGIN_ROOT/scripts/upgrade.mjs"            # dry run (default)
 *   node "$CLAUDE_PLUGIN_ROOT/scripts/upgrade.mjs" --apply    # write
 *
 * This replaces the old sibling-checkout sync (`SRC=/path/to/other-repo
 * scripts/sync-framework.sh`): the source is the installed plugin, so
 * upgrading is `/plugin update` followed by this command — no second clone.
 *
 * Only `owner: "plugin"` entries in scripts/lib/manifest.mjs are written.
 * Everything the team owns — .env, app-profile, memories, shared/env.ts,
 * shared/auth.setup.ts, shared/pom-fixtures.ts, pages/, locators/, tests/,
 * features/, steps/, fixtures/ — is never touched.
 *
 * `package.json` gets a narrow, surgical sync: the plugin owns the *pinned*
 * devDependency versions (Playwright, playwright-qase-reporter, playwright-bdd)
 * so every team runs the same browser build + reporter contract. Caret-ranged
 * tooling (`typescript`, `eslint`, `tsx`, `@types/node`, …) is deliberately
 * left alone — teams may bump those locally without triggering a diff.
 *
 * Dry run is the default on purpose: these files are the contract the agents
 * obey, and a silent overwrite of a locally patched one is how a team loses a
 * fix without noticing.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { stdout, stderr } from "node:process";

import { render } from "./lib/render.mjs";
import { FILES, appliesTo } from "./lib/manifest.mjs";
import { pinnedDevDepsFor } from "./lib/versions.mjs";

const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES = join(PLUGIN_ROOT, "templates");
const TARGET = process.cwd();
const RECORD_PATH = ".claude/qa-agent.json";
const PKG_PATH = "package.json";

const PLUGIN_VERSION = JSON.parse(
  readFileSync(join(PLUGIN_ROOT, ".claude-plugin", "plugin.json"), "utf8"),
).version;

const APPLY = process.argv.includes("--apply");

function main() {
  const recordFile = join(TARGET, RECORD_PATH);
  if (!existsSync(recordFile)) {
    throw new Error(
      `${RECORD_PATH} not found — this directory was not scaffolded by /qa-agent:setup, so there is nothing to upgrade.`,
    );
  }
  const record = JSON.parse(readFileSync(recordFile, "utf8"));
  const styles = new Set(record.style === "both" ? ["tdd", "bdd"] : [record.style]);
  // Repos scaffolded before the stack axis existed are all Jira/Qase.
  const stack = record.stack ?? "jira";
  // Plugin-owned templates carry no app values — the Qase project code, Jira
  // ids, host and FE paths are all read from `.env` at run time. So the style
  // is the only thing the render needs, and an upgrade can never overwrite a
  // repo's configuration with values captured at scaffold time.
  const vars = { STYLE: record.style, STACK: stack };

  const changed = [];
  const same = [];

  for (const entry of FILES) {
    if (entry.owner !== "plugin") continue;
    if (!appliesTo(entry, styles, stack)) continue;

    const rendered = render(
      readFileSync(join(TEMPLATES, entry.src), "utf8"),
      vars,
      new Set([...styles, stack]),
      entry.dest,
    );
    const dest = join(TARGET, entry.dest);
    const current = existsSync(dest) ? readFileSync(dest, "utf8") : null;

    if (current === rendered) {
      same.push(entry.dest);
      continue;
    }
    changed.push([entry.dest, current === null ? "new" : "differs"]);
    if (APPLY) {
      mkdirSync(dirname(dest), { recursive: true });
      writeFileSync(dest, rendered);
    }
  }

  // ---------------------------------------------------------------------------
  // package.json — narrow sync of pinned devDependencies only
  // ---------------------------------------------------------------------------
  const depDiffs = diffPinnedDeps(styles, stack);
  if (depDiffs.length) {
    for (const [name, from, to] of depDiffs) {
      changed.push([`${PKG_PATH} → devDependencies.${name}`, `${from ?? "missing"} → ${to}`]);
    }
    if (APPLY) applyPinnedDeps(depDiffs);
  }

  // ---------------------------------------------------------------------------
  // .claude/qa-agent.json — refresh pluginVersion + lastUpgradedAt
  // ---------------------------------------------------------------------------
  const recordChanges = [];
  if (record.pluginVersion !== PLUGIN_VERSION) {
    recordChanges.push(["pluginVersion", record.pluginVersion ?? "unset", PLUGIN_VERSION]);
  }
  if (recordChanges.length || (APPLY && depDiffs.length)) {
    if (APPLY) writeRecord(record);
    for (const [field, from, to] of recordChanges) {
      changed.push([`${RECORD_PATH} → ${field}`, `${from} → ${to}`]);
    }
  }

  stdout.write(`▸ plugin:      ${PLUGIN_ROOT} (v${PLUGIN_VERSION})\n`);
  stdout.write(`▸ destination: ${TARGET}\n`);
  stdout.write(`▸ style:       ${record.style}\n`);
  stdout.write(`▸ stack:       ${stack}\n`);
  stdout.write(
    `▸ repo was on: ${record.pluginVersion ?? "<pre-versioning>"}` +
      (record.pluginVersion === PLUGIN_VERSION ? " (already current)" : "") +
      "\n",
  );
  stdout.write(`▸ mode:        ${APPLY ? "APPLY" : "DRY-RUN (use --apply to write)"}\n\n`);

  if (!changed.length) {
    stdout.write(`Everything is up to date (${same.length} file(s) unchanged).\n`);
    return;
  }
  for (const [path, why] of changed) {
    stdout.write(`  ${APPLY ? "↻" : "≠"} ${path}  (${why})\n`);
  }
  stdout.write(
    `\n${changed.length} change(s) ${APPLY ? "applied" : "would apply"}, ${same.length} file(s) unchanged.\n`,
  );
  if (!APPLY) {
    stdout.write(
      "\nReview the diff, then re-run with --apply. If a file differs because\n" +
        "this repo patched it locally, move the patch into a repo-owned file\n" +
        "instead — plugin-owned files are overwritten wholesale. If a pinned\n" +
        "devDependency was intentionally overridden, revert it in package.json\n" +
        "so the plugin owns the version everywhere.\n",
    );
  }
  if (APPLY && depDiffs.length) {
    stdout.write(
      "\nRun `npm install` and `npm run install:browsers` next — the pinned\n" +
        "Playwright version drives which Chromium build gets downloaded.\n",
    );
  }
}

/**
 * Compare the repo's package.json devDependencies to the pins this plugin
 * ships. Returns `[[name, current, target], …]`, only for entries that need
 * to change — including entries missing from package.json altogether.
 */
function diffPinnedDeps(styles, stack) {
  const pkgFile = join(TARGET, PKG_PATH);
  if (!existsSync(pkgFile)) return [];
  const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
  const current = pkg.devDependencies ?? {};
  const target = pinnedDevDepsFor([...styles], stack);
  const diffs = [];
  for (const [name, wanted] of Object.entries(target)) {
    if (current[name] !== wanted) diffs.push([name, current[name] ?? null, wanted]);
  }
  return diffs;
}

/**
 * Write the pinned deps back into package.json, sorting devDependencies
 * alphabetically to match init.mjs's layout. Other fields (scripts,
 * dependencies, floating devDeps like eslint/typescript, engines) are untouched.
 */
function applyPinnedDeps(diffs) {
  const pkgFile = join(TARGET, PKG_PATH);
  const pkg = JSON.parse(readFileSync(pkgFile, "utf8"));
  pkg.devDependencies = pkg.devDependencies ?? {};
  for (const [name, , wanted] of diffs) pkg.devDependencies[name] = wanted;
  pkg.devDependencies = Object.fromEntries(
    Object.entries(pkg.devDependencies).sort(([a], [b]) => a.localeCompare(b)),
  );
  writeFileSync(pkgFile, `${JSON.stringify(pkg, null, 2)}\n`);
}

function writeRecord(record) {
  const next = {
    ...record,
    pluginVersion: PLUGIN_VERSION,
    lastUpgradedAt: new Date().toISOString().slice(0, 10),
  };
  writeFileSync(join(TARGET, RECORD_PATH), `${JSON.stringify(next, null, 2)}\n`);
}

try {
  main();
} catch (error) {
  stderr.write(`\n✗ ${error.message}\n`);
  process.exitCode = 1;
}
