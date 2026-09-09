# CLAUDE.md — QA-Agent Contract

Guidance for Claude Code when working in this repository. This file is the
**system prompt, coding standard, architecture contract, source-of-truth
priority, selector strategy, reuse strategy, and self-healing policy** for the
QA-Agent platform. Every agent the `qa-agent` plugin ships obeys it.

> **Shared contract — keep app-agnostic.** This file is shipped by the
> **`qa-agent` Claude Code plugin** (which also provides the agents and the
> `/qa-agent:*` commands) and is identical in every repo the plugin scaffolds.
> `/qa-agent:upgrade` overwrites it wholesale, so **never edit it**. Everything
> specific to *this* app-under-test — app name, region, Qase project, FE source
> path, Jira parent/prefixes — lives in **`.claude/app-profile.md`** (per-repo,
> never upgraded). Where this contract names a concrete value, read it as this
> repo's instance of a value the app profile defines; to retarget the platform
> at another app, change `app-profile.md` + `.env`, **not** this file. Do not
> bake new app-specific constants into this contract.
>
> **Tool stack: `{{STACK}}`.** Test management is **Qase on both stacks**; only
> the issue tracker differs (Jira on `jira`, Azure Boards on `azure`). Reach
> them through `utils/tms.ts` and `utils/tracker.ts` — **import from those,
> never from a provider module** (`qase-helper`, `jira-helper`,
> `azure-boards-helper`). Both stacks expose the same member names behind those
> two files, which is what lets everything above them stay identical. §7
> describes Qase (same on both stacks); §8 describes the tracker in Jira terms
> and calls out where Azure Boards uses `Product Backlog Item → Task` in place
> of `Epic → Story` (the `[TM-…]` / `[TA-…]` / `[FE-…]` / `[BE-…]` prefixes
> ride on **Task** work items under a **PBI**).
>
> **Development style: `{{STYLE}}`.** This repo was scaffolded for that style
> (§5a). Sections describing the other style still apply verbatim should the
> style be added later via `/qa-agent:setup --add-style <tdd|bdd>`.

@.claude/app-profile.md

---

## 1. What this repo is

An autonomous, spec-driven Playwright test platform for **the app declared in
`.claude/app-profile.md`**. Qase test cases are the source of truth; tests are
generated, executed, reported to Qase, and failures are commented back to Jira.

The frontend source is checked out at `$FE_REPO_ROOT` and selector discovery
scans `$FE_REPO_PATH/**` **exclusively** — when the FE is a monorepo, never
mine testids from a sibling app or the repo root. Both come from `.env`
(`shared/env.ts` → `env.fe.repoRoot` / `env.feRepoPath`); the concrete paths
for this repo are tabulated in `.claude/app-profile.md`.

## 2. Commands

```bash
npm install                 # install deps
npm run install:browsers    # one-time Playwright browser download
npm test                    # run all tests (auth setup runs first)
npm run test:login          # run only the login module
npm run test:headed         # headed mode
npm run test:ui             # Playwright UI mode
npm run report              # open the last HTML report
npm run typecheck           # tsc --noEmit  (MUST pass before done)
npm run lint                # eslint        (MUST pass before done)
npm run fe:sync                      # clone/pull the FE source repo (master, SSH) — always run before codegen
npm run qase:create-run -- "Title"   # create a new Qase run, prints the id
npm run test:bdd                     # bddgen + run every features/**/*.feature (BDD cases)
npm run modules                      # list the regression modules CI will sweep (TDD + BDD)
npm run bddgen                       # regenerate .features-gen from features/ + steps/
npm run qase:plan-style -- plan:<id>  # bdd | classic | mixed (reads steps_type)
npm run qase:feature-sync -- plan:<id> --module <m> [--area <a>] [--project CODE] [--emit-steps]
                                     # mirror a Qase plan into features/<area>/<m>.feature
npm run test:plan<id>                # auto-written by qa-codegen: new cycle + run that plan
npm run test:<module>                # auto-written by qa-codegen: new cycle + run that module
```

`qa-codegen` writes a `test:plan<id>` / `test:<module>` script into
`package.json` for each scope it generates; each one mints a **fresh Qase
cycle** then runs the scope on chromium in a single command.

Target a single Qase case: `npx playwright test --grep "TC-2045"`.

**Browser scope: Chromium only.** The suite runs exclusively on the `chromium`
project (`Desktop Chrome`). Do not add Firefox/WebKit/mobile projects — cross-
browser coverage is explicitly out of scope for this platform.

After **any** code change, run `npm run typecheck` and `npm run lint` before
marking work done.

## 3. Source-of-truth priority (NON-NEGOTIABLE)

When resolving anything (a page, a locator, test data), search in this order and
**stop at the first hit** — never regenerate what already exists:

1. **Existing locator** — `locators/<module>/<module>.locator.ts`
2. **Existing page object** — `pages/<module>/<module>.page.ts`
3. **Frontend source** — `$FE_REPO_PATH/**` (scan for `data-testid`; never a sibling app)
4. **Real DOM** — last resort, inspect the running app

