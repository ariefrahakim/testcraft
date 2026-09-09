# TestCraft Indonesia — AI-Native SDLC Monorepo

**Paradigm**: Every feature follows the 5-stage AI-Native SDLC pipeline.
No code is written without a spec. No spec is written without an intent.

---

## Architecture

Three-app monorepo:
- `apps/api` — NestJS REST API (port 4001), Prisma, PostgreSQL
- `apps/web` — Next.js 14 LMS portal (port 3000), students/instructors/admins
- `apps/marketing` — Next.js 14 marketing site (port 3001), public-facing
- `packages/shared` — Shared TypeScript enums and types
- `tests/e2e` — Playwright E2E tests (Chromium)
- `tests/load` — k6 load/performance tests

---

## The AI-Native SDLC Pipeline

Every feature goes through all 5 stages. Never skip a stage.

```
Stage 1: PLAN    → docs/intents/active/<feature>.intent.md
Stage 2: DESIGN  → docs/specs/<feature>.spec.md
Stage 3: BUILD   → Code + tests (spec-driven, plan mode first)
Stage 4: TEST    → Playwright + API tests → Qase feedback loop
Stage 5: DEPLOY  → CI gates → PR review → VPS deployment
```

Full docs: `docs/sdlc/STAGE1-PLAN.md` through `STAGE5-DEPLOY.md`

### Starting Any New Feature

```
1. Write docs/intents/active/<feature>.intent.md (use docs/sdlc/intent.template.md)
2. Tell Claude: "Read the intent and create the spec."
3. Review spec. Approve it.
4. Tell Claude: "Read the spec and create a plan. Do not write code yet."
5. Review plan. Approve it.
6. Tell Claude: "Execute the plan."
7. Tests run automatically. Claude fixes failures.
8. Push → CI gates → AI PR review → merge → auto-deploy.
```

---

## Quick Start

```bash
cp .env.example .env                    # fill in secrets
cp apps/api/.env.example apps/api/.env  # fill in DB + JWT
npm install
docker compose up -d                    # start DB + Redis
npm run db:migrate                      # run migrations
npm run db:seed                         # seed test accounts
npm run dev                             # start all apps (3000, 3001, 4001)
```

Install agents (run once after cloning):
```bash
bash scripts/install-agents.sh
```

---

## Available Agents

| Agent | When to use |
|---|---|
| `fe-agent` | Build/fix Next.js pages and components |
| `be-agent` | Add API endpoints, DB schema, business logic |
| `qa-scenario-agent` | Create Qase test cases from a spec |
| `qa-playwright-agent` | Write/run/fix E2E Playwright tests |
| `qa-api-agent` | Test API endpoints directly with curl |
| `qa-security-agent` | OWASP security testing |
| `qa-exploration-agent` | Exploratory session-based testing |
| `qa-loadtest-agent` | k6 load/performance tests |

All agents are **spec-driven**: they read `docs/specs/<feature>.spec.md` first.

---

## Code Conventions

### Backend (apps/api)
- All routes: `/api/v1/<resource>`
- Business logic: **Services only** (never in Controllers)
- Input validation: always DTOs with `class-validator`
- Auth: `@Public()` for open endpoints; default = JWT required
- Role checks: `@Roles('ADMIN')` decorator
- Errors: throw NestJS exceptions — `AllExceptionsFilter` formats them
- Never trust client-provided prices or discounts — recalculate server-side
- OpenAPI: run `npm run docs:openapi` after every controller change

### Frontend (apps/web + apps/marketing)
- API calls: always `src/lib/api.ts` — never raw `fetch()`
- Auth state: `useAuth()` from `src/lib/auth-context.tsx`
- Data fetching: `useApi()` from `src/lib/use-api.ts`
- i18n: `useT()` for all user-facing strings
- Testability: `data-testid` on every interactive element
- Styling: Tailwind + CSS variables (`--blue:#0E9C9C`, `--navy:#12283E`)

### Tests (tests/e2e)
- No hard waits (`waitForTimeout`) — use `waitForSelector`, `waitForURL`
- Always use Page Object Models — no raw selectors in spec files
- Every test title includes the Qase case: `TC-15: student enrolls in free course`
- Session reuse: use auth fixtures (`auth-fixture.ts`) to avoid re-login

### Database
- Schema: `apps/api/prisma/schema.prisma` — only place to change DB structure
- Migrations: `npm run db:migrate` (creates migration file automatically)
- After schema change: update `packages/shared/src/enums.ts` if enums changed
- Seeding: `npm run db:seed` (seeds admin, student, instructor accounts)

---

## Key Files

| File | Purpose |
|---|---|
| `apps/api/prisma/schema.prisma` | Database schema — source of truth |
| `apps/api/src/app.module.ts` | NestJS module registry |
| `apps/api/src/common/guards/` | JWT + Role guards |
| `apps/api/.env.example` | Backend environment variables |
| `apps/web/src/lib/api.ts` | Frontend API client |
| `apps/web/src/lib/auth-context.tsx` | Auth state |
| `packages/shared/src/enums.ts` | Shared enums (keep in sync with schema) |
| `tests/e2e/playwright.config.ts` | Playwright configuration |
| `tests/e2e/.env.example` | E2E test credentials |
| `docs/specs/` | Spec files — source of truth for features |
| `docs/intents/active/` | Intents being worked on |
| `docs/sdlc/` | SDLC stage documentation |
| `.github/workflows/ci.yml` | CI pipeline |
| `.github/workflows/deploy-vps.yml` | VPS deployment |
| `docker-compose.prod.yml` | Production Docker stack |

---

## Running Tests

```bash
# Unit + e2e API tests (NestJS)
npm run test --workspace @testcraft/api

# Playwright E2E (requires all apps running)
npm run dev                                          # start apps first
cd tests/e2e && npm test                             # run all
cd tests/e2e && npx playwright test --grep @smoke   # smoke only
cd tests/e2e && npm run test:ui                      # interactive UI

# Load tests (requires k6)
cd tests/load && k6 run scenarios/smoke.js
```

---

## Deployment

Auto-deploy: push to `main` → CI passes → `deploy-vps.yml` triggers.

Manual deploy:
```bash
./scripts/deploy.sh production
```

VPS first-time setup:
```bash
bash scripts/setup-vps.sh  # run on the VPS as root
```

Domains:
- `testcraft.id` → marketing (port 3001)
- `app.testcraft.id` → LMS (port 3000)
- `api.testcraft.id` → API (port 4001)

---

## Qase Integration

Project: `TC` | Token: in `.env` as `QASE_TOKEN`
Test Plan: Plan 1 — "TestCraft LMS — Full Regression Suite" (68 base cases)

Upload results: `QASE_MODE=testops npx playwright test`

Suites: 1=Auth, 2=Catalog, 3=Enrollment, 4=Learning, 5=Quiz, 6=Assignment,
        7=Certificates, 8=CMS, 9=Instructor, 10=Marketing, 11=API Security

---

## Hard Rules (Never Violate)

1. **No code without a spec** — create `docs/specs/<feature>.spec.md` first
2. **No spec without an intent** — write `docs/intents/active/<feature>.intent.md` first
3. **No business logic in controllers** — services only
4. **No client-provided prices** — recalculate server-side
5. **No raw `fetch()`** — use `src/lib/api.ts`
6. **No hard waits in tests** — use Playwright's built-in waiting
7. **No merging with failing CI** — all 6 gates must be green
8. **OpenAPI must be in sync** — run `npm run docs:openapi` after controller changes
9. **No quiz answer keys in API responses** — server selects fields explicitly
10. **No `.env` in git** — it is gitignored for a reason
