---
description: Generate Playwright tests from Qase — a whole plan (plan:<id>) or a single case (<id> / TC-xxxx). Pulls, reuses, mines FE selectors, codegens, validates. Does not run. Optional `tm:<KEY>` token attaches the Jira `[TM-…]` description + attached designs as supplementary input — Qase remains the sole source of test scenarios.
argument-hint: <plan:1 | TC-2045 | 2045> [tm:<KEY>]
---

# /qa-agent-generate

Generate (don't run) tests for **$ARGUMENTS** using the **qa-codegen** agent.
Read `CLAUDE.md` first.

- `plan:<id>` → generate every case in the Qase plan.
- `<case id>` / `TC-xxxx` → generate one case.
- Optional `tm:<KEY>` (e.g. `plan:8 tm:NLM-628`) → read the `[TM-…]`
  description (and design attachments, if any) as extra context for selector
  mining and page-object shaping. Non-mandatory: scenarios still come from
  the Qase plan the `[TM-…]` references. Do not pass `[TA-…]`. The
  orchestrator threads `tm:<KEY>` through automatically.

## Step 0 — Sync the FE source repo (MANDATORY)

Before pulling Qase or mining selectors, **always** sync the FE checkout to
HEAD on `master` so generation runs against the latest selectors:

```bash
npm run fe:sync
```

This calls `utils/fe-repo-sync.ts`, which reads `env.fe.*` from `.env`:

- `FE_REPO_ROOT` — the FE checkout root (see `.claude/app-profile.md`).
- `FE_REPO_URL` — the FE remote URL.
- `FE_BRANCH` — the branch to track.
- `SSH_KEY` — path to the private key; injected via `GIT_SSH_COMMAND`.

Behavior:
- Clones if `FE_REPO_ROOT` is missing.
- Otherwise `git fetch origin master` → `git checkout master` →
  `git pull --ff-only origin master`.
- Fails fast on any git error (auth, conflict, missing key) — codegen MUST
  NOT proceed against a stale or dirty FE tree.

Report the result inline (`cloned` / `pulled` / `already-up-to-date` + the
short HEAD sha) so the user can see which FE revision the generation ran
against. If `SSH_KEY` is empty, the sync falls back to the user's default ssh
agent — fine for local dev, but log it.

## Output shape depends on the Qase authoring style

qa-codegen reads each case's **`steps_type`** and branches (CLAUDE.md §5a):

| `steps_type` | Generated |
|---|---|
| `classic` | `tests/e2e/<area>/<m>.spec.ts` — one `test()` per case, one `test.step()` per Qase row |
| `gherkin` | `features/<area>/<m>.feature` (mirrored via `npm run qase:feature-sync`) + `steps/<area>/<m>.steps.ts` — **no per-module spec**; `bddgen` generates it for the `bdd` project |

`<area>` is the case's Qase test folder (suite). `steps/<area>/<m>.steps.ts` is
the **shared business-step layer**: `Feature → Step → Page → Locator` for BDD,
`Spec → Step → Page → Locator` for TDD — one implementation, two entry points.

Pages, locators, fixtures, POM fixtures, `qase.id` pinning and the Qase upload
are identical in both branches. A mixed plan is split by `steps_type` and each
subset is generated in its own branch.

## "To be automated" flag — emit every case, skip the unflagged ones

qa-codegen honors the Qase **"TO BE AUTOMATED"** checkbox on execution, not
emission. Every case in scope becomes a scenario (BDD) or a `test()` (TDD)
pinned by `qase.id(<id>)`, so the generated file stays 1:1 with the plan:

- `automation = 1` (**To be automated**) → generate + run normally.
- `automation = 0` (Manual / not-automated) → emit the case with its title and
  `qase.id`, but mark it skipped so Qase reports it as `skipped`, never
  `passed`. **BDD**: the scenario is tagged `@manual` (already emitted by
  `renderFeature`) and `shared/bdd/fixtures.ts` skips it in the `Before` hook.
  **TDD**: the first line inside the `test(...)` body — right after
  `qase.id(<id>)` — is
  `test.skip(true, "case is not flagged 'To be automated' in Qase — reporting as skipped");`.
- `automation = 2` (Automated) → runs normally; regenerate only on explicit
  request.

See CLAUDE.md §7 (Qase integration) and the `qa-codegen` agent (shipped by the plugin) §1 for
the full contract. Never drop a case just because it is unflagged — that
produces a silent gap in the Qase run. When qa-codegen marks a case skipped,
log the case id + reason in the run report.

## What qa-codegen does
**Step 0** sync FE repo (above) → pull from Qase → spec out
Actions/Assertions → reuse check (no duplicates) → reuse/create page object →
resolve locators (existing → FE source → DOM) → write
`tests/e2e/<module>/<module>.spec.ts` (title = Qase scenario name, first body
line `qase.id(<id>)`, Arrange/Act/Assert) → validate (typecheck, lint, no dup
page/locator, no hard waits, no raw xpath) → **live self-verification via the
Playwright MCP** (drive the running app, confirm every selector resolves, heal in
place without downgrading priority) → update page-map memory.

### Live self-verification (Playwright MCP) — kills false bugs
After validation, qa-codegen **autonomously drives the running app via the
Playwright MCP** to prove each generated happy path resolves live: log in with
`env.user.*`, walk the case (`browser_snapshot` → `browser_click`/`type`/…),
and confirm the assertion target appears. If a selector misses, it reads the live
DOM, re-resolves to the highest-priority unique selector, updates the
locator/page, records the change in `selector-history.md`, and re-walks (≤3
attempts/case). It **never forces a pass**: a genuine product defect is reported
as `blocked: <reason>` with snapshot + network evidence, not masked. A
`verified-green` verdict means a later `/qa-agent-run` red is a **true
regression**, not a codegen/selector artifact.

## Done when
typecheck + lint clean, no duplicate page/locator, every test tagged with
`qase.id(...)`, and each case has a live-verification verdict (`verified-green`
or `blocked: <reason>`). Report files changed, elements resolved (with FE
source), and the per-case verdict.

## Auto-generate the run command for the related scenarios
After generating, **emit the exact `/qa-agent-run` command that runs only the
scenarios you just generated** (chromium only), so the user can copy-paste it:

- `plan:<id>` → ``/qa-agent-run plan:<id>`` (headless) — e.g. generating
  `plan:8` prints ``/qa-agent-run plan:8`` and the headed variant
  ``/qa-agent-run plan:8 --headed``. Runs only that plan's cases.
- single `<case id>` / `TC-xxxx` → ``/qa-agent-run TC-xxxx`` (+ `--headed`).
- if the cases all sit in one module, also offer the module form
  ``/qa-agent-run <module>``.

Always show the headless command first (the default) and the `--headed` variant
beneath it; both run on `chromium` only.

Finishes with the run-logger (agent = `qa-generate`).