Duplicate pages or locators are a Validation Agent failure.

## 4. Selector strategy

Choose the highest-priority selector that uniquely identifies the element:

1. `data-testid`  → `[data-testid="..."]`
2. `aria-label`   → `[aria-label="..."]` / `getByRole(..., { name })`
3. `role`         → `getByRole(...)`
4. `id`           → `#id` (only stable, non-generated ids)
5. `css`          → semantic, never positional (`:nth-child` is banned)
6. `xpath`        → **last resort only**, must be justified in a comment

Prefer whatever testid convention the FE already documents (record it in
`.claude/app-profile.md` once discovered). The login screen is the common legacy
exception — it usually predates the testid standard and falls back to form
`name` attributes.

## 5. Repository layout

```
tests/e2e/<area>/<module>.spec.ts     TDD entry point — one spec per module, tagged by qase.id
features/<area>/<module>.feature      BDD entry point — Gherkin mirrored from Qase (steps_type: "gherkin")
steps/<area>/<module>.steps.ts        the SHARED business-step layer, used by BOTH entry points
.features-gen/                        bddgen output for the `bdd` project (generated, gitignored)
tests/generated/                      qa-codegen scratch output (graduates into e2e/)
fixtures/<module>.json                business test data parsed from the Qase plan's Description, keyed by reusable semantic entity (NOT by case id) — sibling of tests/
pages/<module>/<module>.page.ts       one module = one page object
pages/<module>/<module>.helpers.ts    optional — pure data transforms + reusable assertions for the module
locators/<module>/<module>.locator.ts one page = one locator file
shared/    env.ts auth.setup.ts global.setup.ts hooks.ts custom-expect.ts
           pom-fixtures.ts (page objects, shared) test-fixtures.ts (classic specs)
           bdd/fixtures.ts (playwright-bdd steps + Qase tag hooks)
utils/     logger.ts qase-helper.ts (Qase API + feature mirroring) jira-helper.ts
           selector-helper.ts date-helper.ts
reports/   html/ test-results/ .auth/ … (generated at runtime, gitignored)
.claude/   app-profile.md (this app's values) qa-agent.json (scaffold record)
           memories/ — agents + commands ship with the qa-agent plugin
<FE_DIR>/  FE source checkout (read-only), scanned for selectors
```

**One implementation, two entry points.** Both flows go through the same layers
and bottom out in the same page objects and locators:

```
BDD:  Feature  →  Step  →  Page  →  Locator
TDD:  Spec     →  Step  →  Page  →  Locator
```

`steps/<area>/<module>.steps.ts` is that shared layer: it exports **business
step functions** (the implementation) and binds them to Gherkin text for the
BDD runner. A classic spec imports the same exported functions and wraps each in
a `test.step(...)`. Never re-implement a step in a spec, and never let a step
reach past the page object into a raw selector.

**Test data has two homes — pick the right one:**

1. **Business data** (project ids, expected trade lists, keywords, etc.) →
   **Qase plan Description**, materialised by qa-codegen into
   `fixtures/<module>.json` (sibling of `tests/`). The file is keyed by
   **reusable semantic entity** (e.g. `constructionProjectWithSingleTrade`,
   `goodsServicesProject`), **never by Qase case id** — one datum is shared by
   every scenario that needs it instead of being copied per case. Each entity
   is an object grouping its fields (`{ projectId, tradeName }`,
   `{ projectId, type }`, `{ name }`, …). The plan's Description is the single
   source of truth: codegen parses each `TC-<n>` block (where `<n>` is the
   1-indexed plan position → `plan.cases[n-1].case_id`) and its
   `Default binding:` line — **the binding names the entity key(s) the case
   uses** — then regenerates the JSON file, merging cases that reuse an entity
   onto the same key. Specs import the fixture with
   `import bidSearchData from "../../../fixtures/bid-search.json" with { type: "json" };`
   and read it by entity, e.g. `bidSearchData.constructionProjectWithSingleTrade.projectId`.
   The `qase.id(<id>)` mapping is unchanged — the case is still pinned by
   `qase.id`; only the *data lookup* moved from case-id to entity name. Missing
   binding for a case the generator needs is a hard error — never silently pull
   from `.env` as a fallback.
2. **Environment / infra config** (credentials, URLs, Qase / Jira tokens,
   region, feature flags) → `.env` via `shared/env.ts`. There is no
   `fixtures/` folder; add new infra config to `shared/env.ts`, not as JSON.

## 5a. Two Qase authoring styles — classic and BDD

A Qase case carries a **`steps_type`** and the generator branches on it
(`utils/qase-helper.ts` → `qase.caseStyle(case)` / `qase.getPlanStyle(planId)`).
Both branches share the *same* skeleton — same `pages/`, `locators/`,
`fixtures/`, the same page-object fixtures (`shared/pom-fixtures.ts`),
`qase.id(...)` pinning, Chromium-only run, and Qase upload. Only where the
scenario text lives changes.

