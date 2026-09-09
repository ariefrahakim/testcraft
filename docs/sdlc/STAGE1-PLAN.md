# Stage 1: Plan — Capture as intent.md

> "Before Claude writes a single line of code, it must understand what you're trying to accomplish."
> — AI-Native SDLC Playbook, Lesson 2

---

## What is intent.md?

Every feature, bug fix, or change starts with an `intent.md` file. This captures the **why** before the **how**. It is the single input that triggers the entire AI-native SDLC pipeline.

Claude reads `intent.md` to:
- Understand what to build
- Ask the right clarifying questions
- Produce a spec (Stage 2) and then code (Stage 3)
- Know when it's done (acceptance criteria)

---

## Intent File Location

```
docs/intents/
  active/
    <feature-slug>.intent.md    ← current work
  done/
    <feature-slug>.intent.md    ← shipped
```

---

## intent.md Template

```markdown
# Intent: [Feature Name]

**Date**: YYYY-MM-DD
**Requested by**: [name / role]
**Priority**: P0 (blocker) | P1 (this sprint) | P2 (next sprint)
**Stage**: INTENT → SPEC → BUILD → TEST → DEPLOY

---

## What do we want to build?

[1-3 sentences. Plain language. What will users be able to do that they can't do now?]

## Why does this matter?

[Business reason. What problem does it solve? What happens if we don't build it?]

## Who is the user?

- [ ] STUDENT
- [ ] INSTRUCTOR
- [ ] ADMIN
- [ ] SUPER_ADMIN
- [ ] CORPORATE_ADMIN
- [ ] Public (unauthenticated)

## What does success look like?

[Describe the happy path in plain language — no technical details yet]

1. User opens [page]
2. User does [action]
3. System responds with [result]
4. User sees [confirmation]

## What are the boundaries? (Out of scope)

- NOT building: [...]
- Deferring to later: [...]

## Are there any constraints?

- Must use existing Midtrans integration (no new payment provider)
- Must work on mobile viewport
- API response time < 500ms at p95
- [other constraints]

## Dependencies / blockers

- Requires [other feature] to be done first
- Needs design mockup from [person]
- Waiting on [external API/data]

## Questions to answer in spec

1. ?
2. ?
```

---

## How to Use

### Starting a new feature

```bash
# 1. Copy template
cp docs/sdlc/intent.template.md docs/intents/active/<feature-slug>.intent.md

# 2. Fill it in (5-10 minutes)
# 3. Tell Claude Code:
```

Then in Claude Code:
```
Read docs/intents/active/<feature-slug>.intent.md and proceed to Stage 2 (create the spec).
```

### Claude Code reads intent → produces spec

The `be-agent` and `fe-agent` are wired to:
1. Read the intent file
2. Ask any clarifying questions listed in "Questions to answer"
3. Produce `docs/specs/<feature-slug>.spec.md` (Stage 2)

---

## Example: Real Intent File

```markdown
# Intent: Student Certificate Download

**Date**: 2026-09-08
**Requested by**: Arief (Product)
**Priority**: P1
**Stage**: INTENT

## What do we want to build?

When a student completes all lessons in a course and passes all quizzes,
they can download a PDF certificate of completion with their name, course
title, and completion date.

## Why does this matter?

Students share certificates on LinkedIn — it's our biggest organic marketing
channel. Currently we generate the certificate but there's no download button.

## Who is the user?

- [x] STUDENT

## What does success look like?

1. Student completes the last lesson in a course
2. A "Download Certificate" button appears on their dashboard
3. Student clicks it
4. PDF downloads with their name, course title, and today's date
5. Certificate has a unique verification URL

## Out of scope

- NOT sending certificate via email (next sprint)
- NOT custom certificate templates per course (later)

## Constraints

- PDF must be generated server-side (not client-side)
- Verification URL must work without login

## Questions for spec

1. What PDF library should we use? (pdfkit? puppeteer?)
2. Where do we store the generated PDF? (S3? generate on-demand?)
3. What data goes on the certificate exactly?
```

---

## Intent → Spec → Build → Test → Deploy

Once `intent.md` exists:

| Stage | Input | Output | Command |
|---|---|---|---|
| **Plan** | User request | `intent.md` | Manual — you write this |
| **Design** | `intent.md` | `spec.md` | `be-agent` / `fe-agent` reads intent → produces spec |
| **Build** | `spec.md` | Code + tests | `be-agent` / `fe-agent` in plan mode |
| **Test** | Code | Test results → Qase | `qa-playwright-agent` / `qa-api-agent` |
| **Deploy** | Green CI | Production | GitHub Actions auto-deploys |
