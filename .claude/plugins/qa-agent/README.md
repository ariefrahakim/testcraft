# qa-agent — Claude Code plugin

An autonomous, spec-driven Playwright QA platform, packaged so any team can
install it and point it at their own app.

**Qase test cases are the source of truth.** The agents pull a plan, mine the
frontend source for selectors, generate the tests, run them on Chromium, upload
results to Qase, self-heal broken selectors, comment failures onto the right
Jira children, and open the PR.

Everything except the app under test is identical across teams: the same
generated code shape, the same defect-comment template, the same Qase/Jira
payloads. What differs is one file (`.claude/app-profile.md`) and one `.env`.

## Prerequisites

Install once per machine before `/qa-agent:setup`. The plugin will still
scaffold without the optionals, but the flagged features degrade or no-op.

| Component | Required? | Purpose | Where |
|---|---|---|---|
| **Claude Code** ≥ current | Required | Runs the plugin | https://claude.com/claude-code |
| **Node.js 20+** and **npm** | Required | Generated repo builds/tests on this | `node -v` |
| **Git**, **GitHub CLI (`gh`)** | Required | `/qa-agent:qa-agent-pr` opens/updates the PR via `gh` | `gh auth login` |
| Playwright system deps | Required | `npm run install:browsers` fetches Chromium; `sudo npx playwright install-deps` on Linux CI | — |
| Plugin **`design-agent`** | Recommended | Provides `run-logger` + `run-logger-sync` skills — every QA agent logs to Confluence. Without it the pipeline still runs; only Confluence pages stay empty | `/plugin install design-agent@…`; run `/design-agent:setup` once to create `.team.json` |
| MCP `playwright` | Recommended | qa-codegen self-verifies the generated happy path in a real browser via Playwright MCP before handoff. `/qa-agent:setup` scaffolds a repo-owned `.mcp.json` pinning the server to `--headless --isolated` — headless matches CI, isolated gives each session a clean context (required by single-SSO apps). Drop `--headless` locally to debug a flow visually; `/qa-agent:upgrade` never overwrites the file | Ships in the scaffold — no separate install |
| Skill **`graphify`** | Optional | FE-graph accelerator — qa-codegen (step 0a) and qa-healer (step 1) query `$FE_REPO_PATH/graphify-out/graph.json` before falling back to a full FE scan. `/qa-agent:setup` step 4b offers to build the graph against your FE checkout | See `~/.claude/skills/graphify/SKILL.md` |
| Access to the FE repo | Required for codegen/heal | `utils/fe-repo-sync.ts` clones/pulls the FE source. Azure Repos HTTPS URLs authenticate via `AZURE_PAT` + `http.extraheader` (PAT scope: **Code (Read)**). SSH URLs (git@…) authenticate via `GIT_SSH_COMMAND=SSH_KEY`. | `.env`: `FE_REPO_ROOT`, `FE_REPO_URL`, `FE_BRANCH`, plus either `AZURE_PAT` or `SSH_KEY` |

Stack-specific credentials go into `.env` after setup — see §Environment
below. Both Confluence run logging and Graphify are opt-in: a fresh clone
without them still passes typecheck, lint, and produces a green run.

## Install

The plugin ships from the **`hubexo-ai-agent-marketplace`** GitHub repo, added
into Claude Code as the `hubexo-plugins` marketplace:

```
/plugin marketplace add hubexo/hubexo-ai-agent-marketplace
/plugin install qa-agent@hubexo-plugins
```

Then, in an empty directory that will become your QA repo:

```
/qa-agent:setup
```

It asks for the app, the Qase project, the FE source repo, the Jira tenant —
and the **development style** — then writes a repo that typechecks and lints
clean out of the box.

## Quickstart — install → setup → first run

The end-to-end path from a fresh machine to a green Qase run on your app. Every
value in `<angle brackets>` is something your team owns.

### 1. Once per machine

```bash
# Node ≥ 20, git, gh
node -v && git --version && gh --version
gh auth login                       # /qa-agent:qa-agent-pr uses this
```

Then in Claude Code:

```
/plugin marketplace add hubexo/hubexo-ai-agent-marketplace
/plugin install qa-agent@hubexo-plugins
# Optional but recommended — writes run logs to Confluence:
/plugin install design-agent@hubexo-plugins
/design-agent:setup
```

