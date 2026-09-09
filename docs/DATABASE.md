# Database Documentation

This document explains the TestCraft database: what it contains, how it is structured, and how to work with it as a QA engineer.

---

## What is PostgreSQL?

PostgreSQL (often called "Postgres") is a database — a program that stores and organizes data. Think of it like a very powerful Excel file that:

- Stores all data in tables (like spreadsheets with rows and columns)
- Enforces rules (e.g., "email must be unique", "price cannot be negative")
- Links tables together (e.g., an Enrollment row links a User to a Course)
- Can handle many users reading and writing data simultaneously
- Never loses data, even if the computer crashes

In TestCraft, PostgreSQL stores **everything**: user accounts, courses, enrollments, payments, certificates, site content, and more.

**How to think about it:**
- A "table" is like a spreadsheet tab
- A "row" is one record (e.g., one user, one course, one payment)
- A "column" is one piece of data within a record (e.g., the user's name, or the course's price)
- A "relationship" links one table to another (e.g., "this payment belongs to this user")

---

## What is Prisma?

Prisma is the bridge between the TypeScript code in the API and the PostgreSQL database. Developers write TypeScript, Prisma converts it to SQL, and returns typed results.

For QA engineers, the most important thing to know about Prisma is:

1. **The schema** (`apps/api/prisma/schema.prisma`) is the single source of truth for the database structure. Every table, column, and relationship is defined there.
2. **Prisma Studio** lets you browse the database visually — no SQL needed.
3. **Migrations** are files that record every change ever made to the schema.

---

## How to View Data (Prisma Studio)

Prisma Studio is a web-based visual database browser. No SQL knowledge required.

```bash
# From the root of the project (database must be running)
npm run db:studio
```

Then open **http://localhost:5555** in your browser.

You will see:
- A list of all tables on the left
- Click any table to browse its rows
- Filter, sort, and paginate records
- Edit individual cells directly (use with caution in dev environments)

---

## How to Run Migrations

A migration is a change to the database schema (e.g., adding a new column to the User table).

### Development

```bash
# Apply all pending migrations and create a new one if schema changed
npm run db:migrate
```

After editing `prisma/schema.prisma`, this command:
1. Detects what changed
2. Creates a SQL migration file in `apps/api/prisma/migrations/`
3. Applies the change to the local database

### Production

```bash
# Apply pending migrations WITHOUT creating new ones (safe for production)
npm run db:deploy --workspace @testcraft/api
```

**Never run `db:migrate` in production.** Use `db:deploy` instead.

### After Changing the Schema

Whenever the schema file changes, run:

```bash
npm run db:generate   # Updates the TypeScript Prisma client
```

---

## How to Seed Test Data

Seeding populates the database with realistic test data.

```bash
# From the root of the project
npm run db:seed
```

This creates:

| Account | Email | Password | Role |
|---------|-------|----------|------|
| Admin | admin@testcraft.id | Admin#12345 | ADMIN |
| Student | student@testcraft.id | Student#12345 | STUDENT |
| Instructor | instructor@testcraft.id | Instructor#12345 | INSTRUCTOR |

Plus sample categories, courses, and site settings.

**Seed is idempotent**: running it multiple times will not create duplicate records — it uses "upsert" (update if exists, create if not).

---

## Entity Relationship Overview

Below is a description of all tables and how they relate to each other.

### Identity and Authentication

#### `User`
The central table. Every person who has an account is a User.

| Column | Type | Description |
|--------|------|-------------|
| `id` | String | Unique ID (CUID format, e.g., `clx12abc...`) |
| `email` | String | Unique email address |
| `name` | String | Display name |
| `phone` | String? | Phone number (optional) |
| `passwordHash` | String? | Argon2id hashed password (never plain text) |
| `googleId` | String? | Google OAuth ID (optional) |
| `role` | Role | `SUPER_ADMIN`, `ADMIN`, `INSTRUCTOR`, `STUDENT`, or `CORPORATE_ADMIN` |
| `avatarUrl` | String? | Profile picture URL |
| `bio` | String? | Short biography |
| `isActive` | Boolean | `false` = account is disabled |
| `xp` | Int | Experience points for gamification |
| `level` | Int | Gamification level |
| `streakDays` | Int | Current login streak count |
| `lastLoginAt` | DateTime? | Timestamp of last login |

#### `RefreshToken`
Stores hashed refresh tokens for each login session. Used to validate token rotation.

| Column | Description |
|--------|-------------|
| `tokenHash` | SHA-256 hash of the actual refresh token |
| `userId` | The user who owns this token |
| `expiresAt` | When this token expires |
| `revokedAt` | Set when the token is invalidated (logout) |

### Courses and Content

#### `Category`
Groups courses (e.g., "QA Automation", "API Testing", "Performance Testing").

| Column | Description |
|--------|-------------|
| `name` | Category display name |
| `slug` | URL-safe identifier (e.g., `qa-automation`) |
| `iconUrl` | Icon image URL |

#### `Course`
The main course entity.