| `steps_type` | Case reads as | Generated assets |
|---|---|---|
| `classic` (default) | `action` / `expected_result` / `data` rows | `tests/e2e/<m>/<m>.spec.ts` — one `test()` per case, one `test.step()` per row (§6) |
| `gherkin` | one `Given/When/Then` block per case | `features/<m>.feature` + `steps/<m>.steps.ts`, run by **playwright-bdd** |

**BDD rules (additive — everything in §3, §4, §6 still applies):**

- **The BDD runner is `playwright-bdd`.** `bddgen` compiles every
  `features/*.feature` into `.features-gen/` (gitignored) and the `bdd` project
  in `playwright.config.ts` runs it. There is **no per-module `.spec.ts`** in the
  BDD flow. Always re-run `bddgen` after editing a feature or a step file —
  `npm run test:bdd` does it for you.
- **`features/`, `steps/` and `tests/e2e/` are nested by area** —
  `features/<area>/<m>.feature`, `steps/<area>/<m>.steps.ts`,
  `tests/e2e/<area>/<m>.spec.ts`. `<area>` is the case's **Qase test folder**
  (suite), kebab-cased; `<m>` is the module slug (§12). `feature-sync` resolves
  `<area>` from Qase automatically — pass `--area` only to override it.
- **The step definitions mirror the feature file, 1:1.** The feature file is the
  contract (and it is mirrored from Qase, §3): every `Given`/`When`/`Then`/`And`
  line in `features/<area>/<m>.feature` has **exactly one** matching definition
  in `steps/<area>/<m>.steps.ts`, and no definition exists that no feature line
  uses. Domain sections only *arrange* that set — they never add to it or drop
  from it. Concretely:
  - Never reword a step definition to something the feature does not say; if the
    wording is wrong, fix it **in Qase** and re-run `feature-sync`.
  - A line with no definition is a **missing step** — `bddgen` reports it and
    `missingSteps: "skip-scenario"` skips the scenario. Never paper over it by
    loosening another expression until it accidentally matches.
  - One definition may serve several lines only through a cucumber-expression
    capture (`{string}`, `{int}`, …) — that is the same wording parameterised,
    not a different step.
  - A leftover definition nobody calls is dead code: delete it (playwright-bdd
    does not warn about unused steps, so this one is on review).
- **Each layer only knows the next one down.** `Feature → Step → Page →
  Locator`, no shortcuts:
  - A **step** gets its behaviour from the module's page object
    (`pages/<area>/<m>.page.ts`) plus `expect`. It never imports a locator file,
    never writes a selector string, and never calls `page.locator(...)`
    (ESLint-enforced).
  - A **page object** gets its selectors only from
    `locators/<area>/<m>.locator.ts` — the sole place a raw selector is allowed
    (§4) — and exposes verb methods / `Locator` fields.
  - A **locator file** holds selector strings and nothing else.
  Anything a step needs that the page object does not expose yet is a **new page
  object method**, not an escape hatch in the step.
- **The step layer is shared with the TDD flow.** Put every step body in an
  exported business function and let the Gherkin binding delegate to it:

  ```ts
  export async function openProfileDropdown({
    bidOceanSupportPage,
  }: Pick<StepContext, "bidOceanSupportPage">): Promise<void> {
    await bidOceanSupportPage.openProfileDropdown();
  }
  Given("the user has opened the profile dropdown", openProfileDropdown);
  ```

  A classic spec imports `openProfileDropdown` and calls it inside a
  `test.step(...)`. `StepContext` (from `shared/pom-fixtures.ts`) is the POM
  bundle a step may ask for; `Pick<>` it so the dependencies are visible in the
  signature.
- **The `.feature` file is mirrored from Qase, never hand-authored.** Generate it
  with `npm run qase:feature-sync -- plan:<id> --module <m> [--project CODE]`
  (`--emit-steps` prints the step-definition skeleton). Qase stays the source of
  truth (§3); re-running overwrites the file.
- **Tag by module, not by label.** The mirrored feature carries
  `@qase-project:<CODE>` + `@<module>` at Feature level — the module tag comes
  from the case's **Qase test folder (suite)** — and `@qase-id:<id>` (plus
  `@manual` for a non-automated case) per Scenario. Do not re-add the case's
  semantic Qase tags. `@qase-project:` skips the scenario unless `QASE_PROJECT`
  matches, so a feature mirrored from another Qase project can never upload
  results into the wrong one; both tags are applied by the `Before` hook in
  `shared/bdd-fixtures.ts`.
