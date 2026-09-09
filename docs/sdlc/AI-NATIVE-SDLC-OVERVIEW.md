# TestCraft AI-Native SDLC Playbook

Based on: academy.claude.com/courses/ai-native-sdlc-playbook

This document maps every lesson from the AI-Native SDLC Playbook to its concrete implementation in the TestCraft monorepo.

---

## The 5-Stage Pipeline

```
┌─────────────────────────────────────────────────────────────────────┐
│                   TESTCRAFT AI-NATIVE SDLC                         │
├──────────┬──────────┬──────────┬──────────┬──────────────────────┤
│ Stage 1  │ Stage 2  │ Stage 3  │ Stage 4  │ Stage 5              │
│  PLAN    │  DESIGN  │  BUILD   │  TEST    │  DEPLOY              │
├──────────┼──────────┼──────────┼──────────┼──────────────────────┤
│intent.md │ spec.md  │ Code +   │ Tests +  │ CI gates →           │
│          │          │ tests    │ feedback │ PR review →          │
│          │          │          │ loop     │ VPS deploy           │
├──────────┼──────────┼──────────┼──────────┼──────────────────────┤
│ Lesson 2 │ Lesson 3 │ L4 L5    │ L8 L9    │ L10 L11 L12          │
│          │          │ L6 L7    │          │                      │
└──────────┴──────────┴──────────┴──────────┴──────────────────────┘
```

---

## Lesson Map

### Introduction
**What**: Why AI-native development is different from AI-assisted development.
**In TestCraft**: Claude owns the implementation pipeline. Humans own intent and approval.
**File**: `CLAUDE.md` — the briefing document Claude reads every session.

---

### Stage 1: Plan

#### Lesson 2 — Capture as intent.md
**What**: Every feature starts with a human-written intent file — the "why" before the "how."
**In TestCraft**:
- Template: `docs/sdlc/intent.template.md`
- Location: `docs/intents/active/<feature>.intent.md`
- Example: `docs/intents/active/certificate-download.intent.md`
- Full guide: `docs/sdlc/STAGE1-PLAN.md`

**Workflow**:
```
Human writes intent.md → tells Claude → Claude produces spec
```

---

### Stage 2: Design

#### Lesson 3 — Requirements and Design
**What**: Claude turns intent into a precise spec. The spec is the contract.
**In TestCraft**:
- Template: `docs/specs/_TEMPLATE.spec.md`
- Location: `docs/specs/<feature>.spec.md`
- Full guide: `docs/sdlc/STAGE2-DESIGN.md`

**Spec must include**: User story, numbered ACs (testable), API contract, UI spec with `data-testid` list, data model, out-of-scope.

**Gate**: Spec must be `APPROVED` before Stage 3 starts.

---

### Stage 3: Build

#### Lesson 4 — Claude Code Plan Mode as the Default Starting Point
**What**: Before writing code, Claude shows the plan. Human approves. Then Claude builds.
**In TestCraft**: Tell Claude: *"Read the spec and create a plan. Do not write any code yet."*
**Gate**: Plan approved → then `"Execute the plan."`

#### Lesson 5 — The CLAUDE.md
**What**: The repo's briefing document. Loaded every session.
**In TestCraft**: `CLAUDE.md` at repo root. Contains architecture, conventions, hard rules, agent map.
**Evolves**: Team updates it when new patterns emerge or mistakes must never be repeated.

#### Lesson 6 — Skills as Institutional Knowledge
**What**: Specialized agents carry domain knowledge that persists across sessions.
**In TestCraft**: `docs/agents-staging/` → installed to `.claude/agents/` via `scripts/install-agents.sh`

| Agent | Domain |
|---|---|
| `fe-agent` | Next.js, Tailwind, auth context |
| `be-agent` | NestJS, Prisma, JWT, business rules |
| `qa-scenario-agent` | Qase test case creation |
| `qa-playwright-agent` | Playwright E2E, feedback loop |
| `qa-api-agent` | curl-based API testing |
| `qa-security-agent` | OWASP, auth bypass, injection |
| `qa-exploration-agent` | Session-based exploratory testing |
| `qa-loadtest-agent` | k6 load/stress/soak tests |

#### Lesson 7 — Parallel Sessions and Subagents
**What**: Independent tasks run simultaneously.
**In TestCraft**: BE + FE agents run in parallel on the same spec. QA agent runs in parallel with both.
**Pattern**: `run_in_background: true` for long implementation tasks.

---

### Stage 4: Test

