#!/usr/bin/env node
/**
 * qa-agent init — scaffold a QA-Agent repo from the plugin's templates.
 *
 *   node "$CLAUDE_PLUGIN_ROOT/scripts/init.mjs" \
 *     --app "Acme Portal" --region EU --url https://stage.acme.example \
 *     --qase ACME --style bdd --fe-repo git@github.com:acme/frontend.git \
 *     --fe-scan ./frontend/src --jira-base https://acme.atlassian.net \
 *     --jira-key QAA --jira-parent 1900 --jira-delivery ACM
 *
 *   node .../init.mjs --add-style tdd     # add the missing style to an existing repo
 *   node .../init.mjs --dry-run …         # print the plan, write nothing
 *
 * Plain Node ESM with zero dependencies on purpose: it runs in an empty
 * directory, before any `npm install`.
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

import { render } from "./lib/render.mjs";
import { FILES, DIRS, appliesTo } from "./lib/manifest.mjs";
import { FLOATING_DEVDEPS, pinnedDevDepsFor } from "./lib/versions.mjs";

const PLUGIN_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TEMPLATES = join(PLUGIN_ROOT, "templates");
const TARGET = process.cwd();
const PLUGIN_VERSION = JSON.parse(
  readFileSync(join(PLUGIN_ROOT, ".claude-plugin", "plugin.json"), "utf8"),
).version;

// ---------------------------------------------------------------------------
// Args
// ---------------------------------------------------------------------------

const FLAGS = {
  app: "APP_NAME",
  region: "REGION",
  url: "BASE_URL",
  "post-login": "POST_LOGIN_URL_PATTERN",
  // Neutral names are canonical; the qase/jira spellings stay as aliases so
  // existing invocations and docs keep working.
  "tms-project": "TMS_PROJECT",
  qase: "TMS_PROJECT",
  "tracker-base": "TRACKER_BASE_URL",
  "jira-base": "TRACKER_BASE_URL",
  "tracker-key": "TRACKER_PROJECT_KEY",
  "jira-key": "TRACKER_PROJECT_KEY",
  "tracker-parent": "TRACKER_PARENT_ID",
  "jira-parent": "TRACKER_PARENT_ID",
  "tracker-delivery": "TRACKER_DELIVERY_PROJECT",
  "jira-delivery": "TRACKER_DELIVERY_PROJECT",
  "azure-org": "AZURE_ORG_URL",
  "fe-repo": "FE_REPO_URL",
  "fe-branch": "FE_BRANCH",
  "fe-dir": "FE_DIR",
  "fe-scan": "FE_SCAN_ROOT",
  "plugin-repo": "PLUGIN_REPO",
};

function parseArgs(argv) {
  /** @type {Record<string,string>} */
  const vars = {};
  const opts = { style: "", stack: "", addStyle: "", dryRun: false, force: false, yes: false, placeholders: false };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) throw new Error(`unexpected argument: ${arg}`);
    const name = arg.slice(2);

    if (name === "dry-run") { opts.dryRun = true; continue; }
    if (name === "force") { opts.force = true; continue; }
    if (name === "yes") { opts.yes = true; continue; }
    if (name === "placeholders") { opts.placeholders = true; continue; }

    const value = argv[i + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`--${name} needs a value`);
    }
    i += 1;

    if (name === "style") { opts.style = value.toLowerCase(); continue; }
    if (name === "stack") { opts.stack = value.toLowerCase(); continue; }
    if (name === "add-style") { opts.addStyle = value.toLowerCase(); continue; }
    if (name in FLAGS) { vars[FLAGS[name]] = value; continue; }
    throw new Error(`unknown flag --${name}`);
  }
  return { vars, opts };
}

// ---------------------------------------------------------------------------
// Interactive fallback — only for values with no safe default
// ---------------------------------------------------------------------------

