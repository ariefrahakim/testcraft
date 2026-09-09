/**
 * The single declaration of what the plugin puts in a scaffolded repo, and who
 * owns each file afterwards. `init.mjs` writes everything here; `upgrade.mjs`
 * rewrites only the `plugin`-owned entries.
 *
 *   owner: "plugin" — the format engine. Guaranteed identical in every repo the
 *                     plugin scaffolds, so generated code, defect comments and
 *                     Qase/Jira payloads come out in the same shape everywhere.
 *                     `/qa-agent:upgrade` OVERWRITES these. Never hand-edit.
 *   owner: "repo"   — a seed. Written once at init, then owned by the team:
 *                     app credentials, the login POM, app-profile, memories.
 *                     `/qa-agent:upgrade` never touches these.
 *
 * `styles` restricts an entry to the listed development styles (tdd/bdd) and
 * `stacks` to the listed tool stacks (jira/azure); omitted means every one gets
 * it. The two axes are independent: a repo is one stack times one style set.
 */

/** @typedef {{src: string, dest: string, owner: "plugin"|"repo", styles?: string[], stacks?: string[]}} Entry */

/** @type {Entry[]} */
export const FILES = [
  // --- the contract + shape enforcers -------------------------------------
  { src: "base/CLAUDE.md", dest: "CLAUDE.md", owner: "plugin" },
  { src: "base/eslint.config.js", dest: "eslint.config.js", owner: "plugin" },
  { src: "base/tsconfig.json", dest: "tsconfig.json", owner: "plugin" },
  { src: "base/playwright.config.ts", dest: "playwright.config.ts", owner: "plugin" },
  { src: "base/.github/workflows/regression.yml", dest: ".github/workflows/regression.yml", owner: "plugin", stacks: ["jira"] },

  // --- format engine: Qase / Jira / logging / selectors --------------------
  { src: "base/utils/tms-types.ts", dest: "utils/tms-types.ts", owner: "plugin" },
  { src: "base/utils/tracker-types.ts", dest: "utils/tracker-types.ts", owner: "plugin" },
  { src: "base/utils/gherkin.ts", dest: "utils/gherkin.ts", owner: "plugin" },
  { src: "base/utils/logger.ts", dest: "utils/logger.ts", owner: "plugin" },
  { src: "base/utils/selector-helper.ts", dest: "utils/selector-helper.ts", owner: "plugin" },
  { src: "base/utils/date-helper.ts", dest: "utils/date-helper.ts", owner: "plugin" },
  { src: "base/utils/fe-repo-sync.ts", dest: "utils/fe-repo-sync.ts", owner: "plugin" },
  { src: "base/utils/orchestrator-dashboard.ts", dest: "utils/orchestrator-dashboard.ts", owner: "plugin" },
  { src: "base/utils/orchestrator-resolve-epic.ts", dest: "utils/orchestrator-resolve-epic.ts", owner: "plugin" },
  { src: "base/scripts/list-modules.ts", dest: "scripts/list-modules.ts", owner: "plugin" },
  { src: "base/scripts/post-run-summary.ts", dest: "scripts/post-run-summary.ts", owner: "plugin" },
  { src: "base/scripts/triage-regression.ts", dest: "scripts/triage-regression.ts", owner: "plugin" },

  // --- generic test wiring (no app coupling) -------------------------------
  { src: "base/shared/custom-expect.ts", dest: "shared/custom-expect.ts", owner: "plugin" },
  { src: "base/shared/global.setup.ts", dest: "shared/global.setup.ts", owner: "plugin" },
  // hooks.ts is opt-in lifecycle sugar for classic specs — it extends the TDD
  // `test` object, so it only ships with that style. The BDD flow gets the
  // same breadcrumb from an `After` hook in shared/bdd/fixtures.ts.
  { src: "base/shared/hooks.ts", dest: "shared/hooks.ts", owner: "plugin", styles: ["tdd"] },
  { src: "base/shared/session.ts", dest: "shared/session.ts", owner: "plugin" },
  { src: "base/shared/viewport.ts", dest: "shared/viewport.ts", owner: "plugin" },

  // --- stack layers: test management + issue tracker -----------------------
  // Only the chosen stack's provider modules are written, so a repo never
  // carries a helper for a system it does not use. Both stacks expose the same
  // two gateways — utils/tms.ts and utils/tracker.ts — which is what keeps the
  // agents and qa-codegen free of `if (stack === …)`.
  // Test management is Qase on BOTH stacks. The only per-stack piece is the
  // tracker (Jira issue keys vs Azure Boards work-item ids) and its bindings
  // to work-item hierarchy. `qase-helper` + `qase-automation-reporter` +
  // `qase:feature-sync` ship to every repo — the automation-status flip on
  // passed cases (§7) is stack-agnostic. Azure Test Plans is deprecated for
  // this platform; use Qase in ONE place and route defects via Boards
  // (`[PBI]` → `[TA]`) or Jira (`[Epic]` / `[Story]` → `[TA]`) as per
  // `.claude/app-profile.md`.
  { src: "base/utils/qase-helper.ts", dest: "utils/qase-helper.ts", owner: "plugin" },
  { src: "base/utils/qase-automation-reporter.ts", dest: "utils/qase-automation-reporter.ts", owner: "plugin" },

  { src: "stack-jira/tms.ts", dest: "utils/tms.ts", owner: "plugin", stacks: ["jira"] },
  { src: "stack-jira/tracker.ts", dest: "utils/tracker.ts", owner: "plugin", stacks: ["jira"] },
  { src: "base/utils/jira-helper.ts", dest: "utils/jira-helper.ts", owner: "plugin", stacks: ["jira"] },

  { src: "stack-azure/tms.ts", dest: "utils/tms.ts", owner: "plugin", stacks: ["azure"] },
  { src: "stack-azure/tracker.ts", dest: "utils/tracker.ts", owner: "plugin", stacks: ["azure"] },
  { src: "stack-azure/azure-client.ts", dest: "utils/azure-client.ts", owner: "plugin", stacks: ["azure"] },
  { src: "stack-azure/azure-boards-helper.ts", dest: "utils/azure-boards-helper.ts", owner: "plugin", stacks: ["azure"] },
  { src: "stack-azure/modules-to-azure-matrix.ts", dest: "scripts/modules-to-azure-matrix.ts", owner: "plugin", stacks: ["azure"] },
  { src: "stack-azure/azure-pipelines.yml", dest: "azure-pipelines.yml", owner: "plugin", stacks: ["azure"] },
  { src: "stack-azure/run-log-to-azure-wiki.ts", dest: "utils/run-log-to-azure-wiki.ts", owner: "plugin", stacks: ["azure"] },
  { src: "base/utils/run-log-check.ts", dest: "utils/run-log-check.ts", owner: "plugin" },

  // --- style layers --------------------------------------------------------
  { src: "tdd/test-fixtures.ts", dest: "shared/test-fixtures.ts", owner: "plugin", styles: ["tdd"] },
  { src: "bdd/bdd-fixtures.ts", dest: "shared/bdd/fixtures.ts", owner: "plugin", styles: ["bdd"] },

  // --- seeds: owned by the repo from here on -------------------------------
  { src: "base/shared/env.ts", dest: "shared/env.ts", owner: "repo" },
  { src: "base/shared/auth.setup.ts", dest: "shared/auth.setup.ts", owner: "repo" },
  { src: "base/shared/pom-fixtures.ts", dest: "shared/pom-fixtures.ts", owner: "repo" },
  { src: "base/pages/login/login.page.ts", dest: "pages/login/login.page.ts", owner: "repo" },
  { src: "base/locators/login/login.locator.ts", dest: "locators/login/login.locator.ts", owner: "repo" },
  { src: "base/.claude/app-profile.md", dest: ".claude/app-profile.md", owner: "repo" },
  { src: "base/.claude/memories/page-map.md", dest: ".claude/memories/page-map.md", owner: "repo" },
  { src: "base/.claude/memories/component-map.md", dest: ".claude/memories/component-map.md", owner: "repo" },
  { src: "base/.claude/memories/selector-history.md", dest: ".claude/memories/selector-history.md", owner: "repo" },
  { src: "base/.claude/memories/known-issues.md", dest: ".claude/memories/known-issues.md", owner: "repo" },
  { src: "base/.claude/memories/self-healing.md", dest: ".claude/memories/self-healing.md", owner: "repo" },
  { src: "base/env.example.tpl", dest: ".env.example", owner: "repo" },
  { src: "base/README.md.tpl", dest: "README.md", owner: "repo" },
  { src: "base/gitignore.tpl", dest: ".gitignore", owner: "repo" },
  { src: "base/mcp.json.tpl", dest: ".mcp.json", owner: "repo" },
];

