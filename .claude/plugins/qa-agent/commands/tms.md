---
description: End-to-end QA-Agent workflow driven by a TMS input (Qase). Accepts a **plan id** (`plan:<id>` or bare `<PLAN_ID>`), a **single case** (`TC-xxxx` or `case:<id>`), **or a tracker key** (Jira epic/story/`[TA]` on the jira stack, `AB#<id>` on the azure stack) — a tracker key is resolved to its `[TM-…]` child's plan id and then runs the SAME plan-driven pipeline (no defect routing, no tracker comments). Validates the input → generate → run → (heal on failure) → summary → **qa-agent-pr** (commit + open/update PR), with run-logger + run-logger-sync after every step. Free-text / empty falls back to `/qa-agent`'s router.
argument-hint: <PLAN_ID> | plan:<PLAN_ID> | TC-xxxx | case:<id> | EPIC-KEY | STORY-KEY | TA-KEY | AB#<id> | <free-text intent> | empty
---

# /qa-agent:tms

TMS-driven orchestrator. Mirrors `/qa-agent <EPIC-KEY>` — including the final
qa-agent-pr step — but skips the tracker context-resolution and the qa-defect
step. Input is a **TMS plan id** or a **single TMS case id** (Qase for the
jira stack, Qase on both stacks). Read `CLAUDE.md` for the
full contract (source-of-truth priority, selector strategy,
reuse-before-generate, chromium-only, never-create-bugs).

**Trigger forms:**

| Form | Meaning | Handler |
|---|---|---|
| `/qa-agent:tms 8` or `/qa-agent:tms plan:8` | Run the whole plan `8` | tms pipeline (this file) |
| `/qa-agent:tms TC-2045` or `/qa-agent:tms case:2045` | Run only case `2045` | tms pipeline (this file) |
| `/qa-agent:tms NLM-4` (EPIC / STORY / `[TA]` key) | **Resolve `[TM-…]` child → plan id → tms pipeline** (no defect routing, no tracker comments) | tms pipeline (this file, §Step 1B) |
| `/qa-agent:tms AB#12345` (azure stack) | Same as above via Azure Boards + Qase | tms pipeline (this file, §Step 1B) |
| `/qa-agent:tms "generate plan 1"` (free-text intent) | Router overview + nudge | **delegate to `/qa-agent <text>`** |
| `/qa-agent:tms` (empty) | Router overview | **delegate to `/qa-agent`** |

For a plan id the value must be a positive integer; strip the optional
`plan:` prefix. For a case, accept `TC-<n>` (case-id notation used by the
generator and runner) or the explicit `case:<id>` form; both resolve to the
same integer case id. For a tracker key, resolve the plan via the `[TM-…]`
child (Step 1B); anything that is neither a plan/case form nor a tracker
key is treated as free-text and routed to `/qa-agent`'s router mode —
**never** guess the shape from context, **never** silently drop the input.

**Why not delegate tracker keys to `/qa-agent`?** `/qa-agent <KEY>` runs the
full orchestrator including qa-defect (posts summary + transitions tickets).
When someone opens `/qa-agent:tms <KEY>` they explicitly asked for the
plan-driven flow — so tms uses the tracker only as a plan-lookup shortcut
and never touches the tracker beyond that. The PR body still cites the
tracker key for context, but no comments are posted on any ticket.

## Mode resolution — classify `$ARGUMENTS` first

Before Step 0, classify `$ARGUMENTS` in this order (first match wins). Only
match #3 delegates.

1. **Plan / case form** — `plan:<n>`, bare positive integer, `TC-<n>`, or
   `case:<n>` → **tms pipeline**, jump to Step 1A.
2. **Tracker key** — matches `^[A-Z][A-Z0-9_]+-\d+$` (Jira key on the jira
   stack) or `^AB#\d+$` (Azure Boards work-item on the azure stack) →
   **tms pipeline**, jump to Step 1B (resolves the `[TM-…]` child's plan id
   via `utils/tracker.ts`). Read `.claude/qa-agent.json.stack` for the same
   stack pre-flight `/qa-agent` applies (a Jira key on `azure` stack, or
   `AB#…` on `jira` stack, is rejected with a message that names the current
   stack). Do **not** dispatch qa-defect — this workflow's identity is
   *plan-driven, no tracker comments*.
