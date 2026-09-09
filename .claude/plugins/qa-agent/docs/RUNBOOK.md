# QA Agent Plugin — Runbook

**Repository:** https://github.com/hubexo/qa-agent-plugin

An autonomous, spec-driven Playwright QA platform, packaged as a Claude Code
plugin so any team can install it and point it at their own app.

Test cases are the source of truth. The agents pull a plan, mine the frontend
source for selectors, generate the tests, run them on Chromium, upload results,
self-heal broken selectors, comment failures onto the right child tickets, and
open the pull request.

**Setup picks two things, independently:** a **stack** — `jira` (Qase + Jira) or
`azure` (Azure Boards + Qase) — and a **style** — `tdd`, `bdd` or
`both`. Everything above two gateway modules (`utils/tms.ts`, `utils/tracker.ts`)
is identical in all six combinations, so this page describes one platform, not
two. Where a step differs by stack it says so.

Everything except the app under test is identical across teams — the same
generated-code shape, the same defect-comment template, the same run and comment
payloads. What differs per team is one markdown file and one `.env`.

> This page is generated from
> [`plugins/qa-agent/docs/RUNBOOK.md`](https://github.com/hubexo/qa-agent-plugin/blob/main/plugins/qa-agent/docs/RUNBOOK.md)
> in the plugin repo. Edit it there so the two do not drift.

---

## 1. Prerequisites

| Requirement | Why |
|---|---|
| A decision: `jira` or `azure` stack | it fixes which credentials you need, and cannot be changed in place |
| Node.js ≥ 20 | the platform is ESM TypeScript on Playwright |
| Claude Code | the agents and `/qa-agent*` commands are a Claude Code plugin |
| A test-management project + token | Qase project + API token, **or** an Azure DevOps project + PAT |
| A tracker + token | Jira tenant + API token, **or** the same Azure PAT (Boards) |
| Read access to the frontend repo | selector discovery scans the FE source |
| Access to `hubexo/qa-agent-plugin` | the repo is private — ask for org access first |

### Optional: Run Logger API

`/qa-agent`, `/qa-agent:tms` and `/qa-agent-pr` POST audit rows to the Hubexo orchestration API after each step. One thing is needed, and it is optional:

```bash
Add `RUN_LOGGER_API_KEY` to the `env` object in the project's
`.claude/settings.local.json`, preserving existing settings, then restart Claude
Code so the MCP/server environment is refreshed.
```

The key is issued from the Hubexo orchestration dashboard. Without it the agents print a warning and skip logging — the QA pipeline itself still runs end to end.

---

## 2. Install the plugin

In Claude Code:

```
/plugin marketplace add hubexo/qa-agent-plugin
/plugin install qa-agent@hubexo-plugins
```

To pick up a later release: `/plugin update qa-agent`, then run
`/qa-agent:upgrade` in each repo (see §9).

---

## 3. Scaffold a repo

Create an empty directory that will become the QA repo, open Claude Code in it,
and run:

```
/qa-agent:setup
```

It asks for the values below and writes a repo that typechecks and lints clean
before a single test exists.

| Value | Flag | Notes |
|---|---|---|
| **Tool stack** | `--stack` | `jira` (Qase + Jira) or `azure` (Azure Boards + Qase) |
| App under test (display name) | `--app` | e.g. `Acme Portal` |
| Region / environment label | `--region` | optional, default `global` |
| Base URL | `--url` | the staging host tests run against |
| Post-login URL pattern | `--post-login` | optional, default `/dashboard`. A regex fragment the URL matches once logged in |
| Test-management project | `--tms-project` (alias `--qase`) | the Qase project **code**, or the Azure DevOps **project name** |
| Azure org URL | `--azure-org` | `azure` only — `https://dev.azure.com/<org>`; also answers the tracker URL |
| Azure test plan id | `--azure-plan` | `azure` only, optional |
| FE source repo (git URL) | `--fe-repo` | scanned for `data-testid` |
| FE branch | `--fe-branch` | optional, default `main` |
| FE checkout root | `--fe-dir` | optional, default `./<repo-name>` |
| FE scan subtree | `--fe-scan` | optional, default `<fe-dir>/src`. **A monorepo must set this explicitly** to the one app under test |
| Tracker base URL | `--tracker-base` (alias `--jira-base`) | Jira tenant; auto-filled from `--azure-org` on Azure |
| Tracker project key | `--tracker-key` (alias `--jira-key`) | Jira only |
| Default defect parent | `--tracker-parent` (alias `--jira-parent`) | Jira issue number, or Azure work-item id |
| Delivery project | `--tracker-delivery` (alias `--jira-delivery`) | optional. Owns the `[FE-…]`/`[BE-…]`/`[TM-…]`/`[TA-…]` prefixes |
| **Development style** | `--style` | `tdd`, `bdd`, or `both` — see §5 |

Then finish the setup. Setup step 4c already offers to run
`npm install` + `npm run install:browsers` for you — accept it and skip the
first two lines below. The remaining three read `.env`, so they always stay
manual:

```bash
npm install                                # skip if setup step 4c ran it
npm run install:browsers                   # skip if setup step 4c ran it
cp .env.example .env                       # fill in the secrets (§7)
npm run fe:sync                            # clone/pull the FE source; reads FE_* from .env
npm run typecheck && npm run lint          # green only after .env is filled
```

Finally open `.claude/app-profile.md` and fill in its `TODO` rows — the testid
convention and the login selectors in particular. qa-codegen reads that profile
before every generation, so a stale profile produces stale assets.

### What you get

```
CLAUDE.md                     the contract every agent obeys
.claude/app-profile.md        this app's values (yours to maintain)
.claude/qa-agent.json         scaffold record: style + app identity
.claude/memories/             page map, selector history, known issues, heals
pages/login/login.page.ts     seeded login POM — the reference pattern
locators/login/…              seeded login selectors (form-attribute fallback)
shared/                       env gateway, auth setup, POM fixtures, runner wiring
utils/                        Qase + Jira + logger + selector + date helpers
scripts/                      module discovery, run summary, triage
.github/workflows/            the regression sweep
tests/ or features/ + steps/  per the chosen style
```

Login is the one module the skeleton ships pre-wired, because
`shared/auth.setup.ts` cannot authenticate without it. Its selectors are
form-attribute fallbacks — replace them with the app's real testids on the
first heal.

---

## 4. Two authoring styles

A Qase case carries a `steps_type`, and the generator branches on it. Both
styles share the *same* page objects, locators, fixtures and Qase reporting.
Only where the scenario text lives changes:

```
BDD:  Feature  →  Step  →  Page  →  Locator
TDD:  Spec     →  Step  →  Page  →  Locator
```

The step layer is shared. A step body lives in an exported function; the Gherkin
binding and the classic spec both call it. A step never writes a selector and
never reaches past the page object — this is enforced by ESLint, not convention.

| | `tdd` | `bdd` |
|---|---|---|
| Qase `steps_type` | `classic` (action / expected rows) | `gherkin` |
| Entry point | `tests/e2e/<area>/<module>.spec.ts` | `features/<area>/<module>.feature` |
| Runner project | `chromium` | `bdd` (via `playwright-bdd`) |
| Fixtures | `shared/test-fixtures.ts` | `shared/bdd/fixtures.ts` |
| Extra dependency | — | `playwright-bdd` |
| Compile step | none | `bddgen` → `.features-gen/` |

`--style both` installs both layers and each case's `steps_type` decides how it
is generated. Choose it when the Qase project mixes the two.

Not sure which your project uses? Check a case in the Qase UI, or once the repo
exists run `npm run qase:plan-style -- plan:<id>` — it prints `bdd`, `classic`
or `mixed`.

### Adding the other style later

```
/qa-agent:setup --add-style bdd
```

This writes only the missing layer — the runner project, the lint layer, the
fixtures file, the folders — merges the style's npm scripts into `package.json`,
and never touches assets already generated.

The npm scripts are merged rather than left to you deliberately: a forgotten
`test:<module>` script silently drops the module from the CI regression matrix,
because `npm run modules` keeps only the modules that have one. The one manual
step left is flipping the style row in `.claude/app-profile.md` to `both` (plus
`npm install` when adding `bdd`, to pull in `playwright-bdd`).

---

## 5. Style detail — TDD (classic Qase cases)

### How a case becomes code

A classic Qase case is a list of rows: `action`, `data`, `expected_result`.
qa-codegen emits one `test()` per case and one `test.step()` per row, so the
Playwright report mirrors the Qase scenario step by step.

```ts
// tests/e2e/dashboard/bid-search.spec.ts
import { test, expect } from "../../../shared/test-fixtures.js";
import bidSearchData from "../../../fixtures/bid-search.json" with { type: "json" };

test.describe("bid-search", () => {
  test("Search by keyword returns matching projects", async ({ bidSearchPage }) => {
    qase.id(2045);
    const data = bidSearchData.constructionProjectWithSingleTrade;

    await test.step("Open the bid search page", async () => {
      await bidSearchPage.navigate();
    });

    await test.step("Search for the keyword", async () => {
      await bidSearchPage.searchByKeyword(data.keyword);
    });

    await test.step("Results contain the expected project", async () => {
      await expect(bidSearchPage.resultRow(data.projectId)).toBeVisible();
    });
  });
});
```

Rules that the linter enforces:

- The test title is the Qase scenario name **verbatim**; `qase.id(<id>)` is the
  first line of the body.
- A spec contains only `describe`/`test` blocks. No free functions, no
  interfaces, no type aliases — push UI logic to the page object, pure data and
  reusable assertions to `pages/<m>/<m>.helpers.ts`, generic helpers to `utils/`.
- No `page.waitForTimeout`. No inline selector strings anywhere.
- `test.skip(cond, reason)` stays at the test-body top level, never inside a
  step callback.

### Running

```bash
npm test                    # everything; the auth setup project runs first
npm run test:login          # one module
npm run test:headed         # visible browser
npm run test:debug          # Playwright inspector
npx playwright test --grep "TC-2045"   # one Qase case
```

qa-codegen also writes a `test:<module>` and `test:plan<id>` script per scope it
generates. Each mints a **fresh Qase run** and then runs that scope in one
command.

---

## 6. Style detail — BDD (Gherkin Qase cases)

### The feature file is mirrored from Qase, never hand-written

```bash
npm run qase:feature-sync -- plan:<id> --module <m> [--area <a>] [--project CODE] [--emit-steps]
```

This writes `features/<area>/<module>.feature`. Re-running overwrites it —
Qase stays the source of truth. `--emit-steps` prints the step-definition
skeleton on stdout. If the wording is wrong, **fix it in Qase and re-sync**;
never reword a step definition to match something the feature does not say.

`<area>` is the case's Qase test folder (suite), kebab-cased. `feature-sync`
resolves it automatically; pass `--area` only to override.

### Tags the mirror applies

| Tag | Level | Effect |
|---|---|---|
| `@qase-project:<CODE>` | Feature | the scenario is skipped unless `QASE_PROJECT` matches, so a feature mirrored from another project can never upload into the wrong one |
| `@<module>` | Feature | the module tag, from the Qase suite |
| `@qase-id:<id>` | Scenario | pins the case; repeat for a multi-id case |
| `@manual` | Scenario | the case is not flagged **To be automated** in Qase — the scenario is emitted and reported as *skipped*, never as a false green |

### Step definitions mirror the feature 1:1

Every `Given`/`When`/`Then`/`And` line has exactly one matching definition, and
no definition exists that no line uses. A line with no definition is a *missing
step*: `bddgen` reports it and the project's `missingSteps: "skip-scenario"`
skips that scenario. Never paper over it by loosening another expression until
it accidentally matches.

```ts
// steps/dashboard/bid-ocean-support.steps.ts
import { Given, When, Then } from "../../shared/bdd/fixtures.js";
import type { StepContext } from "../../shared/pom-fixtures.js";

//
// Navigation
//

export async function openProfileDropdown({
  bidOceanSupportPage,
}: Pick<StepContext, "bidOceanSupportPage">): Promise<void> {
  await bidOceanSupportPage.openProfileDropdown();
}
Given("the user has opened the profile dropdown", openProfileDropdown);
```

- Group definitions into banner-commented **domain sections**, never by keyword.
  Matching ignores Given/When/Then, so a flat wall of 250 `Given`s is
  unnavigable. `--emit-steps` emits one flat sorted list with a `TODO` at the
  top; creating the sections is part of implementing the module.
- Put every body in an **exported function** and let the binding delegate to it.
  A classic spec can then import the same function — that is what makes the step
  layer shared between the styles.
- An unimplemented step must leave the scenario **skipped**, not green. Use the
  `pending` body from `shared/bdd/fixtures.ts`, or leave the step undeclared.
- A leftover definition nobody calls is dead code — delete it. `playwright-bdd`
  does not warn about unused steps, so this one is on review.

### Running

```bash
npm run bddgen           # regenerate .features-gen/ from features/ + steps/
npm run test:bdd         # bddgen + run every feature
npm run test:bdd:headed  # visible browser
npm run test:bdd:cycle   # mint a fresh Qase run, then run every feature
```

Always re-run `bddgen` after editing a feature or a step file — `npm run
test:bdd` does it for you.

---

## 7. Environment — `.env`

`/qa-agent:setup` writes a filled-in `.env.example`; copy it to `.env` and add
the secrets. `.env` is gitignored and must never be committed.

**No plugin-owned file contains any of these values.** They are read only
through the typed gateway in `shared/env.ts`, so a missing one fails loudly
instead of silently falling back to another team's app.

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

# --- Frontend source (selector discovery) ----------------------------------
# Only codegen and healing read these, so a plain test run works without them.
FE_REPO_URL=git@github.com:acme/frontend-web.git
FE_BRANCH=main
FE_REPO_ROOT=frontend-web            # the checkout root
FE_REPO_PATH=frontend-web/src        # the subtree actually scanned
SSH_KEY=                             # optional, injected via GIT_SSH_COMMAND

# --- Jira / Atlassian (defect commenting) ----------------------------------
BASE_URL_ATLASSIAN=https://acme.atlassian.net
EMAIL=
ATLASSIAN_TOKEN=
JIRA_PROJECT_KEY=QAA
JIRA_PARENT_ISSUE_ID=1900
```

Required at import time: `HOST`, `USER_ID`, `USER_PWD`, `QASE_PROJECT`,
`POST_LOGIN_URL_PATTERN`. Everything else is optional, with the consumer raising
a named error if it needs a value that is empty — `FE_REPO_PATH`, for instance,
only throws when `findTestIds()` actually runs.


### `azure` stack

`/qa-agent:setup --stack azure` writes this instead. One PAT covers everything
Azure — Boards (tracker), Repos (FE clone + optional QA-repo push), and any
Test Plans surface Qase does not own. Scopes needed on the PAT:

- **Work Items (Read & Write)** — Boards defect commenting (§8 of the contract)
- **Code (Read)** — clone/pull the FE repo when `FE_REPO_URL` is an Azure
  Repos HTTPS URL (see §7.1 below)
- **Code (Read & Write)** — only if this QA repo itself lives in Azure Repos
  and you push from your machine (see §7.2 below)

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
QASE_PROJECT=ACME                      # REQUIRED
API_TOKEN=                             # REQUIRED when QASE_MODE=testops
QASE_MODE=off                          # testops = upload results
CYCLE_KEY=                             # leave EMPTY — qa-runner mints one

# --- Azure DevOps (Boards tracker + Repos source hosting) ------------------
AZURE_ORG_URL=https://dev.azure.com/acme    # REQUIRED
AZURE_PROJECT=AcmeQA                        # REQUIRED — the project NAME
AZURE_PAT=                                  # REQUIRED — see scopes above
# Work item defects default to when no key is passed (Epic or PBI id).
AZURE_PARENT_WORK_ITEM_ID=4821

# --- Frontend source (selector discovery) ----------------------------------
# Azure Repos HTTPS URL — utils/fe-repo-sync.ts injects AZURE_PAT via
# `http.extraheader` (Basic auth). PAT never lands in the URL, git config,
# or reflog. SSH URLs (git@…) also work; fe-repo-sync picks the auth mode
# by URL shape.
FE_REPO_URL=https://dev.azure.com/acme/AcmeQA/_git/frontend
FE_BRANCH=main
FE_REPO_ROOT=frontend
FE_REPO_PATH=frontend/src
# SSH_KEY is ignored for Azure Repos HTTPS URLs; keep empty on this stack.
SSH_KEY=
```

Required at import time on this stack: `HOST`, `USER_ID`, `USER_PWD`,
`POST_LOGIN_URL_PATTERN`, `AZURE_ORG_URL`, `AZURE_PROJECT`. There is no separate
tracker URL or project — Boards and Repos share the org and project above.

#### 7.1 Trigger by ticket kind — Epic, PBI, or `[TA-…]`

`/qa-agent` accepts any of the three parent kinds; all three land on the same
`generate → run → heal → defect → PR` pipeline. Ticket kind is auto-detected
from the summary prefix (`classifyChildBySummaryPrefix()`, applied to the
Azure work-item title). The recursion is done by `getEpicChildren()` — a
WIQL query with `MODE (Recursive)` over `System.LinkTypes.Hierarchy-Forward`
— so it walks every descendant regardless of the intermediate level.

Standard Azure hierarchy (`Epic → Feature → PBI → Task`):

```
Epic  AB#12345  "SPRINT 8 — new checkout"
 └─ PBI  AB#67890  "As a shopper I can add a promo code"
     ├─ Task  AB#98765  "[TM-01] Manual test cases (Qase plan 42)"
     ├─ Task  AB#98766  "[TA-01] Playwright automation"
     ├─ Task  AB#98767  "[FE-01] Frontend implementation"
     └─ Task  AB#98768  "[BE-01] Backend implementation"
```

Flat variant — the `[TM]` / `[TA]` / `[FE]` / `[BE]` set sits **directly
under the Epic** (no intermediate PBI):

```
Epic  AB#12345  "Checkout — promo code"
 ├─ AB#98765  "[TM-01] Manual test cases (Qase plan 42)"
 ├─ AB#98766  "[TA-01] Playwright automation"
 ├─ AB#98767  "[FE-01] Frontend implementation"
 └─ AB#98768  "[BE-01] Backend implementation"
```

| Trigger | What the orchestrator does |
|---|---|
| `/qa-agent AB#<epic-id>` | Read the Epic + every descendant recursively. The `[TM-…]` names the Qase plan; failures route to the matching `[FE-…]` / `[BE-…]` sibling. |
| `/qa-agent AB#<pbi-id>` | Read the PBI + its Task children — identical to the Jira user-story path. Defect-routing `EPIC` = the PBI id. |
| `/qa-agent AB#<ta-id>` | Walk `[TA]` → parent → the `[TM-…]` sibling → its Qase plan. |

If the Epic descendants contain more than one `[TA-…]` / `[TM-…]` set (e.g.
two independent PBIs under one Epic), pass the specific PBI id instead of
the Epic id so the orchestrator scopes to one Qase plan.

#### 7.2 Pushing this QA repo to Azure Repos

When the QA repo itself lives in Azure Repos, initialise (if not already
under git) and push with the same PAT — no credential helper required, and
the PAT stays in process memory rather than being written to `.git/config`:

```bash
# 1) Create the empty target repo in Azure DevOps first
#    (Portal → Repos → New repository), then from your QA-Agent repo root:
git init -b main
git add -A
git commit -m "chore: initial import of QA-Agent scaffold"
git remote add origin https://dev.azure.com/<org>/<project>/_git/<repo>

# 2) One-shot push, PAT read from .env (never written to git config):
set -a; source .env; set +a
AUTH=$(printf ':%s' "$AZURE_PAT" | base64)
git -c http.extraheader="Authorization: Basic $AUTH" push -u origin main
```

Notes:
- PAT scope required for the push: **Code (Read & Write)**.
- Before pushing, double-check `.gitignore` covers `.env`, `reports/`,
  `frontend/` (the FE checkout), `.features-gen/`, and `node_modules/`.
- CI (Azure Pipelines) uses its build-service identity — it does not need
  `AZURE_PAT` for `git checkout`.

#### 7.3 Run-log target — Azure Wiki (per-agent pages, env-driven)

**Two-stage flow.** The log lifecycle is unchanged from the jira stack up
until the sync step:

1. **Write to JSONL** — every step in `commands/qa-agent.md` fires
   `hubexo-spec-sprint:run-logger` (prefilled) after the sub-command
   returns. The skill records the step to `logs/run-log.jsonl` and fills
   in `token_cost` and `duration` at write time (the two fields you
   cannot recover after the fact). **This step is identical on both
   stacks** — do not bypass it by appending JSONL from a shell
   heredoc, or `token_cost` and `duration` show up empty in every
   downstream view.
2. **Sync to the docs target** — only this step differs by stack:
   - `jira` → `hubexo-spec-sprint:run-logger-sync` (Confluence).
   - `azure` → `npm run run-log:sync` (Azure Wiki). Wired here because
     `run-logger-sync` targets Confluence only and does not read `.env`.
     The plugin-owned syncer at `utils/run-log-to-azure-wiki.ts` reads
     `AZURE_WIKI_AGENT_LOGGER` and writes one child page per agent
     under the parent — same per-agent layout Confluence uses on the
     other stack.

Trigger the sync:

```bash
npm run run-log:sync
```

Configuration:

- `AZURE_WIKI_AGENT_LOGGER` in `.env` — the **parent page URL** (paste the
  full Azure DevOps Wiki page URL; the script parses the org/project/wiki
  identifier and the parent page id from it).
- `AZURE_PAT` — same PAT used for Boards, needs **Wiki (Read & Write)** on
  top of Work Items (R/W). Add the scope in Azure DevOps → user settings →
  *Personal access tokens* → edit → check *Wiki (Read & Write)*.

Behavior on each sync:
- Reads `logs/run-log.jsonl` (the local audit trail `run-logger` writes).
- Groups entries by `agent`.
- Rewrites the parent page as an auto-generated index of child pages.
- Creates or updates one child page per agent
  (`qa-agent-orchestrator` / `qa-codegen` / `qa-runner` / `qa-healer` /
  `qa-defect` / `qa-pr`) with a Markdown table of that agent's entries.

Wire the sync where you want it in the pipeline (typically at the end of
`/qa-agent-run` and again after `/qa-agent-pr`). The orchestrator step-log
contract from `commands/qa-agent.md` still stands — the local JSONL is the
source of truth; sync failures are reported, not blocking.

**Gotcha — never bypass `run-logger` on the write side.** If an
orchestrator run (or a hand-driven pipeline) writes entries by appending
raw JSON to `logs/run-log.jsonl` instead of dispatching the
`hubexo-spec-sprint:run-logger` skill, the sync target will show blank
cells in the `token_cost` and `duration` columns for those rows — the
syncer only renders what the JSONL carries. Fix it by re-running the
step through the skill (which appends a fresh, complete row); the older
partial rows can be dropped by editing `logs/run-log.jsonl` before the
next sync.

**Preflight validator (built into `npm run run-log:sync`).** The syncer
scans `logs/run-log.jsonl` before writing to the Wiki and prints one
`WARN` per row missing `duration` or `token_cost`, naming the row's
timestamp and agent so you know which step to re-fire. Default behavior
is soft (warn + sync anyway with blank cells); set `RUN_LOG_STRICT=1` in
the environment to make the syncer abort instead — useful in CI to
guarantee the Wiki never receives partial data. Example:

```bash
RUN_LOG_STRICT=1 npm run run-log:sync
```

Recovery when the validator flags a row: re-fire the offending step's
`hubexo-spec-sprint:run-logger` call (which appends a new, complete
row), then re-run the sync. The syncer never edits or drops rows on its
own — JSONL is source of truth.

### Azure Pipelines

An `azure` repo also gets `azure-pipelines.yml`, running the same sweep as the
GitHub workflow off the same module discovery. It reads its configuration from a
**variable group** named `qa-agent-secrets`:

| Variable | Secret? | What it is |
|---|---|---|
| `USER_ID`, `USER_PWD` | yes | test account |
| `AZURE_PAT` | yes | the PAT above |
| `HOST`, `SSO_LOGIN_URL` | no | resolved per environment |
| `AZURE_ORG_URL`, `AZURE_PROJECT` | no | as in `.env` |
| `POST_LOGIN_URL_PATTERN` | no | required |
| `APP_NAME` | no | labels the test run |

The `setup` stage verifies all of the required ones before installing anything
and fails naming the missing pipeline setting, exactly like the GitHub job.

**Where test data belongs.** Business data (project ids, expected lists,
keywords) comes from the **Qase plan Description**, which qa-codegen
materialises into `fixtures/<module>.json`, keyed by reusable semantic entity
rather than by case id. Environment and infrastructure config goes in `.env`.
Curated values that are neither — a project id a QA author picked by hand — go
in the `App-specific config` section of `shared/env.ts`, kept env-overridable.

---

## 8. GitHub Actions — secrets and variables

The scaffolded `.github/workflows/regression.yml` reads its configuration from
repo settings. Secrets hide their value; variables do not, so put anything
non-sensitive in variables where it stays readable in the run log.

The workflow file lives in the repo — adjust it there and commit; nothing in CI
is configured from this page.

### Settings → Secrets and variables → Actions → **Secrets**

| Secret | Required | What it is |
|---|---|---|
| `USER_ID` | yes | primary test account |
| `USER_PWD` | yes | its password |
| `HOST_STAGING` | yes | staging base URL |
| `SSO_LOGIN_URL_STAGING` | yes | staging login URL |
| `API_TOKEN` | for Qase upload | Qase API token |
| `EMAIL` | for Jira comments | Atlassian account email |
| `ATLASSIAN_TOKEN` | for Jira comments | Atlassian API token |
| `HOST_PRODUCTION` | only `env=production` | production base URL |
| `SSO_LOGIN_URL_PRODUCTION` | only `env=production` | production login URL |
| `TEAMS_WEBHOOK_URL` | optional | Incoming Webhook for the run-summary card |

`GITHUB_TOKEN` is provided by Actions — never add it yourself.

### Settings → Secrets and variables → Actions → **Variables**

| Variable | Required | What it is |
|---|---|---|
| `QASE_PROJECT` | yes | Qase project code |
| `APP_NAME` | optional | labels the Qase run; falls back to the repo name |

The regression sweep is **product-agnostic and tracker-agnostic** — it reads
only the app creds + Qase project. Jira/Atlassian and FE-source variables are
NOT part of the CI path; they belong to `/qa-agent-generate` and `/qa-agent`
which run from a developer machine.

The `setup` job verifies `USER_ID`, `USER_PWD` and the host/SSO pair for the
chosen environment **before installing anything**, and fails naming the missing
GitHub setting. A sweep never starts against a blank host.

### The regression sweep

Triggered by `workflow_dispatch`. Inputs: `env` (staging/production) and
`cycle_key` (reuse a Qase run). No product-specific toggles — the sweep runs
whatever modules `list-modules.ts` finds, top-to-bottom.

Jobs: `setup` (preflight, install, typecheck, lint, mint the Qase run, discover
modules) → `module` (one sequential job per discovered module; a red module is
captured with `continue-on-error` and never halts the sweep) → `notify` (summary
card, a no-op without `TEAMS_WEBHOOK_URL`).

**Deterministic retries.** The env sets `PW_RETRIES=0` so every red module is
a real red — retries never mask flake in regression. `playwright.config.ts`
reads that env and pins `retries` to `0` for the CI sweep; local ad-hoc
dispatches fall back to `IS_CI ? 2 : 0` when the env var is unset.

The module list is data-driven: `npm run modules` unions `tests/e2e/<m>/` with
`features/**/<m>.feature` and keeps the modules that have a `test:<m>` script.
qa-codegen writes that script into `package.json` for every generated module —
adding a module means letting codegen emit the script, not editing the matrix.
A discovered module with no script is reported as a warning, not dropped
silently.

`workers: 1` is enforced everywhere, CI included: most apps under test allow one
active SSO session per user, so two workers evict each other's session and
bounce in-flight tests to the login page. Do not raise it without a pool of
distinct test accounts.

---

## 9. Day-to-day commands

| Command | What it does |
|---|---|
| `/qa-agent <JIRA-KEY \| AB#<id>>` | End to end from a tracker ticket: read the plan → generate → run → heal → defect → PR. Accepts a Jira epic/story/`[TA-…]` key on the jira stack, or an Azure Boards work-item id on the azure stack |
| `/qa-agent:tms <PLAN_ID \| TC-xxxx \| case:<id>>` | Same pipeline driven by a TMS plan **or** single case id (Qase), with no tracker/epic (so no defect routing) — still runs all the way through to PR |
| `/qa-agent-generate plan:<id>` | Generate assets from a plan or a single case. Does not run |
| `/qa-agent-run plan:<id>` | Execute on Chromium, mint a fresh Qase run, upload status + video + screenshots |
| `/qa-agent-heal <module>` | Re-resolve broken selectors, re-run with up to 2 retries, record the heal |
| `/qa-agent-defect <EPIC-KEY>` | Comment failures onto the matching Jira FE/BE children and post a run summary. Never files a bug, never transitions an issue |
| `/qa-agent-pr` | Open or update the PR with the Jira and Qase context stamped in |
| `/qa-agent:setup` | Scaffold a repo, or add a style |
| `/qa-agent:upgrade` | Refresh the framework files from the installed plugin |

npm scripts common to both styles:

```bash
npm test                 npm run typecheck        npm run lint
npm run test:ui          npm run report           npm run modules
npm run fe:sync          npm run install:browsers
npm run qase:create-run -- "Title"
npm run qase:plan-style -- plan:<id>
npm run qase:feature-sync -- plan:<id> --module <m>
```

**Browser scope is Chromium only.** Cross-browser coverage is explicitly out of
scope; do not add Firefox, WebKit or mobile projects.

After any code change, `npm run typecheck` and `npm run lint` must pass before
the work counts as done.

---

## 10. Upgrading the framework

```
/plugin update qa-agent
/qa-agent:upgrade            # dry run — lists what would change
/qa-agent:upgrade --apply
npm install                  # only if pinned devDependencies moved
npm run install:browsers     # only if @playwright/test moved
```

Dry run is the default deliberately: these files are the contract the agents
obey, and a silent overwrite of a locally patched one is how a team loses a fix
without noticing. Review the diff before applying.

If a file differs because your repo patched it, move the patch into a repo-owned
file — or upstream it into the plugin. Editing a plugin-owned file back will be
reverted by the next upgrade.

### What upgrade syncs

Beyond the plugin-owned files listed in §11, `/qa-agent:upgrade` also
performs a **narrow, surgical sync** of `package.json`:

- **Pinned devDependencies** — `@playwright/test`, `playwright-qase-reporter`,
  `playwright-bdd` (bdd style only). The plugin owns these version strings
  end-to-end so every team runs the same browser build + reporter contract.
  A mismatch shows up in the dry-run as
  `package.json → devDependencies.<name>  (current → target)`.
- **Floating tooling** — `typescript`, `eslint`, `tsx`, `@types/node`,
  `@eslint/js`, `dotenv`, `typescript-eslint`, `dotenv`. Deliberately
  **not** policed. Teams may bump these locally without triggering a diff.
- **`.claude/qa-agent.json`** — refreshes `pluginVersion` and
  `lastUpgradedAt`. `scaffoldedAt` and `scaffoldedWith` are preserved from
  the original scaffold so a maintainer can always see where a team started.

After a pinned Playwright bump, always run `npm run install:browsers` — the
Chromium binary is version-locked to `@playwright/test`, so skipping this
step leaves the repo running the previous browser build.

### Where the plugin version comes from

`.claude-plugin/plugin.json` and `.claude-plugin/marketplace.json` carry the
plugin's SemVer version, kept in lock-step. `.claude/qa-agent.json` in each
scaffolded repo records:

- `pluginVersion` — the version this repo is currently on (refreshed by
  `/qa-agent:upgrade --apply`).
- `scaffoldedWith` — the version that originally created the repo. Never
  changes after scaffold, so drift over time stays visible.
- `lastUpgradedAt` — the ISO date of the most recent `--apply`, or `null`
  if the repo has never been upgraded.

See `CHANGELOG.md` for the release history and `CONTRIBUTING.md` for the
versioning policy (PATCH / MINOR / MAJOR triggers, bump procedure, review
checklist).

---

## 11. Who owns which file

This boundary is what makes upgrades safe.

**Plugin-owned** — `/qa-agent:upgrade` overwrites these wholesale. Never
hand-edit them.

```
CLAUDE.md  eslint.config.js  tsconfig.json  playwright.config.ts
utils/*  scripts/*  .github/workflows/*
shared/{custom-expect,global.setup,hooks,session,viewport}.ts
shared/test-fixtures.ts  shared/bdd/fixtures.ts
utils/tms.ts  utils/tracker.ts  and the stack's provider modules
azure-pipelines.yml  (azure stack)
```

**Repo-owned** — written once at init, yours from then on. Upgrade never touches
them.

```
.env  .claude/app-profile.md  .claude/memories/*
shared/env.ts  shared/auth.setup.ts  shared/pom-fixtures.ts
pages/  locators/  tests/  features/  steps/  fixtures/
```

**Split ownership** — `package.json` and `.claude/qa-agent.json` are
repo-owned in principle, but `/qa-agent:upgrade` performs a narrow sync on
them:

- `package.json` — only the **pinned devDependency versions** (Playwright,
  Qase reporter, playwright-bdd) get bumped. `scripts`, `dependencies`,
  floating tooling (`typescript`, `eslint`, `tsx`, …), engines, and every
  other field are left alone.
- `.claude/qa-agent.json` — `pluginVersion` and `lastUpgradedAt` are
  refreshed. `scaffoldedAt`, `scaffoldedWith`, `style`, `stack`, and the
  `app` block are preserved.

This is the mechanism §10 uses to roll out a Playwright pin change to every
team without touching their tests or configuration.

---

## 12. Conventions worth knowing before you generate anything

**Source-of-truth priority.** When resolving a page, a locator or test data,
search in this order and stop at the first hit: existing locator → existing page
object → frontend source (`$FE_REPO_PATH`) → the real DOM. Never regenerate what
already exists; a duplicate page or locator is a validation failure.

**Selector priority.** `data-testid` → `aria-label` → `role` → stable `id` →
semantic CSS → xpath (last resort, and it must be justified in a comment).
`:nth-child` is banned. A heal must never *downgrade* priority to make a test
pass.

**Automation status drives execution, not emission.** Every case in the plan is
generated, title and `qase.id` included. The Qase automation flag only decides
whether the body runs: *To be automated* runs normally, *not automated* is
emitted but skipped so Qase reports it as skipped rather than passed. This keeps
the generated file 1:1 with the plan instead of leaving silent gaps. After a
run, a reporter flips every passed case to *Automated*.

**Jira is comment-only, with exactly one exception.** The defect agent comments
on existing children — it never creates an issue and never transitions one.
Failures are routed by signature: selector, render and assertion failures go to
the `[FE-…]` child; HTTP 4xx/5xx or `**/api/**` timeouts go to `[BE-…]` (this
signal wins when the two disagree).

The single exception is the platform's only workflow write: when **every**
scenario in a run passed, the orchestrator moves the `[TA-…]` automation ticket
to **WAITING TO DEPLOY**. One failure means no transition; skipped scenarios
(`@manual`, or a case not flagged *To be automated*) do not count as failures.
The transition is discovered live and matched on the destination state, so no id
is hardcoded and a tenant whose button reads something else still works — but if
the ticket has no path to that state, the run says so rather than claiming a
move that did not happen.

No other issue is ever transitioned, in either direction. A test run should not
drive a developer's board.

**Self-healing has a budget.** One fix plus two retries. Stop as soon as it goes
green; escalate to the defect flow if it is still red and the cause is a product
defect. Never force a pass to avoid escalating, and record every replacement in
`.claude/memories/selector-history.md`.

---

## 13. Troubleshooting

| Symptom | Cause and fix |
|---|---|
| `Missing required env var "X"` | `.env` is incomplete. Copy `.env.example` again and compare. In CI, X is an unset secret or variable (§8) |
| `FE_REPO_PATH is empty` | selector discovery ran without the FE config. Set `FE_REPO_PATH` and run `npm run fe:sync` |
| A BDD scenario reports **skipped** | either the step is not implemented (`bddgen` lists missing steps), or the case is `@manual` — not flagged *To be automated* in Qase |
| A whole feature is skipped | its `@qase-project:` tag does not match `QASE_PROJECT`. The feature was mirrored from a different Qase project |
| `bddgen` changes nothing | you edited `.features-gen/` instead of `features/`. That folder is generated and gitignored |
| Tests bounce to the login page mid-run | two workers sharing one account. `workers: 1` is enforced by the config — check nothing overrode it |
| Results land in the wrong Qase project | `QASE_PROJECT` in `.env` (locally) or the repo variable (in CI). There is no hardcoded default anywhere |
| `/qa-agent*` commands missing | the plugin is not installed in this repo — see §2 |
| Upgrade wants to overwrite a file you changed | that file is plugin-owned (§11). Move your change into a repo-owned file or upstream it |
