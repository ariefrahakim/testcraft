import dotenv from "dotenv";

dotenv.config();

/** Throws if a required env var is missing — fail fast over silent undefined. */
function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var "${name}". Copy .env.example to .env and fill it in.`,
    );
  }
  return value;
}

function optional(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

/**
 * Single typed gateway to configuration. Never read process.env directly in
 * tests, pages, or utils — import from here so missing config fails loudly and
 * the surface area is documented in one place (CLAUDE.md §6).
 *
 * This is the **generic core** shipped by the qa-agent plugin. App-specific
 * curated test data (project ids, keywords, tier users, …) is appended by the
 * team that owns this repo, under the `App-specific config` section at the
 * bottom — `qa-agent-upgrade` never overwrites this file.
 */
export const env = {
  // App under test. Concrete values live in .env (see .env.example).
  host: required("HOST"),
  ssoLoginUrl: optional("SSO_LOGIN_URL", `${optional("HOST")}/login`),
  forgotPasswordUrl: optional("APP_FORGOT_URL"),

  /**
   * URL the app lands on after a successful login. `shared/auth.setup.ts` and
   * `pages/login/login.page.ts` both assert against it, so a different landing
   * route is a one-line `.env` change (`POST_LOGIN_URL_PATTERN`), not a code
   * edit. Stored as a string and compiled to a RegExp by the consumers.
   */
  postLoginUrlPattern: required("POST_LOGIN_URL_PATTERN"),

  // Primary test user
  userId: required("USER_ID"),
  userPwd: required("USER_PWD"),

  // Qase — test management on BOTH stacks (§7 of CLAUDE.md). `project` is
  // the app-under-test code, env-driven (QASE_PROJECT) with no hardcoded
  // default so the same wiring serves every app repo. Consumers on both
  // stacks read `env.qase.*` — do NOT wrap in a stack region.
  qase: {
    token: optional("API_TOKEN"),
    project: required("QASE_PROJECT"),
    runId: optional("CYCLE_KEY"),
    mode: optional("QASE_MODE", "off"),
  },

  // #region qa-agent:azure
  /**
   * Azure DevOps — Test Plans (test management) and Boards (issue tracker).
   *
   * One PAT covers both areas; it needs Test Management (read & write) and
   * Work Items (read & write). `planId` is optional: it only labels a created
   * test run with the plan it belongs to, and a run works without it.
   */
  azure: {
    orgUrl: required("AZURE_ORG_URL"),
    project: required("AZURE_PROJECT"),
    // Tracker-only PAT (Work Items scope). Test management is Qase; see
    // env.qase.mode + env.qase.token above for the TMS gate.
    pat: optional("AZURE_PAT"),
    /**
     * Work item defects are routed onto when no key is passed — the Azure
     * counterpart of `env.jira.storyKey` (CLAUDE.md §8). On the azure stack
     * this is a Product Backlog Item (PBI) id, and qa-defect resolves its
     * child Tasks (`[TM-…]`, `[TA-…]`, `[FE-…]`, `[BE-…]`) from there.
     */
    parentWorkItemId: optional("AZURE_PARENT_WORK_ITEM_ID"),
    /** Same name as the Jira side so callers read one property on both stacks. */
    get storyKey(): string {
      return this.parentWorkItemId;
    },
  },

  /**
   * Stack-neutral alias — points at `env.azure` on the azure stack (the
   * mirrored getter in the `qa-agent:jira` region above points at `env.jira`).
   * Agents/commands should read `env.tracker.storyKey` so the same
   * instructions render on both stacks.
   */
  get tracker() {
    return this.azure;
  },
  // #endregion qa-agent:azure

  /**
   * Frontend source checkout used by qa-codegen for selector discovery
   * (CLAUDE.md §3 step 3). `feRepoPath` is the exact subtree that gets
   * scanned; `fe.repoRoot` is the checkout root it lives inside. For a
   * monorepo these differ (root = the monorepo, path = one app); for a
   * single-app FE repo they are the same directory.
   *
   * `optional` on purpose, with no literal default: only codegen and healing
   * read the FE source, so a plain test run (CI included) must not fail at
   * import time for a value it never touches. The consumers guard instead —
   * `utils/fe-repo-sync.ts` and `selector-helper.findTestIds` throw a named
   * error when the value is empty.
   */
  feRepoPath: optional("FE_REPO_PATH"),

  fe: {
    repoRoot: optional("FE_REPO_ROOT"),
    gitUrl: optional("FE_REPO_URL") ?? optional("FE_GITHUB_LINK"),
    branch: optional("FE_BRANCH"),
    sshKey: optional("SSH_KEY"),
  },

  // #region qa-agent:jira
  // Jira / Atlassian (defect commenting). Base URL accepts either
  // BASE_URL_ATLASSIAN (preferred) or JIRA_BASE_URL (legacy); any trailing
  // slash is stripped so fetch URLs don't double-slash.
  jira: {
    email: optional("EMAIL"),
    token: optional("ATLASSIAN_TOKEN"),
    baseUrl: (
      optional("BASE_URL_ATLASSIAN") || optional("JIRA_BASE_URL")
    ).replace(/\/+$/, ""),
    projectKey: optional("JIRA_PROJECT_KEY"),
    parentIssueId: optional("JIRA_PARENT_ISSUE_ID"),
    /** Convenience: the issue key defects are commented on. */
    get storyKey(): string {
      return `${this.projectKey}-${this.parentIssueId}`;
    },
  },

  /**
   * Stack-neutral alias — points at `env.jira` on the jira stack, at
   * `env.azure` on the azure stack (see the mirrored getter in the
   * `qa-agent:azure` region below). Prefer `env.tracker.storyKey` in
   * agents/commands so the same instructions render on both stacks;
   * `.claude/qa-agent.json.stack` still decides which member shape you get.
   */
  get tracker() {
    return this.jira;
  },
  // #endregion qa-agent:jira

  // ==========================================================================
  // App-specific config — OWNED BY THIS REPO, never synced or upgraded.
  //
  // Curated business test data that is NOT parsed from a Qase plan description
  // goes here (CLAUDE.md §5: business data → the plan Description →
  // fixtures/<module>.json; environment/infra config → here). Keep every value
  // env-overridable so `.env` can swap a stale id without a code change:
  //
  //   myModule: {
  //     someProjectId: Number(optional("MY_MODULE_PROJECT_ID", "12345")),
  //   },
  // ==========================================================================
} as const;

export type Env = typeof env;