3. **Empty or unmatched free-text** → **delegate**: invoke `/qa-agent`
   (empty) or `/qa-agent <text>` (free-text). `/qa-agent` then prints the
   router overview and — for free-text — appends a one-line nudge to the
   right sub-command. Do **not** auto-dispatch a sub-flow from free text.

Emit one line announcing the resolved mode (`mode=plan|case|tracker-delegate|router-delegate`)
before dispatch so the log is unambiguous.

**Stack pre-flight:** read `.claude/qa-agent.json.stack` before dispatch. Both
forms are valid on either stack (the TMS gateway is vendor-agnostic), but
call it out in logs so the operator knows whether the plan/case id is being
resolved against Qase.

**Scope:** the app configured in `.claude/app-profile.md`. One plan or one
case per invocation.

**When to use this vs `/qa-agent <TICKET>`:**
- `/qa-agent <EPIC-KEY | STORY-KEY | TA-KEY | AB#<id>>` — you have a tracker
  ticket (Jira or Azure Boards) with a `[TM-…]`/`[Test]` child and want
  defects routed/transitioned on `[FE…]`/`[BE…]` siblings.
- `/qa-agent:tms <plan-or-case>` — you only have a TMS id and want to drive
  the full pipeline (including PR) locally; failures end in the summary, not
  the tracker.

**Tools you'll use:** `Bash`, `Read`, the four sub-commands
(`/qa-agent-generate`, `/qa-agent-run`, `/qa-agent-heal`, `/qa-agent-pr`),
the two skills `design-agent:run-logger` +
`design-agent:run-logger-sync`, and the **dashboard helper**
`utils/orchestrator-dashboard.ts`.

## Auto mode — NON-NEGOTIABLE

Same contract as `/qa-agent` orchestrator mode. Once invoked, run the full
pipeline to completion without ever pausing for input.

- **Never call `AskUserQuestion`.**
- **Never ask "shall I proceed?" / "is this OK?"** between steps.
- **Decide with sensible defaults:**
  - browser mode → `chromium`, headless (use `--headed` only if `$ARGUMENTS`
    explicitly contains `--headed`).
  - heal target → for module-wide failures, run the healer once per affected
    module (sequentially). For a single failing case, target `TC-xxxx`.
- **Run-logger is prefilled, never interactive.**
- **Heal retries are autonomous** — qa-healer's 2-retry cap (3 attempts total)
  runs end-to-end without prompting; see §Step 3 for the explicit cycle.

The ONLY way to abort is a §Stop condition. For anything else, keep going.

## Workflow

```
Trigger (plan:<id> | TC-xxxx | case:<id>)
  → Normalise + validate input against TMS (plan exists / case belongs to a plan)
  → qa-agent-generate     → run-logger (prefilled) → run-logger-sync
  → qa-agent-run          → run-logger (prefilled) → run-logger-sync
      ├─ all green                                  → Summary
      └─ failures
          → qa-agent-heal → run-logger (prefilled) → run-logger-sync
              ├─ recovered                          → Summary
              └─ still failing                      → Summary (report-only;
                                                      no defect routing)
  → Summary → TMS + console
  → qa-agent-pr           → run-logger (prefilled) → run-logger-sync
```

The pr step runs unconditionally at the end (green **or** red), same as the
tracker-driven orchestrator. `/qa-agent-pr` is called with **no ticket
anchor** — because there is no tracker epic — so its body cites the TMS plan
or case URL instead of a Jira/Azure Boards link. When the run is red the PR
title is prefixed `WIP:` and the body flags the remaining failures.

Execute steps sequentially, branch on each step's result, and never skip a
`run-logger` + `run-logger-sync` after a workflow step (even on step failure).

## Step 0 — Normalise `$ARGUMENTS` (plan / case mode)

Runs when §Mode resolution matched #1 (plan / case form). Tracker keys
match #2 and take the alternative Step 1B path below; free-text / empty
was already delegated to `/qa-agent`. Classify the remaining input in this
order (first match wins):

1. `plan:<n>` or bare positive integer → **plan mode**, `PLAN_ID = <n>`.
2. `TC-<n>` or `case:<n>` → **case mode**, `CASE_ID = <n>`. Resolve the case
   to its parent plan (via `utils/tms.ts` — Qase `getCase(id).plan_ids` or the
   Qase equivalent) so downstream generate/run still receive the
   plan context. If the case is not in exactly one plan, abort with a clear
   message — do **not** create a new plan.