| Column | Description |
|--------|-------------|
| `slug` | URL identifier (e.g., `selenium-webdriver-fundamentals`) |
| `title` | Course title |
| `status` | `DRAFT`, `PUBLISHED`, or `ARCHIVED` |
| `level` | `BEGINNER`, `INTERMEDIATE`, or `ADVANCED` |
| `priceIdr` | Price in Indonesian Rupiah (Decimal) |
| `priceUsd` | Price in US Dollars (Decimal, optional) |
| `isFree` | Boolean — `true` for free courses |
| `ratingAvg` | Average student rating (0.0 to 5.0) |
| `totalStudents` | Cached count of enrolled students |
| `instructorId` | Which instructor teaches this course |
| `categoryId` | Which category this course belongs to |

#### `Module`
A section/chapter within a course. Courses have many modules.

| Column | Description |
|--------|-------------|
| `title` | Module title (e.g., "Chapter 1: Getting Started") |
| `position` | Order within the course (1, 2, 3...) |
| `courseId` | Which course this belongs to |

#### `Lesson`
An individual lesson within a module.

| Column | Description |
|--------|-------------|
| `title` | Lesson title |
| `type` | `VIDEO`, `ARTICLE`, `QUIZ`, `ASSIGNMENT`, or `LIVE_SESSION` |
| `videoUrl` | URL to the video (for VIDEO type) |
| `content` | Rich text content (for ARTICLE type) |
| `durationSeconds` | Length of the video in seconds |
| `isFreePreview` | `true` = visible without enrollment |
| `position` | Order within the module |
| `moduleId` | Which module this belongs to |

### Learning Progress

#### `Enrollment`
Records that a student has access to a course.

| Column | Description |
|--------|-------------|
| `userId` | The student |
| `courseId` | The course they are enrolled in |
| `progressPct` | Overall course progress (0–100) |
| `completedLessons` | Count of lessons completed |
| `completedAt` | When they finished the course (if completed) |
| `certificateId` | Their earned certificate (once completed) |

#### `LessonProgress`
Records that a specific lesson has been completed.

| Column | Description |
|--------|-------------|
| `userId` | The student |
| `lessonId` | The lesson |
| `enrollmentId` | The enrollment this belongs to |
| `watchedSeconds` | How many seconds of video they watched |
| `completedAt` | When they marked it complete |

### Assessments

#### `Quiz`
A quiz attached to a lesson.

| Column | Description |
|--------|-------------|
| `lessonId` | Which lesson this quiz belongs to |
| `passingPct` | Minimum score to pass (e.g., 70 = 70%) |
| `timeLimitMin` | Time limit in minutes |

#### `Question`
A single question within a quiz.

| Column | Description |
|--------|-------------|
| `quizId` | Which quiz this belongs to |
| `type` | `MCQ`, `MULTI_SELECT`, `TRUE_FALSE`, `DRAG_DROP`, `MATCHING`, `FILL_BLANK` |
| `body` | The question text |
| `points` | How many points this question is worth |
| `options` | JSON array of answer choices |
| `answer` | The correct answer(s) |

#### `Assignment`
A written assignment attached to a lesson.

| Column | Description |
|--------|-------------|
| `lessonId` | Which lesson this belongs to |
| `title` | Assignment title |
| `instructions` | Full instructions (rich text) |
| `maxPoints` | Total possible points |
| `dueAt` | Deadline (optional) |

#### `Submission`
A student's submitted assignment.

| Column | Description |
|--------|-------------|
| `assignmentId` | Which assignment |
| `userId` | Which student submitted |
| `content` | The student's submission text |
| `status` | `DRAFT`, `SUBMITTED`, `GRADED`, or `RETURNED` |
| `grade` | Score given by instructor |
| `feedback` | Instructor's written feedback |

### Payments

#### `Payment`
A payment transaction.

| Column | Description |
|--------|-------------|
| `invoiceNo` | Unique invoice number (e.g., `TC-20260101-ABCD`) |
| `userId` | Who is paying |
| `status` | `PENDING`, `PAID`, `FAILED`, `REFUNDED`, or `EXPIRED` |
| `provider` | `MIDTRANS`, `XENDIT`, `STRIPE`, `PAYPAL`, or `MANUAL_TRANSFER` |
| `currency` | `IDR` or `USD` |
| `totalAmount` | Amount charged |
| `paidAt` | When the payment was confirmed |

#### `OrderItem`
Line items within a payment (one per course purchased).

| Column | Description |
|--------|-------------|
| `paymentId` | Which payment |
| `courseId` | Which course was purchased |
| `price` | Price at time of purchase (locked in, not affected by future price changes) |

### Certificates

#### `Certificate`
Awarded when a student completes a course.

| Column | Description |
|--------|-------------|
| `number` | Unique certificate number (e.g., `TC-QA-20260101-XXXX`) |
| `userId` | The recipient |
| `courseId` | The completed course |
| `issuedAt` | When the certificate was issued |

### CMS Content

#### `Page`
A CMS-managed public page (e.g., the homepage, pricing page).

| Column | Description |
|--------|-------------|
| `slug` | URL identifier (e.g., `home`, `pricing`) |
| `title` | Page title |
| `status` | `DRAFT`, `PUBLISHED`, `SCHEDULED`, or `ARCHIVED` |