#### Lesson 8 — Give Claude a Feedback Loop
**What**: Test results flow back to Claude. Claude fixes failures. Loop continues until green.
**In TestCraft**:
- `qa-playwright-agent` implements the feedback loop automatically
- Run → read failure → fix code → rerun (up to convergence)
- Qase `TC` project receives results after every run
**Full guide**: `docs/sdlc/STAGE4-TEST.md`

#### Lesson 9 — Continuous Evals in CI
**What**: Every push runs the full eval suite. One failure blocks the PR.
**In TestCraft**: `.github/workflows/ci.yml` runs 6 gates:
1. lint → 2. typecheck → 3. api-test → 4. web-build → 5. marketing-build → 6. e2e
**Every spec AC must have a CI gate.** No AC without a test. No test without a CI gate.

---

### Stage 5: Deploy

#### Lesson 10 — AI in the PR Review Loop
**What**: Every PR gets an automated review checklist posted by Claude.
**In TestCraft**: `.github/workflows/pr-review.yml`
- Posts checklist: implementation gate, test gate, security gate, SDLC process gate
- Updates the comment on each push (no duplicate comments)

#### Lesson 11 — Hooks as Approval Gates
**What**: Git hooks enforce standards automatically before bad code spreads.
**In TestCraft**: `scripts/hooks/`
- `pre-commit`: TypeScript + lint + OpenAPI sync
- `pre-push`: Playwright smoke tests (`@smoke` tag)
- Install: `bash scripts/hooks/install-hooks.sh`

#### Lesson 12 — CI/CD Integration and Deployment
**What**: Merge to main → automated build → push images → deploy to VPS.
**In TestCraft**:
- `deploy-vps.yml`: builds Docker images → pushes to GHCR → SSH to VPS → migrate → health check
- `release.yml`: auto-semver tags from conventional commits
- Full guide: `docs/sdlc/STAGE5-DEPLOY.md`

---

## The Complete Flow (one feature, start to finish)

```
1. PLAN:   Human writes docs/intents/active/<feature>.intent.md
2. PLAN:   "Claude, read the intent and create a spec."
3. DESIGN: Claude writes docs/specs/<feature>.spec.md
4. DESIGN: Human reviews and approves spec
5. DESIGN: qa-scenario-agent creates Qase test cases (TC-N)
6. BUILD:  "Claude, create a plan from the spec. No code yet."
7. BUILD:  Human reviews and approves plan
8. BUILD:  be-agent + fe-agent run in parallel
           → be-agent: writes e2e test (RED) → implements (GREEN)
           → fe-agent: writes Playwright test (RED) → implements (GREEN)
9. TEST:   qa-playwright-agent feedback loop:
           → run → fail → fix → rerun → green
10. TEST:  QASE_MODE=testops → results uploaded to TC project
11. DEPLOY: pre-commit hook runs → TypeScript ✓ → Lint ✓ → OpenAPI ✓
12. DEPLOY: git push → pre-push hook → smoke tests ✓
13. DEPLOY: GitHub Actions CI → 6 gates → all green
14. DEPLOY: pr-review.yml posts checklist → human reviews → merge
15. DEPLOY: deploy-vps.yml → Docker build → push → SSH deploy → health ✓
16. DONE:  Move intent to docs/intents/done/ → spec status = IMPLEMENTED
```

---

## Files Created for This Playbook

| File | Stage | What it implements |
|---|---|---|
| `docs/sdlc/intent.template.md` | 1 | Intent capture template |
| `docs/sdlc/STAGE1-PLAN.md` | 1 | Plan stage documentation |
| `docs/specs/_TEMPLATE.spec.md` | 2 | Spec template |
| `docs/sdlc/STAGE2-DESIGN.md` | 2 | Design stage documentation |
| `docs/sdlc/STAGE3-BUILD.md` | 3 | Build stage documentation (plan mode, CLAUDE.md, skills, subagents) |
| `docs/sdlc/STAGE4-TEST.md` | 4 | Test stage documentation (feedback loop, evals) |
| `docs/sdlc/STAGE5-DEPLOY.md` | 5 | Deploy stage documentation (PR review, hooks, CI/CD) |
| `docs/agents-staging/fe-agent.md` | 3 | FE institutional knowledge |
| `docs/agents-staging/be-agent.md` | 3 | BE institutional knowledge |
| `docs/agents-staging/qa-*.md` | 4 | QA agents (8 agents) |
| `.github/workflows/pr-review.yml` | 5 | AI PR review checklist |
| `scripts/hooks/pre-commit` | 5 | TypeScript/lint gate |
| `scripts/hooks/pre-push` | 5 | Smoke test gate |
| `scripts/hooks/install-hooks.sh` | 5 | Hook installer |
| `CLAUDE.md` | 3 | Briefing document (updated) |
| `docs/intents/active/*.intent.md` | 1 | Active feature intents |
