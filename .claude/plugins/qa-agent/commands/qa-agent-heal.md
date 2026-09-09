---
description: Maintenance — fix broken selectors for a failing test, re-run with up to 2 retries, record the heal, and escalate to qa-defect if it's still failing as a product defect.
argument-hint: <TC-id | module> [EPIC-KEY]
---

# /qa-agent-heal

Recover **$ARGUMENTS** from selector breakage with the **qa-healer** agent.
Optional trailing `<EPIC-KEY>` (e.g. `bid-search NLM-4`) is the Jira epic to
escalate to if it turns out to be a product defect.

## What qa-healer does
1. Run the failing test, capture the failing locator + error; confirm it's
   selector breakage (not a product defect).
2. Re-resolve in order: existing locator → existing page → FE source
   (`findTestIds`) → real DOM. Pick the highest-priority unique selector;
   **never downgrade** priority. Update `locators/<module>/<module>.locator.ts`.
3. **Fix first, then re-run with up to 2 retries** (chromium only). Stop as soon
   as it goes green.
4. Record in memory: `selector-history.md`, `self-healing.md`, and
   `known-issues.md` / `component-map.md` as needed.
5. **If still red after the fix + 2 retries and the cause is a product defect**
   (real app behavior, not a re-resolvable selector), hand off to
   `/qa-agent-defect <EPIC-KEY>` (defaults to `QAA-1900` when no key is given).
   qa-defect resolves the epic's children and routes the failure to the matching
   FE/BE child. Never force a pass to avoid escalating.

## Done when
either the test passes with an equal-or-higher-priority selector and the heal is
recorded, **or** the fix + 2 retries didn't go green and the failure was escalated
to `/qa-agent-defect`. Report old → new selector, the FE source, the re-run result
(with retry count), and the defect handoff if one was triggered.

Finishes with the run-logger (agent = `qa-heal`).