3. Anything else (should be unreachable if §Mode resolution ran) → abort
   with the accepted plan/case forms listed.

Emit one line to stdout announcing the resolved mode, plan id, and (in case
mode) the case id, so the log is unambiguous.

## Step 1B — Resolve the plan from a tracker key

Runs when §Mode resolution matched #2 (tracker key). Resolves the plan id
through the tracker gateway (`utils/tracker.ts`) — same TA / epic / story
detection as `/qa-agent`, but the output is a **plan id only**; no defect
routing follows.

```bash
KEY="$ARGUMENTS"    # e.g. NLM-4 (jira) or AB#12345 (azure)

KEY="$KEY" npx tsx <<'EOF'
import { tracker, extractPlanId } from "./utils/tracker.js";
const key = process.env.KEY!;
const ticket = await tracker.getIssue(key);
// Classification: automation ([TA-…]) resolves via parent + [TM-…] sibling;
// anything else (epic, story, [Test]/[QA] child) resolves via
// getEpicChildren + the [TM-…]/[Test]/[QA] child. Mirrors /qa-agent's
// Step 1A / 1B logic — reused so the shape stays identical.
let tm;
if (ticket.classification === "automation") {
  const parent = await tracker.getParentKey(key);
  if (!parent) throw new Error(`${key}: no parent — cannot resolve [TM-…] sibling.`);
  const siblings = await tracker.getEpicChildren(parent);
  tm = siblings.find((c) => c.classification === "test");
} else {
  const children = await tracker.getEpicChildren(key);
  tm = children.find((c) => c.classification === "test");
}
if (!tm) throw new Error(`${key}: no [TM-…]/[Test]/[QA] child/sibling — cannot resolve plan.`);
const desc = await tracker.getIssueDescription(tm.key);
const comments = await tracker.getIssueComments(tm.key);
const blob = `${tm.summary}\n${desc}\n${comments.map((c) => c.bodyText).join("\n")}`;
const planId = extractPlanId(blob);
if (!planId) throw new Error(`[TM] ${tm.key}: no Qase plan declared in summary/description/comments.`);
console.log(JSON.stringify({ trackerKey: key, tmKey: tm.key, planId }, null, 2));
EOF
```

Cache `PLAN_ID` from the output and `TRACKER_KEY` (for the PR body only —
never posted back to the tracker). Continue at Step 2 exactly as if the
plan id had been supplied directly. **No qa-defect step follows**, and no
Jira/Azure comments are posted anywhere on the ticket family.

If the tracker key resolves cleanly but the `[TM-…]` declares no plan,
abort with the same message the /qa-agent orchestrator uses so operators
recognise the fix.

## Step 1 — Validate the TMS input

**Plan mode.** Resolve the plan via `utils/tms.ts`. Confirm it exists and
lists at least one case.

**Case mode.** Resolve the case; confirm the case exists and belongs to
exactly one plan. Downstream steps run with `--grep "TC-<n>"` so only that
case executes, but the plan context still drives Qase run creation.

```bash
PLAN_ID="${ARG#plan:}"    # ARG := first token of $ARGUMENTS

PLAN_ID="$PLAN_ID" npx tsx <<'EOF'
import { qase } from "./utils/qase-helper.js";
const planId = Number(process.env.PLAN_ID);
if (!Number.isInteger(planId) || planId <= 0) throw new Error("plan id must be a positive integer");
const plan = await qase.getPlan(planId);
const cases = await qase.getPlanCases(planId);
if (cases.length === 0) throw new Error(`Qase plan ${planId} has no cases.`);
console.log(JSON.stringify({
  plan: { id: plan.id, title: plan.title, cases_count: cases.length },
  cases: cases.map((c) => ({ id: c.id, title: c.title })),
}, null, 2));
EOF
```

**Abort** (with a clear message) when the plan id is non-numeric, the plan is
missing, or the plan has zero cases. Cache `PLAN_ID` for the remaining steps.

Mint a `runId` once here (`RUN_ID=$(uuidgen | tr 'A-Z' 'a-z')`) and reuse it
for every dashboard event in this invocation. Emit the start event:

```json
{"runId":"$RUN_ID","epic":null,"epicTitle":null,"testChild":null,
 "scope":"plan:$PLAN_ID","planTitle":"<plan.title>",
 "agent":"qa-agent-orchestrator","step":"start","status":"running"}
```

(`epic` is `null` because there is none — the dashboard renders that row
without epic links; this is expected.)