### 2. Scaffold the QA repo (once per app)

```bash
mkdir qa-playwright-<app-slug>
cd qa-playwright-<app-slug>
# Open Claude Code in this directory, then:
```

```
/qa-agent:setup
```

Setup asks for **stack** (`jira` or `azure`), **style** (`tdd` / `bdd` / `both`),
the app name, base URL, post-login URL pattern, Qase or Azure project, the FE
repo (SSH URL, or Azure Repos HTTPS URL on `--stack azure`, plus branch,
checkout root, scan subtree) and the Jira/Azure defect parent. It writes a repo that typechecks and lints clean.

### 3. Fill `.env` and verify locally

```bash
cp .env.example .env
# Edit .env — fill USER_ID, USER_PWD, API_TOKEN, ATLASSIAN_TOKEN, SSH_KEY, …
npm install                         # skip if setup step 4c already ran it
npm run install:browsers            # skip if setup step 4c already ran it
npm run fe:sync                     # clone/pull FE source (needs SSH access)
npm run typecheck && npm run lint   # both must be green
```

### 4. First run

Pick the trigger that matches the artefact you have:

| You have | Command |
|---|---|
| A **Jira epic/story/`[TA]`** ticket, or an **Azure Boards** `AB#<id>` (Epic, Product Backlog Item, or `[TA-…]` Task) with a `[TM-…]` child that names a plan | `/qa-agent:qa-agent NLM-4` |
| Only a **Qase plan id** — no tracker ticket | `/qa-agent:tms plan:8` |
| Only a **single case id** to iterate on | `/qa-agent:tms TC-2045` |

The orchestrator drives the full pipeline autonomously:

```
generate → run → (heal on failure → defect on jira only) → PR
```

At the end it prints the Qase/Azure run URL, the pass/fail counts, and the PR
URL. Failures on the `jira` stack are commented back to the matching
`[FE-…]`/`[BE-…]` children; the `[TA-…]` ticket is transitioned to
*Waiting to Deploy* only on an all-green run (CLAUDE.md §8).

### 5. Iterate

Same commands drive maintenance:

| Command | When |
|---|---|
| `/qa-agent:qa-agent-generate plan:<id>` | Just regenerate — no run |
| `/qa-agent:qa-agent-run plan:<id> \| <module> \| TC-xxxx [--headed]` | Just run — no regen. Mints a fresh Qase cycle |
| `/qa-agent:qa-agent-heal <module> \| TC-xxxx` | Broken selector — re-resolve, re-run (up to 2 retries) |
| `/qa-agent:qa-agent-defect <EPIC-KEY>` | Route last run's failures to Jira children |
| `/qa-agent:qa-agent-pr` | Open/update PR for the current branch |
| `/qa-agent:upgrade` | Pull latest framework files after a plugin update |

## Tool stacks

Setup picks a stack as well as a style. The two are independent, so there are
six starting points, and everything above the two gateway modules is identical
in all of them:

| | `jira` | `azure` |
|---|---|---|
| Test management | **Qase** | **Qase** (same as jira — Azure Test Plans is not used) |
| Issue tracker | Jira | Azure Boards |
| Ticket hierarchy | `Epic → Story → [TM-…] / [TA-…] / [FE-…] / [BE-…]` | `Product Backlog Item (PBI) → Task` — the same `[TM-…]` / `[TA-…]` / `[FE-…]` / `[BE-…]` prefixes ride on Task work items under a PBI |
| Gateways (import from these) | `utils/tms.ts`, `utils/tracker.ts` | same two files |
| Providers (never import directly) | `qase-helper.ts`, `jira-helper.ts` | `qase-helper.ts`, `azure-boards-helper.ts` |
| Result upload | `playwright-qase-reporter` | `playwright-qase-reporter` |
| Automation-status flip on passed cases | `utils/qase-automation-reporter.ts` | `utils/qase-automation-reporter.ts` |
| Comment format | ADF | HTML |
| CI | `.github/workflows/regression.yml` | that **and** `azure-pipelines.yml` |

Only the chosen stack's provider modules are written, so a repo never carries a
helper for a system it does not use. Epics, User Stories and the
`[FE-…]`/`[BE-…]`/`[TM-…]`/`[TA-…]` prefixes mean the same thing on both.