#### `ContentBlock`
A section within a page (e.g., a hero banner, a stats bar, a FAQ).

| Column | Description |
|--------|-------------|
| `pageId` | Which page this block belongs to |
| `type` | `HERO`, `STATS`, `COURSE_GRID`, `TESTIMONIALS`, `FAQ`, `RICH_TEXT`, etc. |
| `data` | JSON payload specific to the block type |
| `position` | Order on the page |
| `isHidden` | `true` = block exists but is not rendered |

#### `SiteSetting`
Global site configuration stored as key-value pairs.

| Column | Description |
|--------|-------------|
| `key` | Setting name (e.g., `companyName`, `ppnPct`, `usdToIdr`) |
| `value` | Setting value (stored as text) |

#### `Banner`
A promotional announcement shown at the top of the site.

| Column | Description |
|--------|-------------|
| `message` | Banner text |
| `ctaLabel` | Button text (optional) |
| `ctaUrl` | Button link (optional) |
| `isActive` | Whether the banner is currently shown |
| `startsAt` / `endsAt` | Schedule for when to show/hide |

### Other

#### `Coupon`
A discount code.

| Column | Description |
|--------|-------------|
| `code` | The discount code (e.g., `QA50`) |
| `discountType` | `PERCENT` (e.g., 20%) or `FIXED_IDR` (e.g., Rp 100,000 off) |
| `discountValue` | The amount of discount |
| `maxUses` | Maximum times this code can be used |
| `usedCount` | How many times it has been used |
| `expiresAt` | Expiration date |

#### `Lead`
A potential student who submitted the contact form on the marketing site.

| Column | Description |
|--------|-------------|
| `name` | Their name |
| `email` | Their email |
| `phone` | Their phone number |
| `interest` | What program they are interested in |
| `source` | Where they came from (e.g., `landing-page`) |
| `contactedAt` | When the sales team followed up |

#### `Notification`
An in-app notification for a user.

| Column | Description |
|--------|-------------|
| `userId` | The recipient |
| `title` | Notification title |
| `body` | Notification body text |
| `readAt` | When the user read it (null = unread) |
| `link` | URL to navigate to when clicked |

---

## Common Database Queries for QA

These are practical queries you can run to verify test results. Use Prisma Studio (http://localhost:5555) to browse without writing code, or run these as direct API calls.

### Find a User

Via Prisma Studio:
1. Open http://localhost:5555
2. Click "User" in the left sidebar
3. Use the filter to search by email

Via API:
```bash
curl http://localhost:4001/api/v1/users \
  -H "Authorization: Bearer <admin-token>"
```

### Check a Student's Enrollment

Find all courses a specific student is enrolled in:
1. Open Prisma Studio → Click "Enrollment"
2. Filter by `userId` = (the student's ID)

### Verify a Payment

1. Open Prisma Studio → Click "Payment"
2. Find the payment by `invoiceNo`
3. Check that `status = PAID`

### Check Certificate Issuance

1. Open Prisma Studio → Click "Certificate"
2. Filter by `userId` to see all certificates for a student
3. Or filter by `courseId` to see who earned a certificate for a course

### Count Enrollments for a Course

1. Open Prisma Studio → Click "Enrollment"
2. Filter by `courseId` = (the course's ID)
3. The row count shown is the total enrollments

---

## Backup and Restore

### Create a Backup

```bash
# Backup the local development database
docker exec testcraft-db pg_dump -U testcraft testcraft \
  | gzip > backup-$(date +%F).sql.gz
```

### Restore from Backup

```bash
# Restore a backup (WARNING: overwrites current data)
gunzip -c backup-2026-01-01.sql.gz \
  | docker exec -i testcraft-db psql -U testcraft -d testcraft
```

### Reset the Database Completely

```bash
# WARNING: Deletes all data in the local database
cd apps/api
npx prisma migrate reset

# Then re-seed
cd ../..
npm run db:seed
```

---

## Database in CI (Automated Tests)

For automated E2E tests in GitHub Actions, a separate PostgreSQL instance runs as a service container:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    env:
      POSTGRES_USER: testcraft
      POSTGRES_PASSWORD: testcraft
      POSTGRES_DB: testcraft
    ports: ['5432:5432']
```

The CI pipeline:
1. Starts the fresh PostgreSQL container
2. Runs `npm run db:deploy` to apply migrations (creates all tables)
3. Runs `npm run db:seed` to populate test accounts and sample data
4. Starts the apps
5. Runs the E2E tests

Each CI run starts with a clean, predictable database state. This means tests are not affected by leftover data from previous runs.

---

## Database Configuration Reference

| Setting | Value |
|---------|-------|
| Database name | `testcraft` |
| Username | `testcraft` |
| Password | `testcraft` (local dev) |
| Host | `localhost` |
| Port | `5433` (host) → `5432` (inside Docker) |
| Connection string | `postgresql://testcraft:testcraft@localhost:5433/testcraft?schema=public` |
| Schema | `public` |
| Engine | PostgreSQL 16 |