const QUESTIONS = [
  ["APP_NAME", "App under test (display name)", ""],
  ["REGION", "Region / environment label", "global"],
  ["BASE_URL", "Base URL of the app under test", ""],
  ["TMS_PROJECT", "Test-management project (Qase code, or Azure DevOps project)", ""],
  ["FE_REPO_URL", "Frontend source repo (git URL, for selector discovery)", ""],
  ["TRACKER_BASE_URL", "Tracker base URL (Jira tenant, or https://dev.azure.com/<org>)", ""],
  ["TRACKER_PARENT_ID", "Default defect parent (Jira issue number, or Azure work-item id)", ""],
];

function applyPlaceholders(vars, stack) {
  const defaults = {
    APP_NAME: "Placeholder App",
    BASE_URL: "https://staging.example.com",
    TMS_PROJECT: "PLACEHOLDER",
    // On the azure stack the FE is assumed to live in Azure Repos (auth via
    // AZURE_PAT / http.extraheader in utils/fe-repo-sync.ts). On jira the
    // default stays SSH to GitHub. Either can be overridden with --fe-repo.
    FE_REPO_URL: stack === "azure"
      ? "https://dev.azure.com/placeholder-org/PLACEHOLDER/_git/frontend"
      : "git@github.com:placeholder/frontend.git",
    TRACKER_BASE_URL: stack === "azure"
      ? "https://dev.azure.com/placeholder-org"
      : "https://placeholder.atlassian.net",
    TRACKER_PARENT_ID: "1",
  };
  for (const [key, value] of Object.entries(defaults)) {
    if (!vars[key]) vars[key] = value;
  }
}

async function prompt(vars, styleFromFlag, stackFromFlag) {
  const interactive = stdin.isTTY && stdout.isTTY;
  const missing = QUESTIONS.filter(([key]) => !vars[key]);
  const needStyle = !styleFromFlag;
  const needStack = !stackFromFlag;

  if (!interactive) {
    // A question with a fallback is not "missing" — apply it. Only values with
    // no safe default can stop a non-interactive run.
    for (const [key, , fallback] of missing) {
      if (fallback) vars[key] = fallback;
    }
    const names = missing.filter(([, , fallback]) => !fallback).map(([k]) => k);
    if (needStyle) names.push("STYLE");
    if (needStack) names.push("STACK");
    if (names.length) {
      throw new Error(
        `missing required value(s): ${names.join(", ")} — pass them as flags ` +
          `(no TTY available for prompting). Run with --help for the flag names.`,
      );
    }
    return { style: styleFromFlag, stack: stackFromFlag };
  }

  const rl = createInterface({ input: stdin, output: stdout });
  try {
    for (const [key, label, fallback] of missing) {
      const suffix = fallback ? ` [${fallback}]` : "";
      let answer = "";
      while (!answer) {
        answer = (await rl.question(`${label}${suffix}: `)).trim() || fallback;
        if (!answer) stdout.write("  (required)\n");
      }
      vars[key] = answer;
    }
    let stack = stackFromFlag;
    if (needStack) {
      stack = "";
      while (!["jira", "azure"].includes(stack)) {
        stack = (
          await rl.question("Tool stack — jira (Jira + Qase) | azure (Azure Boards + Qase) [jira]: ")
        ).trim().toLowerCase() || "jira";
        if (!["jira", "azure"].includes(stack)) {
          stdout.write("  (expected jira or azure)\n");
        }
      }
    }
    if (needStyle) {
      let answer = "";
      while (!["tdd", "bdd", "both"].includes(answer)) {
        answer = (
          await rl.question("Development style — tdd | bdd | both [bdd]: ")
        ).trim().toLowerCase() || "bdd";
        if (!["tdd", "bdd", "both"].includes(answer)) {
          stdout.write("  (expected tdd, bdd, or both)\n");
        }
      }
      return { style: answer, stack };
    }
    return { style: styleFromFlag, stack };
  } finally {
    rl.close();
  }
}

// ---------------------------------------------------------------------------
// Derived values
// ---------------------------------------------------------------------------

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** `git@github.com:acme/frontend.git` / `https://…/frontend.git` → `frontend` */
function repoName(url) {
  const tail = url.split(/[/:]/).pop() ?? "frontend";
  return tail.replace(/\.git$/, "") || "frontend";
}

