---
description: Set up a QA-Agent Playwright repo — Jira+Qase or Azure Boards+Qase, in TDD or BDD style — or add the missing style to an existing one. Also collects the Confluence page URL for each QA agent's run log.
argument-hint: "[--add-style tdd|bdd] [--dry-run]"
allowed-tools: Bash, Read, Write, Edit, Glob, Grep, AskUserQuestion
---

# /qa-agent:setup

Scaffold this directory into a working QA-Agent repo: the contract
(`CLAUDE.md`), the format engine (`utils/`, `shared/`, configs), a seeded login
module, and **only the layers the chosen development style needs**.

Arguments: `$ARGUMENTS`

## What you do

### 1. Decide the mode

- No arguments → **fresh init** of the current directory.
- `--add-style tdd` / `--add-style bdd` → **extend** an already-initialised
  repo with the missing style. Skip straight to step 4.
- `--dry-run` → pass it through; the script prints the plan and writes nothing.

Refuse to run a fresh init if `.claude/qa-agent.json` already exists — that repo
is already scaffolded, and the caller almost certainly wants `--add-style` or
`/qa-agent:upgrade`. Say so and stop.

**Pre-flight for run logging:** if `.team.json` is missing at the repo root,
Confluence run logging (via the `design-agent` plugin's `run-logger` /
`run-logger-sync` skills) will not work. Point that out and offer to run
`/design-agent:setup` first — but do not block; `/qa-agent:setup` still
scaffolds the repo, only Confluence sync is skipped at runtime.

### 2. Collect the configuration

Ask the user with **AskUserQuestion**, not free-text prompts. Group it into as
few questions as the answers allow; every value below is required unless marked
optional. Do not guess a value the user has not given — a wrong Qase project
code silently uploads results into the wrong project.