- **Authoring style is playwright-bdd's** — `import { Given, When, Then } from
  "../shared/bdd-fixtures.js"`, **fixtures destructured as the first argument**
  (each page object by name, plus `page` and the `$`-fixtures), step captures
  after it. Step definitions are global: any feature may use any step.
- **A step definition is a step body, not a spec.** It drives the UI only
  through the **existing** `pages/<m>/<m>.page.ts` (which reads
  `locators/<m>/<m>.locator.ts`) and never inlines a selector
  (ESLint-enforced). Pure data transforms / reusable assertions still go to
  `<m>.helpers.ts`.
- **Group step definitions by domain, never by keyword.** Matching ignores
  Given/When/Then, so a flat wall of 250 `Given`s is unnavigable. Split the file
  into banner-commented domain sections, each holding its own
  `Given`/`When`/`Then`:

  ```ts
  //
  // Authentication & session
  //

  Given("a Core-tier user is signed in", ...);

  //
  // Navigation
  //

  Given("the user has opened the profile dropdown", async ({ bidOceanSupportPage }) => {
    await bidOceanSupportPage.openProfileDropdown();
  });
  ```

  `--emit-steps` emits one flat list (sorted Given → When → Then) with a `TODO`
  at the top — it does not guess the sections. **Creating them is part of
  implementing the module**, not an optional tidy-up.
- **An unimplemented step leaves the scenario skipped, never green.** Use the
  `pending` body from `shared/bdd-fixtures.ts` (what `--emit-steps` generates),
  or leave the step undeclared and let the project's
  `missingSteps: "skip-scenario"` handle it. This is the BDD form of the §11
  "never force a pass" rule.
- **A BDD module is addressed by its module name everywhere else.** The only
  thing to register is the `test:<m>` script in `package.json`:
  `npm run bddgen && playwright test --project=bdd .features-gen/features/<area>/<m>.feature.spec.js`.
  The regression matrix then picks it up **automatically** —
  `scripts/list-modules.ts` (`npm run modules`) discovers every module from
  `tests/e2e/<m>/` and `features/**/<m>.feature` and keeps the ones that have a
  `test:<m>` script, so `.github/workflows/regression.yml` needs no edit and a
  module without a script is flagged as a CI warning instead of silently
  skipped. Never add a runner name such as `bdd` to that matrix.

## 6. Coding standards

- **TypeScript, ESM.** Files & folders kebab-case; one module per folder.
- **Never read `process.env` directly** — import typed config from `shared/env.ts`.
- **Specs** import `test` / `expect` / `qase` from `shared/test-fixtures.ts`,
  never from `@playwright/test` directly (so POM fixtures + Qase tagging apply).
- **Page objects**: constructor takes `page`; expose `Locator` fields built from
  the module's `*.locator.ts`; actions are verb methods returning `Promise<void>`.
  No business assertions inside actions.
- **Clean specs — no free functions.** A spec contains only `describe`/`test`
  blocks and their Arrange → Act → Assert. It declares **no** helper functions,
  interfaces, or type aliases — **ESLint-enforced** in `tests/e2e/**/*.spec.ts`
  (`no-restricted-syntax`). Extract them by kind:
  - UI driving / network capture → a verb method on `pages/<m>/<m>.page.ts`.
  - Pure data transforms + reusable `expect()` assertions → a co-located helpers
    module `pages/<m>/<m>.helpers.ts` (import base `expect` from
    `@playwright/test`; never put `expect()` in the page object).
  - Generic, module-agnostic helpers → `utils/`.
  The spec imports these named helpers and defines none of its own.
- **Locators** live only in `locators/` — **never** inline a raw selector string
  (CSS/xpath/testid) in a page object or a spec. Page objects reference them as
  `page.locator(<module>Selectors.key)`; specs touch the UI only through page
  objects. This is **ESLint-enforced**: `page.locator('literal')` /
  `.locator(\`tpl\`)` is an error.
- **No hard waits.** `page.waitForTimeout` is banned (ESLint-enforced). Use
  web-first assertions, `waitForURL`, `expect.poll`, or `locator.waitFor`.
- **Test structure**: Arrange → Act → Assert. One Qase case per `test(...)`.
  The title is the **readable Qase scenario name**; the first line of the test
  body is `qase.id(<id>)` (e.g. `qase.id(12)`; multiple → `qase.id([12, 13])`).
  This keeps the spec aligned 1:1 with the Qase test scenario.
- **Mirror Qase steps with `test.step`.** Wrap each logical step of the case in
  `await test.step("<readable step>", async () => { … })` so the Playwright
  report/trace reflects the Qase scenario step-by-step. Use **Playwright-native
  `test.step`** — never `qase.step`; specs must not import from
  `playwright-qase-reporter` (the reporter already records native steps, and the
  suite stays runnable with no Qase coupling). `qase.id(...)` and any per-case
  `const data = …` line stay **outside** the steps; `test.skip(cond, reason)`
  stays at the **test-body top level** (never inside a step callback); keep
  cross-step values in scope via the step's return value
  (`const x = await test.step(..., async () => …)`).
- **No `any`** (warn); prefer `unknown` + narrowing.

## 7. Qase integration

- Reporter: `playwright-qase-reporter` (mode `testops`), wired in
  `playwright.config.ts`, gated on `QASE_MODE=testops` + `API_TOKEN`.
- Results upload to the project named by **`QASE_PROJECT`** in `.env`, run id
  `CYCLE_KEY`. There is no hardcoded project code anywhere in the repo. **Every
  `qa-agent-run` mints a fresh run (cycle)** — qa-runner always creates a new run
  and exports `CYCLE_KEY=$RUN_ID` for the test command, never reusing the
  `CYCLE_KEY` from `.env`. Create runs via `npm run qase:create-run` (or the
  auto-written `test:plan<id>` / `test:<module>` scripts, which create-run then
  run in one command).
- Pull cases/plans with `utils/qase-helper.ts` (`qase.getCase`, `qase.getPlan`,
  `qase.getPlanCases`). A "TC-2045" ref maps to numeric case id 2045.
- **Automation status drives execution, not emission — the plan → code
  mapping stays 1:1.** Each case has an `automation` status (0 = Manual /
  not-automated, 1 = **To be automated**, 2 = Automated — the "TO BE AUTOMATED"
  checkbox sets `1`). **qa-codegen emits every case in the plan** (BDD scenario
  or TDD `test()`, title + `qase.id(<id>)`); the status only decides whether the
  body runs:
  - `1` (To be automated) → generate + run normally.
  - `0` (Manual / not-automated) → generate the case with its title and
    `qase.id`, but skip execution so Qase reports it as **skipped**, not
    passed. **BDD**: the scenario is tagged `@manual` by `renderFeature`, and
    the `Before` hook in `shared/bdd/fixtures.ts` calls
    `$testInfo.skip(true, …)` on that tag. **TDD**: the first line inside the
    `test(...)` body (right after `qase.id`) is
    `test.skip(true, "case is not flagged 'To be automated' in Qase — reporting as skipped")`.
  - `2` (Automated) → runs normally; regenerate only on an explicit request.
  This keeps the generated file 1:1 with the Qase plan (no silent gaps) while
  surfacing unflagged cases as `skipped` in the run result. After a run, a
  custom reporter (`utils/qase-automation-reporter.ts`, same `QASE_MODE`/token
  gate as the qase reporter) flips every **passed** case to **Automated (2)** —
  so the test-management status tracks what the repo actually automates. Never
  hand-edit the flag as part of a normal run; let the reporter do it.

## 8. Jira defect policy

- **Never create bug tickets.** The Defect Agent only **comments** on Jira — it
  does not call any create-issue endpoint.
- **Exactly one workflow transition exists in this platform**, and the defect
  agent does not perform it. See "The one transition" below.
- The agent takes a **single Jira parent key** — an Epic (e.g. `NLM-4`) OR
  a Story (e.g. `NLM-66`) — and routes the latest Qase run's outcomes onto
  that parent's child issues. Children are classified by their summary prefix
  (`classifyChildBySummaryPrefix`):
  - `[FE…]` / `[Frontend]` → FE child (receives FE-sourced defect comments).
  - `[BE…]` / `[Backend]` / `[DB…]` / `[Database]` → BE child (receives
    BE-sourced defect comments; DB/persistence tickets route here).
  - `[TM…]` / `[T…]` / `[Test Case]` / `[QA]` → test child. `[TM]` is the
    **manual** test-case ticket authored in Qase — it is the **Qase-plan
    source**.
  - `[TA…]` → automation child — the **Playwright-automation ticket** (the
    Jira-comment trigger home + run-summary target).
  - **Per-run summary posts on every test + automation child present.** A family
    typically has a `[TM-…]` (manual/plan) and a `[TA-…]` (automation) ticket
    (and historically `[T-…]` + `[QA]`) — post the summary on **all** of them.
- **The green-run transition — all-green → every family child → WAITING TO
  DEPLOY.** When **every** scenario in the run passed, the orchestrator moves
  the whole family under the parent PBI / Story / Epic — `[TA-…]`, `[TM-…]`,
  `[FE-…]`, `[BE-…]` — to `WAITING TO DEPLOY` via
  `tracker.transitionToWaitingToDeploy(<key>)`, one call per child. All-green
  is the signal that the automated coverage cleared the whole vertical slice,
  so the whole slice moves together. Concretely:
  - **All-green means all-green.** One failed or errored scenario means no
    transitions anywhere. Skipped scenarios (`@manual`, or a case not flagged
    *To be automated*) do not count as failures.
  - Every child classified as `test` / `automation` / `fe` / `be` under the
    parent is transitioned. `[QA]` legacy tickets follow the `[TM-…]` rule.
    A test run drives the whole family's board only on green — a red run
    still never touches FE/BE (see the failed-path rule below).
  - There is a **failed-state transition**, and it is scoped: on a red run,
    the routed `[FE-…]` / `[BE-…]` child moves to `TEST: FAILED/BUGS` (never
    to WAITING TO DEPLOY). `[TM-…]` / `[TA-…]` receive the summary comment
    but do not transition on red.
  - Transitions are discovered live and matched on the **destination state**,
    so no transition id is hardcoded and a tenant whose button reads something
    else (e.g. "Pull request") still works.
  - If a ticket offers no path to that state, `transitionToWaitingToDeploy`
    returns `null` and logs what *was* available. Report each child's outcome
    plainly — never describe a run as transitioned when nothing moved.
- **Failure source** (FE vs BE) is decided from the error/locator signature
  **and** the trace network log. Selector / render / assertion failures → FE.
  HTTP 4xx/5xx or `**/api/**` timeout → BE (this signal wins when the two
  disagree). Unclassifiable failures → comment on the parent instead.
- **Even one failed case** triggers the route to the matching FE/BE child.
  An all-pass run posts the success comment on the `[T…]` child (or the epic).
- **Everything the defect agent does is a comment.** It never transitions any
  issue, in either direction. Driving a developer's board from a test run
  causes more confusion than it saves, and the previous per-tenant pattern
  lists silently did nothing on any other team's workflow.
- **Always dual-post.** Per failure: full bug comment on the routed FE/BE
  child. Per run (every run, including all-green): a results-summary comment
  on the `[T-…]` test-case child with deep-links to the per-failure comments.
- **Always upload the screenshot first**, then embed it inline in the comment
  via the ADF `media` node — never paste a file path as text. Use
  `jira.uploadAttachmentFromPath(child, path)` → pass the returned id in
  `attachmentMediaIds: [...]` on the `DefectReport`.
- **Defect comment layout** follows the standard QA bug-report template:
  Title → Summary bullets → **Preconditions** → **Steps to Reproduce** →
  **Actual Result** → **Expected Result** → **Attachment** (embedded) →
  **Network** → **Error** → **Artifacts** → Footer. Preconditions and Steps
  come from the Qase case (`qase.getCase(id).preconditions` /
  `.steps[].action / .data / .expected_result`); the Actual Result is the
  agent's human summary, not the raw Playwright stack trace.
- Use `utils/jira-helper.ts`:
  - `jira.getEpicChildren(epicKey)`, `classifyChildBySummaryPrefix(summary)`
  - `jira.transitionToWaitingToDeploy(taKey)` — the only transition (see above)
  - `jira.uploadAttachmentFromPath(issueKey, path)` (and the buffer-form
    `jira.uploadAttachment(...)`) — returns the attachment id used by the
    ADF `media` node.
  - `jira.addComment(issueKey, buildDefectComment(report))` for failures
  - `jira.addComment(issueKey, buildTestCaseSummary(report))` for every run
- Default parent when no key is supplied: `env.<stack>.storyKey` — on Jira
  `JIRA_PROJECT_KEY-JIRA_PARENT_ISSUE_ID`, on Azure `AZURE_PARENT_WORK_ITEM_ID`.
  Both come from `.env`; the property name is the same on either stack.

## 9. Self-healing policy

When a selector fails at runtime, the Self-Healing Agent runs a **3-attempt
cycle (1 initial fix + 2 retries)** — exercise the full budget so the
"recovered" outcome is statistically valid, not a single-run fluke:

```
Attempt 1: re-resolve via source-of-truth order → re-run on chromium
  ├─ green → STOP (recovered, 0 retries used)
  └─ red → Attempt 2 (RETRY 1): re-resolve again → re-run
              ├─ green → STOP (recovered, 1 retry used)
              └─ red → Attempt 3 (RETRY 2): final re-resolve → re-run
                          ├─ green → STOP (recovered, 2 retries used)
                          └─ red  → escalate via /qa-agent-defect <EPIC>
```

The source-of-truth order is: existing locator → existing page → FE source →
real DOM. The replacement must be the highest-priority unique match — never
downgrade priority (testid → xpath is banned). Stop as soon as it goes green;
never keep retrying past green. The healer also records:
- `.claude/memories/selector-history.md` — old → new selector + why
- `.claude/memories/self-healing.md` — the healing event (incl. retry count)

If the case is **still red after the fix + 2 retries** and the cause is a product
defect (not a re-resolvable selector), the healer escalates to the defect flow:
`/qa-agent-defect <EPIC-KEY>` (the Jira epic that owns the failing scope, e.g.
`NLM-4`). qa-defect resolves the epic's children and routes the failure to the
matching FE/BE child. Never silently swap a selector without recording it; never
downgrade selector priority (e.g. testid → xpath) to "make it pass"; never force
a pass to avoid escalating.

## 10. Memory

`.claude/memories/` is the persistent knowledge base the Memory Agent maintains:
`page-map.md`, `component-map.md`, `selector-history.md`, `known-issues.md`,
`self-healing.md`. Read relevant memory before generating; update it after.

## 11. Agents & commands

Five consolidated agents in `.claude/agents/`, driven by `/qa-agent:*`
sub-commands, plus a tri-mode `/qa-agent` entry point that is the
router/overview, the end-to-end orchestrator (epic **or** `[TA]` ticket), AND
and the end-to-end orchestrator:

| Agent / Driver | Command | Responsibility |
|---|---|---|
| **qa-codegen** | `/qa-agent-generate plan:<id> \| TC-xxxx` | **Sync FE repo (`npm run fe:sync` — master, SSH)** → pull Qase → reuse/create page + locators (FE-source mined) → codegen (`qase.id(...)`) → validate → **live self-verify the happy path via the Playwright MCP** (heal selectors in place, never forcing green) so a later runner red is a real bug |
| **qa-runner** | `/qa-agent-run plan:<id> \| all \| <module> \| TC-xxxx [--headed]` | Execute on chromium (headless default, `--headed` optional — chromium only) → auto-create Qase run → upload status + full-screen video + failure screenshot |
| **qa-defect** | `/qa-agent-defect <EPIC-KEY>` | Resolve the epic's children → classify FE/BE failures → comment + transition the matching child (or post a success comment on the `[T…]` child when all-pass). Never creates a bug. |
| **qa-healer** | `/qa-agent-heal TC-xxxx \| <module> [EPIC-KEY]` | Fix broken selectors → re-run with up to 2 retries → record in memory → escalate to `/qa-agent-defect <EPIC-KEY>` if still failing as a product defect |
| **qa-agent-pr** (logs as `qa-pr`) | `/qa-agent-pr [STORY-KEY \| TICKET-KEY \| empty]` | Open/update a GitHub PR for the current branch with the Jira context stamped into the body — Story + [QA] + [T-*] + [FE-*] children, Qase run URL + counts, deep-links to per-failure bug comments, generated vs reused asset list. Never force-pushes, never bypasses hooks. |
| **`/qa-agent` (dual-mode)** | `/qa-agent` (router) · `/qa-agent <EPIC-KEY \| STORY-KEY>` or `/qa-agent <TA-KEY>` (orchestrator) | Empty/free-text → router/overview. An **epic key** OR a **user-story key** → read parent + its `[Test]`/`[TM]` child (for a Story the `[TM]`/`[TA]`/`[FE-…]`/`[BE-…]` tickets are **subtasks under the Story** and resolve via the same `parent = X OR "Epic Link" = X` JQL as epic children); a **`[TA-…]` key** (e.g. `NLM-253`) → read its parent + `[TM-…]` plan sibling — then extract Qase plan → generate → run → (heal → defect) → summary, with `run-logger` + `run-logger-sync` after every step. On an all-green run every family child under the parent (`[TA-…]`, `[TM-…]`, `[FE-…]`, `[BE-…]`) moves to WAITING TO DEPLOY (§8). Fully autonomous (no decision prompts). |

**run-logger agent names are canonical** — entries use the *agent* name
(`qa-codegen`, `qa-runner`, `qa-healer`, `qa-defect`, `qa-pr`, `orchestrator`),
never the `qa-agent-*` command spelling, so Confluence keeps one page per agent.

**Jira ticket prefixes** (the delivery project is named in `.claude/app-profile.md`): `[DB-…]` persistence → routes **be**;
`[BE-…]` backend; `[FE-…]` frontend; `[TM-…]` manual cases in Qase (the
**Qase-plan source**); `[TA-…]` Playwright automation (the **trigger home +
run-summary target**).

A common flow:
`/qa-agent-generate plan:8` → `/qa-agent-run plan:8` → `/qa-agent-defect NLM-4`
(plus `/qa-agent-heal <module>` for selector breakage). After generation, the
codegen step prints the exact run command for the scenarios it just created —
e.g. `plan:8` → `/qa-agent-run plan:8` (add `--headed` for a visible browser;
headless is the default). Both modes run on `chromium` only — never all
browsers.

**One-shot via the orchestrator.** When the work is fully described by a Jira
**epic** (epic has a `[Test]`/`[TM]` child whose summary/description names a
Qase plan or `TC-xxxx` refs), a **user story** (whose `[TM]` subtask names the
same — `[TA]`/`[FE-…]`/`[BE-…]` sit as sibling subtasks under the Story), **or**
a `[TA-…]` automation ticket (whose parent has a `[TM-…]` plan sibling),
`/qa-agent <KEY>` runs the whole pipeline. It
dispatches the existing `/qa-agent:*` slash commands (never the underlying
agents directly), branches on each step's result (all-green → summary;
failures → heal → still red → defect), and calls
`design-agent:run-logger` (with a `prefilled:` block) +
`design-agent:run-logger-sync` after every step so the run log lands in
Confluence automatically. The orchestrator never creates Jira bugs, never
downgrades selector priority, and aborts cleanly when the plan source is missing
or has no Qase reference.