**Authoring-style preflight.** Qase decides the output shape via `steps_type` —
probe it before generating so you know which run command applies:

```bash
npm run qase:plan-style -- plan:<id>   # last line: bdd | classic | mixed
```

`classic` → `tests/e2e/<area>/<m>.spec.ts`, run with `/qa-agent-run plan:<id>`.
`bdd` → `features/<area>/<m>.feature` + `steps/<area>/<m>.steps.ts`, run with the
`test:<m>` script codegen wrote (it runs `bddgen` first). `mixed` → both. Record
the style in the run log; never rewrite a case from one style into the other
(CLAUDE.md §5a).

## Step 2 — qa-agent-generate

Invoke the existing slash command (do not call qa-codegen directly):

```
/qa-agent-generate plan:<PLAN_ID>
```

Wait for completion. Record:
- files created/changed,
- whether typecheck + lint passed (qa-codegen runs them; a red gate is a step
  failure — do NOT proceed to step 3),
- the printed `/qa-agent-run` command (for the next step).

**Log + sync:**

| outcome | tag | manual_effort | notes |
|---|---|---|---|
| generated cleanly | Accept | 4 | — |
| red typecheck / lint | Rework | — | `hallucination: No, improvement_point: Agent, notes: <why>` then **stop** |

## Step 3 — qa-agent-run

Execute the plan:

```
/qa-agent-run plan:<PLAN_ID>
```

qa-runner mints a fresh Qase cycle, runs on chromium (headless by default),
and uploads status + video + screenshot. Capture:
- `CYCLE_KEY` (the new run id),
- the **Qase run URL**,
- pass/fail/flaky counts (read `reports/results.json` if needed).

**Log + sync** with `manual_effort: 1`.

Then branch:
- **all green** → Step 5 (Summary).
- **any failure** → Step 4 (heal).

## Step 4 — qa-agent-heal (on failure) — **2 retries, no exceptions**

Hand the failing scope to the healer. **No epic key is passed** — the healer
must NOT escalate to qa-defect for this workflow (there is no epic to route
against). If qa-healer would otherwise escalate, treat the case as "still
failing" and continue to the summary.

- module-wide → `/qa-agent-heal <module>`
- single case → `/qa-agent-heal TC-xxxx`

### Retry cycle — fix → re-run, capped at 2 retries (3 attempts total)

```
Attempt 1: re-resolve selector → re-run (chromium)
  ├─ green → stop, report recovered
  └─ still red ↓
Attempt 2 (RETRY 1): re-resolve again (from FE source / DOM) → re-run
  ├─ green → stop, report recovered (1 retry used)
  └─ still red ↓
Attempt 3 (RETRY 2): final re-resolve → re-run
  ├─ green → stop, report recovered (2 retries used)
  └─ still red → report "still failing — no defect route (plan-driven)"
```

The retry count is **non-negotiable**: never 0, never 1, always exactly up to
2 retries. Stop as soon as it goes green. Never downgrade selector priority
between attempts (testid → xpath is banned).

If multiple cases failed in different modules, run this cycle **once per
module** (sequentially). Each module gets its full 2-retry budget.

**Log + sync** per healer invocation with `manual_effort: 2`. Include
`notes: "recovered after N retr(y|ies)"` or
`notes: "still failing after 2 retries — no defect route (plan-driven)"`.

## Step 5 — Summary

Compose a final **orchestrator report** for the user (≤200 words):

```
Plan:      plan:<PLAN_ID> "<plan.title>"  (cases: <n>)
Qase run:  <URL>      (id <CYCLE_KEY>)
Outcome:   ✅ all green | 🟠 healed | 🔴 unresolved failures (no defect route)

Steps
  • generate  → <files changed count>, typecheck+lint <pass|fail>
  • run       → P:<n> F:<n> Flaky:<n>
  • heal      → <skipped | applied <m> heals | <k> still failing>

Unresolved (plan-driven, no defect routing):
  • TC-xxxx — <module> — <one-line reason from healer/run>
  • …

Logs:      run-log.jsonl entries: <n> pending → synced to Confluence
Dashboard: reports/dashboard/index.html
```

The summary lives in your output AND on the TMS (Qase —
the run URL holds per-case status + artifacts). There is **no tracker
surface** in this workflow.

## Step 6 — qa-agent-pr