function applyDefaults(vars, style, stack) {
  vars.APP_SLUG ??= slugify(vars.APP_NAME);
  vars.REGION ??= "global";
  vars.FE_BRANCH ??= "main";
  // No leading "./": FE_DIR is interpolated into .gitignore and the ESLint
  // ignore list, where "./x/" is not a valid pattern. As a relative path for
  // env.ts / fe-repo-sync it works the same either way.
  vars.FE_DIR = (vars.FE_DIR ?? repoName(vars.FE_REPO_URL)).replace(/^\.\//, "").replace(/\/+$/, "");
  // A single-app FE repo scans its own src/; a monorepo needs an explicit
  // --fe-scan pointing at the one app this platform tests (CLAUDE.md §3).
  vars.FE_SCAN_ROOT = (vars.FE_SCAN_ROOT ?? `${vars.FE_DIR}/src`).replace(/^\.\//, "").replace(/\/+$/, "");
  vars.POST_LOGIN_URL_PATTERN ??= "/dashboard";
  vars.PLUGIN_REPO ??= "hubexo/qa-agent-plugin";

  // --- stack-shaped defaults ----------------------------------------------
  // Azure uses one org URL for both Test Plans and Boards, and its "project
  // key" is the project name itself, so the tracker fields fall back to the
  // test-management ones rather than being asked for twice.
  if (stack === "azure") {
    vars.AZURE_ORG_URL ??= vars.TRACKER_BASE_URL ?? "";
    vars.TRACKER_BASE_URL ??= vars.AZURE_ORG_URL;
    vars.TRACKER_PROJECT_KEY ??= vars.TMS_PROJECT;
  } else {
    vars.AZURE_ORG_URL ??= "";
    vars.TRACKER_PROJECT_KEY ??= "";
  }
  vars.TRACKER_PARENT_ID ??= "";
  vars.TRACKER_DELIVERY_PROJECT ??= vars.TRACKER_PROJECT_KEY || vars.TMS_PROJECT;

  // Legacy placeholder names, still used by CLAUDE.md / app-profile / README.
  // Filled from the neutral ones so there is exactly one source of each value.
  vars.QASE_PROJECT = vars.TMS_PROJECT;
  vars.JIRA_BASE_URL = vars.TRACKER_BASE_URL;
  vars.JIRA_PROJECT_KEY = vars.TRACKER_PROJECT_KEY;
  vars.JIRA_PARENT_ISSUE_ID = vars.TRACKER_PARENT_ID;
  vars.JIRA_DELIVERY_PROJECT = vars.TRACKER_DELIVERY_PROJECT;

  vars.STACK = stack;
  vars.STACK_NOTES = stackNotes(stack);
  vars.STYLE = style;
  vars.INIT_DATE = new Date().toISOString().slice(0, 10);
  vars.STYLE_NOTES = styleNotes(style);
  vars.STYLE_RUN_NOTES = styleRunNotes(style);
  return vars;
}

function stackNotes(stack) {
  if (stack === "azure") {
    return [
      "- **Test management:** Qase (same as the `jira` stack). Cases, plans and",
      "  `steps_type` are read through `utils/tms.ts`; results upload via",
      "  `playwright-qase-reporter`; `utils/qase-automation-reporter.ts` flips",
      "  passed cases to Automated (§7).",
      "- **Issue tracker:** Azure Boards. `Product Backlog Item (PBI) → Task` —",
      "  `[TM-…]` / `[TA-…]` / `[FE-…]` / `[BE-…]` prefixes ride on Task work items",
      "  under a PBI (a PBI plays the role a Jira Story plays on the other stack).",
      "  Children come from a WIQL link query and comments are HTML.",
      "- **Source hosting:** Azure Repos over HTTPS. `utils/fe-repo-sync.ts`",
      "  clones/pulls the FE repo using `AZURE_PAT` via `http.extraheader` —",
      "  the PAT never lands in the remote URL, git config, or reflog. Push",
      "  this QA repo the same way (see `docs/RUNBOOK.md §7.2 — Pushing this QA repo to Azure Repos`).",
      "  PAT scopes: **Work Items (Read & Write)** for Boards, **Code (Read)**",
      "  for FE clone, **Code (Read & Write)** if this QA repo is also in Azure Repos.",
      "- **CI:** `azure-pipelines.yml` only — the GitHub-Actions workflow is not",
      "  shipped on the azure stack.",
      "- **Run-log target:** Azure Wiki (env-driven). `utils/run-log-to-azure-wiki.ts`",
      "  reads `AZURE_WIKI_AGENT_LOGGER` in `.env` and writes one child page per",
      "  agent under that parent (matches the per-agent layout Confluence uses on",
      "  the jira stack). Trigger via `npm run run-log:sync` after each",
      "  `qa-agent-run` — replaces the Confluence path from",
      "  `hubexo-spec-sprint:run-logger-sync` on this stack.",
    ].join("\n");
  }
  return [
    "- **Test management:** Qase. Cases, plans and `steps_type` are read through",
    "  `utils/tms.ts`; results upload via `playwright-qase-reporter`.",
    "- **Issue tracker:** Jira. Children resolve by `parent = X OR \"Epic Link\" = X`",
    "  and comments are ADF.",
    "- **CI:** `.github/workflows/regression.yml`.",
  ].join("\n");
}

function styleNotes(style) {
  const tdd = [
    "- **TDD (classic)** — Qase cases with `steps_type: \"classic\"`. qa-codegen",
    "  emits `tests/e2e/<area>/<module>.spec.ts`: one `test()` per case, one",
    "  `test.step()` per Qase step row, `qase.id(<id>)` as the first line.",
    "- Entry point layers: `Spec → Step → Page → Locator`.",
    "- Runner project: `chromium`. Fixtures: `shared/test-fixtures.ts`.",
  ].join("\n");
  const bdd = [
    "- **BDD (Gherkin)** — Qase cases with `steps_type: \"gherkin\"`. qa-codegen",
    "  mirrors the plan into `features/<area>/<module>.feature` and emits the",
    "  matching `steps/<area>/<module>.steps.ts`; `playwright-bdd` compiles them",
    "  into `.features-gen/` (gitignored).",
    "- Entry point layers: `Feature → Step → Page → Locator`.",
    "- Runner project: `bdd`. Fixtures: `shared/bdd/fixtures.ts`.",
    "- The feature file is **mirrored from Qase, never hand-authored** —",
    "  `npm run qase:feature-sync -- plan:<id> --module <m>`.",
  ].join("\n");

  if (style === "tdd") return tdd;
  if (style === "bdd") return bdd;
  return `${tdd}\n${bdd}\n\nBoth layers are present; the case's \`steps_type\` in Qase decides which one a given case is generated into.`;
}

function styleRunNotes(style) {
  if (style === "tdd") return "";
  return [
    "BDD scenarios compile through `bddgen` before they run:",
    "",
    "```bash",
    "npm run bddgen            # regenerate .features-gen/ from features/ + steps/",
    "npm run test:bdd          # bddgen + run every feature",
    "```",
  ].join("\n");
}

// ---------------------------------------------------------------------------
// package.json
// ---------------------------------------------------------------------------

/** The npm scripts a single style contributes. */
function styleScripts(style) {
  if (style === "tdd") {
    return {
      "test:headed": "playwright test --project=chromium --headed",
      "test:debug": "PWDEBUG=1 playwright test --project=chromium",
      "test:login": "playwright test --project=chromium tests/e2e/login",
    };
  }
  return {
    bddgen: "bddgen",
    "test:bdd": "npm run bddgen && playwright test --project=bdd",
    "test:bdd:headed": "npm run bddgen && playwright test --project=bdd --headed",
    "test:bdd:cycle":
      'npm run bddgen && RUN_ID=$(npx tsx utils/qase-helper.ts create-run "BDD features — auto" | tail -1) && CYCLE_KEY=$RUN_ID npx playwright test --project=bdd',
  };
}

/**
 * The devDependencies a single style contributes. The pinned versions live in
 * `scripts/lib/versions.mjs` so `/qa-agent:upgrade` can sync existing repos to
 * the same values — this function only expresses which style pulls which pin.
 */
function styleDeps(style) {
  if (style !== "bdd") return {};
  const { "playwright-bdd": version } = pinnedDevDepsFor(["bdd"], "jira");
  return { "playwright-bdd": version };
}

/**
 * `--add-style` path: merge the new style's scripts and deps into the existing
 * package.json. Done here rather than left as a manual step, because a forgotten
 * `test:bdd` script silently drops the module from the CI regression matrix —
 * `scripts/list-modules.ts` keeps only modules that have one.
 */
function patchPackageJson(style, opts, log) {
  const file = join(TARGET, "package.json");
  if (!existsSync(file)) {
    log.push(["skip", "package.json", "not found — nothing to patch"]);
    return;
  }
  const pkg = JSON.parse(readFileSync(file, "utf8"));
  const added = [];

  for (const [name, cmd] of Object.entries(styleScripts(style))) {
    if (!pkg.scripts?.[name]) {
      pkg.scripts = { ...pkg.scripts, [name]: cmd };
      added.push(name);
    }
  }
  for (const [name, range] of Object.entries(styleDeps(style))) {
    if (!pkg.devDependencies?.[name]) {
      pkg.devDependencies = sortKeys({ ...pkg.devDependencies, [name]: range });
      added.push(name);
    }
  }

  if (!added.length) {
    log.push(["skip", "package.json", `already has the ${style} scripts`]);
    return;
  }
  pkg.scripts = sortKeys(pkg.scripts);
  if (!opts.dryRun) writeFileSync(file, `${JSON.stringify(pkg, null, 2)}\n`);
  log.push(["overwrite", "package.json", `+ ${added.join(", ")}`]);
}

function buildPackageJson(vars, styles, stack) {
  const scripts = {
    test: "playwright test",
    "test:ui": "playwright test --ui",
    report: "playwright show-report",
    typecheck: "tsc --noEmit",
    lint: "eslint .",
    "lint:fix": "eslint . --fix",
    modules: "tsx scripts/list-modules.ts",
    "install:browsers": "playwright install --with-deps chromium",
    "fe:sync": "npx tsx utils/fe-repo-sync.ts",
    // Post-step verifier: assert the current runId has a complete row for each
    // expected agent in logs/run-log.jsonl. Stack-agnostic — the JSONL layout
    // is identical on jira and azure; only the sync target differs.
    "run-log:check": "npx tsx utils/run-log-check.ts",
  };

  // Qase is TMS on both stacks (§7), so both stacks route through the same CLI.
  // The `tms:*` and `qase:*` aliases exist so agents / runbook / muscle memory
  // keep working regardless of which name a caller reaches for.
  const tmsCli = "tsx utils/qase-helper.ts";
  Object.assign(scripts, {
    "tms:create-run": `${tmsCli} create-run`,
    "tms:plan-style": `${tmsCli} plan-style`,
    "tms:feature-sync": `${tmsCli} feature-sync`,
    // Legacy aliases so existing docs and muscle memory keep working.
    "qase:create-run": `${tmsCli} create-run`,
    "qase:plan-style": `${tmsCli} plan-style`,
    "qase:feature-sync": `${tmsCli} feature-sync`,
  });
  if (stack === "azure") {
    scripts["tms:complete-run"] = `${tmsCli} complete-run`;
    // Per-agent run-log pages under an Azure Wiki parent (env-driven target):
    // Confluence sync via `hubexo-spec-sprint:run-logger-sync` doesn't read
    // `AZURE_WIKI_AGENT_LOGGER`, so azure-stack repos ship their own syncer.
    // Trigger it after every `qa-agent-run` (and at the end of the
    // orchestrator) — one child page per agent under the parent, matching the
    // Confluence per-agent layout.
    scripts["run-log:sync"] = "npx tsx utils/run-log-to-azure-wiki.ts";
  }

  for (const style of styles) Object.assign(scripts, styleScripts(style));

  // Graphify is optional tooling (an AST code-navigation accelerator). The
  // scripts are wired up front so a team that installs it needs no edit; they
  // simply fail with "command not found" until it is installed.
  Object.assign(scripts, {
    "graph:qa": "graphify update . --no-cluster",
    "graph:fe": `graphify update ${vars.FE_SCAN_ROOT} --no-cluster`,
    "graph:all": "npm run graph:qa && npm run graph:fe",
  });

  // Floating (caret) tooling deps + pinned deps for this (styles, stack) tuple.
  // Both maps live in scripts/lib/versions.mjs so /qa-agent:upgrade sees the
  // same values on every rollout.
  const devDependencies = {
    ...FLOATING_DEVDEPS,
    ...pinnedDevDepsFor([...styles], stack),
  };

  return {
    name: `qa-playwright-${vars.APP_SLUG}`,
    version: "0.1.0",
    private: true,
    description: `QA-Agent: autonomous spec-driven Playwright test platform for ${vars.APP_NAME} (Qase + Jira + Claude Code).`,
    type: "module",
    scripts: sortKeys(scripts),
    devDependencies: sortKeys(devDependencies),
    engines: { node: ">=20" },
  };
}

function sortKeys(obj) {
  return Object.fromEntries(Object.entries(obj).sort(([a], [b]) => a.localeCompare(b)));
}

// ---------------------------------------------------------------------------
// Writing
// ---------------------------------------------------------------------------

function write(relPath, content, { dryRun, force }, writtenLog) {
  const dest = join(TARGET, relPath);
  const exists = existsSync(dest);
  if (exists && !force) {
    writtenLog.push(["skip", relPath, "exists (use --force to overwrite)"]);
    return;
  }
  if (!dryRun) {
    mkdirSync(dirname(dest), { recursive: true });
    writeFileSync(dest, content);
  }
  writtenLog.push([exists ? "overwrite" : "create", relPath, ""]);
}

function readTemplate(src) {
  return readFileSync(join(TEMPLATES, src), "utf8");
}

// ---------------------------------------------------------------------------
// Modes
// ---------------------------------------------------------------------------

/**
 * `.claude/qa-agent.json` records only what `.env` cannot: the development
 * style and the app's identity. `--add-style` and `/qa-agent:upgrade` re-render
 * from it.
 *
 * Deliberately NOT stored here: the Qase project code, the Jira project/parent
 * ids, the host, the FE paths. Those live in `.env` and are read through
 * `shared/env.ts` — duplicating them into a second file is how the two drift
 * apart, with no signal about which one is authoritative. init receives them as
 * flags so it can write `.env.example` and `app-profile.md`, then forgets them.
 */
const RECORD_PATH = ".claude/qa-agent.json";

function readRecord() {
  const file = join(TARGET, RECORD_PATH);
  if (!existsSync(file)) return null;
  return JSON.parse(readFileSync(file, "utf8"));
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    stdout.write(HELP);
    return;
  }

  const { vars, opts } = parseArgs(argv);

  // ---- add-style mode: extend an existing repo --------------------------
  if (opts.addStyle) {
    const record = readRecord();
    if (!record) {
      throw new Error(
        `--add-style needs an already-initialised repo (${RECORD_PATH} not found). Run the plain init first.`,
      );
    }
    const current = record.style;
    if (current === "both" || current === opts.addStyle) {
      stdout.write(`Nothing to do: this repo is already style "${current}".\n`);
      return;
    }
    if (!["tdd", "bdd"].includes(opts.addStyle)) {
      throw new Error(`--add-style expects tdd or bdd, got "${opts.addStyle}"`);
    }
    stdout.write(
      [
        `Adding "${opts.addStyle}" to a "${current}" repo.`,
        "",
        "This rewrites the two style-conditional PLUGIN-owned files:",
        "  playwright.config.ts   (adds the missing runner project)",
        "  eslint.config.js       (adds the missing lint layer)",
        `and creates shared/${opts.addStyle === "bdd" ? "bdd/fixtures.ts" : "test-fixtures.ts"} plus the style's folders.`,
        "It also merges the style's npm scripts into package.json.",
        "",
      ].join("\n"),
    );
    // Fall through with both styles active and force enabled for the two
    // config files only — handled below via `styles`/`onlyStyleFiles`.
    // The files add-style rewrites (the two configs and the style's fixture)
    // carry no app placeholders — they read `.env` at run time — so the style
    // is all the render needs.
    return runScaffold({
      vars: {
        STYLE: "both",
        STYLE_NOTES: styleNotes("both"),
        STYLE_RUN_NOTES: styleRunNotes("both"),
        INIT_DATE: new Date().toISOString().slice(0, 10),
        APP_NAME: record.app?.name ?? "",
        APP_SLUG: record.app?.slug ?? "",
        REGION: record.app?.region ?? "",
        PLUGIN_REPO: record.pluginRepo ?? "hubexo/qa-agent-plugin",
      },
      styles: new Set(["tdd", "bdd"]),
      stack: record.stack ?? "jira",
      opts: { ...opts, force: true },
      onlyStyleFiles: true,
      addStyle: opts.addStyle,
    });
  }

  // ---- fresh init --------------------------------------------------------
  let style = opts.style;
  if (style && !["tdd", "bdd", "both"].includes(style)) {
    throw new Error(`--style expects tdd, bdd, or both, got "${style}"`);
  }
  if (opts.stack && !["jira", "azure"].includes(opts.stack)) {
    throw new Error(`--stack expects jira or azure, got "${opts.stack}"`);
  }
  // On Azure the tracker and the test-management system are the same org URL,
  // so --azure-org answers the tracker question too. Back-filled before
  // prompting so the run does not stop to ask for a value it already has.
  if (vars.AZURE_ORG_URL && !vars.TRACKER_BASE_URL) {
    vars.TRACKER_BASE_URL = vars.AZURE_ORG_URL;
  }
  if (opts.placeholders) {
    const effectiveStack = opts.stack || "jira";
    applyPlaceholders(vars, effectiveStack);
    if (!style) style = "bdd";
    if (!opts.stack) opts.stack = effectiveStack;
  }
  const answers = opts.placeholders
    ? { style, stack: opts.stack }
    : await prompt(vars, style, opts.stack);
  style = answers.style;
  const stack = answers.stack;

  if (stack === "azure" && !vars.AZURE_ORG_URL && !vars.TRACKER_BASE_URL) {
    throw new Error(
      "the azure stack needs --azure-org https://dev.azure.com/<org> (or --tracker-base with the same value)",
    );
  }

  const nonEmpty = existsSync(TARGET) && readdirSync(TARGET).filter((f) => f !== ".git").length > 0;
  if (nonEmpty && !opts.force && !opts.dryRun) {
    stdout.write(
      `Note: ${TARGET} is not empty. Existing files are SKIPPED, not overwritten (pass --force to replace).\n\n`,
    );
  }

  const styles = new Set(style === "both" ? ["tdd", "bdd"] : [style]);
  return runScaffold({
    vars: applyDefaults(vars, style, stack),
    styles,
    stack,
    opts,
  });
}

function runScaffold({ vars, styles, stack, opts, onlyStyleFiles = false, addStyle = "" }) {
  /** @type {[string,string,string][]} */
  const log = [];

  for (const entry of FILES) {
    if (!appliesTo(entry, styles, stack)) continue;
    if (onlyStyleFiles) {
      const isStyleFile =
        entry.dest === "playwright.config.ts" ||
        entry.dest === "eslint.config.js" ||
        (entry.styles && entry.styles.includes(addStyle));
      if (!isStyleFile) continue;
    }
    const rendered = render(readTemplate(entry.src), vars, new Set([...styles, stack]), entry.dest);
    write(entry.dest, rendered, { dryRun: opts.dryRun, force: opts.force }, log);
  }

  if (!onlyStyleFiles) {
    const pkg = buildPackageJson(vars, styles, stack);
    write("package.json", `${JSON.stringify(pkg, null, 2)}\n`, opts, log);
  }

  // The record is rewritten on every run (force), including --add-style, so it
  // always reflects the repo's current style and placeholder values.
  const previous = readRecord();
  const record = {
    plugin: "qa-agent",
    pluginVersion: PLUGIN_VERSION,
    scaffoldedAt: previous?.scaffoldedAt ?? vars.INIT_DATE,
    scaffoldedWith: previous?.scaffoldedWith ?? PLUGIN_VERSION,
    lastUpgradedAt: previous?.lastUpgradedAt ?? null,
    style: styles.size === 2 ? "both" : [...styles][0],
    stack,
    app: {
      name: vars.APP_NAME,
      slug: vars.APP_SLUG,
      region: vars.REGION,
    },
    pluginRepo: vars.PLUGIN_REPO,
  };
  write(
    RECORD_PATH,
    `${JSON.stringify(record, null, 2)}\n`,
    { dryRun: opts.dryRun, force: true },
    log,
  );

  if (onlyStyleFiles) patchPackageJson(addStyle, opts, log);

  const dirs = [...DIRS.all, ...[...styles].flatMap((s) => DIRS[s] ?? [])];
  for (const dir of dirs) {
    write(join(dir, ".gitkeep"), "", { dryRun: opts.dryRun, force: false }, log);
  }

  // ---- report -----------------------------------------------------------
  const width = Math.max(...log.map(([, p]) => p.length));
  for (const [action, path, note] of log) {
    const mark = action === "skip" ? "·" : action === "overwrite" ? "↻" : "+";
    stdout.write(`  ${mark} ${path.padEnd(width)} ${note}\n`);
  }
  const created = log.filter(([a]) => a !== "skip").length;
  stdout.write(
    `\n${opts.dryRun ? "DRY RUN — nothing written. " : ""}${created} file(s), ${log.length - created} skipped.\n`,
  );

  if (!onlyStyleFiles && !opts.dryRun) {
    stdout.write(
      [
        "",
        "Next:",
        "  1. cp .env.example .env   → fill USER_ID / USER_PWD / API_TOKEN / ATLASSIAN_TOKEN",
        "  2. npm install && npm run install:browsers",
        "  3. npm run fe:sync        → clone the FE source used for selector discovery",
        "  4. npm run typecheck && npm run lint",
        "  5. Open .claude/app-profile.md and fill in the TODO rows.",
        "",
      ].join("\n"),
    );
  }
  if (onlyStyleFiles && !opts.dryRun) {
    stdout.write(
      [
        "",
        `Style "${addStyle}" added. Remaining manual step:`,
        "  - flip the `Development style` row in .claude/app-profile.md to `both`",
        ...(addStyle === "bdd" ? ["  - run `npm install` to pull in playwright-bdd"] : []),
        "",
      ].join("\n"),
    );
  }
}

const HELP = `qa-agent init — scaffold a QA-Agent repo.

Usage: node "$CLAUDE_PLUGIN_ROOT/scripts/init.mjs" [flags]

Required (prompted for if a TTY is available):
  --app <name>            App under test, display name
  --url <url>             Base URL of the app under test
  --qase <CODE>           Qase project code
  --fe-repo <git-url>     Frontend source repo (selector discovery)
  --jira-base <url>       Jira tenant URL
  --jira-key <KEY>        Jira project key owning the defect parent
  --jira-parent <n>       Jira default parent issue number
  --style <tdd|bdd|both>  Development style

Optional:
  --region <label>        Region/environment label            (default: global)
  --post-login <regex>    URL pattern after a successful login (default: /dashboard)
  --fe-branch <branch>    FE branch to track                   (default: main)
  --fe-dir <path>         FE checkout root        (default: ./<repo-name>)
  --fe-scan <path>        FE subtree to scan      (default: <fe-dir>/src)
  --jira-delivery <KEY>   Delivery project for [FE-]/[BE-] prefixes
  --plugin-repo <o/r>     Plugin repo slug used in the README link

Modes:
  --add-style <tdd|bdd>   Add the missing style to an initialised repo
  --placeholders          Fill any missing required value with a safe placeholder
                          (non-interactive; edit .env afterwards)
  --dry-run               Print the plan, write nothing
  --force                 Overwrite files that already exist
`;

main().catch((error) => {
  process.stderr.write(`\n✗ ${error.message}\n`);
  process.exitCode = 1;
});
