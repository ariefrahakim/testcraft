# Graphify — the FE-graph accelerator

qa-codegen and qa-healer both need to answer the same question repeatedly:
**"which frontend file renders this `data-testid`, and what does it import?"**

The naive answer is a full `grep -r` across the FE checkout — slow and noisy
on a monorepo. Graphify pre-computes that answer once into a JSON graph, and
the agents query it in milliseconds.

Graphify is **Optional**. Without it, qa-codegen and qa-healer fall through
to the FE source scan (`selector-helper.findTestIds(...)`) and still finish
their step. The graph is an accelerator, not a dependency.

---

## What it is

A read-only knowledge graph built from the FE source, persisted at:

```
$FE_REPO_PATH/graphify-out/graph.json
```

The graph has **god nodes** (components, testids, hooks, routes), **community
detection** (which files cluster together), and three query verbs:

| Verb | Example | Answers |
|---|---|---|
| `graphify search <query>` | `graphify search "bid detail contacts"` | Which file(s) in the FE render this feature? |
| `graphify affected <symbol>` | `graphify affected "search-btn"` | Reverse impact — which files use this testid / import this component? |
| `graphify explain <symbol>` | `graphify explain "ContactAvatar"` | Wire-up — what does this component take, and where does it live in the render tree? |

Point every command at the graph you built:

```bash
graphify affected "<selector-or-component>" \
  --graph $FE_REPO_PATH/graphify-out/graph.json
```

---

## Why the QA agents care

Two hotspots in the pipeline use it — both fall back to a full FE scan when
the graph is missing:

### 1. `qa-codegen` — step 0a (selector-mining accelerator)

Before writing a page object, qa-codegen needs to know **which testids exist
for this module**. A full scan works but takes tens of seconds on a monorepo
with hundreds of components. The graph turns the same query into a single
`graphify search "<module>"` — usually milliseconds — and returns the
component files ranked by relevance. Codegen then reads only those files to
extract `data-testid` attributes.

Cost with graph: **~1s + 1 file read per selector.**
Cost without: **full FE `rg` sweep per selector.**

### 2. `qa-healer` — step 1 (broken-selector re-resolution)

When a selector fails, the healer needs to find **where the old testid moved
to**. That's exactly `graphify affected "<old-testid-or-Component>"`:

```
graphify affected "old-search-btn" \
  --graph $FE_REPO_PATH/graphify-out/graph.json
```

The graph shortlists the file(s) that likely renamed or removed the testid.
The JSX read is still authoritative — the graph only points, it never
decides. Priority never downgrades (data-testid → aria-label → …); the graph
just accelerates the lookup.

If the graph is empty or misses, the healer falls through to
`selector-helper.findTestIds(...)` as before.

---

## Install

The skill ships out of tree at `~/.claude/skills/graphify/SKILL.md`. Once
installed:

```bash
# Build (or refresh) the graph against the current FE checkout.
npm run graph:fe

# Or invoke graphify directly:
graphify build --repo "$FE_REPO_PATH" --out "$FE_REPO_PATH/graphify-out/graph.json"
```

`/qa-agent:setup` step 4b offers to build the graph the first time you
scaffold; after that, refresh it once per heal session (the FE is a moving
target — a stale graph misleads step 5 of qa-codegen).

---

## When to refresh

Rule of thumb: **once per feature-branch cycle, plus whenever selectors
start missing on a heal**. Concretely:

| Situation | Refresh? |
|---|---|
| Just pulled `master` on the FE checkout | Yes — `npm run graph:fe` |
| Starting a new module (qa-codegen for a new plan) | Yes |
| Between the 3 heal attempts on the same session | No — same FE HEAD |
| CI (agents run against a clean checkout every time) | Automated by `npm run fe:sync && npm run graph:fe` in the setup step |
| Passed all gates + happy with the module | No — the graph is a cache, not an artifact |

The graph is per FE HEAD — it's cheap to rebuild (~seconds), so err on the
side of refreshing rather than debugging a stale-graph miss.

---

## When Graphify degrades

The pipeline is designed to survive without the graph. Agents that would
have used it:

| Scenario | Falls back to |
|---|---|
| `graphify` skill not installed | Full `selector-helper.findTestIds(...)` FE scan |
| `graphify-out/graph.json` missing / stale | Same — with a `notes:` in the run log |
| Query returns 0 hits | Full scan (the graph never masks a real testid) |
| Query returns wrong file | JSX read is authoritative — codegen/heal keeps looking |

None of these break the pipeline; they only add latency. The pipeline never
"guesses" from the graph — every selector still comes from an actual JSX
read.

---

## What NOT to do with the graph

- **Do NOT** hard-code paths from the graph into `locators/`. The graph is
  a query interface; the locator file is the source of truth.
- **Do NOT** trust the graph over the live DOM. During qa-codegen's live
  self-verification (§8 in the qa-codegen spec), the browser is the last
  word.
- **Do NOT** commit `graphify-out/graph.json` — it belongs in
  `$FE_REPO_PATH`, gitignored.

---

## Summary

Graphify shaves the "which FE file, which testid" round-trip from seconds
to milliseconds. It is:

- **Optional** — the pipeline works without it.
- **Read-only** — the agents query, never write.
- **Per-checkout** — rebuild whenever the FE moves.
- **Never authoritative** — the JSX read + live DOM decide.

If you're on a large FE monorepo and codegen or heal feel slow, install
Graphify. If you're on a small FE and speed isn't a pain, skip it.