Definition of done for any generated module: typecheck clean, lint clean, no
duplicate page/locator, no hard waits, no raw xpath, every test tagged with
`qase.id(...)`, **each case live-verified via the Playwright MCP
(`verified-green`, or `blocked: <reason>` for a genuine defect — never forced
green)**, and the run reports to Qase.

The Playwright MCP server is declared in the repo-owned `.mcp.json` and runs
**`--headless --isolated` by default**: headless keeps codegen's self-verify at
CI parity (green here implies green in CI), and isolated gives each session a
clean context — required by single-SSO apps. To debug a specific flow visually,
drop `--headless` in `.mcp.json` locally; the file is repo-owned so
`/qa-agent:upgrade` never reverts it.

## 12. Naming rules for new modules

A "module" is one app area (login, dashboard, bid-search, project-detail,
company-profile, …). Pick the module slug in **kebab-case** and reuse it
verbatim across every layer — folder, file, symbol, and route mapping must line
up so the agents can resolve assets deterministically.

For a module slug `<m>` (e.g. `bid-search`):

| Layer | Path / symbol |
|---|---|
| Spec (TDD entry point) | `tests/e2e/<area>/<m>.spec.ts` |
| Feature (BDD entry point) | `features/<area>/<m>.feature` |
| Business steps (shared by both) | `steps/<area>/<m>.steps.ts` → exported step functions + `Given/When/Then` bindings from `../../shared/bdd/fixtures.js` |
| Page object | `pages/<m>/<m>.page.ts` → `class <M>Page` (PascalCase, e.g. `BidSearchPage`) |
| Helpers module (optional) | `pages/<m>/<m>.helpers.ts` → exported data/assertion helpers (e.g. `collectDatedItems`, `expectLastUpdatedDescending`) |
| Locator file | `locators/<m>/<m>.locator.ts` → `export const <camelM>Selectors` (e.g. `bidSearchSelectors`) |
| POM fixture | `<camelM>Page` in `shared/test-fixtures.ts` (e.g. `bidSearchPage`) |
| Page map row | one row in `.claude/memories/page-map.md` |

