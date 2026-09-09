# Rollout Guide — Adopting the QA-Agent Platform

Everything a QA team needs to prepare **before** running `/qa-agent:setup`, plus
the four concrete setup scenarios (`azure`/`jira` × `tdd`/`bdd`) laid out end
to end with the tokens, permissions, and `.env` values each one needs.

Read the [Runbook](./RUNBOOK.md) once first for the platform overview; this
document is the operational counterpart focused on onboarding.

> **Rule of thumb:** every value under `.env` and every credential listed here
> belongs to *your team*, not the plugin. Nothing in this repo carries a
> hard-coded project code, tenant, or ticket key. If setup asks you for a
> value, you are the source of truth for it.

---

## 1. Pre-rollout checklist — common to every team

### 1.1 Decide two things

| Decision | Value | Why it matters |
|---|---|---|
| **Stack** | `jira` (Qase + Jira) or `azure` (Azure Boards + Qase) | Fixes which credentials you need. **Cannot be changed in place** — a new stack means a new scaffolded repo. |
| **Style** | `tdd`, `bdd`, or `both` | Decides how Qase/Qase cases become code. Can be extended later with `/qa-agent:setup --add-style <tdd\|bdd>`; cannot be shrunk. |

If unsure, pick the stack your organisation already uses for tickets. On style,
`tdd` is the safer default; switch to `bdd` only when the test-management
project actually authors cases as Gherkin.

### 1.2 Machines

Every engineer who will run `/qa-agent:*` needs:

| Tool | Version | Where |
|---|---|---|
| Node.js + npm | ≥ 20 | https://nodejs.org — use `nvm` if you juggle projects |
| Git | any recent | `git --version` |
| GitHub CLI (`gh`) | any recent, authenticated | `gh auth login` — used by `/qa-agent:qa-agent-pr` |
| Claude Code | current | https://claude.com/claude-code |
| Playwright system deps | resolved by npm | Chromium is pulled by `npm run install:browsers`; on Linux CI you also want `sudo npx playwright install-deps` |

Recommended (not required — pipeline still runs without them):

| Add-on | Purpose | Install |
|---|---|---|
| Run Logger API key | Each QA agent POSTs audit rows to the orchestration API | Add `RUN_LOGGER_API_KEY` to the project's `.claude/settings.local.json` `env` object, then restart Claude Code — key from the Hubexo orchestration dashboard |
| MCP `playwright` | qa-codegen self-verifies the happy path in a real browser before handoff. Scaffolded automatically: `/qa-agent:setup` writes `.mcp.json` pinning `--headless --isolated` (CI parity + clean per-session context for single-SSO apps). Repo-owned — safe to drop `--headless` locally for visual debugging; `/qa-agent:upgrade` never touches it | Ships in the scaffold |
| Skill `graphify` | FE-graph accelerator for selector discovery + healing | See `~/.claude/skills/graphify/SKILL.md`; `/qa-agent:setup` step 4b will offer to build the graph |

### 1.3 Access requests

Before setup, file these access tickets (or confirm they already exist):

- [ ] Read access to `hubexo/hubexo-ai-agent-marketplace` (the plugin marketplace)
- [ ] Read access to the frontend-web repo(s) whose selectors the QA repo will
      scan — with an SSH key on your machine so `npm run fe:sync` succeeds
- [ ] A **service test account** on the app under test (username + password
      that survives long runs; not a personal account)
- [ ] Membership in the Confluence space the run logs will publish to
      (optional — only if you keep Confluence run logging enabled)

### 1.4 Team artefacts to have ready

- **Team name / slug** for `.team.json` (short kebab, e.g. `tnlm`)
- The **app-under-test display name** and **staging base URL**
- The **post-login URL pattern** (a regex fragment the URL matches once the
  test user is authenticated — e.g. `/dashboard` or `/home`). This is asserted
  by `shared/auth.setup.ts`; a wrong pattern means every test fails at login.
- Your FE repo SSH URL, branch, checkout root, and (for monorepos) the
  specific subtree the tests apply to
- A CI environment (GitHub Actions or Azure Pipelines) with permission to
  read your repo secrets

Once all four sections are green, proceed to §2 for the stack-specific values.

---

## 2. Credentials and tokens — by stack

### 2.1 `jira` stack — Qase + Jira