> **Azure adapters have not yet run against a live organisation.** The request
> shapes follow the published REST contract and the scaffold typechecks and
> lints clean, but no run has gone end to end. Treat the first execution against
> a real project as bring-up.

## Development styles

The style decides the repo's shape. Both bottom out in the same page objects and
locators, so a module written in one style reuses the other's assets unchanged:

```
BDD:  Feature  →  Step  →  Page  →  Locator
TDD:  Spec     →  Step  →  Page  →  Locator
```

| | `tdd` | `bdd` |
|---|---|---|
| Qase `steps_type` | `classic` (action / expected rows) | `gherkin` |
| Entry point | `tests/e2e/<area>/<module>.spec.ts` | `features/<area>/<module>.feature` |
| Runner project | `chromium` | `bdd` (via `playwright-bdd`) |
| Fixtures | `shared/test-fixtures.ts` | `shared/bdd/fixtures.ts` |
| Extra dep | — | `playwright-bdd` |

`--style both` installs both layers; each Qase case's `steps_type` then decides
how it is generated. Not sure which your project uses? Check the case in the
Qase UI, or run `npm run qase:plan-style -- plan:<id>` once the repo exists.

Adding the other style later never re-scaffolds anything:

```
/qa-agent:setup --add-style tdd
```

It writes only the missing layer and merges the style's npm scripts into
`package.json`. The one manual step left is the app-profile style row.

### Style layers — the npm scripts each one adds

`tdd`:

```json
"test:headed": "playwright test --project=chromium --headed",
"test:debug":  "PWDEBUG=1 playwright test --project=chromium",
"test:login":  "playwright test --project=chromium tests/e2e/login"
```

`bdd` (also add `"playwright-bdd": "^9.2.0"` to `devDependencies`):

```json
"bddgen":           "bddgen",
"test:bdd":         "npm run bddgen && playwright test --project=bdd",
"test:bdd:headed":  "npm run bddgen && playwright test --project=bdd --headed"
```