Other naming:
- **Tests**: the title is the Qase scenario name verbatim; `qase.id(<id>)` is the
  first line in the body; one `test()` per Qase case; `describe` block named
  after the module.
- **Selector keys**: camelCase describing the element role (`keywordInput`,
  `searchButton`, `resultRow`) — never the raw testid string as the key.
- **Test data / config**: add to `shared/env.ts` (backed by `.env`), not as JSON.
- **No abbreviations** that aren't already used in the FE routes/testids.

## 13. CI

CI runs the same commands as local; keep them green before merging.

- Pipeline order: `npm ci` → `npm run install:browsers` → `npm run typecheck`
  → `npm run lint` → `npm test`.
- **The regression matrix is data-driven.** `.github/workflows/regression.yml`
  builds its module list from `npm run modules` (`scripts/list-modules.ts`),
  which unions `tests/e2e/<m>/` with `features/**/<m>.feature` and keeps the
  modules that have a `test:<m>` script. Adding a module — TDD or BDD — means
  adding that script, nothing else. A discovered module with no script is
  reported as a `::warning::`, never dropped silently.
- Secrets injected as env vars (never committed): `USER_ID`, `USER_PWD`,
  `API_TOKEN`, `CYCLE_KEY`, `EMAIL`, plus the host / SSO / Qase-project pair.
  The regression pipeline is **product-agnostic and tracker-agnostic** — it
  does not read Jira / Atlassian / FE-source vars (those belong to
  `/qa-agent-generate` and `/qa-agent`, which run from a developer machine).
