# ---------------------------------------------------------------------------
# {{APP_NAME}} ({{REGION}}) — QA-Agent environment
#
# Copy to `.env` and fill in. `.env` is gitignored and must NEVER be committed.
# Every value is read through the typed gateway in `shared/env.ts` — code never
# touches process.env directly (CLAUDE.md §6).
# ---------------------------------------------------------------------------

# --- App under test --------------------------------------------------------
HOST={{BASE_URL}}
SSO_LOGIN_URL={{BASE_URL}}/login
# Optional: the forgot-password entry point, when a case exercises it.
APP_FORGOT_URL=
# Regex (as a string) the URL must match after a successful login. Used by
# shared/auth.setup.ts and pages/login/login.page.ts.
POST_LOGIN_URL_PATTERN={{POST_LOGIN_URL_PATTERN}}

# --- Primary test user -----------------------------------------------------
USER_ID=
USER_PWD=

# --- Qase (test management on BOTH stacks) --------------------------------
# Qase owns test cases, plans, `steps_type`, results upload, and the
# automation-status flip on passed cases (§7). Same env vars on `jira` and
# `azure` stacks — only the tracker below differs.
QASE_PROJECT={{TMS_PROJECT}}
API_TOKEN=
# testops = upload results to Qase; off = local reports only.
QASE_MODE=off
# Leave EMPTY: qa-runner mints a fresh run (cycle) per invocation.
CYCLE_KEY=

# #region qa-agent:azure
# --- Azure DevOps (tracker + Repos) --------------------------------------
# Test management is Qase (above); this section is Azure Boards (tracker) and
# Azure Repos (source hosting). One PAT covers both. Scopes needed:
#   - Work Items (Read & Write)  — Boards defect commenting (CLAUDE.md §8)
#   - Code (Read)                — clone/pull the FE repo via
#                                  utils/fe-repo-sync.ts when FE_REPO_URL is
#                                  an Azure Repos HTTPS URL
#   - Code (Read & Write)        — only if this QA repo itself lives in
#                                  Azure Repos and you push from your machine
AZURE_ORG_URL={{AZURE_ORG_URL}}
AZURE_PROJECT={{TMS_PROJECT}}
AZURE_PAT=
# #endregion qa-agent:azure

# --- Frontend source (selector discovery, CLAUDE.md §3 step 3) -------------
# Supported URL forms and how `utils/fe-repo-sync.ts` authenticates:
#   - Azure Repos over HTTPS (dev.azure.com / *.visualstudio.com)
#       → Basic auth from AZURE_PAT via `http.extraheader` (PAT never lands in
#         the URL, git config, or reflog). PAT scope: **Code (Read)**.
#         Format: https://dev.azure.com/<org>/<project>/_git/<repo>
#   - SSH (git@github.com:…, git@bitbucket.org:…, ssh://…)
#       → GIT_SSH_COMMAND with SSH_KEY (falls back to the default ssh-agent).
FE_REPO_URL={{FE_REPO_URL}}
FE_BRANCH={{FE_BRANCH}}
FE_REPO_ROOT={{FE_DIR}}
FE_REPO_PATH={{FE_SCAN_ROOT}}
# Optional: path to an SSH private-key file. Only used for SSH URLs; ignored
# when FE_REPO_URL is an Azure Repos HTTPS URL (AZURE_PAT is used instead).
SSH_KEY=

# #region qa-agent:jira
# --- Jira / Atlassian (defect commenting, CLAUDE.md §8) --------------------
BASE_URL_ATLASSIAN={{TRACKER_BASE_URL}}
EMAIL=
ATLASSIAN_TOKEN=
JIRA_PROJECT_KEY={{TRACKER_PROJECT_KEY}}
JIRA_PARENT_ISSUE_ID={{TRACKER_PARENT_ID}}
# #endregion qa-agent:jira

# #region qa-agent:azure
# --- Azure Boards (defect commenting, CLAUDE.md §8) ------------------------
# The tracker shares AZURE_ORG_URL / AZURE_PROJECT / AZURE_PAT above.
# Default defect parent — an Epic or User Story work-item id.
AZURE_PARENT_WORK_ITEM_ID={{TRACKER_PARENT_ID}}

# --- Run-log target (per-agent Azure Wiki pages) ---------------------------
# Where `npm run run-log:sync` (utils/run-log-to-azure-wiki.ts) writes.
# Paste the full page URL — the script parses org/project/wiki id/parent
# page id from it, then writes one child page per agent
# (qa-agent-orchestrator / qa-codegen / qa-runner / qa-healer / qa-defect /
# qa-pr) under that parent. Replaces the Confluence path from
# `hubexo-spec-sprint:run-logger-sync` on this stack.
#   Format: https://<org host>/<project>/_wiki/wikis/<wiki>/<pageId>/<slug>
AZURE_WIKI_AGENT_LOGGER=
# #endregion qa-agent:azure

# --- App-specific test data ------------------------------------------------
# Add curated, env-overridable values here as modules are generated. They are
# read via the `App-specific config` section of shared/env.ts.