| Credential | Where to get it | Scope needed |
|---|---|---|
| **Qase API token** | Qase → *Profile → API tokens* → **Create** | Full access to the Qase project the tests belong to |
| **Qase project code** | Qase → Project settings → the short code in URLs (e.g. `ACME`, not the display name) | — |
| **Atlassian email** | The account that will post Jira comments | — |
| **Atlassian API token** | https://id.atlassian.com/manage-profile/security/api-tokens → **Create API token** | Access to the Jira project holding the defect parent |
| **Jira project key + parent issue number** | Jira project settings (e.g. `QAA` + `1900` → parent `QAA-1900`) | — |

Both tokens are secrets — never commit them, never paste them into a shared
document. Rotate them on a schedule your team agrees on (e.g. every 90 days).

### 2.2 `azure` stack — Azure Boards + Qase

| Credential | Where to get it | Scope needed |
|---|---|---|
| **Qase API token** | Qase → *Profile → API tokens* → **Create** | Full access to the Qase project (test management is Qase on both stacks). |
| **Qase project code** | Qase → Project settings → the short code in URLs (e.g. `ACME`) | — |
| **Azure DevOps Personal Access Token (PAT)** | Azure DevOps → user settings → *Personal access tokens* → **New Token** | **Work Items: Read & write** (Boards defect commenting), **Code: Read** (FE-repo clone via HTTPS), plus **Code: Read & write** if this QA repo lives in Azure Repos and you push from your machine. One PAT covers all three. |
| **Azure organisation URL** | The `https://dev.azure.com/<org>` portion in your Azure DevOps URL | — |
| **Azure DevOps project name** | The project name (not the id) — the same one Boards and Repos live under | — |
| **Default work-item id for defects** | The Epic or PBI id that unrouteable failures anchor to | — |

Set the PAT expiry to a length your rotation policy allows, and store it in
your team password manager for handoffs.

---

## 3. Setup scenarios

Each scenario walks the full flow: create the empty repo directory, run
`/qa-agent:setup`, fill `.env`, verify, wire up CI. Copy the `.env` block into
your `.env` file after `cp .env.example .env` and replace every `<…>`.

> **Before any scenario:** install the plugin in Claude Code
>
> ```
> /plugin marketplace add hubexo/hubexo-ai-agent-marketplace
> /plugin install qa-agent@hubexo-plugins
> ```

### 3.1 `jira` + `tdd` — Qase + Jira + classic specs

**Setup**

```
mkdir qa-playwright-<app-slug> && cd qa-playwright-<app-slug>
# open Claude Code in this directory, then:
/qa-agent:setup
```

Answers during setup:

- Tool stack: `jira`
- Development style: `tdd`
- App name / base URL / post-login pattern
- Qase project code
- FE repo SSH URL, branch, checkout root, scan subtree
- Jira tenant URL, project key, default parent issue number

Optional prompts:

- **Step 3b** (per-agent Confluence URLs): skip unless you have pre-existing
  Confluence pages you want the run logs to route to.
- **Step 4b** (Graphify graph): choose *build* if the `graphify` skill is
  installed — it warms the selector-discovery accelerator on first run.

**`.env` after setup**

```bash
# --- App under test --------------------------------------------------------
HOST=https://stage.acme.example
SSO_LOGIN_URL=https://stage.acme.example/login
POST_LOGIN_URL_PATTERN=/dashboard                # REQUIRED — regex fragment

# --- Primary test user -----------------------------------------------------
USER_ID=<service-test-account-username>
USER_PWD=<service-test-account-password>

# --- Qase (test management, source of truth) -------------------------------
QASE_PROJECT=<QASE_PROJECT_CODE>                 # REQUIRED — code, not name
API_TOKEN=<qase-api-token>
QASE_MODE=testops                                # off = local reports only
CYCLE_KEY=                                       # leave EMPTY

# --- Frontend source (selector discovery) ----------------------------------
FE_REPO_URL=git@github.com:<org>/<frontend-repo>.git
FE_BRANCH=main
FE_REPO_ROOT=frontend-web
FE_REPO_PATH=frontend-web/src
SSH_KEY=~/.ssh/id_ed25519                        # optional

# --- Jira / Atlassian (defect commenting) ----------------------------------
BASE_URL_ATLASSIAN=https://<tenant>.atlassian.net
EMAIL=<atlassian-account-email>
ATLASSIAN_TOKEN=<atlassian-api-token>
JIRA_PROJECT_KEY=<JIRA_PROJECT_KEY>
JIRA_PARENT_ISSUE_ID=<parent-issue-number>
```

