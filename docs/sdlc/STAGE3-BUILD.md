# Stage 3: Build — Claude Code Plan Mode + CLAUDE.md + Skills + Subagents

> "Plan mode is a forcing function: Claude shows its work before doing it."
> — AI-Native SDLC Playbook, Lesson 4

---

## Lesson 4: Claude Code Plan Mode as the Default Starting Point

**Every non-trivial task starts in plan mode.** Never jump straight to implementation.

### How to Use Plan Mode

```
# Before building, always say:
"Read docs/specs/<feature>.spec.md and create a plan for implementation.
Do not write any code yet — show me the plan first."
```

Claude will produce:
```markdown
## Implementation Plan: Certificate Download

### Files to create/modify
1. apps/api/src/modules/certificates/ — new `CertificateController.ts`
2. apps/api/prisma/schema.prisma — add `pdfUrl` field to Certificate
3. apps/web/src/app/dashboard/certificates/ — new download button component

### Steps (in order)
1. Add `pdfUrl String?` to Certificate model → migrate
2. Install pdfkit: `npm install pdfkit --workspace @testcraft/api`
3. Create `CertificateService.generatePdf()` method
4. Add `GET /certificates/:id/download` endpoint with `@Roles('STUDENT')`
5. Add `data-testid="download-cert-btn"` to dashboard component
6. Write Playwright test for AC-1, AC-2, AC-3

### Risk areas
- PDF generation blocks the event loop → use async stream
- Certificate must be student's own → IDOR check needed (AC-4 security)

### AC coverage
- AC-1 ✓ (step 4 + 5)
- AC-2 ✓ (step 4: guard checks ownership)
- AC-3 ✓ (step 6: Playwright test)
- AC-4 ✓ (step 4: IDOR guard)

Approve this plan? (yes/no)
```

**Do not write code until you approve the plan.**

---

## Lesson 5: The CLAUDE.md — Institutional Memory

`CLAUDE.md` at the repo root is Claude's briefing document. It loads at the start of every session.

### What Goes in CLAUDE.md

See the root `CLAUDE.md` for the full file. Key sections:

1. **Architecture overview** — what each app is for
2. **The SDLC pipeline** — the exact stages Claude follows
3. **Code conventions** — NestJS service/controller split, Tailwind classes, etc.
4. **Key files** — where to find things quickly
5. **Hard rules** — what Claude must never do

### Evolving CLAUDE.md

When you discover a pattern worth preserving:
```
Add this to CLAUDE.md under "Code Conventions":
When grading assignments, always create a new Submission record
rather than modifying the existing one, to preserve audit trail.
```

CLAUDE.md is written by the team, read by Claude. Update it when:
- A new pattern is established
- A mistake is made and should never be repeated
- A new dependency is added to the stack

---

## Lesson 6: Skills as Institutional Knowledge

Skills in `docs/agents-staging/` (installed to `.claude/agents/`) are specialized agents that carry domain knowledge. Each skill has:

- A specific domain (`fe-agent`, `be-agent`, `qa-playwright-agent`)
- A defined workflow (SDD — spec first, then code)
- Platform-specific knowledge (NestJS patterns, Prisma migrations, Playwright POMs)

### Currently Available Skills / Agents

| Agent | Trigger |
|---|---|
| `fe-agent` | Frontend features, pages, components |
| `be-agent` | API endpoints, DB schema, business logic |
| `qa-scenario-agent` | Create Qase test cases from spec |
| `qa-playwright-agent` | Write/run/fix Playwright E2E tests |
| `qa-api-agent` | Direct API testing with curl |
| `qa-security-agent` | OWASP security testing |
| `qa-exploration-agent` | Session-based exploratory testing |
| `qa-loadtest-agent` | k6 load/performance tests |

### Adding a New Skill

When a new domain pattern emerges, create a new agent:
```bash
cp docs/agents-staging/fe-agent.md docs/agents-staging/<new-domain>-agent.md
# Edit the file with domain-specific knowledge
# Then run: bash scripts/install-agents.sh
```

---

## Lesson 7: Parallel Sessions and Subagents

Some tasks can be split and run simultaneously.

### When to Use Parallel Subagents

Use parallel agents when tasks are **independent** — no shared files, no ordering dependency.

Example: Building a feature that touches both FE and BE:

```
"Work in parallel:
- Agent 1: Read docs/specs/certificate-download.spec.md and implement the BE
  (apps/api/src/modules/certificates/) following the be-agent workflow.
- Agent 2: Read docs/specs/certificate-download.spec.md and implement the FE
  (apps/web/src/app/dashboard/) following the fe-agent workflow.
Both agents: write tests before implementation."
```

### The Agent Coordination Pattern

```
Orchestrator (you, in Claude Code)
  ├── be-agent (implements API)
  ├── fe-agent (implements UI)
  └── qa-scenario-agent (creates Qase cases)
       └── qa-playwright-agent (writes E2E tests)
```

All run in parallel. Each reads the same spec. They produce independent artifacts that integrate together.

### Subagent Best Practices

- Each subagent gets the spec file path, not the full spec content
- Subagents read code themselves — don't paste code in the prompt
- Use `run_in_background: true` for long-running tasks
- Subagents report back to the orchestrator with a summary

---

## Build Checklist

Before moving to Stage 4 (Test):

- [ ] Plan was reviewed and approved before coding started
- [ ] All spec ACs have corresponding implementation
- [ ] TypeScript compiles: `npm run typecheck --workspaces`
- [ ] Linting passes: `npm run lint --workspaces`
- [ ] OpenAPI spec updated: `npm run docs:openapi`
- [ ] `data-testid` attributes added to all interactive FE elements
- [ ] No hardcoded secrets or prices
- [ ] Spec marked as `IN PROGRESS` → `IMPLEMENTED`
