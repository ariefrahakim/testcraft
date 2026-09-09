---
name: qa-defect
description: Routes the latest Qase run's outcomes to the children of a tracker epic — Jira on the jira stack, Azure Boards on the azure stack. For each failure it uploads the screenshot to the matching FE/BE child and posts a QA-template bug comment with the screenshot embedded inline; it also posts a per-run summary on the `[T-…]`/`[TM-…]` test-case child. Comment + transition + attachment only — never creates a bug ticket.
tools: Bash, Read, Grep
---

# qa-defect

Epic-aware defect router. Takes **one tracker epic key** (Jira issue key on
the jira stack, `AB#<id>` on the azure stack), reads the latest Qase
run, and:

- **Per failure** → uploads the screenshot to the matching FE/BE child,
  embeds it in a **standard QA bug-report comment** (Preconditions → Steps to
  Reproduce → Actual / Expected → **Root cause suggestion** → Attachment →
  Network → Error), and (if available) transitions the child to its
  Failed/Bugs step.
- **Per run, always** → posts a per-run **summary comment on the `[T-…]`
  test-case child** listing every case in the scope (pass / fail) with a
  deep-link to the per-failure comment on each FE/BE child.

Never files a new bug.

## Input

- `<EPIC-KEY>` — a single tracker key. On jira: a Jira issue key (e.g.
  `NLM-4`). On azure: an `AB#<id>` Azure Boards work-item id (e.g.
  `AB#12345`).
  - If no key is provided, default to `env.tracker.storyKey`. On jira that
    resolves to `JIRA_PROJECT_KEY-JIRA_PARENT_ISSUE_ID`; on azure that
    resolves to `AZURE_PARENT_WORK_ITEM_ID`.
  - This is the form **qa-healer** uses to escalate.

## Epic child classification

Children are classified by the bracketed prefix on their `summary` (the FE/BE
convention used in the NLM project — e.g.
`[FE-01] [Frontend] Implement Sticky Collapsing Header …`):

| Prefix pattern | Classification | Role |
|---|---|---|
| `[FE…]`, `[Frontend]` | **fe** | Receives FE-sourced defect comments + transition |
| `[BE…]`, `[Backend]`, `[DB…]`, `[Database]` | **be** | Receives BE-sourced defect comments + transition (DB/persistence tickets route here) |
| `[TM…]`, `[T…]`, `[Test Case]`, `[QA]` | **test** | Receives the per-run summary comment (every run) — `[TM]` is the manual/Qase-plan ticket |
| `[TA…]` | **automation** | Playwright-automation ticket — also receives the per-run summary (every run) |
| anything else | **unknown** | Ignored — surfaced in the agent report |

Use `tracker.getEpicChildren(<EPIC>)` (see `utils/tracker.ts`, which
re-exports the concrete `utils/jira-helper.ts` or
`utils/azure-boards-helper.ts` for the active stack). The
classification is computed by `classifyChildBySummaryPrefix`.

**Per-run summary goes to every `test` AND `automation` child present.** Just as
the family historically carries both a `[T-…]` and a `[QA]` ticket (summary
posted on both), the new convention has a `[TM-…]` (manual/plan) and a `[TA-…]`
(automation) ticket — post the per-run summary on **all** of them. Per-failure
FE/BE routing is unchanged.

## Failure source classification (FE vs BE)

For each failed Qase case, decide source using **both** signals:

1. **Error / locator signature** — selector / locator / render / assertion → FE;
   HTTP 4xx/5xx, JSON shape mismatch, `**/api/**` timeout → BE.
2. **Trace network log** — open the trace under
   `reports/test-results/**/trace.zip`. A non-2xx on an `**/api/**` call
   **promotes** the source to `be` even if the surface error reads as a UI
   assertion.
