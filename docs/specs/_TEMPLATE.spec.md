# Spec: [Feature Name]

**Status**: DRAFT | REVIEW | APPROVED | IMPLEMENTED
**Owner**: [FE/BE/QA]
**Created**: YYYY-MM-DD
**Qase Suite**: [suite ID + name]

---

## User Story

```
As a [STUDENT | INSTRUCTOR | ADMIN | SUPER_ADMIN]
I want to [action]
So that [benefit / business value]
```

---

## Acceptance Criteria

Each criterion maps to at least one test case in Qase.

| # | Criterion | Priority | Qase Case | Status |
|---|-----------|----------|-----------|--------|
| AC-1 | [What must be true for the feature to work] | Must Have | TC-xxx | ⬜ |
| AC-2 | [Edge case that must be handled] | Must Have | TC-xxx | ⬜ |
| AC-3 | [Error case with user-friendly message] | Should Have | TC-xxx | ⬜ |
| AC-4 | [Security constraint] | Must Have | TC-xxx | ⬜ |

Status: ⬜ Pending · 🔄 In Progress · ✅ Done · ❌ Failed

---

## API Contract

### Request
```
METHOD /api/v1/endpoint
Authorization: Bearer <token>
Content-Type: application/json

{
  "field": "type — description"
}
```

### Response (Success)
```json
{
  "data": {},
  "message": "Human-readable success message"
}
```

### Response (Errors)

| HTTP | Code | When |
|------|------|------|
| 400 | Bad Request | [validation fails] |
| 401 | Unauthorized | [no/invalid token] |
| 403 | Forbidden | [wrong role] |
| 404 | Not Found | [resource missing] |
| 409 | Conflict | [duplicate resource] |

---

## Data Model

Fields affected in `apps/api/prisma/schema.prisma`:
```prisma
model ModelName {
  id          String   @id @default(cuid())
  // fields here
}
```

New/changed fields:
- `field` — type — description, constraints

---

## UI Spec (if FE feature)

**Page**: `/path/to/page`
**Roles that can access**: [STUDENT, ADMIN, ...]

**States**:
- Loading: show skeleton / spinner
- Empty: show `<EmptyState>` with message "..."
- Error: show error banner
- Populated: show main content

**Key elements** (with `data-testid`):
- `data-testid="[element-id]"` — Button/Input/Link — purpose

**Navigation**:
- After success: redirect to [where]
- On error: show inline error, stay on page

---

## Out of Scope

- [Things explicitly NOT part of this feature]

---

## Test Scenarios

Generated from acceptance criteria. See Qase TC project for full steps.

```gherkin
Feature: [Feature Name]

  Scenario: AC-1 — [happy path title]
    Given [precondition]
    When [action]
    Then [expected outcome]
    And [secondary outcome]

  Scenario: AC-3 — [error case title]
    Given [precondition]
    When [invalid action]
    Then [error response]
    And [user-friendly message shown]
```

---

## Implementation Checklist

### Backend (apps/api)
- [ ] DTO created/updated in `src/modules/<domain>/dto/`
- [ ] Service method implemented
- [ ] Controller endpoint added with Swagger decorators
- [ ] Guard/decorator applied (`@Roles`, `@Public`)
- [ ] Prisma migration created and tested
- [ ] OpenAPI spec updated (`npm run docs:openapi`)

### Frontend (apps/web or apps/marketing)
- [ ] Page/component created
- [ ] `data-testid` attributes added to all interactive elements
- [ ] Loading, empty, error states handled
- [ ] API call uses `lib/api.ts` (no raw fetch)
- [ ] TypeScript passes (`npm run typecheck`)

### QA
- [ ] Qase test cases created (IDs: TC-xxx)
- [ ] Playwright spec file created at `tests/e2e/specs/<area>/`
- [ ] All ACs covered by at least one test
- [ ] Tests pass locally
- [ ] Tests pass in CI