**Verify locally**

`/qa-agent:setup` step 4c already offered to run `npm install` +
`npm run install:browsers` for you. If you accepted, skip those two lines
below. The remaining three commands read `.env`, so they always stay manual.

```bash
npm install                                # if you skipped setup step 4c
npm run install:browsers                   # if you skipped setup step 4c
npm run fe:sync                            # reads FE_* from .env; needs your SSH key
npm run typecheck && npm run lint          # green only after .env is filled
/qa-agent:qa-agent-generate plan:<qase-plan-id>   # first codegen against a real plan
```

**Ship to CI (GitHub Actions)** — set the secrets and variables listed in
[RUNBOOK §8](./RUNBOOK.md#8-github-actions--secrets-and-variables). Minimum to
run a staging sweep on this scenario:

- Secrets: `USER_ID`, `USER_PWD`, `HOST_STAGING`, `SSO_LOGIN_URL_STAGING`,
  `API_TOKEN`, `EMAIL`, `ATLASSIAN_TOKEN`
- Variables: `QASE_PROJECT`, `POST_LOGIN_URL_PATTERN`, `BASE_URL_ATLASSIAN`,
  `JIRA_PROJECT_KEY`, `JIRA_PARENT_ISSUE_ID`, and the four `FE_*` variables

---

### 3.2 `jira` + `bdd` — Qase (Gherkin cases) + Jira + `playwright-bdd`

**When to use.** Your Qase project authors cases with `steps_type: "gherkin"`
(each case is a Given/When/Then block, not action/expected rows). Confirm by
opening a case in Qase, or after the repo exists by running
`npm run qase:plan-style -- plan:<id>`.

**Setup**

```
/qa-agent:setup
```

Answers as in §3.1, except:

- Development style: `bdd`

Setup will additionally install `playwright-bdd`, create the `features/` and
`steps/` folders, and add the `bddgen`, `test:bdd`, `test:bdd:headed`,
`test:bdd:cycle` npm scripts.

**`.env`** — identical to §3.1. BDD authoring changes nothing about the
credentials.

**Additional first-run steps**

```bash
npm run qase:feature-sync -- plan:<id> --module <module-slug>
npm run bddgen
npm run test:bdd
```

`feature-sync` mirrors the Qase plan into `features/<area>/<module>.feature`;
Qase remains the source of truth. Never hand-edit the `.feature` file — re-run
sync after any Qase change.

**CI** — same secrets and variables as §3.1. The `regression.yml` workflow
already includes the BDD project when `test:<module>` scripts exist.

---

### 3.3 `azure` + `tdd` — Azure Boards + Qase + classic specs

**Setup**

```
mkdir qa-playwright-<app-slug> && cd qa-playwright-<app-slug>
/qa-agent:setup
```

Answers during setup:

- Tool stack: `azure`
- Development style: `tdd`
- App name / base URL / post-login pattern
- Azure org URL (`https://dev.azure.com/<org>`)
- Azure DevOps project **name** (not id)
- Qase project code + API token
- Default defect work-item id (an Epic or PBI id)
- FE repo URL (Azure Repos HTTPS, or SSH)

**`.env` after setup**

```bash
# --- App under test --------------------------------------------------------
HOST=https://stage.acme.example
SSO_LOGIN_URL=https://stage.acme.example/login
POST_LOGIN_URL_PATTERN=/dashboard                # REQUIRED
APP_FORGOT_URL=                                  # optional

# --- Primary test user -----------------------------------------------------
USER_ID=<service-test-account-username>
USER_PWD=<service-test-account-password>

# --- Qase (test management on both stacks) --------------------------------
QASE_PROJECT=<QASE_PROJECT_CODE>                 # REQUIRED
API_TOKEN=<qase-api-token>                       # REQUIRED for QASE_MODE=testops
QASE_MODE=testops                                # off = local reports only
CYCLE_KEY=                                       # leave EMPTY

# --- Azure DevOps (Boards tracker + Repos source hosting) -----------------
# Scopes on this PAT:
#   Work Items (R/W) — Boards defect commenting
#   Code       (R)   — clone/pull the FE repo when FE_REPO_URL is Azure Repos
#   Code       (R/W) — only if this QA repo is also in Azure Repos and you
#                      push from your machine (see step below)
AZURE_ORG_URL=https://dev.azure.com/<org>        # REQUIRED
AZURE_PROJECT=<AzureProjectName>                 # REQUIRED — project NAME
AZURE_PAT=<azure-devops-pat>                     # REQUIRED
AZURE_PARENT_WORK_ITEM_ID=<parent-work-item-id>  # REQUIRED — Epic or PBI id

# --- Frontend source (selector discovery) ----------------------------------
# When FE lives in Azure Repos, use the HTTPS URL — utils/fe-repo-sync.ts
# injects AZURE_PAT via `http.extraheader` (Basic auth), so the PAT never
# lands in the URL, git config, or reflog. SSH URLs (git@…) also work.
FE_REPO_URL=https://dev.azure.com/<org>/<project>/_git/<frontend-repo>
FE_BRANCH=main
FE_REPO_ROOT=frontend
FE_REPO_PATH=frontend/src
SSH_KEY=                                         # leave EMPTY for Azure Repos HTTPS
```

There is **no separate tracker URL, project key, or Atlassian token** on this
stack — Boards and Repos share the org and project above, and one PAT
authenticates FE clone, Boards comments, and (optionally) pushing this QA
repo. Test management stays with Qase on both stacks.

**Verify locally**

`/qa-agent:setup` step 4c already offered to run `npm install` +
`npm run install:browsers` for you. If you accepted, skip those two lines
below. The remaining three commands read `.env`, so they always stay manual.

```bash
npm install                                # if you skipped setup step 4c
npm run install:browsers                   # if you skipped setup step 4c
npm run fe:sync                            # clones FE via AZURE_PAT (or SSH)
npm run typecheck && npm run lint          # green only after .env is filled
/qa-agent:qa-agent-generate plan:<qase-plan-id>
```

**Push this QA repo to Azure Repos** (optional — skip if it lives in GitHub /
Bitbucket instead). Create the empty repo in the Azure portal first, then:

```bash
git init -b main && git add -A
git commit -m "chore: initial import of QA-Agent scaffold"
git remote add origin https://dev.azure.com/<org>/<project>/_git/<repo>

# One-shot push; PAT stays in process memory, never written to .git/config:
set -a; source .env; set +a
AUTH=$(printf ':%s' "$AZURE_PAT" | base64)
git -c http.extraheader="Authorization: Basic $AUTH" push -u origin main
```

**Ship to CI (Azure Pipelines)** — the scaffold ships `azure-pipelines.yml`.
Configure a **variable group** named `qa-agent-secrets` in *Pipelines →
Library* with:

- Secrets: `USER_ID`, `USER_PWD`, `AZURE_PAT`
- Variables: `AZURE_ORG_URL`, `AZURE_PROJECT`
  (optional), `HOST`, `SSO_LOGIN_URL`, `POST_LOGIN_URL_PATTERN`, `APP_NAME`

The `setup` stage of the pipeline fails naming any missing setting **before**
installing dependencies, so a sweep never starts against a blank org.

---

### 3.4 `azure` + `bdd` — Qase (Gherkin) + Azure Boards + `playwright-bdd`

**When to use.** Your Qase cases are authored as Gherkin or carry
a `bdd`/`gherkin` tag. `npm run qase:plan-style -- plan:<id>` also works on
the Azure stack (`plan-style` is stack-agnostic).

**Setup**

```
/qa-agent:setup
```

Answers as in §3.3, except:

- Development style: `bdd`

**`.env`** — identical to §3.3.

**Additional first-run steps** — same as §3.2, replacing Qase with Azure Test
Plans. The `feature-sync` script talks to whichever TMS the stack is on:

```bash
npm run qase:feature-sync -- plan:<azure-plan-id> --module <module-slug>
npm run bddgen
npm run test:bdd
```

**CI** — same variable group as §3.3.

---

### 3.5 `--style both` — mixed authoring

If the TMS project holds *both* classic and Gherkin cases, run setup with
`--style both`. Nothing else changes — the two layers coexist in one repo,
each case's `steps_type` decides how it is generated. Adding the second style
later is `/qa-agent:setup --add-style <tdd|bdd>`; the reverse (shrinking
`both` to a single style) is not supported — delete the layer manually.

---

## 4. First-run checklist

Once the repo scaffolds and `.env` is filled:

- [ ] `npm install` succeeds — **auto-run by setup step 4c** if you accepted;
      otherwise run manually
- [ ] `npm run install:browsers` downloads Chromium — **auto-run by setup
      step 4c** if you accepted. This alone will fail on Linux without
      `sudo npx playwright install-deps`
- [ ] `npm run fe:sync` clones or pulls the FE checkout (needs your SSH key
      + FE_* vars in `.env` — always manual)
- [ ] `npm run typecheck` and `npm run lint` are green (needs `.env`
      populated — always manual)
- [ ] `.claude/app-profile.md` — fill in the login-selector TODO rows and the
      testid convention row
- [ ] `/qa-agent:qa-agent-generate plan:<one plan id>` produces spec / page /
      locator files that pass typecheck
- [ ] `/qa-agent:qa-agent-run plan:<same id>` executes against staging and
      uploads results to Qase (both stacks) (`QASE_MODE=testops` /
      `QASE_MODE=testops`)
- [ ] The regression workflow (`.github/workflows/regression.yml` or
      `azure-pipelines.yml`) is triggered manually once end-to-end before
      leaving it on a schedule

If any of these fail, refer to [RUNBOOK §13 Troubleshooting](./RUNBOOK.md#13-troubleshooting).

---

## 5. After rollout — staying current

The plugin is versioned (SemVer) and rolls out via `/qa-agent:upgrade`. The
scaffolded repo records its version in `.claude/qa-agent.json`
(`pluginVersion`, `scaffoldedWith`, `lastUpgradedAt`).

**When a new version lands:**

```
/plugin update qa-agent
/qa-agent:upgrade                # dry run — lists what would change
/qa-agent:upgrade --apply
npm install                      # only if pinned devDependencies moved
npm run install:browsers         # only if @playwright/test moved
npm run typecheck && npm run lint
```

- Review the CHANGELOG entry ([`CHANGELOG.md`](../CHANGELOG.md) in the plugin
  repo) before running `--apply`. A **MAJOR** bump means migration steps are
  documented in that entry — read them first.
- Never edit a plugin-owned file to patch a bug. Any hand-edit will be
  reverted by the next `--apply`. Report the bug or open a PR against the
  plugin — see [`CONTRIBUTING.md`](../CONTRIBUTING.md).

---

## 6. Quick reference — permissions matrix

Copy this into your team's onboarding ticket:

| Access | jira + tdd | jira + bdd | azure + tdd | azure + bdd |
|---|---|---|---|---|
| `hubexo/hubexo-ai-agent-marketplace` (repo read) | ✅ | ✅ | ✅ | ✅ |
| FE repo (SSH read) | ✅ | ✅ | ✅ | ✅ |
| Service test account | ✅ | ✅ | ✅ | ✅ |
| Qase API token | ✅ | ✅ | — | — |
| Atlassian API token + email | ✅ | ✅ | — | — |
| Azure DevOps PAT (Test Mgmt R/W + Work Items R/W) | — | — | ✅ | ✅ |
| Confluence space (run logs — optional) | ➖ | ➖ | ➖ | ➖ |
| CI: GitHub Actions secrets configured | ✅ | ✅ | — | — |
| CI: Azure Pipelines variable group `qa-agent-secrets` | — | — | ✅ | ✅ |

Legend: ✅ required, ➖ optional, — not applicable.

---

## 7. Handover artefacts

When you sign the rollout off internally, hand the following to the QA lead:

1. The repo URL (the newly scaffolded QA repo, e.g.
   `github.com/<org>/qa-playwright-<app-slug>`).
2. The stack + style choice (`.claude/qa-agent.json` records it).
3. The plugin version scaffolded with (`.claude/qa-agent.json.scaffoldedWith`).
4. The CI dashboard URL for the regression workflow (staging + production if
   both are wired).
5. The test-management project URL (Qase) and, if
   Confluence run logging is on, the parent Agent Logs page URL.
6. The service test account credentials, delivered via the team password
   manager — never via chat/email.
7. A rotation date for every token (Qase API, Atlassian token, Azure PAT).

Point the lead at this guide, the [Runbook](./RUNBOOK.md), and the plugin
[CHANGELOG](../CHANGELOG.md) so they know where to look next time.