/** Directories created empty (with a .gitkeep) so the layout is visible in git.
 *
 * Layer belongs to the style it serves:
 *   - `tests/`   → TDD entry point       (Spec → Step → Page → Locator)
 *   - `steps/`   → shared business layer (used by BOTH styles; scaffolded whenever BDD is active)
 *   - `features/`→ BDD entry point       (Feature → Step → Page → Locator)
 *
 * A BDD-only repo therefore has NO `tests/` folder — the runner project is
 * `bdd` and the generated `.features-gen/*.spec.js` bind to `steps/`. A
 * TDD-only repo has NO `features/`, and the shared step layer only appears
 * once the repo adds `bdd` via `--add-style bdd`.
 */
export const DIRS = {
  // `reports/` is deliberately absent — it is gitignored, so a .gitkeep there
  // would be ignored too; Playwright creates it at run time.
  all: ["fixtures"],
  tdd: ["tests", "tests/e2e"],
  bdd: ["features", "steps"],
};

/**
 * @param {Entry} entry
 * @param {Set<string>} styles active development styles
 * @param {string} stack active tool stack
 */
export function appliesTo(entry, styles, stack) {
  const styleOk = !entry.styles || entry.styles.some((s) => styles.has(s));
  const stackOk = !entry.stacks || entry.stacks.includes(stack);
  return styleOk && stackOk;
}
