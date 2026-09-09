---
description: Route the latest Qase run onto a tracker epic — Jira on the jira stack, Azure Boards on the azure stack. Per failure → uploads the screenshot to the matching FE/BE child and posts a QA-template bug comment with the screenshot embedded inline. Per run (always) → posts a summary on the `[T-…]`/`[TM-…]` test-case child with deep-links to each failure comment. Comment + transition + attachment only — never creates a bug.
argument-hint: <EPIC-KEY | AB#<id>, e.g. NLM-4 or AB#12345>
---

# /qa-agent-defect

Route the latest Qase run onto the tracker epic **$ARGUMENTS** using the
**qa-defect** agent.

`$ARGUMENTS` is `<EPIC-KEY>` — a single tracker key. On the jira stack that
is a Jira issue key (e.g. `NLM-4`); on the azure stack that is an Azure
Boards work-item id (e.g. `AB#12345`). With no argument the agent falls
back to `env.tracker.storyKey` — computed from
`JIRA_PROJECT_KEY-JIRA_PARENT_ISSUE_ID` on jira, from
`AZURE_PARENT_WORK_ITEM_ID` on azure.

This is the form **qa-healer** uses when a heal can't go green.

## What qa-defect does

1. **Resolve the epic's children** via `tracker.getEpicChildren("$ARGUMENTS")`,
   classified by summary prefix:
   - `[FE…]` / `[Frontend]` → **fe** child (defect destination for FE failures)
   - `[BE…]` / `[Backend]`  → **be** child (defect destination for BE failures)
   - `[T…]` / `[Test Case]` / `[QA]` → **test** child (per-run summary destination)
2. **Pull the latest Qase run** (id from `CYCLE_KEY` / `reports/results.json`)
   plus the local report (`reports/results.json`, `reports/test-results/**/`):
   failed step, trimmed error, screenshot / video / trace paths. Extract a
   minimal network summary from `trace.zip` on best effort; fall back to
   `"No failing API call detected"` for FE render regressions.
3. **For each failed case** also fetch the Qase case via `qase.getCase(id)`
   for **Preconditions** and **Steps to Reproduce** (with per-step Data /
   Expected). The **Expected Result** comes from the last step's
   `expected_result` (fallback: `postconditions`).
4. **Classify each failure** as FE-sourced or BE-sourced from error signature
   + trace network log (BE wins on disagreement).
5. **Route a failure**:
   - Upload the screenshot to the matching FE/BE child via
     `tracker.uploadAttachmentFromPath(child, screenshot)` to obtain the
     attachment id.
   - `tracker.transitionToTestFailed(child)` — fires
     when a forward transition to `TEST: FAILED/BUGS` exists from the child's
     current state; **returns null (comment-only) when the child is already
     in the failed state** or no path exists. Never pick a wrong-direction
     transition, never loop, never hard-code a transition id.
   - `tracker.addComment(child, buildDefectComment({…, attachmentMediaIds: [att.id]}))`
     posts the QA bug-report-template comment with the screenshot embedded
     inline.
6. **Per run, always — even on a green scope**: post
   `buildTestCaseSummary({…})` on **every test child** of the story — both
   `[T-…]` test-case children AND `[QA]` QA-acceptance children get the same
   summary (the helper classifies both as `test`). Each summary lists every
   case with its status and (when failed) a deep-link to the per-failure
   comment on the FE/BE child (`<base>/browse/<child>?focusedCommentId=<id>`).

   **When the parent is a Story (not an Epic), the test children typically
   come in pairs:**
   - `[T-…]` (e.g. `[T-01]`) — the per-module test-case ticket QA
     authors maintain in the TMS.
   - `[QA]` (e.g. `[QA] Verify …`) — the QA-acceptance ticket the story
     workflow transitions through (Ready for Dev → WIP → WAITING TO DEPLOY).

   Post the summary on **both**. Track each posted comment id so the
   per-failure comments on FE/BE children can deep-link from either summary.
6b. **Transition targets after the summary lands** (post-summary, never
    before — enforced by qa-defect §6a):
    - **Any bug found (FE or BE)** → the routed `[FE-…]` / `[BE-…]` child →
      `TEST FAILED/BUGS` (Azure state: `Test Failed/Bugs`, no colon; jira
      stack: `TEST: FAILED/BUGS`) via
      `tracker.transitionToTestFailed(child)`.
      `[TM-…]` / `[TA-…]` receive the summary comment on a red run but do
      not transition.
    - **All-pass run** → **every family child** (`[TM-…]`, `[TA-…]`,
      `[FE-…]`, `[BE-…]` — plus legacy `[QA]` / `[T-…]`) → `WAITING TO
      DEPLOY` via `tracker.transitionToWaitingToDeploy(target)`. All-green
      is the signal that the automated coverage cleared the whole vertical
      slice, so the whole slice moves together. `[FE-…]` / `[BE-…]` reach
      WAITING TO DEPLOY only through the all-pass path — a red run never
      moves them forward.
    Both `transitionToTestFailed` and `transitionToWaitingToDeploy`
    discover transitions live and match by destination-state name — never
    hard-code ids. If no forward path exists from the current state, they
    return `null`; comment-only, log "skipped: already-in-target /
    no-forward-path", never pick a wrong-direction transition.
