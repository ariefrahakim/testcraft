# Stage 2: Design — Requirements and Design

> "The spec is the contract between intent and implementation. Claude writes code against the spec, not against the conversation."
> — AI-Native SDLC Playbook, Lesson 3

---

## What Happens in Stage 2

The intent file describes WHAT. The spec describes HOW — precisely enough that:
- Claude can implement it without ambiguity
- QA knows exactly what to test
- The team can review and approve before a line of code is written

Input: `docs/intents/active/<feature>.intent.md`
Output: `docs/specs/<feature>.spec.md`

---

## How to Trigger Stage 2

In Claude Code:
```
Read docs/intents/active/<feature>.intent.md.
Answer the questions listed, then create docs/specs/<feature>.spec.md.
```

The `be-agent` / `fe-agent` will:
1. Read the intent
2. Ask clarifying questions (from intent's "Questions for spec" section)
3. Resolve ambiguities by reading existing code for patterns
4. Write the spec

---

## Spec Must Include

### 1. User Story
```
As a [role], I want to [action] so that [business value].
```

### 2. Acceptance Criteria (ACs)
Numbered list. Testable. Each maps to ≥1 Qase test case.

```
AC-1: [observable, testable fact about system behavior]
AC-2: [edge case that must be handled]
AC-3: [error case with specific HTTP status and user-facing message]
AC-4: [security constraint]
```

**Good AC**: "POST /enrollments with a duplicate courseId returns 409 with message 'Already enrolled'"
**Bad AC**: "Handle duplicate enrollments" ← too vague, not testable

### 3. API Contract (for BE features)
- Method + path
- Request body (every field: name, type, required/optional, validation rules)
- Success response shape
- All error responses (HTTP status + when they occur)

### 4. UI Spec (for FE features)
- Route path + roles that can access
- Every state: loading, empty, error, populated
- Every interactive element with its `data-testid` attribute
- Navigation after success / error

### 5. Data Model Changes
- New Prisma fields or models
- Enum additions/changes (must also update `packages/shared/src/enums.ts`)

### 6. Out of Scope
Explicit list. Prevents scope creep.

---

## Requirements Review

Before Claude builds anything, the spec must be reviewed:

```
Review docs/specs/<feature>.spec.md.
Is every AC testable? Is the API contract complete?
Are there any missing error cases?
```

Claude will flag:
- Vague ACs that can't be turned into tests
- Missing error cases from the API contract
- Security gaps (missing auth check, role check)
- Inconsistencies with existing patterns in `docs/ARCHITECTURE.md`

---

## Design Decisions Go in the Spec

When Claude chooses an approach (e.g. "generate PDF on demand vs. store in S3"), it records the decision and rationale in the spec's **Design Decisions** section:

```markdown
## Design Decisions

### PDF Generation Strategy
**Decision**: Generate on demand, cache for 24h in Redis
**Why**: Avoids storage costs; certificates rarely downloaded more than once.
  S3 storage adds operational complexity without clear benefit at current scale.
**Alternative considered**: Pre-generate at completion time → rejected because
  most completions happen at night, generating PDFs that may never be downloaded.
```

This becomes permanent institutional knowledge — future Claude sessions read it.

---

## Spec Review Checklist

Before moving to Stage 3, confirm:

- [ ] Every intent "question" is answered in the spec
- [ ] All ACs are written in testable format (observable outcome)
- [ ] API contract covers all happy path + error responses
- [ ] UI spec includes all `data-testid` attributes
- [ ] Security: auth guard and role guard specified
- [ ] Out of scope is explicit
- [ ] No ambiguous language ("should", "might", "could")

---

## Spec Status Flow

```
DRAFT → REVIEW → APPROVED → IN PROGRESS → IMPLEMENTED
```

Only move to Stage 3 (Build) when status is `APPROVED`.
