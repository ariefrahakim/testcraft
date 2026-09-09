# Ponytail — Lazy Senior Dev Mode for AI Agents

Ponytail is an AI agent skill that enforces minimal, efficient code. The philosophy: the best code is the code never written.

Source: https://github.com/dietrichgebert/ponytail  
Version integrated: 4.9.0 (MIT License)  
Location in this repo: `tools/ponytail/`

---

## What It Does

Before writing any code, ponytail stops the agent at the first rung of this ladder that holds:

1. **Does this need to exist at all?** — If not, skip it (YAGNI)
2. **Already in this codebase?** — Reuse it, don't rewrite
3. **Stdlib does it?** — Use it
4. **Native platform feature covers it?** — Use it (`<input type="date">` over a picker lib, CSS over JS)
5. **Already-installed dependency solves it?** — Use it; never add a new dep for what a few lines can do
6. **Can it be one line?** — One line
7. **Only then:** the minimum code that works

Result: ~54% less code on average, ~20% cheaper tokens, ~27% faster sessions — without dropping safety guards.

---

## Integration into TestCraft

Ponytail skills are stored at `tools/ponytail/skills/`. They are available as Claude Code skills.

### Available Skills

| Skill | What it does |
|-------|-------------|
| `ponytail` | Main skill — enforces lazy coding ladder on any coding task |
| `ponytail-review` | Reviews the current diff for over-engineering; returns a delete-list |
| `ponytail-audit` | Audits the whole repo for over-engineering, not just the diff |
| `ponytail-debt` | Harvests `ponytail:` shortcut comments into a ledger |
| `ponytail-gain` | Shows the benchmark impact scoreboard |
| `ponytail-help` | Quick reference for all commands |

---

## How to Use in Claude Code

### Activate for a session

Type any of these in the Claude Code chat:

```
/ponytail            → activate at default level (full)
/ponytail lite       → names lazier alternative, user picks
/ponytail full       → enforces the ladder (default)
/ponytail ultra      → YAGNI extremist — deletion before addition
/ponytail off        → disable for this session
```

### Review current diff

```
/ponytail-review
```

Returns one-line findings per over-engineered item. Format: `L<line>: <tag> <what>. <replacement>.`

Tags used: `delete:`, `stdlib:`, `native:`, `yagni:`, `shrink:`

### Audit entire codebase

```
/ponytail-audit
```

Scans the full repo, not just the current diff.

### Harvest deferred simplifications

```
/ponytail-debt
```

Finds all `# ponytail: ...` comments in the codebase and compiles them into a ledger so "later" doesn't become "never".

---

## Intensity Levels

| Level | Behavior |
|-------|----------|
| `lite` | Build what's asked, name the lazier alternative in one line |
| `full` | Ladder enforced. Stdlib and native first. Shortest diff (default) |
| `ultra` | YAGNI extremist. Deletion before addition. Challenges requirements |

Set a default for all sessions with an env var:

```bash
export PONYTAIL_DEFAULT_MODE=full   # lite | full | ultra | off
```

---

## Marking Deliberate Simplifications

When ponytail cuts a real corner with a known ceiling, mark it in code:

```typescript
// ponytail: global lock, per-account locks if throughput matters
// ponytail: O(n²) scan, use index when records exceed 1k
// ponytail: naive heuristic, use ML model when training data is available
```

Run `/ponytail-debt` to harvest all these into a prioritized upgrade list.

---

## What Ponytail Never Cuts

- Input validation at trust boundaries
- Error handling that prevents data loss
- Security measures
- Accessibility basics
- Anything explicitly requested by the user

---

## Install (if adding to a new Claude Code project)

Ponytail installs as a Claude Code plugin from its marketplace:

```
/plugin marketplace add DietrichGebert/ponytail
/plugin install ponytail@ponytail
```

Or copy the `tools/ponytail/skills/` directory to `~/.claude/skills/` for manual installation.

---

## Files in `tools/ponytail/`

```
tools/ponytail/
├── AGENTS.md                  # Always-on ruleset (auto-loaded by Claude Code)
├── LICENSE                    # MIT
├── package.json               # npm metadata (version 4.9.0)
└── skills/
    ├── ponytail/SKILL.md      # Main skill — lazy coding ladder
    ├── ponytail-review/SKILL.md
    ├── ponytail-audit/SKILL.md
    ├── ponytail-debt/SKILL.md
    ├── ponytail-gain/SKILL.md
    └── ponytail-help/SKILL.md
```