**Placeholder mode.** If the user has no real values yet (e.g. "just generate
placeholders", "kamu langsung generate placeholder saja"), skip the questions
and pass `--placeholders` to the scaffolder. It fills every missing required
value with a safe placeholder so `.env` and `.claude/app-profile.md` are written
without any real config; the operator edits them afterwards. Any explicit flags
the caller does pass are honoured — placeholders only fill gaps.

| Value | Flag | Notes |
|---|---|---|
| App under test (display name) | `--app` | e.g. "Acme Portal" |
| Region / environment label | `--region` | optional, default `global` |
| Base URL | `--url` | the staging host tests run against |
| Post-login URL pattern | `--post-login` | optional, default `/dashboard` — a regex fragment the URL matches once logged in |
| Test-management project | `--tms-project` (alias `--qase`) | the Qase project **code**, or the Azure DevOps **project name** |
| Azure org URL | `--azure-org` | `azure` stack only — `https://dev.azure.com/<org>`. Also answers the tracker URL |
| Azure test plan id | `--azure-plan` | `azure` stack only, optional — labels created runs |
| FE source repo (git URL) | `--fe-repo` | scanned for `data-testid` (CLAUDE.md §3) |
| FE branch | `--fe-branch` | optional, default `main` |
| FE checkout root | `--fe-dir` | optional, default `./<repo-name>` |
| FE scan subtree | `--fe-scan` | optional, default `<fe-dir>/src`. **A monorepo needs this set explicitly** to the one app under test |
| Tracker base URL | `--tracker-base` (alias `--jira-base`) | Jira tenant, or the Azure org URL (auto-filled from `--azure-org`) |
| Tracker project key | `--tracker-key` (alias `--jira-key`) | Jira only; Azure uses the project name |
| Default defect parent | `--tracker-parent` (alias `--jira-parent`) | Jira issue number, or Azure work-item id |
| Delivery project | `--tracker-delivery` (alias `--jira-delivery`) | optional — owns the `[FE-…]`/`[BE-…]`/`[TM-…]`/`[TA-…]` prefixes |
| **Tool stack** | `--stack` | `jira` (Jira + Qase) or `azure` (Azure Boards + Qase) |
| **Development style** | `--style` | `tdd`, `bdd`, or `both` |

**Ask the stack question first** — it decides which credentials the rest of the
setup needs:

- **`jira`** — Qase for test cases and plans, Jira for Epics / Stories and
  defect comments. Needs a Qase project code + API token, and an Atlassian
  tenant + token. Ticket hierarchy: `Epic → Story → [TM-…] / [TA-…] /
  [FE-…] / [BE-…]`.
- **`azure`** — Qase for test cases and plans, Azure Boards for work items.
  Needs a Qase project code + API token, plus a single Azure PAT (Work Items,
  read & write). `azure-pipelines.yml` ships as the only CI file (the
  GitHub-Actions workflow is not shipped on the azure stack).
  Ticket hierarchy: `Product Backlog Item (PBI) → Task`, where the `[TM-…]`,
  `[TA-…]`, `[FE-…]`, and `[BE-…]` prefixes ride on **Task** work items
  under a **PBI** (a PBI plays the role a Jira Story does on the other stack).

Both stacks use **Qase for test management** — the automation-status flip on
passed cases (§7 of the shared contract) is stack-agnostic and applied by
`utils/qase-automation-reporter.ts` regardless of tracker. Azure Test Plans
is intentionally NOT the source of truth: keeping test-management in one
place reduces the surface area agents have to reason about and lets `steps_type`
(classic / gherkin) stay a single field.

Both stacks produce the same repo above the two gateway modules
(`utils/tms.ts`, `utils/tracker.ts`), so the style choice below is independent
of it.

**On the style question**, present the trade-off honestly rather than a bare
list — it decides the repo's shape:

- **`bdd`** — cases authored as Gherkin. Feature files are mirrored from the
  test-management system and run by `playwright-bdd`.
- **`tdd`** — cases authored as classic action/expected rows. One `.spec.ts` per
  module, one `test.step()` per row.
- **`both`** — both layers present; each case decides how it is generated. Pick
  this when the project mixes the two.

If the user is unsure: `npm run tms:plan-style -- plan:<id>` answers it once the
repo exists. Before that, the Qase UI does — and on Azure, a case counts as BDD
when it carries a `bdd`/`gherkin` tag or its steps read as Gherkin.

### 3. Run the scaffolder

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/init.mjs" --app "…" --url "…" --qase … \
  --fe-repo … --tracker-base … --tracker-parent … --stack … --style …
```

Pass every collected value as a flag — the script only falls back to
interactive prompting when it has a TTY, which it will not have here.

Existing files are **skipped**, never overwritten, unless the user explicitly
asks for `--force`.

### 3b. Collect per-agent Confluence page URLs

`run-logger-sync` creates one Confluence page per distinct `agent` value under
the folder configured in `.team.json` (see the `design-agent` plugin).
Those pages are auto-created on first log — but if the team already has pages
you want the run logs to route to, collect them here.

Ask the user via **AskUserQuestion**, one question per agent (or a single free
text if `AskUserQuestion` cannot fit them all), for the Confluence page URL
each agent's log should land on. All values are **optional** — leave blank to
let `run-logger-sync` auto-create the page on first run.

| Agent (`agent` value used by run-logger) | .env key |
|---|---|
| `qa-agent-orchestrator` | `CONFLUENCE_PAGE_QA_ORCHESTRATOR` |
| `qa-codegen`            | `CONFLUENCE_PAGE_QA_CODEGEN` |
| `qa-runner`             | `CONFLUENCE_PAGE_QA_RUNNER` |
| `qa-healer`             | `CONFLUENCE_PAGE_QA_HEALER` |
| `qa-defect`             | `CONFLUENCE_PAGE_QA_DEFECT` |
| `qa-pr`                 | `CONFLUENCE_PAGE_QA_PR` |

For every value the user provides, append the matching `CONFLUENCE_PAGE_QA_…=<url>`
line to `.env.example` (and to `.env` if it exists) under a
`# --- Run-log Confluence pages (informational) ---` block. These are
informational overrides used by dashboards and PR bodies; the actual sync
destination is still driven by `.team.json.atlassian.confluence.agentLogsFolderId`.

Skip this step entirely (do not prompt) when `--add-style` was passed — style
adds should not re-collect run-log config.

### 4. Style layer only (`--add-style`)

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/init.mjs" --add-style <tdd|bdd>
```

The script merges the style's npm scripts and dependency into `package.json`
itself. Two things are left to you:

- run `npm install` when the added style is `bdd` (it pulls in `playwright-bdd`);
- flip the `Development style` row in `.claude/app-profile.md` to `both`.

`--add-style` never changes the repo's **stack** — that is fixed at init.

### 4b. Build the Graphify FE knowledge graph

`qa-codegen` and `qa-healer` open with a Graphify accelerator that queries
`$FE_REPO_PATH/graphify-out/graph.json` before falling back to a full FE
scan. Build the graph now, once, against the FE checkout so the accelerator
is warm on first run.

Ask the user via **AskUserQuestion** whether to build it now:

- **Yes (recommended)** — run `npm run fe:sync` first (populates
  `$FE_REPO_PATH` at `.env`'s `FE_BRANCH`), then, from `$FE_REPO_PATH`,
  invoke the `graphify` skill. Do not shell out to a hard-coded `graphify`
  binary — use the installed skill; if it is missing, print the install
  instructions from `~/.claude/skills/graphify/SKILL.md` and continue.
- **No / skip** — the accelerator falls back to
  `selector-helper.findTestIds(...)` full-scan on first run (slower, still
  correct). Note this in the final report so the user knows what to do
  later.

Add to `.claude/app-profile.md` (under the *FE integration* row) whether the
graph was built and the resulting `graphify-out/` path. `qa-codegen` step 0a
and `qa-healer` step 1 read that row to decide whether to skip the graph
refresh on first run.

Skip this step entirely when `--add-style` was passed.

### 4c. Install npm dependencies and Chromium (optional, recommended)

Ask the user via **AskUserQuestion**:

- **Yes (recommended)** — run `npm install`, then `npm run install:browsers`.
  Together these take about 3–5 minutes on a warm cache. Do this **before**
  step 4b if the user asked for a Graphify build (Graphify needs `tsx` from
  `node_modules`), otherwise this step runs on its own.
- **Skip** — leave dependencies uninstalled. Note it in the final report so
  the user knows to run those two commands manually before touching any
  `/qa-agent:*` sub-command.

Never run these two silently — the download is large and the user may be on
a metered connection. If `install:browsers` fails because system deps are
missing (typical on fresh Linux CI images), print the platform-specific
follow-up (`sudo npx playwright install-deps` on Debian/Ubuntu) and mark the
step as *partially complete* rather than failing outright.

`fe:sync`, `typecheck`, and `lint` are **not** run here — they all read
`.env` (via `shared/env.ts`) and `.env` is empty at scaffold time. They
belong to §5.

### 5. Advise remaining manual steps

The rest of the initial checklist depends on values only the operator can
provide (secrets in `.env`, an SSH key with FE-repo access). Do **not** run
them automatically; instead print the ordered next steps clearly:

```bash
cp .env.example .env             # then fill USER_ID / USER_PWD / API_TOKEN etc.
npm run fe:sync                  # clones/pulls the FE checkout; needs SSH
npm run typecheck && npm run lint
```

Explain why each one is manual:

- `.env` — no auto-populate because credentials belong to the team, not the
  scaffolder. `npm run typecheck` will fail loudly (`shared/env.ts` throws on
  a missing required var) until it is filled.
- `fe:sync` — needs the SSH key that unlocks the FE repo. The scaffolder
  does not know which key path to use.
- `typecheck` / `lint` — depend on both of the above.

Do not claim setup is "verified" when these three have not run — the report
in §6 must say *pending credentials* rather than *green*.

### 6. Report

State each of the following on its own line so the user can act on them one
by one:

- Stack and style chosen.
- File count created (plugin-owned vs repo-owned).
- **Dependencies status from Step 4c**: either *installed (npm + Chromium)*
  or *skipped — run `npm install && npm run install:browsers` before the next
  command*.
- **Graphify graph status from Step 4b**: *built (`graphify-out/…`)* or
  *skipped — run `graphify` inside `$FE_REPO_PATH` when convenient*.
- The three manual next steps from §5 exactly as listed, so the user can
  copy-paste them.
- **TODO rows in `.claude/app-profile.md`** — call out the login selectors
  and the testid convention specifically, since qa-codegen reads that profile
  before every generation.

Never describe the setup as *verified* / *green* unless
`npm run typecheck && npm run lint` actually ran and passed — which requires
the user to have completed the §5 steps first. When they are still pending,
say *pending credentials* and list what is missing.