- **Deterministic retries in regression.** `playwright.config.ts` honours the
  `PW_RETRIES` env override; both regression pipelines set `PW_RETRIES=0` so
  every red module is a real red, never a masked flake. Local dispatches fall
  back to the historical `IS_CI ? 2 : 0` default when the env is unset.
- **The suite runs serially (`workers: 1`), CI included.** The app-under-test
  permits only one active session per user (single SSO), so concurrent workers
  evict each other's session and bounce in-flight tests to `/login`. Never raise
  the worker count without a pool of distinct test accounts — `playwright.config.ts`
  and `utils/run-regression.ts` both pin one worker.
- Qase upload happens only when `QASE_MODE=testops` **and** `API_TOKEN` are
  present; otherwise the run still produces the HTML/JSON reports locally.
- Artifacts to publish from CI: `reports/html/`, `reports/results.json`, and
  `reports/test-results/` (traces/videos/screenshots for failures).
- A red typecheck, lint, or test run blocks the merge. Don't disable a check to
  go green — fix it or route the failure through the heal/defect flow.

## 14. Branch & PR conventions

- **Never commit to `master` (or `main`) directly.** Branch first. The PR base
  for this repo family is `master`; `main` is only a fork-default alias.
- Branch names: `feature/<short-desc>`, `fix/<short-desc>`,
  `test/<module>-<TC-id>` (e.g. `test/bid-search-2045`), `chore/<short-desc>`.
- Commits: imperative present tense, scoped, e.g.
  `test(bid-search): add TC-2045 keyword search`. Group by module.
- One PR per module or per Qase plan; keep generated assets (spec + page +
  locator + memory update) together in the same PR.
- PR description must state: Qase case/plan covered, modules touched, reused vs.
  newly created assets, and the Qase run URL once executed.
- Merge only when CI is green (§13) and the §11 definition of done is met.
- Commit or push only when explicitly asked.
