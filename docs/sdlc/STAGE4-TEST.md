# Stage 4: Test — Feedback Loop + Continuous Evals in CI

> "Claude needs to see test results to close the loop. Without feedback, it's flying blind."
> — AI-Native SDLC Playbook, Lesson 8

---

## Lesson 8: Give Claude a Feedback Loop

The feedback loop is what makes AI-native development self-correcting. Claude writes code → tests run → results come back → Claude fixes failures → repeat.

### How the Feedback Loop Works in TestCraft

```
Write code (Stage 3)
    ↓
Run tests → get results
    ↓
Results fed back to Claude
    ↓
Claude fixes failures automatically
    ↓
Tests run again → all green
    ↓
Move to Stage 5 (Deploy)
```

### Activating the Feedback Loop

After implementing a feature, trigger the full test feedback loop:

```
"Run the tests for docs/specs/<feature>.spec.md and fix any failures.
Keep running until all tests pass."
```

Claude will:
1. Run the relevant Playwright tests
2. Read the failure output (screenshots + console errors)
3. Fix the code
4. Re-run tests
5. Repeat until green

### Playwright Feedback Commands

```bash
# Run and show output inline (Claude reads this)
cd tests/e2e && npx playwright test specs/<area>/<feature>.spec.ts --reporter=list

# On failure, Claude reads:
# - Console output (exact error message)
# - Screenshot at tests/e2e/results/test-results/<name>/screenshot.png
# - Trace file: npx playwright show-trace <trace-file>
```

### API Test Feedback

```bash
# Run NestJS e2e tests
npm run test:e2e --workspace @testcraft/api 2>&1

# Claude reads the output and fixes failures
```

### Qase as Feedback Loop

After every test run, upload results to Qase:
```bash
QASE_MODE=testops npx playwright test
```

Qase shows: which ACs pass, which fail, trend over time. Claude reads Qase results to understand coverage gaps.

---

## Lesson 9: Continuous Evals in CI

Every push to `main` or PR runs the full eval suite automatically.

### CI Eval Pipeline (`.github/workflows/ci.yml`)

```yaml
# The pipeline runs these evaluations in order:

1. lint          → code quality gate
2. typecheck     → type safety gate
3. api-test      → backend correctness gate (NestJS e2e)
4. web-build     → frontend compilation gate
5. marketing-build → marketing compilation gate
6. e2e           → full-stack behavior gate (Playwright)
```

All 6 gates must be green before merge is allowed. One failure blocks the PR.

### What Each Gate Checks

| Gate | What it verifies | Failure means |
|---|---|---|
| lint | Code follows conventions | Style drift — easy to fix |
| typecheck | TypeScript contracts | API/UI contract broken |
| api-test | Backend business rules | AC violations in BE |
| web-build | Frontend compiles | Import errors, missing components |
| e2e | User-visible behavior | AC violations visible to users |

### Eval Coverage by Spec AC

Every spec AC must be covered by at least one CI check:

```markdown
# In docs/specs/<feature>.spec.md

| AC | Implementation | CI Gate | Qase |
|----|---------------|---------|------|
| AC-1 | apps/api/src/modules/certs/ | api-test | TC-41 |
| AC-2 | apps/web/src/app/dashboard/ | e2e | TC-42 |
| AC-3 | JWT guard on GET /certificates/:id | api-test | TC-43 |
```

If an AC has no CI gate → it is not verified → it should not be marked ✅.

### Adding a New Eval

When a new risk area is found (e.g. "payments always recheck price server-side"):

1. Write a test that would fail if the risk materializes
2. Add it to the appropriate CI job
3. Reference the spec AC it covers

```typescript
// apps/api/test/payments.e2e-spec.ts
// AC-SECURITY-1: price manipulation rejected
it('rejects client-provided price', async () => {
  const res = await request(app).post('/payments/checkout')
    .send({ courseId, totalAmount: 1 }) // manipulated
    .set('Authorization', `Bearer ${studentToken}`)
  // Server should use its own price, not client's "1"
  expect(res.body.data.amount).not.toBe(1)
  expect(res.body.data.amount).toBeGreaterThan(1)
})
```

### Eval Cadence

| Trigger | Evals Run |
|---|---|
| Every PR | lint + typecheck + api-test + web-build + e2e |
| Push to main | All of the above + deploy |
| Nightly (optional) | Full E2E suite + load test (smoke only) |
| Weekly | Full soak test + security scan |

### Setting Up Nightly Evals

Add to `.github/workflows/ci.yml`:

```yaml
on:
  schedule:
    - cron: '0 1 * * *'  # 1 AM UTC nightly
```

Or create `.github/workflows/nightly.yml` with the extended suite.

---

## Feedback Loop for QA Agents

The `qa-playwright-agent` follows this loop automatically:

```
Read spec → write test → run test
     ↑                       ↓
   Fix code ← read failure output
```

When a test fails, the agent:
1. Reads the Playwright failure output
2. Reads the relevant source file
3. Determines: is it a code bug or a test bug?
4. If code bug → fixes `apps/api/` or `apps/web/` and re-runs
5. If test bug (wrong selector, wrong expectation) → updates the test and spec
6. Never marks a test as "passed" by deleting assertions

---

## Test Result Reporting

After every test run (local or CI), results go to three places:

1. **Console** — immediate feedback during development
2. **Playwright HTML report** — `tests/e2e/playwright-report/index.html`
3. **Qase** — `QASE_MODE=testops` uploads results to TC project (Plan 1)

Claude reads the console and HTML report for the feedback loop.
Qase is for tracking trends and sharing with the team.