Invoke `/qa-agent-pr` with **no ticket anchor** (the tracker key, if one
was passed at Step 1B, is used for the PR body only — never for
comments or transitions). The sub-agent commits the working tree, opens
or updates the PR, and stamps the body with:

- the TMS plan / case URL,
- the TMS run URL,
- the tracker key from Step 1B when applicable (as a plain reference — no
  comment is posted on the ticket),
- the summary block from Step 5.

When Step 5 outcome was **not** all-green, the PR title is prefixed `WIP:`
and the body's *Test plan* block calls out the unresolved cases. The PR runs
unconditionally — the operator still gets a diff to review even when tests
are red — so never skip this step on failure.

Follow with `design-agent:run-logger` (prefilled, `agent: qa-pr`) +
`design-agent:run-logger-sync` per the §Run-logger contract.

## Dashboard contract

Same as `/qa-agent` orchestrator mode (see the `qa-agent` command shipped by the plugin,
§Dashboard contract). Differences:
- `epic` and `testChild` are `null` in every event.
- Skip the `defect` pipe-cell — emit `{step: "defect", status: "skipped"}` on
  the completion event so the dashboard renders the cell as "skipped".

### Event cadence per step

1. **Step 1 (start)** — `qa-agent-orchestrator/start/running` with `scope: "plan:<id>"`.
2. **Each sub-step** — TWO events: `running` on launch, then
   `completed`/`failed`/`skipped` on return (carry `durationSec`, `tokenCost`,
   step-specific results — same shape as `/qa-agent`).
3. **Step 5 (summary)** — `qa-agent-orchestrator/end/completed` (or `failed` on abort).

Always emit `defect/skipped` so the timeline is unambiguous.

## Run-logger contract

Same as `/qa-agent` orchestrator mode (see the `qa-agent` command shipped by the plugin,
§Run-logger contract). Differences:

- The `input` field is `plan:<PLAN_ID>` (plan mode) or `TC-<CASE_ID>` (case
  mode) — not a tracker key. `input_url` is the TMS plan/case URL when
  available; otherwise omit.
- The `output` field is a 1–4 entry list: TMS run URL, the heal report (when
  applicable), the unresolved-failures list (when applicable), and the PR
  URL from Step 6. **No tracker comment link** — there is none in this
  workflow.
- No `qa-agent-defect` row — that step does not run.
- A `qa-pr` row is written for Step 6 (mirrors `/qa-agent` orchestrator
  mode).

After each `run-logger` call, immediately invoke
`design-agent:run-logger-sync` (no args). If sync fails, log it in the
orchestrator report but **do not abort the workflow** — the local JSONL is
the source of truth.

## Stop conditions

Abort (with a clear human-readable reason in the report) when:

- `$ARGUMENTS` matches a **stack-mismatched** tracker key (Jira key on
  `azure` stack, or `AB#…` on `jira` stack) — reject via the §Mode
  resolution pre-flight; never fall through to plan/case parsing.
- `$ARGUMENTS` matches none of the accepted forms in §Mode resolution
  (this should be unreachable — empty / free-text delegates to `/qa-agent`
  in router mode instead of aborting).
- The plan id does not resolve on the TMS (404 or auth failure).
- The plan has zero cases (plan mode).
- The case id does not resolve, or belongs to no plan / more than one plan
  (case mode) — **never** silently create a new plan to host it.
- qa-codegen leaves the codebase with a red typecheck or lint gate.
- The TMS `API_TOKEN` (Qase) or Azure PAT is missing.
- The user requests cancellation.

For every other error, log the step failure to run-logger, finish what you
can, and end with a clear diagnosis. Never silently swallow failures.

## Rules

- **Always go through the slash commands** (`/qa-agent-generate`,
  `/qa-agent-run`, `/qa-agent-heal`) — do not invoke the underlying agents
  directly.
- **Never invoke `/qa-agent-defect`** in this workflow (no epic).
- **Never create a Jira ticket or comment** in this workflow.
- **Always log + sync after every workflow step**, even on step failure.
- **Never downgrade selector priority** to force a pass (qa-healer's rule).
- **Chromium only**, headless default; pass `--headed` through only if the
  user appended `--headed` to `/qa-agent:tms <id> --headed`.
- **One plan per invocation.** If the user passes multiple ids, run them
  sequentially and emit one summary per plan.

## Done when

The summary report (§Step 5) is printed AND all workflow-step entries are at
least `pending` in `logs/run-log.jsonl` (synced is best-effort).
