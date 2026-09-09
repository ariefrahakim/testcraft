# Run Logger — how qa-agent audit rows reach the orchestration API

The QA agents are autonomous, so **every step posts an audit row** to the Run Logger REST API. Together they answer three questions a manager asks after any autonomous run:

1. What did the agent do — and how long / how many tokens did it cost?
2. Was the output accepted, or did a human rework it?
3. How much manual QA effort did this replace?

Without run-logger the pipeline still executes — you just lose the audit trail. That's why it is **Recommended, not Required** in the prerequisites.

---

## API

Base URL: `https://orchestration.hubexo-ai-global-breeze.com`
Auth: `Authorization: Bearer $RUN_LOGGER_API_KEY`

**Step 1 — POST a run record:**
```bash
curl -s -X POST https://orchestration.hubexo-ai-global-breeze.com/api/runs \
  -H "Authorization: Bearer $RUN_LOGGER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"agentType":"<agent-name>","subjectRef":"<ticket-or-subject>","model":"claude-sonnet-4-6","tokenCost":<n>,"durationMs":<n>,"outputUrls":["<url>"]}'
```
Response `201`: `{ "id": "<run-uuid>" }` — save the `id`.

**Step 2 — PATCH the verdict:**
```bash
curl -s -o /dev/null -w "%{http_code}" \
  -X PATCH "https://orchestration.hubexo-ai-global-breeze.com/api/runs/<run-id>/logger-input" \
  -H "Authorization: Bearer $RUN_LOGGER_API_KEY" \
  -H "Content-Type: application/json" \
  -d '<verdict-json>'
```
Response `204` = success.

**Verdict payloads:**

| Result | JSON |
|---|---|
| `accept` | `{"result":"accept","manualWorkHours":<n>}` |
| `rework` | `{"result":"rework","isHallucination":<bool>,"hallucinationPart":"<knowledge_graph\|agent\|human_gate>","notes":"<text>"}` |
| `refine` | `{"result":"refine","notes":"<text>"}` |

---

## Setup

Set the API key in Claude Code:
```bash
Add `RUN_LOGGER_API_KEY` to the `env` object in the project's
`.claude/settings.local.json`, preserving existing settings, then restart Claude
Code so the environment is refreshed.
```

The key is issued from the Hubexo orchestration dashboard.

---

## When rows are written

Each step in the pipeline fires **one POST + one PATCH** — prefilled, never prompting the user:

| Step | result | manualWorkHours | Notes |
|---|---|---:|---|
| `qa-codegen` clean | accept | 1 | Generation typecheck+lint green |
| `qa-codegen` red gate | rework | — | notes: abort reason |
| `qa-runner` clean | accept | 0.5 | Playwright ran; Qase upload OK |
| `qa-runner` failure | rework | — | notes: failure summary |
| `qa-healer` recovered | accept | 0.5 | Selectors re-resolved, re-run green |
| `qa-healer` escalated | rework | — | notes: escalated to qa-defect |
| `qa-defect` comments landed | accept | 0.5 | Comment posted on FE/BE child |
| `qa-pr` created | accept | 1 | PR URL in outputUrls |
| `qa-pr` updated | accept | 0.5 | notes: updated existing PR #n |
| `qa-pr` aborted | rework | — | notes: abort reason |

**Canonical agent type values:** `qa-codegen`, `qa-runner`, `qa-healer`, `qa-defect`, `qa-pr`.

---

## Model field

Use `claude-sonnet-4-6` for all qa-agent runs (the model family the agents run on). If the model is overridden, use the actual model ID.

---

## What NOT to log

- Ephemeral in-progress state — that lives in dashboard events.
- Code patterns / architecture / recent commits — derivable from the repo.
- Secrets, credentials, or raw `.env` values.