7. **Cross-check** `.claude/memories/known-issues.md` to dedupe by
   `(caseRef, child, runId)`. Append rows for newly reported defects.

## Comment template (failure, on the FE/BE child)

The ADF body follows the standard QA bug-report layout:

- **Title** (heading) — readable scenario title.
- **Summary** (bullets) — Test case, Status, Epic, Routed to, Source
  (FE/BE + reason), Environment, Qase run, Qase case, Transition applied.
- **Preconditions** (paragraph) — from Qase.
- **Steps to Reproduce** (ordered list) — from Qase, each with Data /
  Expected when present.
- **Actual Result** (paragraph) — human summary of what happened.
- **Expected Result** (paragraph) — what should have happened.
- **Root cause suggestion** (paragraph) — heuristic classification (see
  §Root cause suggestion below); falls back to `Root cause (LLM):
  {{root_cause_llm}}` when the heuristic yields "unclassified".
- **Attachment** — screenshot embedded via ADF `media` node.
- **Network** (code block) — extracted failing API call, or
  "No failing API call detected".
- **Error** (code block) — trimmed Playwright error for the dev.
- **Artifacts** (bullets) — Video / Trace / Screenshot local paths.
- **Footer** — comment-only notice + route-to-healer hint.

## Summary template (every run, on the `[T-…]` child)

- **Title** — `✅ Automated QA run — <epic>` (🟠 on any failure).
- **Summary** — Epic, Qase run, Environment, Totals (passed / failed / …).
- **Results** — per-case bullet with status icon, ref, title, brief, and
  deep-link to the FE/BE comment when failed.

## Root cause suggestion

Every routed defect comment carries a **Root cause suggestion** line placed
between **Expected Result** and **Attachment**. It is produced in two stages:

**1. Heuristic first (rule-based, deterministic, always run).** The agent
inspects the trace + error signature it already has and picks the first
matching rule:

- `expect(<locator>).toBeVisible` timeout **and** `locator.count() === 0`,
  **and** qa-healer has already run its full 3-attempt cycle (fix + 2
  retries) via the source-of-truth chain (existing locator → existing page →
  FE source → real DOM) without recovering → **FE element not rendered**.
  The element is genuinely absent from the DOM (feature removed, route
  changed, or an upstream state gate didn't advance) — **not** a testid
  rename (heal already covers that). If qa-healer has NOT yet run for this
  failure, do **not** emit this verdict — fall through to `unclassified`
  with a note "return to healer". Include the failing `data-testid` and
  the closest FE-source matches for context.
- HTTP **4xx** on `**/api/**` in the trace network log → likely **BE
  contract/permission issue** — include the endpoint + status code.
- HTTP **5xx**, `net::ERR_*`, or a `page.waitForResponse` timeout on
  `**/api/**` → likely **BE outage / latency regression** — include the
  endpoint + measured duration.
- Playwright assertion mismatch on rendered text while the underlying API
  responded **200 OK** → likely **FE render/state bug** — include the
  expected vs. observed text and the API endpoint that succeeded.
- No rule matched → `unclassified` (fall through to stage 2).

**2. LLM fallback (only if heuristic returns `unclassified`).** The comment
template emits a placeholder line — `Root cause (LLM): {{root_cause_llm}}` —
that the runtime fills in. The runtime already has access to the trace,
screenshot and error text; when the heuristic yields `unclassified`, the
agent asks Claude to narrate the root cause from those artifacts and inlines
the narrative here. This command does **not** implement the LLM call itself
— it only owns the template hook and the docstring.

## Done when

- For each failed case: screenshot uploaded, comment posted on the routed
  FE/BE child with the screenshot embedded, transition fired (or
  "skipped: already-in-failed / no-forward-path" reported).
- For every run: summary comment posted on every summary-target child.
- On an all-pass run: every family child (`[TM-…]`, `[TA-…]`, `[FE-…]`,
  `[BE-…]`) transitioned to WAITING TO DEPLOY (or per-child "skipped:
  no-forward-path" reported when the tenant's workflow blocks it).
- The agent reports the epic key, run id + URL, per-failure routing,
  attachment ids, comment ids, transitions applied, and anything skipped.

**Never** creates a bug ticket — comment + transition + attachment-upload only.

Finishes with the run-logger (agent = `qa-defect`).
