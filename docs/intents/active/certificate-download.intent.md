# Intent: Student Certificate Download

**Date**: 2026-09-08
**Requested by**: Arief Rahman (Product)
**Priority**: P1 (this sprint)
**Stage**: INTENT → SPEC → BUILD → TEST → DEPLOY

---

## What do we want to build?

When a student completes all lessons in a course and passes all quizzes,
they can download a PDF certificate of completion with their name, course
title, completion date, and a unique verification URL.

## Why does this matter?

Students share certificates on LinkedIn — it's our biggest organic marketing
channel. Currently the Certificate record exists in the database but there is
no way for students to download it. The `pdfUrl` field in the Certificate model
is always null.

## Who is the user?

- [x] STUDENT
- [ ] INSTRUCTOR
- [ ] ADMIN / SUPER_ADMIN
- [ ] Public (unauthenticated) — but verification URL must work without login

## What does success look like?

1. Student completes the last lesson in a course
2. A "Download Certificate" button appears on the student's dashboard
3. Student clicks the button
4. PDF downloads with: student full name, course title, completion date, unique verification URL
5. Anyone can visit the verification URL and see "This certificate is valid"

## What is out of scope?

- NOT emailing the certificate (future sprint)
- NOT custom certificate templates per course (future)
- NOT certificate revocation UI (admin can do this via Prisma Studio for now)

## Constraints

- PDF must be generated server-side (not client-side)
- Verification URL must be public (no login required)
- Certificate is only downloadable by the student who earned it (not shareable download link)
- Completion check: all REQUIRED lessons completed AND quiz scores meet threshold

## Dependencies / blockers

- Certificate model already exists in schema: `apps/api/prisma/schema.prisma`
- `pdfUrl` field exists but is always null — we need to populate it
- Need to decide: generate PDF on-demand vs. pre-generate at completion

## Questions for the spec

1. Which PDF library? (`pdfkit` is already a common NestJS choice)
2. Store PDF in S3/R2 OR generate on-demand and stream?
3. What exactly goes on the certificate? (name, course title, date, logo, verify URL?)
4. What is the completion threshold? (100% lessons? 80% quiz score?)
5. Certificate ID format for the verification URL? (UUID or custom?)