3. If the signals disagree, prefer **be** (BE failures usually cause the FE
   state the selector then can't find).
4. If neither signal is conclusive → mark `source: "unknown"`, **comment-only**
   on the closest matching child (or skip with a note).

Record the one-line `sourceReason` (e.g. `"401 on POST /v1/search/project"` or
`"highlight span never renders inside project-detail-project-name"`) — it goes
into the comment.

## Process

### 1. Collect run data

- Resolve the run id (`CYCLE_KEY` in `.env`, corroborate via
  `reports/results.json`).
- Per failed test:
  - Read `reports/results.json` and `reports/test-results/<sanitised>/`:
    failed step, trimmed error, paths to `test-failed-*.png`, `video.webm`,
    `trace.zip`.
  - Extract a minimal **network summary** from `trace.zip` on a best-effort
    basis (e.g. `unzip -p trace.zip '*-trace.network' | jq -s '[.[] | select(.type=="response" and .status>=400)] | last'`).
    If nothing matches, write
    `"No failing API call detected — FE render regression."`.

### 2. Pull Qase case for the QA template

For each failing case ref (`TC-<id>`):

```ts
import { qase } from "./utils/qase-helper.js";
const c = await qase.getCase(caseId);
// c.preconditions  → DefectReport.preconditions
// c.steps          → DefectReport.steps (map QaseStep → ReproStep)
// last step.expected_result → DefectReport.expectedResult (fallback to c.postconditions)
```

The **Actual Result** is derived by the agent from the failed step + a short
human summary of what was observed (NOT the raw Playwright error — that lives
in the Error section). Example for TC-88:

> The "water" highlight `<span style="background:#C8F1FC">` does not render
> inside `[data-testid="project-detail-project-name"]`. The project name is
> shown as plain text in every header collapse state, even though
> `?keyword=water` is in the URL.

### 3. Resolve the epic's children + the `[T-…]` target

```ts
const children = await tracker.getEpicChildren("NLM-4");
const fe   = children.filter((c) => c.classification === "fe");
const be   = children.filter((c) => c.classification === "be");
const test = children.filter((c) => c.classification === "test");        // [TM]/[T-]/[QA]
const automation = children.filter((c) => c.classification === "automation"); // [TA]
// Post the per-run summary on every test + automation child (deduped).
const summaryTargets = [...new Set([...test, ...automation].map((c) => c.key))];
```

If `fe` or `be` is empty for a failure that needs that route, surface the gap;
do NOT post the defect on the wrong-class child.

### 4. Cross-check known issues

Read `.claude/memories/known-issues.md`. Dedupe by `(caseRef, child, runId)` —
do not duplicate a comment for a tuple already filed.

### 5. Per failure — upload screenshot, then comment + transition

```ts
const att = await tracker.uploadAttachmentFromPath(routedChild.key, screenshotPath);
// att.content is the direct attachment URL — required for the ADF media `external` node.
const t = await tracker.transitionToTestFailed(routedChild.key);
const comment = await tracker.addComment(routedChild.key, buildDefectComment({
  caseRef, title, status: "failed",
  epicKey: "<EPIC-KEY>",
  routedTo: routedChild.key,
  source, sourceReason,
  env, qaseRunUrl, qaseRunId, qaseCaseUrl,
  transitionApplied: t?.name,
  preconditions: c.preconditions,
  steps: c.steps.map((s) => ({
    position: s.position, action: s.action,
    data: s.data, expectedResult: s.expected_result,
  })),
  actualResult,
  expectedResult: c.steps.at(-1)?.expected_result ?? c.postconditions,
  failedStep,
  error,
  networkSummary,
  attachmentMedia: [{ id: att.id, contentUrl: att.content! }],
  artifactPaths: { video: videoPath, trace: tracePath, screenshot: screenshotPath },
}));
// `comment.id` is needed for the [T-…] summary deep-link.
```

> **Tenant note.** The `media` node is built in the `external` form (`{ type:
> "external", url }`), which renders on every Jira Cloud tenant. The `file`
> form (`{ type: "file", id }`) requires Atlassian Media Services and fails
> with `ATTACHMENT_VALIDATION_ERROR` on tenants without it.
> The helper takes care of this — callers only pass `attachmentMedia` with the
> id + contentUrl from `uploadAttachment(...)`.

- **Comment-only when already in failed state.** If the routed child is
  already in `TEST: FAILED/BUGS` (or no failed transition exists from its
  current state), `transitionToTestFailed` returns `null` — post the
  comment, skip the transition, surface "already in failed state" in the
  report. Never pick a wrong-direction transition (e.g. `Start bug fix →
  WIP` is the dev's recovery path, not a QA move) and never loop.

### 6. Always — post the per-run summary on every test + automation child

Even when the run is all-green, post the same summary on **every**
`summaryTargets` ticket (the `[TM]`/`[T-]`/`[QA]` test child(ren) **and** the
`[TA]` automation child). This is the same comment body on each:

```ts
const summary = buildTestCaseSummary({
  epicKey: "<EPIC-KEY>",
  qaseRunUrl, qaseRunId, env,
  cases: allCases.map((c) => ({
    ref: c.ref, title: c.title,
    status: c.status, // "passed" | "failed" | "skipped" | "broken"
    routedTo: c.routedTo,                 // FE/BE child if failed
    routedCommentId: c.routedCommentId,   // for the focusedCommentId deep-link
    failureBrief: c.failureBrief,         // one-liner for scanning
  })),
});
for (const target of summaryTargets) {
  await tracker.addComment(target, summary);
}
```

The `[T-…]` child is never transitioned — its lifecycle is separate from the
FE/BE dev workflow.

### 6a. Transition rule (mandatory)

**Transitions run AFTER the summary comment has been posted, never before.**
The order is: post per-failure defect comments → post per-run summary on every
`summaryTargets` ticket → then apply transitions below.

- **Any bug found (FE or BE)** → transition the routed FE/BE child to its
  **Failed / TEST: FAILED/BUGS** state. Use
  `tracker.transitionToTestFailed(child)` — the tracker gateway
  discovers transitions live and pattern-matches the destination state
  name on both stacks. If the child is already in that state (or no
  forward path exists from its current state), it returns `null` — post
  the comment and skip the transition (log "already-in-failed"). Never
  transition sideways or backwards (e.g. `Start bug fix → WIP` is a
  dev-recovery path, not a QA move); never invent a transition id; never
  loop.
- **All-pass run (no failures at all — every case passed or is a skipped
  `@manual` case; or every failure is a known/accepted regression already
  commented on its child)** → transition **every family child under the
  parent** to **`WAITING TO DEPLOY`** using
  `tracker.transitionToWaitingToDeploy(child)`.
  That is: `[TM-…]`, `[TA-…]`, `[FE-…]`, and `[BE-…]` — plus legacy
  `[QA]` / `[T-…]` — in **every** mode (epic, story, TA). All-green is the
  signal that the automated coverage cleared the whole vertical slice, so
  the whole slice moves together. If a ticket has no forward path to
  WAITING TO DEPLOY from its current state, log "no-forward-path" and skip
  that ticket — never force it, never block the rest of the family. The
  `[FE-…]` / `[BE-…]` children only reach WAITING TO DEPLOY through this
  all-pass path — a red run never moves them forward (their red-path target
  is `TEST FAILED/BUGS` / `Test Failed/Bugs`).

Both branches are strict: on a bug-present run, FE/BE children MUST reach
Failed (or already be there); on an all-pass run, every family child
(`[TM-…]`, `[TA-…]`, `[FE-…]`, `[BE-…]`) MUST reach WAITING TO DEPLOY (or
already be there). Silent skips are allowed only when the current-state →
target-state transition is genuinely unavailable in the workflow.

**Discovery is live.** Never hard-code a transition id or a transition name.
`transitionToTestFailed` / `transitionToWaitingToDeploy` both fetch the
issue's current transitions (jira) or work-item state list (azure) and
pattern-match the destination-state name.

**Patterns are per-tenant config, not baked in.** Different tenants label
the "failed" and "passed" destination states differently
(`TEST: FAILED/BUGS` vs `Failed`, `WAITING TO DEPLOY` vs `Waiting to Deploy`
vs `Ready for Release`, and the surface transition name is often unrelated
— `Pull request`, `Start Pull Request`, `Move to release`). The helpers
MUST source their pattern list from `.team.json` (or the resolved tenant
block) under keys like `failedDestinationStates: ["TEST: FAILED/BUGS",
"Failed", "Bugs"]` and `passedDestinationStates: ["WAITING TO DEPLOY",
"Waiting to Deploy", "Ready for Release", "Done"]`. Hard-coding a regex
list inside `utils/jira-helper.ts` / `utils/azure-boards-helper.ts` is a
bug — it silently no-ops on every tenant whose workflow the plugin
author did not have in mind at write time, and the caller sees an
"all-pass run, no transition applied" that looks like healthy behaviour.

**Skip reasons are always logged, never silent.** When
`transitionToTestFailed` / `transitionToWaitingToDeploy` returns `null`,
the log line must name **why**:
`already-in-target: <state>`, `no-forward-path: <current-state>`, or
`pattern-mismatch: <destination-states-offered>` — the third variant is
the signal that `.team.json` is missing this tenant's destination-state
names and the config, not the pipeline, needs the fix.

**On the `azure` stack** the same rules apply through the tracker's
Azure-Boards adapter (Azure has no transition objects — a state change is a
field patch, so the adapter reads the work-item type's allowed states,
regex-matches the target, and PATCHes `System.State`):
- Bug-present → `tracker.transitionToTestFailed(routedChildKey)` moves the
  routed FE/BE **Task** to `Test Failed/Bugs` (also matches
  `Test Failed / Bugs`, `Failed/Bugs`, `Bugs`).
- All-green → `tracker.transitionToWaitingToDeploy(<key>)` is called for
  **each** family child under the parent PBI / Story / Epic — the
  `[TM-…]`, `[TA-…]`, `[FE-…]`, and `[BE-…]` Tasks — moving each to
  `Waiting to Deploy`. This is the green-path family write per CLAUDE.md §8;
  Azure tolerates `Waiting to Deploy`, `Waiting for Deploy`, and
  `Waiting to Deployment` spellings.
Both return `null` if the work-item type's workflow does not offer the
destination state; log the same skip reasons as the Jira path.

### 7. Append to known-issues memory

For each newly reported defect, append a row to
`.claude/memories/known-issues.md` (id, module, description, status,
workaround placeholder, first-seen date) so the next run dedupes.

## Output (agent report, ≤200 words)

- Epic + child counts (fe/be/test/unknown).
- Qase run id + URL.
- Per failure: `caseRef → routedTo (FE|BE)`, attachment id, comment id,
  transition applied (or "skipped: already-in-failed" / "no-forward-path").
- `[T-…]` summary comment id, plus per-summary-target transition applied
  (or "skipped") on an all-pass run.
- Skipped-known issues; missing-class gaps; unclassified sources.

## Rules

- **Never** create-issue. Comment + transition + attachment-upload only.
- **Always upload the screenshot first**, then build the comment with
  `attachmentMediaIds: [att.id]` so it renders inline. A bare file path in
  text is not acceptable.
- **Always dual-post**: full defect on the FE/BE child + summary on the
  `[T-…]` child. The summary runs even on green scopes.
- **Transitions discovered live**, never hard-coded; respect the comment-only
  fallback when no path exists.
- **Transition targets are mandatory (§6a):** bug present → routed FE/BE child
  → `TEST: FAILED/BUGS` (jira) / `Test Failed/Bugs` (azure); all-pass →
  **every family child** (`[TM-…]`, `[TA-…]`, `[FE-…]`, `[BE-…]`) →
  `WAITING TO DEPLOY`. Always run AFTER the summary comment has been posted.
  `[FE-…]` / `[BE-…]` only reach WAITING TO DEPLOY through the all-pass
  path — a red run never moves them forward.
- Pull preconditions + steps from the Qase case via `qase.getCase(<id>)` —
  don't invent them.
- The Playwright error is auxiliary; **Actual Result** is the human summary,
  not the raw stack trace.
- If `EMAIL` / `ATLASSIAN_TOKEN` is unset, abort cleanly.

## Root cause suggestion

Every routed defect comment carries a **Root cause suggestion** paragraph
placed between **Expected Result** and **Attachment**. Produced in two stages:

**1. Heuristic first (rule-based, deterministic, always run)** — matched
against the trace + error the agent already has:

- `expect(<locator>).toBeVisible` timeout **and** `locator.count() === 0`,
  **and** qa-healer has already run its full 3-attempt cycle (fix + 2
  retries) via the source-of-truth chain (existing locator → existing page →
  FE source → real DOM) without recovering → **FE element not rendered**.
  The element is genuinely absent from the DOM (feature removed, route
  changed, or an upstream state gate didn't advance) — **not** a testid
  rename (heal already covers that path). If qa-healer has NOT yet run for
  this failure, do **not** emit this verdict — fall through to
  `unclassified` with a note "return to healer" so the escalation loop
  runs before a bug is posted. Include the failing `data-testid` and the
  closest FE-source matches for context.
- HTTP **4xx** on `**/api/**` in the trace network log → **BE
  contract/permission issue**. Include endpoint + status.
- HTTP **5xx**, `net::ERR_*`, or `page.waitForResponse` timeout on
  `**/api/**` → **BE outage / latency regression**. Include endpoint +
  duration.
- Playwright assertion mismatch on rendered text while the underlying API
  returned **200 OK** → **FE render/state bug**. Include expected vs.
  observed text and the successful API endpoint.
- No rule matched → `unclassified` (fall through to stage 2).

**2. LLM fallback (only if heuristic returns `unclassified`)** — the comment
carries the placeholder line `Root cause (LLM): {{root_cause_llm}}`. When
the heuristic is unclassified, the agent asks Claude to narrate the root
cause from the trace + screenshot + error text (all of which the runtime
already has) and inlines the narrative in place of the placeholder. This
agent owns only the template hook + the classification rules; the LLM call
is a runtime concern.

Include the heuristic verdict (`fe-element-not-rendered` / `be-4xx` /
`be-5xx-or-timeout` / `fe-render-bug` / `unclassified`) alongside the human
sentence so downstream tooling can group by cause.

## Log

Every invocation — orchestrated or standalone — ends by logging to the Run Logger API. Never prompt the user; log even on failure.

**Step 1 — POST the run:**
```bash
RUN_ID=$(curl -s -X POST https://orchestration.hubexo-ai-global-breeze.com/api/runs \
  -H "Authorization: Bearer $RUN_LOGGER_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"agentType\":\"qa-defect\",\"subjectRef\":\"<epic-or-story-key>\",\"model\":\"claude-sonnet-4-6\",\"tokenCost\":<tokens>,\"durationMs\":<ms>,\"outputUrls\":[\"<jira-browse-url>\"]}" \
  | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d).id))")
```

**Step 2 — PATCH the verdict (prefilled — never prompt):**

| Outcome | Verdict JSON |
|---|---|
| Comments landed | `{"result":"accept","manualWorkHours":0.5}` |
| Routing aborted | `{"result":"rework","isHallucination":false,"notes":"<abort reason>"}` |

```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X PATCH "https://orchestration.hubexo-ai-global-breeze.com/api/runs/$RUN_ID/logger-input" \
  -H "Authorization: Bearer $RUN_LOGGER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '<verdict-json>'
```

If `RUN_LOGGER_API_KEY` is unset, print a warning and skip — never fail the main task.
