---
description: Execute tests on chromium (a plan, case, module, or all), headless or headed, auto-create the Qase run, and upload status + video + screenshot attachments. Returns the Qase run URL.
argument-hint: <plan:1 | all | <module> | TC-2045> [--headed | --headless]
---

# /qa-agent-run

Execute **$ARGUMENTS** with the **qa-runner** agent and report to Qase.

## Run mode (headed / headless — chromium only)
- **Both modes run on the `chromium` project only**, never all browsers.
  qa-runner always passes `--project=chromium`; Firefox/WebKit/mobile are out
  of scope (CLAUDE.md §2).
- **Default is headless** (no browser window) — CI-safe and faster.
- Pass `--headed` to watch the browser drive the tests (local debugging /
  demos). qa-runner appends `--headed` to the chromium Playwright command.
- `--headless` is accepted to be explicit; it is the default and a no-op.
- Convenience scripts: `npm test` (headless), `npm run test:headed` (headed) —
  both chromium only.
- The flag only changes browser visibility — the engine (chromium), scope,
  Qase run creation, and upload behave identically in both modes.

## What qa-runner does
- Select/create the Qase run:
  - **`plan:<id>` → always creates a fresh run (cycle) from that plan** and
    reports into it.
  - else reuse `CYCLE_KEY` if set, otherwise auto-create a run
    (`QASE_RUN_TITLE` optional).
- Run chromium only (append `--headed` when requested):
  - `plan:<id>` → the plan's cases (resolved from Qase)
  - `all` → `npm test` (headless) / `npm run test:headed` (headed)
  - `<module>` → `npx playwright test tests/e2e/<module> [--headed]`
  - `TC-xxxx` → `npx playwright test --grep "TC-xxxx" [--headed]`
- Upload per-case status + attachments: **full-screen video** (every test) and
  **screenshot** (on failure), plus trace on failure.

## Done when
results are in Qase. Report pass/fail/flaky counts and the run URL. For
failures, route product defects to `/qa-agent-defect <EPIC-KEY>` (e.g.
`/qa-agent-defect NLM-4` — qa-defect resolves the epic's FE/BE children) and
selector breakage to `/qa-agent-heal`.

## BDD-authored scopes

Cases authored in Qase as Gherkin (`steps_type: "gherkin"`) live in
`features/<module>.feature` + `steps/<module>.steps.ts` and run through
**playwright-bdd**, which compiles them into `.features-gen/` first:

```bash
npm run test:bdd                                   # every BDD module
BDD_FEATURE=<area>/<module> npm run test:bdd:feature   # one module
npm run test:<module>                              # the per-module script codegen wrote
```

Always let `bddgen` run (all the scripts above do) — a stale `.features-gen/`
runs the previous step wiring. `qase.id(...)` comes from the `@qase-id:` tag, so
Qase reporting, the fresh cycle, and the video/screenshot attachments behave
exactly as for classic specs. A scenario tagged `@qase-project:<CODE>` is
skipped unless `QASE_PROJECT` matches — that is the guard against uploading into
the wrong Qase project, not a failure.

Finishes with the run-logger (agent = `qa-run`).
