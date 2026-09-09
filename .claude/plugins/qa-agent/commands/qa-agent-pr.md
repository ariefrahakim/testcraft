---
description: Open (or update) a PR for the current branch with the tracker context stamped into the description — GitHub PR on the jira stack, Azure Repos PR on the azure stack; related Story / [QA] / [T-*] / [FE-*] tickets (jira) or PBI / Task children (azure), Qase run URL + counts, deep-links to per-failure bug comments, generated vs reused assets.
argument-hint: [<EPIC-KEY | STORY-KEY | TICKET-KEY | AB#<id>> | empty]
---

# /qa-agent-pr

Open or update a pull request for the current branch using the **qa-agent-pr**
agent. The PR description carries the full tracker + Qase context so reviewers
don't have to chase 4 different links to understand what was tested.

**Stack switch — read `.claude/qa-agent.json.stack` FIRST:**

- `jira` → GitHub PR via `gh pr create` / `gh pr edit`.
- `azure` → Azure Repos PR via the Azure DevOps REST API (see §Azure stack)
  authenticated with `AZURE_PAT` from `.env`. **Never call `gh` on the azure
  stack** — `gh` cannot drive Azure DevOps and will fail or land the PR on
  the wrong remote.

Everything else — body composition, tracker resolution, run-logger — is
identical on both stacks.

## Input — `$ARGUMENTS`

- **empty** → the agent infers the Jira anchor from the latest commit
  messages and `.claude/memories/*.md`. Falls back to `env.jira.storyKey`.
- **`<EPIC-KEY>` or `<STORY-KEY>`** (e.g. `NLM-66`) → anchor the PR to
  this Jira parent; the agent stamps every child ([QA] / [T-*] / [FE-*] /
  [BE-*] / [UX]) into the body.
- **`<TICKET-KEY>`** of a `[T-*]` or `[QA]` child (e.g. `NLM-222`) → the
  agent resolves upward to the parent Story, then stamps the family.

## What qa-agent-pr does

1. Reads `git status` + `git log <base>...HEAD` (default base: `master`).
   Aborts if the tree is dirty, the branch has no commits ahead, or the
   branch is `master` / `main`.
2. Resolves the Jira anchor (see Input). Fetches children via
   `jira.getEpicChildren(<anchor>)` and classifies them.
3. Resolves the latest Qase run (highest cycle id in
   `reports/results.json`; falls back to `logs/run-log.jsonl`). Captures
   pass/fail/flaky counts + per-case status.
4. For each failed case, scans the matching FE/BE child's recent comments
   for the QA bug template and captures the `?focusedCommentId=` deep-link.
5. Composes a markdown PR body (see template below) and either creates
   the PR or updates the existing one — **using the stack's tool**:
   - `jira` → `gh pr create` / `gh pr edit`.
   - `azure` → Azure DevOps REST (see §Azure stack) with `AZURE_PAT`.
6. Optionally posts a one-line "PR opened: <url>" back to the `[QA]` and
   `[T-*]` Jira children (toggle with `--no-jira-back`).
7. **Log + sync** — like every QA-Agent command, invoke the
   `design-agent:run-logger` skill with a **prefilled block** so the
   user is never prompted mid-flow, then `design-agent:run-logger-sync`
   to push the entry to Confluence. Use these prefill values:

   | outcome | tag | manual_effort (h) | notes |
   |---|---|---|---|
   | PR created cleanly | Accept | 1 | — |
   | PR edited (existing) | Accept | 0.5 | `notes: updated existing PR #<n>` |
   | aborted (dirty tree / no commits / on master\|main) | Rework | — | `hallucination: No, improvement_point: Human, notes: <abort reason>` |
   | gh / Jira write failed | Rework | — | `hallucination: No, improvement_point: Agent, notes: <error>` |

   - `input` = the resolved Jira anchor (Story key); `input_url` = the
     Jira browse URL.
   - `output` = `[PR URL, NLM-QA summary deep-link, NLM-T deep-link]`
     (skip the deep-links when `--no-jira-back` was passed or no Jira-back
     comments were posted).
   - `agent` = `qa-pr` (canonical run-logger name — never `qa-agent-pr`, which
     would duplicate the Confluence page).
   - `duration` = seconds elapsed inside this step.
   - `token_cost` = approx tokens spent inside this step.

   If run-logger-sync fails (e.g. `.team.json` missing), log it in the
   report but **do not roll back the PR** — the PR is the source of
   truth and a later `/run-logger-sync` will recover the Confluence row.

## PR body template

```md
## Summary
- <1–3 bullets>

## Jira
| Type | Key | Status | Title |
|---|---|---|---|
| Story | NLM-66 | Ready for Dev | … |
| [QA] | NLM-222 | WAITING TO DEPLOY | … |
| [T-01] | NLM-112 | WIP | … |
| [FE-01] | NLM-98 | Ready to Test | … |
| [UX] | NLM-79 | Ready for Dev | … |

## Qase
- Plan: plan:10 "<title>" (9 cases)
- Run:  https://app.qase.io/run/<QASE_PROJECT>/dashboard/42 (id 42)
- Results: ✅ 8 · 🔴 1 · ⚠️ 0
- Failing:
  - TC-136 — keyword highlight — PH-PROD-1 (FE regression)
    Bug → <JIRA_BASE_URL>/browse/<FE-CHILD>?focusedCommentId=<id>

## Files
- Generated:  <new specs / pages / locators>
- Heal:       <files touched by qa-healer>
- Reused:     <existing assets imported>

## Test plan
- [ ] CI green (typecheck + lint + chromium e2e)
- [ ] Qase run <id> reviewed
- [ ] [FE-01] fix lands before this PR merges (when applicable)

🤖 Generated with the QA-Agent platform (qa-pr)
```

## Flags

- `--base <branch>` — PR base branch. Defaults to the repo's default branch
  (`gh repo view --json defaultBranchRef -q .defaultBranchRef.name`), not a
  hardcoded `master`/`main`.
- `--draft` — open as draft (only when the user asked).
- `--no-jira-back` — skip posting the "PR opened" comment back to Jira.

## PR target (remote)

PRs **must land on this repo's `origin`**, never on a personal fork. Resolve
the target once, at the start, rather than assuming:

```bash
git remote -v                       # what origin actually points at
```

- **jira stack** — verify with `gh repo view --json nameWithOwner -q .nameWithOwner`.
  If `gh` asks "Where should we push the branch?", choose the `origin`
  owner/repo those commands printed. After `gh pr create`, sanity-check the
  returned URL contains the same `owner/repo`.
- **azure stack** — parse `origin` for `{org, project, repo}` (accepts both
  `https://<org>.visualstudio.com/<project>/_git/<repo>` and
  `https://dev.azure.com/<org>/<project>/_git/<repo>` forms), and cross-check
  against `.env`'s `AZURE_ORG_URL` / `AZURE_PROJECT`. Refuse to push if the
  remote org/project don't match — the PR would land in the wrong project.

## Azure stack

On the `azure` stack this command drives the Azure DevOps REST API directly
(no `gh`, no `az` CLI dependency — one PAT + `curl` is enough).

**Prereqs (fail-fast if missing):**

- `AZURE_PAT` in `.env` with **Code (Read & Write)** scope on this repo.
- `AZURE_ORG_URL` (e.g. `https://thenbs.visualstudio.com`) and
  `AZURE_PROJECT` (e.g. `Cirrus`) in `.env`.
- `origin` remote parsed to `{org, project, repo}` matching those env values.

**Detect an existing PR for the current branch:**

```bash
BRANCH=$(git rev-parse --abbrev-ref HEAD)
API="$AZURE_ORG_URL/$AZURE_PROJECT/_apis/git/repositories/$REPO/pullrequests"
curl -sS -u ":$AZURE_PAT" \
  "$API?searchCriteria.sourceRefName=refs/heads/$BRANCH&searchCriteria.status=active&api-version=7.1" \
  | jq '.value[0]'
```

**Create** (no existing PR):

```bash
curl -sS -u ":$AZURE_PAT" -H 'Content-Type: application/json' \
  -X POST "$API?api-version=7.1" \
  -d @body.json
# body.json:
# {
#   "sourceRefName": "refs/heads/<branch>",
#   "targetRefName": "refs/heads/<base>",
#   "title": "<title>",
#   "description": "<markdown body>"
# }
```

**Update** (existing PR, keep the number):

```bash
curl -sS -u ":$AZURE_PAT" -H 'Content-Type: application/json' \
  -X PATCH "$API/$PR_ID?api-version=7.1" \
  -d '{"title":"<title>","description":"<markdown body>"}'
```

**Base branch resolution** — mirror the `gh` behaviour: check
`--base <branch>` first; otherwise query the repo's default branch via
`GET $AZURE_ORG_URL/$AZURE_PROJECT/_apis/git/repositories/$REPO?api-version=7.1`
and read `.defaultBranch` (`refs/heads/master` for this repo). Only fall back
to `master` if the API call fails, and log the fallback.

**Sanity-check the response** — the returned JSON should include
`pullRequestId`, `repository.name == $REPO`, and
`_links.web.href` matching `$AZURE_ORG_URL/$AZURE_PROJECT/_git/$REPO/pullrequest/<id>`.
If any of those don't line up, treat it as a wrong-remote landing and stop
rather than reporting success. Print that web href back to the user as the
PR URL.

**Tracker-back comment (`--no-jira-back` toggle applies)** — on azure the
"PR opened: <url>" line goes on the same `[TA-…]` / `[TM-…]` / `[FE-…]` /
`[BE-…]` Task work items that qa-defect touched. Use the existing
`tracker.addComment(<key>, <html>)` (HTML on azure, ADF on jira) — do not
inline-call the Boards REST API here; keep tracker writes flowing through
`utils/tracker.ts`.

## Common flow position

Typical orchestrator order:
`/qa-agent-generate plan:<id>` → `/qa-agent-run plan:<id>` →
(`/qa-agent-heal <module>` on failures) → `/qa-agent-defect <EPIC>` →
**`/qa-agent-pr <STORY-KEY>`** ← stamps everything into a single PR.

For the plan-driven flow (`/qa-agent:tms <id>`) the final PR step is
optional — call `/qa-agent-pr` separately when ready to ship.

## Rules

- **Never** push to `master` / `main`. **Never** force-push. **Never** `--no-verify`.
- **Never** create a duplicate PR; edit the existing one for the branch.
- **Never** invent Jira keys or Qase run numbers — every value in the
  body must come from a real fetch.
- **Commits stay the user's job** — the agent will not `git add` /
  `git commit` on your behalf. Commit first, then run this command.

## Done when

The PR is visible on the correct remote (`gh pr view` on jira / the Azure
Repos `pullrequest/<id>` web URL on azure), the body shows the tracker table +
Qase block + per-failure deep-links, and the agent reports the PR URL plus
the family of tickets it stamped.