> **Full runbook** — install, per-style walkthroughs (TDD and BDD), CI settings,
> conventions and troubleshooting: [docs/RUNBOOK.md](docs/RUNBOOK.md), also
> published at
> [QA Agent Plugin](https://bcisuite.atlassian.net/wiki/spaces/TNLM/pages/3608969240/QA+Agent+Plugin)
> on Confluence.
>
> **Rolling out to a new team?** Start with
> [docs/ROLLOUT.md](docs/ROLLOUT.md) — the onboarding guide with a
> permissions matrix and scenario-by-scenario setup for `jira`/`azure` ×
> `tdd`/`bdd`, listing every token, environment variable, and CI secret each
> combination needs.

## Environment — `.env`

`/qa-agent:setup` writes a filled-in `.env.example` for the stack you chose; copy
it to `.env` and add the secrets. **No plugin-owned file contains any of these
values** — they are
read only through the typed gateway in `shared/env.ts`, so a missing one fails
loudly instead of silently falling back to another team's app.

### `jira` stack

```bash
# --- App under test --------------------------------------------------------
HOST=https://stage.acme.example
SSO_LOGIN_URL=https://stage.acme.example/login
# Regex (as a string) the URL must match after a successful login. Asserted by
# shared/auth.setup.ts and pages/login/login.page.ts. REQUIRED.
POST_LOGIN_URL_PATTERN=/dashboard

# --- Primary test user -----------------------------------------------------
USER_ID=
USER_PWD=

# --- Qase (test management, source of truth) -------------------------------
QASE_PROJECT=ACME          # the project CODE, not its name. REQUIRED.
API_TOKEN=
QASE_MODE=off              # testops = upload results; off = local reports only
CYCLE_KEY=                 # leave EMPTY — qa-runner mints a fresh run per call

# --- Frontend source (selector discovery, CLAUDE.md §3 step 3) -------------
# Only codegen and healing read these, so a plain test run works without them.
FE_REPO_URL=git@github.com:acme/frontend-web.git
FE_BRANCH=main
FE_REPO_ROOT=frontend-web            # the checkout root
FE_REPO_PATH=frontend-web/src        # the subtree actually scanned
SSH_KEY=                             # optional, injected via GIT_SSH_COMMAND

# --- Jira / Atlassian (defect commenting, CLAUDE.md §8) --------------------
BASE_URL_ATLASSIAN=https://acme.atlassian.net
EMAIL=
ATLASSIAN_TOKEN=
JIRA_PROJECT_KEY=QAA
JIRA_PARENT_ISSUE_ID=1900
```

Required at import time: `HOST`, `USER_ID`, `USER_PWD`, `QASE_PROJECT`,
`POST_LOGIN_URL_PATTERN`. Everything else is optional, with the consumer
raising a named error if it needs a value that is empty — `FE_REPO_PATH`, for
instance, only throws when `findTestIds()` actually runs.


### `azure` stack

`/qa-agent:setup --stack azure` writes this instead. Qase owns test
management; one PAT covers everything else on Azure — Boards (defect
commenting), Repos (FE clone via HTTPS), and pushing this QA repo to Azure
Repos if you host it there. Scopes: **Work Items (Read & Write)**, **Code
(Read)** for FE clone, and **Code (Read & Write)** only for pushing the QA
repo. Full walkthrough (Epic / PBI / `[TA-…]` trigger, hierarchy variants,
QA-repo push commands) lives in [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) §7
("Environment — `.env`" → `azure` stack).

```bash
# --- App under test --------------------------------------------------------
HOST=https://stage.acme.example
SSO_LOGIN_URL=https://stage.acme.example/login
POST_LOGIN_URL_PATTERN=/dashboard      # REQUIRED
APP_FORGOT_URL=                        # optional

# --- Primary test user -----------------------------------------------------
USER_ID=
USER_PWD=

# --- Qase (test management on both stacks) --------------------------------
QASE_PROJECT=ACME
API_TOKEN=
QASE_MODE=off                          # testops = upload results
CYCLE_KEY=                             # leave EMPTY — a fresh cycle per run

# --- Azure DevOps (Boards tracker + Repos source hosting) -----------------
AZURE_ORG_URL=https://dev.azure.com/acme    # REQUIRED
AZURE_PROJECT=AcmeQA                        # REQUIRED — the project NAME
AZURE_PAT=                                  # REQUIRED — scopes above
# Default defect parent when no key is passed (Epic or PBI work-item id).
AZURE_PARENT_WORK_ITEM_ID=4821

# --- Frontend source (selector discovery) ----------------------------------
# Azure Repos HTTPS URL — utils/fe-repo-sync.ts injects AZURE_PAT via
# `http.extraheader`. SSH URLs (git@…) also work; pick by URL shape.
FE_REPO_URL=https://dev.azure.com/acme/AcmeQA/_git/frontend
FE_BRANCH=main
FE_REPO_ROOT=frontend
FE_REPO_PATH=frontend/src
SSH_KEY=                                    # only for SSH URLs
```

Required at import time on this stack: `HOST`, `USER_ID`, `USER_PWD`,
`POST_LOGIN_URL_PATTERN`, `QASE_PROJECT`, `API_TOKEN`, `AZURE_ORG_URL`,
`AZURE_PROJECT`. Qase owns test management on both stacks; Azure Boards is
the tracker; Azure Repos is the (optional) source host.

### Azure Pipelines

An `azure` repo also gets `azure-pipelines.yml`, running the same sweep as the
GitHub workflow off the same module discovery. It reads its configuration from a
**variable group** named `qa-agent-secrets`:

| Variable | Secret? | What it is |
|---|---|---|
| `USER_ID`, `USER_PWD` | yes | test account |
| `API_TOKEN` | yes | Qase API token (TMS on both stacks) |
| `AZURE_PAT` | yes | the PAT above (Work Items scope only) |
| `HOST`, `SSO_LOGIN_URL` | no | resolved per environment |
| `QASE_PROJECT` | no | the Qase project code |
| `AZURE_ORG_URL`, `AZURE_PROJECT` | no | as in `.env` |
| `POST_LOGIN_URL_PATTERN` | no | required |
| `APP_NAME` | no | labels the test run |

The `setup` stage verifies all of the required ones before installing anything
and fails naming the missing pipeline setting, exactly like the GitHub job.

Add app-specific curated data under the `App-specific config` section of
`shared/env.ts`, keeping each value env-overridable. Business data that belongs
to a Qase plan does **not** go here — it comes from the plan's Description into
`fixtures/<module>.json` (CLAUDE.md §5).

## GitHub Actions — secrets and variables

The scaffolded `.github/workflows/regression.yml` reads its configuration from
repo settings. Secrets hide their value; variables do not, so put anything
non-sensitive in variables where it stays readable in the log.

The regression sweep is **product-agnostic and tracker-agnostic** — it does not
read Jira / Atlassian / FE-source config. Those belong to `/qa-agent-generate`
and `/qa-agent`, which run from a developer machine.

**Settings → Secrets and variables → Actions → Secrets**

| Secret | Required | What it is |
|---|---|---|
| `USER_ID` | yes | primary test account |
| `USER_PWD` | yes | its password |
| `HOST_STAGING` | yes | staging base URL |
| `SSO_LOGIN_URL_STAGING` | yes | staging login URL |
| `API_TOKEN` | for Qase upload | Qase API token |
| `EMAIL` | optional | Atlassian account email (only if `scripts/*` read it) |
| `HOST_PRODUCTION` | only for `env=production` | production base URL |
| `SSO_LOGIN_URL_PRODUCTION` | only for `env=production` | production login URL |
| `TEAMS_WEBHOOK_URL` | optional | Incoming Webhook for the run-summary card |

**Settings → Secrets and variables → Actions → Variables**

| Variable | Required | What it is |
|---|---|---|
| `QASE_PROJECT` | yes | Qase project code |
| `APP_NAME` | optional | labels the Qase run; falls back to the repo name |

`GITHUB_TOKEN` is provided by Actions — never add it yourself.

The `setup` job checks `USER_ID`, `USER_PWD` and the host/SSO pair for the
chosen environment before installing anything, and fails with the name of the
missing GitHub setting. A sweep never
starts against a blank host.

## Commands

| Command | What it does |
|---|---|
| `/qa-agent:setup` | Scaffold a repo (or add a style) |
| `/qa-agent:upgrade` | Refresh the framework files from the installed plugin |
| `/qa-agent:qa-agent <JIRA-KEY \| AB#<id>>` | End-to-end from a tracker ticket (Jira or Azure Boards): plan → generate → run → heal → defect → PR |
| `/qa-agent:tms <PLAN_ID \| TC-xxxx \| case:<id>>` | Same pipeline driven by a TMS plan **or** single case id (Qase (both stacks)), no tracker/defect routing but still runs through PR |
| `/qa-agent:qa-agent-generate plan:<id>` | Generate assets from a Qase plan |
| `/qa-agent:qa-agent-run plan:<id>` | Execute + upload results to Qase |
| `/qa-agent:qa-agent-defect <EPIC-KEY>` | Comment failures onto the matching Jira children |
| `/qa-agent:qa-agent-heal <module>` | Re-resolve broken selectors, re-run, record the heal |
| `/qa-agent:qa-agent-pr` | Open/update the PR with Jira + Qase context stamped in |

## Who owns which file

This is the contract that makes upgrades safe.

**Plugin-owned** — `/qa-agent:upgrade` overwrites these wholesale. Never
hand-edit them; a local patch is lost on the next upgrade.

```
CLAUDE.md  eslint.config.js  tsconfig.json  playwright.config.ts
utils/*  scripts/*  .github/workflows/*
shared/{custom-expect,global,hooks,session,viewport}.ts
shared/test-fixtures.ts  shared/bdd/fixtures.ts
```

**Repo-owned** — written once at init, yours from then on. Upgrade never
touches them.

```
.env  .mcp.json  .claude/app-profile.md  .claude/memories/*
shared/env.ts  shared/auth.setup.ts  shared/pom-fixtures.ts
pages/  locators/  tests/  features/  steps/  fixtures/  package.json
```

Needed behaviour that would mean patching a plugin-owned file belongs in a
repo-owned one — or upstream, in this plugin.

`.claude/qa-agent.json` records the style and every value init substituted;
`--add-style` and `/qa-agent:upgrade` re-render from it.

## Upgrading

```
/plugin update qa-agent
/qa-agent:upgrade            # dry run — lists what would change
/qa-agent:upgrade --apply
npm install                  # only if pinned devDependencies moved
npm run install:browsers     # only if @playwright/test moved
```

Dry run is the default deliberately: these files are the contract the agents
obey, and a silent overwrite is how a team loses a fix without noticing.

Upgrade will also sync the **pinned devDependency versions** in your repo's
`package.json` (`@playwright/test`, `playwright-qase-reporter`,
`playwright-bdd`) to whatever this plugin currently ships. Floating tooling
packages (`typescript`, `eslint`, `tsx`, `@types/node`) are left alone. The
Chromium browser binary is version-locked to `@playwright/test`, so run
`npm run install:browsers` after the pin moves.

## Versioning & upgrades

Both `.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` carry
a SemVer version, kept in lock-step. Every scaffolded repo records the
version it was scaffolded with and the last version it was upgraded to under
`.claude/qa-agent.json` (`pluginVersion`, `scaffoldedWith`,
`lastUpgradedAt`) so you always know where a team stands.

- **PATCH** (`1.0.0 → 1.0.1`) — bug fix, prompt tightening, doc edit.
  `/qa-agent:upgrade` is optional.
- **MINOR** (`1.0.0 → 1.1.0`) — additive: new command, new stack/style
  option, new pinned dep, Playwright minor bump. `/qa-agent:upgrade` picks
  it up automatically.
- **MAJOR** (`1.x.y → 2.0.0`) — breaking: renamed command, changed record
  schema, changed gateway signature. Migration steps are documented in the
  CHANGELOG entry.

`CHANGELOG.md` is the authoritative log. `CONTRIBUTING.md` is the policy —
when to bump, how to review, how to run the scaffolder + upgrade locally.
Pull requests use the template at `.github/pull_request_template.md`, which
reminds contributors to bump the version and add the CHANGELOG line.

## Further reading

Focused deep-dives, in reading order:

| Doc | For | What it covers |
|---|---|---|
| [`docs/ROLLOUT.md`](./docs/ROLLOUT.md) | New team | Pre-rollout checklist, credentials, the 4 stack × style scenarios end to end |
| [`docs/RUNBOOK.md`](./docs/RUNBOOK.md) | Operator / on-call | The pipeline, the agents, definition of done, common failures |
| [`docs/RUN-LOGGER.md`](./docs/RUN-LOGGER.md) | Reviewer / manager | How audit rows reach Confluence: schema, agent-name canonicalisation, when to trigger a sync |
| [`docs/GRAPHIFY.md`](./docs/GRAPHIFY.md) | Codegen/heal debugger | The FE-graph accelerator: what it does, when to refresh, how it degrades |
| [`docs/runbook.html`](./docs/runbook.html) | New user / stakeholder | Single-file landing page — install → setup → trigger → stacks covered → 5 agents → troubleshooting. Self-contained (no build step); open the file in a browser or deploy to Netlify/Vercel as-is. |

## Requirements

- Node ≥ 20
- A Qase project and API token
- A Jira tenant + API token (for the defect-routing commands)
- Read access to the frontend source repo (selector discovery scans it)
- Optional: the `design-agent` plugin — `/qa-agent` calls its
  `run-logger` / `run-logger-sync` skills to log runs to Confluence. See
  [`docs/RUN-LOGGER.md`](./docs/RUN-LOGGER.md). Without it, the orchestrator
  still runs; only the Confluence logging is skipped.
- Optional: the `graphify` skill — accelerates selector discovery and
  broken-selector re-resolution. See [`docs/GRAPHIFY.md`](./docs/GRAPHIFY.md).

## Repo layout

```
.claude-plugin/     plugin.json + marketplace.json
agents/             qa-codegen, qa-runner, qa-defect, qa-healer, qa-pr
commands/           /qa-agent* slash commands
scripts/
  init.mjs          the scaffolder (zero-dependency Node ESM)
  upgrade.mjs       re-renders plugin-owned files into an existing repo
  lib/manifest.mjs  the single declaration of what ships where, and who owns it
  lib/render.mjs    placeholder substitution + style-region stripping
templates/
  base/             app-agnostic files, with {{PLACEHOLDERS}} and #region markers
  tdd/  bdd/        the style layers
```

A template carries style-conditional blocks as regions, stripped at render time:

```ts
// #region qa-agent:bdd
import { defineBddProject } from "playwright-bdd";
// #endregion qa-agent:bdd
```

An unknown `{{PLACEHOLDER}}` is a hard error rather than a silent pass-through —
shipping a half-rendered config to a team that cannot see where it came from is
worse than failing loudly.
