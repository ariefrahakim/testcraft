---
description: QA-Agent entry point. With no args (or free-text intent) → prints the router/overview. With a **tracker ticket** (Jira key like `NLM-4` on the jira stack, Azure Boards work-item like `AB#12345` on the azure stack) → runs the end-to-end agentic workflow. An **epic OR user-story** reads the parent + its `[Test]`/`[TM-…]` child (for a Story the `[TM]`/`[TA]`/`[FE-…]`/`[BE-…]` tickets are subtasks under the Story); a `[TA-…]` automation ticket reads its parent + `[TM-…]` plan sibling — then extract the TMS plan (Qase) → generate → run → (heal → defect on failure) → summary → **qa-pr** (commit + open/update PR), with run-logger + run-logger-sync after every step. Fully autonomous end-to-end — every accepted ticket kind reaches PR submission without prompting.
argument-hint: [EPIC-KEY | STORY-KEY | TA-KEY | AB#<id> | <free-text intent> | empty]
---

# /qa-agent

Dual-mode entry point for the QA-Agent platform. Read `CLAUDE.md` for the full
contract (source-of-truth priority, selector strategy, reuse-before-generate,
chromium-only, never-create-bugs).

## Mode resolution — look at `$ARGUMENTS`

- **Empty** (or free-text intent) → **Router mode** (print the overview below;
  do nothing else).
- Matches `^[A-Z][A-Z0-9_]+-\d+$` (a **Jira key**, jira stack) **or**
  `^AB#\d+$` (an **Azure Boards work-item id**, azure stack) → **Orchestrator
  mode** (run the full pipeline — §Orchestrator). Before dispatch, read
  `.claude/qa-agent.json.stack`: reject a Jira key when stack is `azure`, or
  an `AB#…` id when stack is `jira`, with a message that names the current
  stack and the expected input form — never guess. The orchestrator then
  auto-detects the ticket's kind from its summary prefix:
  - a **`[TA-…]` automation ticket** (e.g. `NLM-253`) → resolve its parent
    (epic or story) → the `[TM-…]` sibling → that ticket's Qase plan.
  - **anything else** — a true **epic** (e.g. `NLM-4`), a **user story** (e.g.
    `NLM-66`, whose `[TM]`/`[TA]`/`[FE-…]`/`[BE-…]` tickets are **subtasks
    under the Story**), or a legacy `[Test]`/`[QA]` child → the original
    parent path: read the parent + its `[Test]`/`[TM-…]` child. Epic and Story
    are treated **identically** — `getEpicChildren()` uses
    `parent = X OR "Epic Link" = X`, so subtasks under a Story resolve the
    same way epic children do.
  All three kinds — on either stack — then run the **same** generate → run
  → heal → defect → **pr** pipeline. `utils/tracker.ts` abstracts Jira and
  Azure Boards; `utils/tms.ts` abstracts Qase (on both stacks); the
  orchestrator itself never branches on vendor.
- Anything else (free-text intent like *"generate plan 1"*) → **Router mode**,
  but append a one-line nudge pointing the user to the right sub-command. Do
  NOT auto-dispatch on free text — the four `/qa-agent:*` sub-commands are the
  only way to actually run those sub-flows.

---

# Router mode

| Intent | Command | Agent |
|---|---|---|
| Generate tests from a Qase plan or case (no run) | `/qa-agent-generate plan:<id> \| TC-xxxx` | qa-codegen |
| Run tests + report to Qase (auto-creates the run) | `/qa-agent-run plan:<id> \| all \| <module> \| TC-xxxx [--headed]` | qa-runner |
| Route the latest run's results onto a Jira epic | `/qa-agent-defect <EPIC-KEY>` | qa-defect |
| Heal broken selectors (maintenance) | `/qa-agent-heal TC-xxxx \| <module> [EPIC-KEY]` | qa-healer |
| Open a PR stamped with Jira + Qase context | `/qa-agent-pr [STORY-KEY \| TICKET-KEY \| empty]` | qa-pr |
| End-to-end agentic workflow from a Jira epic | `/qa-agent <EPIC-KEY>` | orchestrator (this command, see below) |
| End-to-end agentic workflow from a Jira **user story** (subtasks = [TM]/[TA]/[FE-…]/[BE-…]) | `/qa-agent <STORY-KEY>` (e.g. `NLM-66`) | orchestrator (identical to epic mode) |
| End-to-end agentic workflow from a `[TA]` ticket | `/qa-agent <TA-KEY>` (e.g. `NLM-253`) | orchestrator (TA mode, see below) |
| End-to-end agentic workflow from an **Azure Boards** work-item — Epic, Product Backlog Item, or `[TA-…]` Task (azure stack) | `/qa-agent AB#<id>` (e.g. `AB#12345`) — same terminal command as Jira, no webhook needed. See [docs/AZURE.md](../docs/AZURE.md) for the ticket-hierarchy walkthrough. | orchestrator (same pipeline) |
| End-to-end agentic workflow from a TMS **plan** id (Qase) — no tracker | `/qa-agent:tms <PLAN_ID> \| plan:<PLAN_ID>` | tms-orchestrator |
| End-to-end agentic workflow from a TMS **single case** id | `/qa-agent:tms TC-xxxx \| case:<id>` | tms-orchestrator |

### Jira ticket convention (NLM)

A feature epic fans out into prefixed sibling tickets. The orchestrator and
qa-defect route off these prefixes:

| Prefix | Role |
|---|---|
| `[DB-…]` | DB / persistence (routed as **be** for defects) |
| `[BE-…]` | backend (defect target) |
| `[FE-…]` | frontend (defect target) |
| `[TM-…]` | **manual** test cases in **Qase** → the **Qase-plan source** |
| `[TA-…]` | **Playwright automation** → the **trigger home + run-summary target** |

## The 4 sub-agents (shipped by the `qa-agent` plugin)
- **qa-codegen** — pull Qase → reuse/create page + locators (FE-source mined) →
  codegen (`qase.id(...)`) → validate.
- **qa-runner** — execute on chromium → auto-create Qase run → upload status +
  full-screen video + failure screenshot.
- **qa-defect** — resolve a Jira epic's FE/BE/test children → comment +
  comment on the matching child for each failure, or post a success comment on
  the `[T…]` child when the scope is all-green. Never creates a bug.
- **qa-healer** — re-resolve broken selectors → re-run → record in memory.

## A common full flow
- **Manual chaining** (fine-grained control):
  `/qa-agent-generate plan:1` → `/qa-agent-run plan:1` → `/qa-agent-defect NLM-4`
  (plus `/qa-agent-heal <module>` for selector breakage).
- **One-shot orchestrator**: `/qa-agent NLM-4` — does the above end-to-end,
  branches on results, and logs every step to Confluence.
- **Plan-only orchestrator** (no Jira): `/qa-agent:tms 8` — generate → run →
  heal → summary, driven by a Qase plan id; skips the defect step since
  there's no epic to route against.

## Always obey
reuse-before-generate; selector priority data-testid → aria → role → id → css →
xpath; no hard waits; no raw xpath; chromium only; never create Jira bugs.

---

# Orchestrator mode (`/qa-agent <EPIC-KEY>`, `/qa-agent <STORY-KEY>`, or `/qa-agent <TA-KEY>`)

End-to-end. Drives the full QA-Agent platform on one Jira key from a single
command — read context, generate code, execute, heal, route defects, summarise.

**Trigger:** `/qa-agent <KEY>` (e.g. `/qa-agent NLM-4` for an epic, `/qa-agent
NLM-66` for a user story, or `/qa-agent NLM-253` for a `[TA]` ticket). If
`$ARGUMENTS` is empty or unmatched, stay in router mode (above). The key shape
is `^[A-Z][A-Z0-9_]+-\d+$`.

**Three ways in, one pipeline.** Step 1 detects the key's kind and resolves the
scope; Steps 2–6 are identical for all three:

- **Epic key** → read the epic + its `[Test]`/`[QA]` child (Step 1A).
- **User-story key** → **identical to epic mode** (Step 1A). The `[TM-…]` /
  `[TA-…]` / `[FE-…]` / `[BE-…]` tickets sit as **subtasks under the Story**;
  `tracker.getEpicChildren()` uses `parent = X OR "Epic Link" = X` so subtasks
  resolve the same way epic children do. `EPIC` in Steps 2–7 is the Story key
  in this mode (used for defect routing and the PR body anchor).
- **`[TA-…]` automation key** → read its parent (epic or story) + the `[TM-…]`
  plan sibling (Step 1B).

**Scope:** the single app configured in `.claude/app-profile.md`. Routing
across several apps is out of scope — do not branch on it.

**Tools you'll use:** `Bash`, `Read`, the four sub-commands
(`/qa-agent-generate`, `/qa-agent-run`, `/qa-agent-heal`, `/qa-agent-defect`),
the two skills `design-agent:run-logger` +
`design-agent:run-logger-sync`, and the **dashboard helper**
`utils/orchestrator-dashboard.ts` (see §Dashboard contract — auto-posts every
step to `reports/dashboard/index.html`).

## Auto mode — NON-NEGOTIABLE

Orchestrator mode is **fully autonomous**. Once `/qa-agent <EPIC-KEY>` is
invoked, run the full pipeline to completion without ever pausing for input.

- **Never call `AskUserQuestion`** in orchestrator mode. Not for ambiguity,
  not for confirmation, not for headed-vs-headless, not for module routing.
- **Never ask "shall I proceed?" / "is this OK?"** between steps. The contract
  IS the proceed decision.
- **Decide with sensible defaults**:
  - browser mode → `chromium`, headless (use `--headed` only if `$ARGUMENTS`
    explicitly contains `--headed`).
  - scope priority → `planId` from `[Test]` child wins; first `TC-xxxx` ref
    is the fallback (see Step 1).
  - heal target → for module-wide failures, run the healer once per affected
    module (sequentially). For a single failing case, target `TC-xxxx`.
  - defect routing → qa-defect already FE/BE-classifies; don't second-guess.
- **The ONLY way to abort** is the documented §Stop conditions. Hit one of
  those → log a `failed` event, post what you have, exit with a clear
  diagnosis. For anything else, keep going.
- **Run-logger is prefilled, never interactive.** Always pass the
  `prefilled:` block per the §Run-logger contract; the skill must not prompt.
- **Heal retries are autonomous.** qa-healer's 2-retry cap (3 attempts total)
  runs end-to-end without user prompting; see §Step 4 for the explicit cycle.
- **PR submission is autonomous.** Step 7 (`/qa-agent-pr`) ALWAYS runs at the
  end of the pipeline (epic mode, `[TA]` mode, AND Watch / Jira-comment mode).
  Never ask "should I commit?" / "should I open the PR?" — the orchestrator
  stages the generated assets, commits on the current feature branch, pushes,
  and dispatches `/qa-agent-pr`. The only legitimate skip is a documented
  Step 7 abort (protected branch / push failure / `gh` not authenticated) —
  surface it in the report, do not retry by asking the user.
- **run-logger-sync is autonomous.** Fire it after every `run-logger` call
  without confirmation; sync failures are reported, not blocking.

If a tool feedback message implies the user is expected to answer (e.g. a
skill in interactive mode), re-invoke the skill with the prefilled block
forced. Never wait for the user.

### Runs autonomously — never *ask the user a question*

The orchestrator (and the whole chain it dispatches — `/qa-agent-generate`,
`/qa-agent-run`, `/qa-agent-heal`, `/qa-agent-defect`, `/qa-agent-pr`,
`design-agent:run-logger`, `design-agent:run-logger-sync`)
decides everything with sensible defaults and **never calls
`AskUserQuestion`**, all the way from the orchestrator down to PR submission
and Confluence sync. This is about *decision* prompts, not *permission*
prompts.

- **Decision prompts** (ambiguity, confirmation, module routing,
  headed-vs-headless) → never asked; resolve with the defaults above.
- **Permission prompts** (Bash / MCP tool approval) are a separate, harness-level
  concern. To run the pipeline without them, configure a permission **allowlist**
  in `.claude/settings.json` (the sanctioned mechanism) for the npm/git/tsx and
  Jira/Qase MCP calls the chain makes — or launch the session yourself with a
  bypass flag if you choose. The orchestrator does **not** embed
  `--dangerously-skip-permissions`, and a comment-triggered run never silently
  bypasses approval off untrusted input.
- This applies regardless of entry kind (epic or `[TA]`).

## Workflow (mirrors the flowchart)

```
Trigger
  → Read Jira ticket context
  → (Determine project — the configured app; skip routing)
  → /qa-agent-generate (qa-codegen) → run-logger (prefilled) → run-logger-sync
  → /qa-agent-run      (qa-runner)  → run-logger (prefilled) → run-logger-sync
      ├─ all green                                  → Summary
      └─ failures
          → /qa-agent-heal (qa-healer) → run-logger (prefilled) → run-logger-sync
              ├─ recovered                          → Summary
              └─ still failing
                  → /qa-agent-defect (qa-defect) → run-logger (prefilled) → run-logger-sync
                                                                          → Summary
  → Summary → Qase + Jira
  → /qa-agent-pr       (qa-pr)      → run-logger (prefilled) → run-logger-sync
                                                            → End
```

The pipeline ALWAYS ends with `qa-pr` — outcome (green / healed / defects
routed) doesn't matter; the PR is how reviewers see the run + the routed
defects + the generated assets. The orchestrator stages + commits the generated
work itself (the user no longer commits by hand; see §Step 7), and `qa-pr`
opens or updates the PR for the current branch with the Jira table + Qase run
URL + per-failure deep-links stamped into the body.

You are the orchestrator. Execute steps sequentially, branch on the result of
each step, and never skip a `run-logger` + `run-logger-sync` after a workflow
step completes (even on failure of that step — log what happened).

## Step 1 — Read tracker context (detect the key kind first)

The single `$ARGUMENTS` key drives two resolution paths. **Detect the kind, then
follow 1A or 1B.** Both produce the same cached scope (`EPIC` = the epic to route
defects against, `PLAN_ID` or case ref, and the summary-target ticket).

Before dispatch, **verify `$ARGUMENTS` matches the active stack** — read
`.claude/qa-agent.json.stack`:
- `stack: "jira"` → `$ARGUMENTS` must match `^[A-Z][A-Z0-9_]+-\d+$` (a Jira
  key). An `AB#…` id here is a stack-mismatch; abort with a message that
  names the current stack and the expected input form.
- `stack: "azure"` → `$ARGUMENTS` must match `^AB#\d+$` (an Azure Boards
  work-item id). A Jira key here is a stack-mismatch; abort the same way.
Never guess the stack from the argument shape — the ground truth is
`.claude/qa-agent.json`.

```bash
KEY="$ARGUMENTS"         # tracker key: Jira issue key OR AB#<id>
KEY="$KEY" npx tsx -e 'import {tracker} from "./utils/tracker.js"; const k=process.env.KEY!; const i=await tracker.getIssue(k); console.log(i.classification);'
# → "automation"  → Step 1B ([TA] ticket)
# → anything else → Step 1A (epic)
```

### Step 1A — Epic or user-story key (the parent path)

Works identically whether `$ARGUMENTS` is an **epic** (e.g. `NLM-4`) or a
**user story** (e.g. `NLM-66`). In both cases `tracker.getEpicChildren(<KEY>)`
resolves the parent's direct children — for a Story that means its subtasks
(`[TM-…]`, `[TA-…]`, `[FE-…]`, `[BE-…]`), and for an epic that means the
`[Test]`/`[TM-…]`/`[QA]` child + the `[FE-…]`/`[BE-…]` siblings. Read that
list, find the `[Test]`/`[TM]`/`[QA]` child, and extract the Qase plan id
from its summary or description. `EPIC` in the rest of the pipeline refers to
whichever parent was passed (used verbatim for defect routing and the PR body
anchor).

```bash
EPIC="$ARGUMENTS"        # epic OR user-story key

EPIC="$EPIC" npx tsx <<'EOF'
import { tracker, extractPlanId, extractCaseRefs } from "./utils/tracker.js";
const epicKey = process.env.EPIC!;         // epic or story — resolver is identical
const epic = await tracker.getIssue(epicKey);
const children = await tracker.getEpicChildren(epicKey);   // JQL: parent=X OR "Epic Link"=X (covers Story subtasks too)
const testChild = children.find((c) => c.classification === "test");
if (!testChild) throw new Error(`${epicKey} has no [Test]/[TM-…]/[T-…]/[QA] child/subtask.`);
const desc = await tracker.getIssueDescription(testChild.key);
const blob = `${testChild.summary}\n${desc}`;
const planId = extractPlanId(blob);
const caseRefs = extractCaseRefs(blob);
console.log(JSON.stringify({
  epic: { key: epic.key, summary: epic.summary, status: epic.status },
  test: { key: testChild.key, summary: testChild.summary },
  planId, caseRefs,
  children: children.map((c) => ({ key: c.key, classification: c.classification, summary: c.summary })),
}, null, 2));
EOF
```

**Resolve scope** in this order:
1. `planId` present → scope is `plan:<planId>`.
2. `caseRefs` present (one or many) → scope is the first `TC-xxxx` (run by grep).
3. Otherwise → **abort**: the `[Test]` child must declare either `plan:<n>` / a
   Qase plan URL, or one or more `TC-xxxx` refs in its summary/description.

Cache `EPIC`, `PLAN_ID` (or case ref), `TEST_CHILD` (the `[TM-…]`) and, when
present, `TA_CHILD` (the `[TA-…]` sibling — resolved via
`children.find((c) => c.classification === "automation")`). The **summary-target
list** is `TEST_CHILD` **and** `TA_CHILD` if it exists — qa-defect posts the
per-run summary on BOTH tickets so the automation ticket carries the same
green/red signal as the manual test-case ticket. Epic mode and Story mode
resolve the automation sibling identically.

### Step 1B — `[TA-…]` automation key (the Jira-comment path)

The `[TA]` ticket is the trigger home, not the plan source. Walk
`[TA]` → parent epic → the `[TM-…]` sibling, and pull the Qase plan from the
`[TM]` ticket (summary → description → **comments**). The parent epic becomes
`EPIC` for defect routing; the summary lands on **both** the `[TA]` and `[TM]`
tickets.

```bash
TA="$ARGUMENTS"          # strip any trailing github:/--headed tokens first

TA="$TA" npx tsx <<'EOF'
import { tracker, extractPlanId } from "./utils/tracker.js";
const taKey = process.env.TA!;
const ta = await tracker.getIssue(taKey);
const parent = await tracker.getParentKey(taKey);
if (!parent) throw new Error(`${taKey} has no parent epic — cannot resolve the [TM] plan sibling.`);
const siblings = await tracker.getEpicChildren(parent);
const tm = siblings.find((c) => /^\s*\[\s*tm(?:-\d+)?\s*\]/i.test(c.summary));
if (!tm) throw new Error(`Parent ${parent} has no [TM-…] sibling — no Qase plan source.`);

// Plan source priority: [TM] summary → description → comments.
let blob = `${tm.summary}\n${await tracker.getIssueDescription(tm.key)}`;
let planId = extractPlanId(blob);
if (!planId) {
  const comments = await tracker.getIssueComments(tm.key);
  planId = extractPlanId(comments.map((c) => c.bodyText).join("\n"));
}
if (!planId) throw new Error(`[TM] ${tm.key} declares no Qase plan (summary/description/comments).`);

console.log(JSON.stringify({
  ta: { key: ta.key, summary: ta.summary, status: ta.status },
  epic: parent,            // defects route against the parent epic
  tm: { key: tm.key, summary: tm.summary },
  planId,
  children: siblings.map((c) => ({ key: c.key, classification: c.classification, summary: c.summary })),
}, null, 2));
EOF
```

If a `github:<url>` token was supplied on the command, compare it to
`git remote get-url origin` and **warn** on mismatch — informational only, never
abort (this repo is always where the run happens).

Cache `EPIC` = the parent, `PLAN_ID`, `TA_KEY`, and `TM_KEY`. The
summary-target tickets are **`TA_KEY` + `TM_KEY`** (Step 6).

## Step 2 — qa-agent-generate

**2a. Read the authoring style from Qase first.** The scope decides *what kind*
of code gets generated, and Qase already says which: every case carries a
`steps_type`. Probe it before generating (deterministic, no guessing — the last
stdout line is `bdd`, `classic`, or `mixed`):

```bash
npm run qase:plan-style -- plan:<PLAN_ID>     # or TC-xxxx
```

| Style | What qa-codegen produces | Run command in Step 3 |
|---|---|---|
| `classic` | `tests/e2e/<area>/<m>.spec.ts` (one `test()` per case, one `test.step()` per Qase row) | `/qa-agent-run plan:<PLAN_ID>` |
| `bdd` | `features/<area>/<m>.feature` + `steps/<area>/<m>.steps.ts` (no per-module spec — `bddgen` generates it) | `npm run test:<m>` (the script codegen wrote), or `BDD_FEATURE=<area>/<m> npm run test:bdd:feature` |
| `mixed` | both, split by case | both of the above |

Record the style in the run log — it is the single fact that explains the shape
of the diff. Never override it: a Gherkin case is not rewritten into classic
rows, and a classic case is not promoted to Gherkin (CLAUDE.md §5a).

**2b. Generate** by **invoking the existing slash command** (do not call
qa-codegen directly — go through the command so the contract in
`qa-agent-generate.md` is enforced). **Pass the cached `TM_KEY` from Step 1
as `tm:<KEY>`** so qa-codegen can read the `[TM-…]` description + attached
designs (Figma / mockups) as supplementary context — Qase still owns the
test scenarios (`qa-codegen` §1a-tracker). Do **not** pass `TA_KEY`; the
`[TA-…]` is only the automation trigger home, not a codegen input:

- plan (epic mode, `TEST_CHILD` = the `[TM-…]`) → `/qa-agent-generate plan:<PLAN_ID> tm:<TEST_CHILD>`
- plan (TA mode) → `/qa-agent-generate plan:<PLAN_ID> tm:<TM_KEY>`
- single case → `/qa-agent-generate TC-xxxx [tm:<TM_KEY>]`

If the caller was invoked with a plan-only scope (`/qa-agent:tms <PLAN_ID>`)
there is no tracker context — omit the token.

The command reads `steps_type` itself and picks the branch; step 2a is so **you**
know which run command to use next and can spot a wrong-branch diff (e.g. a
`.spec.ts` appearing for a `bdd` plan) before running anything.

Wait for completion. Record:
- the authoring style from 2a,
- files created/changed — for `bdd`, expect `features/<area>/<m>.feature` +
  `steps/<area>/<m>.steps.ts` + the new `test:<m>` script, and **no**
  `tests/e2e/**` spec unless the plan is `mixed`,
- whether typecheck + lint passed (qa-codegen runs them; treat a red gate as a
  step failure — do NOT proceed to step 3),
- for `bdd`: that `npm run bddgen` reported no unexpected missing step,
- the printed run command (for the next step).

Then **log + sync** (see §Run-logger contract):

```
tag: Accept                # if generated cleanly
manual_effort: 4           # ~4h to author the spec/page/locator by hand
```

If qa-codegen returned a hard error (typecheck/lint red after its own retry),
log it as `tag: Rework, hallucination: No, improvement_point: Agent` with a
short note, then **stop** — do not run a red codebase.

## Step 3 — qa-agent-run

Execute the scope (chromium, headless by default). **Pick the command that
matches the authoring style from Step 2a:**

- `classic` plan → `/qa-agent-run plan:<PLAN_ID>`
- `classic` single case → `/qa-agent-run TC-xxxx`
- `bdd` → `/qa-agent-run <module>` (its `test:<m>` script runs `bddgen` first) —
  a **skipped** scenario means a pending/unmatched step definition or a
  `@qase-project:` mismatch, not a product defect: that is a Step-2 gap, route it
  back to qa-codegen, never to heal/defect.
- `mixed` → run both scopes and merge the counts into one summary.

qa-runner mints a fresh Qase cycle, runs, and uploads status + video +
screenshot. Capture:
- `CYCLE_KEY` (the new run id) — `tail -1` of the create-run output if not
  printed otherwise,
- the **Qase run URL**,
- pass/fail/flaky counts (read `reports/results.json` if needed).

**Log + sync** with `manual_effort: 1` (the hour saved per manual execution).

Then branch:
- **all green** → skip to Step 6 (Summary).
- **any failure** → Step 4 (heal).

## Step 4 — qa-agent-heal (on failure) — **2 retries, no exceptions**

Hand the failing scope to the healer **with the epic key** so it knows where
to escalate if the heal fails:

- module-wide → `/qa-agent-heal <module> <EPIC>`
- single case → `/qa-agent-heal TC-xxxx <EPIC>`

### Retry cycle — fix → re-run, capped at 2 retries (3 attempts total)

qa-healer must do exactly this:

```
Attempt 1: re-resolve selector → re-run (chromium)
  ├─ green → stop, report recovered
  └─ still red ↓
Attempt 2 (RETRY 1): re-resolve again (from FE source / DOM) → re-run
  ├─ green → stop, report recovered (1 retry used)
  └─ still red ↓
Attempt 3 (RETRY 2): final re-resolve → re-run
  ├─ green → stop, report recovered (2 retries used)
  └─ still red → escalate to /qa-agent-defect <EPIC>
```

The retry count is **non-negotiable**: never 0, never 1, always exactly up to
2 retries. Stop as soon as it goes green; never keep retrying past green.
Never downgrade selector priority between attempts (testid → xpath is banned).

If multiple cases failed in different modules, run this 3-attempt cycle
**once per module** (sequentially). Each module gets its full 2-retry budget.

**Log + sync** per healer invocation with `manual_effort: 2`. In the dashboard
event for `qa-healer/heal/completed` include `notes: "recovered after N
retr(y|ies)"` so the timeline shows the retry count.

Then branch on the healer's report:
- **recovered (green within the 3-attempt cycle)** → Step 6 (Summary).
- **still failing AND escalated** → qa-healer already handed off to
  `/qa-agent-defect <EPIC>` after its 2 retries; treat Step 5 as already done
  for that scope (do NOT double-route). Log it under qa-healer's entry, then
  go to Step 6.
- **healer aborted early (didn't do the full 3 attempts)** → that's an agent
  gap; log `tag: Rework, hallucination: Yes, improvement_point: Agent,
  notes: heal cycle truncated — only N attempts run`, then re-invoke qa-heal
  forcing the full cycle. Never accept a truncated cycle.

## Step 5 — qa-defect (ALWAYS runs — summary + terminal transition are non-negotiable)

**qa-defect must ALWAYS be dispatched before Step 7 (PR), regardless of
outcome.** The orchestrator MUST post the per-run summary comment on the
tracker summary-target ticket(s) — the `[TM-…]` **and** the `[TA-…]`
sibling whenever it exists, in **every** mode (epic, story, or TA entry) —
**before** the PR step, so reviewers see the run context on the tracker first
and the PR body just references what's already there. The `[T-…]` / `[QA]`
legacy child form still counts as the `[TM-…]` for this rule. No matter what:

- **All-green** → dispatch `/qa-agent-defect <EPIC>` anyway; the sub-command
  posts the success/summary comment on the summary-target ticket(s) and
  transitions each of them to **WAITING TO DEPLOY** (§6a of qa-defect).
  qa-defect never creates a bug ticket, so a green run is safe to route.
- **Failures + qa-healer already escalated to qa-defect** → do NOT re-dispatch
  (double-route). Trust the healer's handoff; Step 5 is already done.
- **Failures + qa-healer did NOT escalate** (heal skipped, or heal recovered
  but you still want the summary) → dispatch `/qa-agent-defect <EPIC>`.

```
/qa-agent-defect <EPIC>
```

qa-defect uploads screenshots (on failure), posts the QA-template bug comment
on the routed FE/BE child for each failure and transitions that child to
`TEST: FAILED/BUGS`, and **always** posts a per-run summary on the
summary-target child(ren) — even when the run is all-green. On an all-green
run it also transitions **every family child** (`[TM-…]`, `[TA-…]`, `[FE-…]`,
`[BE-…]`) to `WAITING TO DEPLOY`. On a red run, `[FE-…]` / `[BE-…]` are never
transitioned to WAITING TO DEPLOY — they only move to `TEST: FAILED/BUGS`.

Transitions are discovered live via `tracker.getTransitions(<issueKey>)` — never
hard-coded ids. If no forward path exists from the current state, the
sub-command comments only and reports "skipped: already-in-target /
no-forward-path".

Never skip Step 5 to speed up green runs. The summary is the reviewer's entry
point on the tracker; the PR must not open before it lands.

**Log + sync** with `manual_effort: 1` (the hour saved per manual defect
triage + tracker comment authoring).

## Step 6 — Summary (TMS + tracker) + transitions

Both the summary comment and the terminal transitions are **already in place**
by this point — do not re-create them. They landed in Step 5 (qa-agent-defect
always runs, even on green — see the Step 5 preamble):
- **TMS**: the run + per-case status (and the screenshots/videos/traces) live
  at the run URL emitted in Step 3.
- **Tracker**: qa-defect posts the per-run summary comment on the
  summary-target child(ren), with deep-links to each per-failure comment.
  In **every** mode (epic, story, TA) that's the `[TM-…]` **and** the
  `[TA-…]` sibling whenever it exists — the same green/red signal lands on
  both tickets. Legacy `[T-…]` / `[QA]` children are treated as the
  `[TM-…]`.
- **Terminal transitions** (§6a of qa-defect):
  - bug present → routed FE/BE child → `TEST: FAILED/BUGS`
    (`[TM-…]` / `[TA-…]` receive the summary comment but do not transition
    on red),
  - all-pass → **every family child** (`[TM-…]`, `[TA-…]`, `[FE-…]`,
    `[BE-…]`) → `WAITING TO DEPLOY`. All-green is the signal that the
    automated coverage cleared the whole vertical slice, so the whole slice
    moves together.

If for some reason Step 5 was skipped (e.g. an exception between Step 4 and
Step 5), the orchestrator MUST re-attempt Step 5 here before proceeding to
Step 7. **Never open a PR that isn't preceded by a tracker summary comment on
the summary-target ticket(s).**

Compose a final **orchestrator report** for the user (≤200 words), structured
as:

```
Entry:     <EPIC> (epic)  |  <TA_KEY> [TA] → parent <EPIC>
Plan src:  <TEST_CHILD>  |  <TM_KEY>
Scope:     plan:<id>  |  TC-xxxx
Qase run:  <URL>      (id <CYCLE_KEY>)
Outcome:   ✅ all green | 🟠 healed | 🔴 defects routed

Steps
  • generate  → <files changed count>, typecheck+lint <pass|fail>
  • run       → P:<n> F:<n> Flaky:<n>
  • heal      → <skipped | applied <m> heals | escalated>
  • defect    → <skipped | <m> FE / <n> BE comments posted>
  • pr        → <created #<n> | updated #<n> | aborted: <reason>>

Jira:      summary on <summary targets>; per-failure on <fe-children>, <be-children>
           transitions: FE/BE → TEST: FAILED/BUGS: <n applied>; summary-targets → WAITING TO DEPLOY: <applied | not attempted (run not green) | no path available>
GitHub:    <PR URL>
Logs:      run-log.jsonl entries: <n> pending → synced to Confluence
```

After Step 6 finishes (regardless of outcome), the orchestrator continues to
Step 7 to land the PR. The user is never asked to commit or push.

## Step 7 — qa-pr (autonomous commit + PR — ALWAYS runs)

The orchestrator owns the commit + push + PR so the whole pipeline reaches
GitHub without manual intervention. This step **always runs**, including on
green runs.

1. **Stage + commit** any unstaged changes the orchestrator produced
   (generated specs, page-object updates, locator self-heals, memory rows).
   Stage by explicit path — never `git add -A` — and skip anything outside
   the QA-Agent surface (`tests/`, `pages/`, `locators/`, `fixtures/`,
   `shared/`, `utils/`, `package.json`, `.claude/memories/`). Skip the step
   silently when `git status --porcelain` is clean. Commit message format:

   ```
   test(<module>): <human summary> (<EPIC or TA key>)

   <one-line scope: plan:<id> / TC-xxxx, X cases>

   Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
   ```

   The commit is created on the **current branch** — never on `main` /
   `master`. If the orchestrator was invoked on a protected branch, abort
   the PR step (do NOT create one), log the abort under Step 7, and surface
   it in the final report. Never `--no-verify`, never amend.

2. **Push** the current branch (`git push -u <remote> HEAD`). Pick the first
   remote that points at a GitHub repo the gh CLI can authenticate to; if the
   default `origin` is unreachable, fall back to a secondary remote without
   reconfiguring `origin`. **Also ensure the base branch exists on that
   remote** — if it does not (a fresh fork that only carries `main`, for
   example), push the local `master` to the remote first so the PR can target
   it. If push fails for any reason, log the failure under Step 7, surface it
   in the report, and continue to the dispatch (which will then no-op
   cleanly).

3. **Dispatch `/qa-agent-pr <EPIC or TA-KEY> --base master`.** Pass the entry
   key from Step 1 so the PR body is anchored to the right Jira parent, and
   pin `--base master` (the canonical base for this repo family — never
   `main`). The sub-command opens a new PR or updates the existing one for
   the branch — never duplicates.

4. **Log + sync** with `agent: qa-pr`, `tag: Accept`, `manual_effort: 1`
   (PR opened) or `0.5` (existing PR updated). On abort (dirty-but-protected
   branch / push failure / `gh` not authenticated), use
   `tag: Rework, hallucination: No, improvement_point: <Human|Agent>,
   notes: <reason>`.

Step 7 is **autonomous** — it never asks "should I commit?" or "should I
push?". The pipeline is the contract; the PR is the closing artifact.

## Dashboard contract (called at the start AND end of every workflow step)

In orchestrator mode you also stream events to the live monitoring dashboard
(`reports/dashboard/index.html`, auto-refreshes every 5s). The user can open
it once with `npm run dashboard:open` and watch the pipeline live.

Helper CLI:
```bash
# Append one event + regenerate the HTML in one go.
npx tsx utils/orchestrator-dashboard.ts event '<json>'
```

Mint a `runId` once at Step 1 (e.g. `RUN_ID=$(uuidgen | tr 'A-Z' 'a-z')`) and
reuse it for every event in this orchestrator invocation.

### Event payload — required fields

`runId`, `epic`, `agent`, `step`, `status` are **mandatory**.

| field | values |
|---|---|
| `agent` | `qa-agent-orchestrator \| qa-codegen \| qa-runner \| qa-healer \| qa-defect \| qa-pr` |
| `step` | `start \| generate \| run \| heal \| defect \| summary \| pr \| end` |
| `status` | `running \| completed \| failed \| skipped` |

### Event cadence per step

1. **Step 1 (start)** — emit one `qa-agent-orchestrator/start/running` event with the
   resolved scope, epic title, and `[Test]` child:
   ```json
   {"runId":"$RUN_ID","epic":"NLM-4","epicTitle":"…","testChild":"NLM-7",
    "scope":"plan:8","agent":"qa-agent-orchestrator","step":"start","status":"running"}
   ```
2. **Each sub-step (generate/run/heal/defect)** — emit TWO events: one
   `running` when the sub-command launches, one `completed`/`failed`/`skipped`
   when it returns. The `completed` event carries `durationSec`, `tokenCost`,
   and any per-step results (e.g. `results: { passed, failed, flaky }` after
   the run; `qaseRunId` + `qaseRunUrl` after the run; `notes: "escalated to
   qa-defect"` when applicable).
3. **Step 7 (pr)** — emit `qa-pr/pr/running` when the commit/push/dispatch
   starts and `qa-pr/pr/completed` (or `failed` / `skipped`) when it
   returns. The `completed` event carries `prUrl`, `prNumber`,
   `action: "created" | "updated"`, and `notes` for any abort reason
   (`"dirty tree on protected branch"`, `"push failed: …"`, etc.).
4. **Step 6 (summary) + Step 7 close** — emit a final
   `qa-agent-orchestrator/end/completed` (or `failed` on abort) event **after Step 7
   returns**, so the dashboard moves the row out of "Active" only once the
   PR step is done.

### Order of operations per step

```
appendEvent  (running)       → dashboard shows pipe-cell as running
<run the sub-command>
appendEvent  (completed)     → dashboard updates the pipe-cell + stats
run-logger   (prefilled)     → see §Run-logger contract
run-logger-sync              → push to Confluence
```

If a step is genuinely skipped (e.g. heal not needed because the run was
all-green) emit `status: "skipped"` so the dashboard renders the cell as
"skipped" rather than leaving it pending.

## Run-logger contract (called after every workflow step)

In orchestrator mode you invoke the `design-agent:run-logger` skill
**with a `prefilled:` block** so the user is never prompted mid-flow. Then
invoke `design-agent:run-logger-sync` to push the entry to Confluence.

### `agent` field — one canonical name per agent (NO command-name variants)

run-logger-sync creates **one Confluence page per distinct `agent` value**, so
the `agent` field MUST be the **agent's** name, never the slash-command name.
Use exactly these — never the `qa-agent-*` command spellings:

| Step (command) | run-logger `agent` value |
|---|---|
| `/qa-agent-generate` | `qa-codegen` |
| `/qa-agent-run` | `qa-runner` |
| `/qa-agent-heal` | `qa-healer` |
| `/qa-agent-defect` | `qa-defect` (never `qa-agent-defect`) |
| `/qa-agent-pr` | `qa-pr` (never `qa-agent-pr`) |
| the orchestrator itself | `qa-agent-orchestrator` — lands on the Confluence page of that name under the Agent Logs folder configured in `.team.json` (never `orchestrator`) |

This keeps the dashboard `agent` enum and the Confluence pages aligned to a
single name each — no `qa-defect` **and** `qa-agent-defect` duplication.

Prefilled block per step:

| Step | tag | manual_effort (h) | Other |
|---|---|---|---|
| qa-codegen (clean) | Accept | 4 | — |
| qa-codegen (red gate) | Rework | — | `hallucination: No, improvement_point: Agent, notes: <why>` |
| qa-runner (clean exec) | Accept | 1 | — |
| qa-runner (test infra crash) | Rework | — | `hallucination: No, improvement_point: Agent, notes: <why>` |
| qa-healer (recovered) | Accept | 2 | — |
| qa-healer (escalated) | Accept | 2 | `notes: escalated to qa-defect` |
| qa-defect | Accept | 1 | — |
| qa-pr (PR created) | Accept | 1 | `notes: PR #<n> opened — <url>` |
| qa-pr (PR updated) | Accept | 0.5 | `notes: updated existing PR #<n> — <url>` |
| qa-pr (aborted — protected branch / push failed / gh unauthed) | Rework | — | `hallucination: No, improvement_point: <Human\|Agent>, notes: <why>` |
| **`qa-agent-orchestrator` (start)** | Accept | — | `notes: pipeline started for <EPIC or TA-KEY>` — fire at Step 1 kickoff so the orchestrator's own "run started" event lands on the qa-agent-orchestrator Confluence page. |
| **`qa-agent-orchestrator` (end — all green)** | Accept | 8 | `notes: green — <pass>/<total>, Qase run <URL>, PR <url>` |
| **`qa-agent-orchestrator` (end — routed defects)** | Accept | 6 | `notes: <n> defects routed to <children>, Qase run <URL>, PR <url>` |
| **`qa-agent-orchestrator` (end — aborted)** | Rework | — | `hallucination: No, improvement_point: <Human\|Agent>, notes: <abort reason>` |

> **Mandatory per-step logging (NON-NEGOTIABLE for NLM-355 and all future runs).**
> Every step in the pipeline — codegen → run → heal → defect → pr — MUST fire
> `design-agent:run-logger` (prefilled) + `design-agent:run-logger-sync`
> BEFORE moving to the next step, even when the sub-command errored. Skipping
> a step's log is a contract violation and requires an immediate follow-up
> log with `tag: Rework, hallucination: Yes, improvement_point: Agent,
> notes: <which step was skipped>`. The orchestrator itself ALSO fires its
> own bookend entries (`qa-agent-orchestrator` start + end) so the Confluence
> `qa-agent-orchestrator` page shows one row per pipeline invocation.

The `input` field is the **entry key** — the epic key (epic mode) or the `[TA]`
key (TA mode) — with the Jira browse URL as `input_url`. The `output` field is a
1–3 entry list:
- Qase run URL (when applicable),
- Jira summary comment link (when applicable),
- the failing/healed/routed list when applicable.

Pass the per-step `agent` (from the table above), `duration` (seconds elapsed for
that step), and `token_cost` (approx tokens from the step) to the skill — the
skill does not ask the user for these.

After each `run-logger` call, immediately invoke
`design-agent:run-logger-sync` (no args) to push the pending entry to
Confluence. **`run-logger-sync` is autonomous too** — never ask the user
"should I sync now?" / "want me to push to Confluence?" between steps; fire it
unconditionally after every `run-logger`. If sync fails, log it in the
orchestrator report but **do not abort the workflow** — the local JSONL is the
source of truth and a manual `/run-logger-sync` will recover later. Sync
failure must NOT block Step 7 (PR submission).

### Why both dashboard + run-logger?

- **Dashboard** = live, granular, per-step state visualised in HTML. Reset
  per invocation; ephemeral by design.
- **run-logger / Confluence** = durable audit trail of agent runs, surfaced
  to the team; per-agent grouping rather than per-orchestrator-run.

Both fire after every step. The dashboard event is FREE (just an `appendFile`
call); the run-logger entry costs the prefilled-block summary the user reads
back in Confluence. Never skip one to "speed up" — they answer different
questions.

## Stop conditions

Abort orchestrator mode (with a clear human-readable reason in the report) when:

- (epic / user-story mode) the parent has no `[Test]/[TM-…]/[T-…]/[QA]` child
  (or, for a Story, no such subtask).
- (TA mode) the `[TA]` ticket has no parent epic, the parent has no `[TM-…]`
  sibling, or the `[TM]` sibling declares no Qase plan in its
  summary/description/comments.
- The plan source declares neither a `plan:<n>` nor any `TC-xxxx` ref.
- qa-codegen leaves the codebase with a red typecheck or lint gate.
- `EMAIL` / `ATLASSIAN_TOKEN` / `API_TOKEN` is missing.
- The user requests cancellation.

For every other error, log the step failure to run-logger, post what you have
to Jira via the relevant sub-command if reachable, and end with a clear
diagnosis. Never silently swallow failures.

## Rules (orchestrator)

- **Always go through the slash commands** (`/qa-agent-generate`,
  `/qa-agent-run`, `/qa-agent-heal`, `/qa-agent-defect`, `/qa-agent-pr`) —
  do not invoke qa-codegen/qa-runner/qa-healer/qa-defect/qa-pr agents
  directly.
- **Always run Step 5 (qa-agent-defect) BEFORE Step 7, including on
  all-green runs.** The tracker summary comment on the summary-target
  ticket(s) is the reviewer's entry point; the PR must never open before
  that comment lands. qa-defect never creates bug tickets, so routing a
  green run is safe. qa-defect also fires the terminal transitions (§6a):
  on any bug, the routed FE/BE child → `TEST: FAILED/BUGS`; on all-pass,
  **every family child** (`[TM-…]`, `[TA-…]`, `[FE-…]`, `[BE-…]`) →
  `WAITING TO DEPLOY`. `[FE-…]` / `[BE-…]` only reach WAITING TO DEPLOY
  through the all-pass path — a red run never moves them forward.
- **Always run Step 7 (qa-pr) — it is the closing artifact of the
  pipeline**, including on green runs.
- **Always log + sync after every workflow step**, even on step failure.
  `run-logger-sync` fires unconditionally; never gated on user confirmation.
- **Never create a Jira bug** (qa-defect doesn't, and you don't either).
- **Never downgrade selector priority** to force a pass (qa-healer's rule;
  trust its escalation).
- **Chromium only**, headless default; pass `--headed` through only if the
  user appended `--headed` to `/qa-agent <EPIC-KEY> --headed` (rare).
- **One epic per invocation.** If the user passes multiple keys, run them
  sequentially and emit one summary per epic.

## Done when

The summary report (§Step 6) is printed, Step 7 (`/qa-agent-pr`) has resolved
(PR created / updated / abort-reason logged), and all workflow-step entries —
including the `qa-pr` entry — are at least `pending` in `logs/run-log.jsonl`
(synced is best-effort).

---

# Watch mode — removed

`/qa-agent watch` (polling `[TA]` tickets for `QA Agent <KEY>` directive
comments) is **no longer part of this plugin**. Comment-triggered runs are
moving to a cloud implementation with a different trigger and a different trust
model, so shipping a local poller here would mean maintaining a second design
that teams could adopt and then have to unpick.

If you reached this from a link or an old note: run the orchestrator directly
with the key, `/qa-agent <TA-KEY>`.
