# TestCraft API — NestJS Backend

The backend API is the brain of the TestCraft platform. It handles all business logic: user authentication, course management, enrollments, payments, content management, and more. The frontend apps (LMS and Marketing) communicate with this API over HTTP.

**Base URL (local):** `http://localhost:4001/api/v1`
**Interactive API Docs:** `http://localhost:4001/docs` (available when the API is running)

---

## What Technology Is Used

| Technology | What It Does |
|------------|--------------|
| **NestJS** | The web framework — organizes code into modules, handles routing, validation, authentication |
| **TypeScript** | Adds type safety to JavaScript — catches bugs before you run the code |
| **Prisma** | Talks to the database — translates TypeScript code into SQL queries |
| **PostgreSQL** | The database — stores all data (users, courses, payments, etc.) |
| **JWT** | JSON Web Tokens — how the API proves a user is who they say they are |
| **Argon2id** | Password hashing — passwords are never stored as plain text |

---

## How to Run Locally

### Prerequisites

- Node.js 20+ installed
- Docker Desktop running
- The database container is up (`npm run docker:up` from the root)

### Steps

```bash
# 1. From the root of the project, start the database
npm run docker:up

# 2. Set up environment variables (only needed once)
cp apps/api/.env.example apps/api/.env

# 3. Create the database tables
npm run db:migrate

# 4. Fill with test data
npm run db:seed

# 5. Start only the API (in watch mode — restarts on file changes)
npm run dev:api
```

The API will be available at `http://localhost:4001/api/v1`.

To run all apps at once (recommended):

```bash
npm run dev
```

---

## Environment Variables

Copy `apps/api/.env.example` to `apps/api/.env` and configure these variables:

### Server Settings

| Variable | Example | Plain English Explanation |
|----------|---------|--------------------------|
| `NODE_ENV` | `development` | Switches between dev and production behavior. Use `development` locally. |
| `PORT` | `4001` | The port number the API listens on. |
| `API_PREFIX` | `api/v1` | The URL prefix for all endpoints. Every URL starts with `/api/v1/`. |
| `API_URL` | `http://localhost:4001` | The full URL of this API (used to build callback URLs). |
| `WEB_URL` | `http://localhost:3000` | The URL of the LMS web app (used in email links). |
| `CORS_ORIGINS` | `http://localhost:3000,http://localhost:3001` | Which websites are allowed to call this API. Multiple origins separated by commas. |

### Database

| Variable | Example | Explanation |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://testcraft:testcraft@localhost:5433/testcraft?schema=public` | Full connection string to PostgreSQL. Format: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE` |

Note: Port `5433` (not the default `5432`) is used to avoid conflicts with other local PostgreSQL installations.

### Authentication (JWT)

| Variable | Example | Explanation |
|----------|---------|-------------|
| `JWT_ACCESS_SECRET` | `dev-access-secret-change-me` | Secret key used to sign access tokens. **Must be changed in production.** Generate with: `openssl rand -base64 48` |
| `JWT_ACCESS_TTL` | `15m` | How long an access token stays valid. `15m` = 15 minutes. After this, the user's browser automatically gets a new one using the refresh token. |
| `JWT_REFRESH_SECRET` | `dev-refresh-secret-change-me` | Secret key for refresh tokens. Must be **different** from the access secret. |
| `JWT_REFRESH_TTL` | `30d` | How long a refresh token stays valid. `30d` = 30 days. After this, the user must log in again. |

### Google OAuth (Optional)

| Variable | Explanation |
|----------|-------------|
| `GOOGLE_CLIENT_ID` | Google OAuth app client ID. Leave empty to disable Google login. |
| `GOOGLE_CLIENT_SECRET` | Google OAuth app secret. Leave empty to disable Google login. |

### File Storage

| Variable | Example | Explanation |
|----------|---------|-------------|
| `STORAGE_DRIVER` | `local` | Where to store uploaded files. `local` = on this server's disk. `s3` = AWS S3 cloud storage. |
| `STORAGE_LOCAL_DIR` | `uploads` | Folder name for local file storage. |
| `S3_BUCKET` | `testcraft-assets` | AWS S3 bucket name (only needed when `STORAGE_DRIVER=s3`). |
| `S3_REGION` | `ap-southeast-1` | AWS region for S3 (Singapore = `ap-southeast-1`). |
| `AWS_ACCESS_KEY_ID` | — | AWS credentials for S3 access. |
| `AWS_SECRET_ACCESS_KEY` | — | AWS credentials for S3 access. |

### Payments (Midtrans)

| Variable | Explanation |
|----------|-------------|
| `MIDTRANS_SERVER_KEY` | Server-side key from your Midtrans dashboard. Used to create payment charges. |
| `MIDTRANS_CLIENT_KEY` | Client-side key (safe to expose in browser). Used to initialize the payment widget. |
| `XENDIT_SECRET_KEY` | Optional: Xendit payment gateway secret key. |
| `STRIPE_SECRET_KEY` | Optional: Stripe payment gateway secret key. |

### Email

| Variable | Example | Explanation |
|----------|---------|-------------|
| `RESEND_API_KEY` | `re_xxxxx` | API key from Resend.com for sending transactional emails. |
| `EMAIL_FROM` | `"TestCraft <no-reply@testcraft.id>"` | The sender name and address that appears in emails. Must be quoted if it contains `#`. |

### Seed Data

| Variable | Example | Explanation |
|----------|---------|-------------|
| `SEED_ADMIN_EMAIL` | `admin@testcraft.id` | Email for the admin account created by `npm run db:seed`. |
| `SEED_ADMIN_PASSWORD` | `"Admin#12345"` | Password for the admin account. **Must be quoted** because `#` is treated as a comment by dotenv. |

---

## API Endpoints

All endpoints are prefixed with `/api/v1`. Authentication is required unless marked **[public]**.

The interactive API documentation (Swagger UI) is available at `http://localhost:4001/docs` when running locally.

### Auth

| Method | Endpoint | Who Can Use | What It Does |
|--------|----------|-------------|--------------|
| `POST` | `/auth/register` | [public] | Create a new student account |
| `POST` | `/auth/login` | [public] | Log in with email and password; returns access + refresh tokens |
| `POST` | `/auth/refresh` | [public] | Exchange a refresh token for a new access token |
| `POST` | `/auth/logout` | Any logged-in user | Invalidate the current session (or all sessions) |
| `GET` | `/auth/me` | Any logged-in user | Get the current user's profile and role |

### Users

| Method | Endpoint | Who Can Use | What It Does |
|--------|----------|-------------|--------------|
| `GET` | `/users` | Admin | List all users |
| `PATCH` | `/users/me` | Any logged-in user | Update own profile (name, bio, avatar) |
| `PATCH` | `/users/{id}` | Admin | Change a user's role or active status |

### Courses

| Method | Endpoint | Who Can Use | What It Does |
|--------|----------|-------------|--------------|
| `GET` | `/courses` | [public] | List all published courses (catalog) |
| `GET` | `/courses/{slug}` | [public] | Get course details and curriculum |
| `POST` | `/courses` | Admin | Create a new course |
| `PATCH` | `/courses/{id}` | Admin | Update course details |
| `DELETE` | `/courses/{id}` | Admin | Archive (soft-delete) a course |
| `PATCH` | `/courses/{id}/pricing` | Admin | Update price for one course |
| `PATCH` | `/courses/pricing/bulk` | Admin | Update prices for multiple courses at once |
| `POST` | `/courses/{id}/refresh-stats` | Admin | Recalculate course rating and student count |

### Enrollments

| Method | Endpoint | Who Can Use | What It Does |
|--------|----------|-------------|--------------|
| `POST` | `/enrollments` | Student | Enroll in a course |
| `GET` | `/enrollments/me` | Student | Get my enrolled courses and progress |
| `POST` | `/enrollments/lessons/{lessonId}/progress` | Student | Mark a lesson as completed |
| `GET` | `/enrollments/me/assignments` | Student | Get my assignments and submission status |
| `POST` | `/enrollments/assignments/{assignmentId}/submit` | Student | Submit an assignment |

### Payments

| Method | Endpoint | Who Can Use | What It Does |
|--------|----------|-------------|--------------|
| `POST` | `/payments/checkout` | Student | Create a payment invoice to buy a course |
| `GET` | `/payments/me` | Student | My payment history |
| `GET` | `/payments` | Admin | All transactions (admin view) |
| `POST` | `/payments/webhook/midtrans` | [public - Midtrans only] | Webhook called by Midtrans when payment succeeds |
| `POST` | `/payments/simulate-paid` | Admin / QA | Mark an invoice as paid (development/testing only) |

### Instructor Workspace

| Method | Endpoint | Who Can Use | What It Does |
|--------|----------|-------------|--------------|
| `GET` | `/instructor/courses` | Instructor | My courses |
| `GET` | `/instructor/submissions` | Instructor | Queue of assignment submissions to grade |
| `PATCH` | `/instructor/submissions/{id}/grade` | Instructor | Grade a student submission |
| `GET` | `/instructor/payouts` | Instructor | My earnings summary |

### Certificates

| Method | Endpoint | Who Can Use | What It Does |
|--------|----------|-------------|--------------|
| `GET` | `/certificates/me` | Student | My earned certificates |
| `GET` | `/certificates/verify` | [public] | Verify a certificate by number |

### Notifications

| Method | Endpoint | Who Can Use | What It Does |
|--------|----------|-------------|--------------|
| `GET` | `/notifications` | Any logged-in user | Get my 50 most recent notifications |
| `PATCH` | `/notifications/{id}/read` | Any logged-in user | Mark one notification as read |
| `PATCH` | `/notifications/read-all` | Any logged-in user | Mark all notifications as read |

### CMS (Admin Only)

All `/cms/*` endpoints require Admin role.

| Method | Endpoint | What It Does |
|--------|----------|--------------|
| `GET/POST` | `/cms/pages` | List or create CMS pages |
| `PATCH/DELETE` | `/cms/pages/{id}` | Update or delete a page |
| `POST` | `/cms/pages/{id}/publish` | Publish a draft page |
| `GET/POST` | `/cms/banners` | List or create announcement banners |
| `GET/POST` | `/cms/testimonials` | List or create testimonials |
| `GET/POST` | `/cms/faqs` | List or create FAQ entries |
| `GET/POST` | `/cms/coupons` | List or create discount coupons |
| `GET/PATCH` | `/cms/settings` | Read or update site settings |
| `GET/POST` | `/cms/assignments` | Manage course assignments |

### Public Content

| Method | Endpoint | What It Does |
|--------|----------|--------------|
| `GET` | `/content/pages/{slug}` | Get a published page with content blocks |
| `GET` | `/content/banners` | Active banners |
| `GET` | `/content/settings` | Site branding and settings |
| `GET` | `/content/testimonials` | Published testimonials |
| `GET` | `/content/faqs` | Published FAQs |

### Analytics

| Method | Endpoint | Who Can Use | What It Does |
|--------|----------|-------------|--------------|
| `GET` | `/analytics/overview` | Admin | KPI summary: users, revenue, enrollments |
| `GET` | `/analytics/revenue-by-month` | Admin | Revenue data for the last 12 months |
| `GET` | `/analytics/top-courses` | Admin | Top 10 courses by enrollment |

### Health

| Method | Endpoint | Who Can Use | What It Does |
|--------|----------|-------------|--------------|
| `GET` | `/health` | [public] | Returns `{"status":"ok"}` if the API and database are up |

---

## Database: PostgreSQL + Prisma

### What Is PostgreSQL?

PostgreSQL is a relational database — think of it as a very sophisticated spreadsheet. It stores all the data for TestCraft: user accounts, courses, enrollments, payments, and everything else. The data is organized into tables (like "User", "Course", "Payment"), and rows within those tables are linked together with relationships.

### What Is Prisma?

Prisma is an ORM (Object-Relational Mapping) tool. It acts as a translator between the TypeScript code in the API and the PostgreSQL database. Instead of writing raw SQL queries, developers write TypeScript, and Prisma converts it to the right SQL automatically.

The schema is defined in `apps/api/prisma/schema.prisma`. This file is the single source of truth for the database structure.

### How to View the Database

Run Prisma Studio — a web-based database browser:

```bash
# From the root of the project
npm run db:studio
```

Then open http://localhost:5555 in your browser. You will see all tables and can browse, filter, and even edit data directly.

### How to Run Migrations

A migration is how you apply changes to the database schema (e.g., adding a new column):

```bash
# Development: creates a new migration file and applies it
npm run db:migrate

# Production: applies existing migration files (NEVER creates new ones)
npm run db:deploy --workspace @testcraft/api
```

### How to Add a New Field to a Model

1. Open `apps/api/prisma/schema.prisma`
2. Find the model you want to change (e.g., `model User`)
3. Add your new field:
   ```prisma
   model User {
     id    String @id @default(cuid())
     email String @unique
     name  String
     # Add your new field here:
     linkedinUrl String?   # The ? means it's optional
   }
   ```
4. Save the file
5. Run `npm run db:migrate` to apply the change
6. Run `npm run db:generate` to update the TypeScript client

### How to Seed Test Data

Seeding populates the database with realistic test data (users, courses, etc.):

```bash
npm run db:seed
```

This creates:
- Admin account: admin@testcraft.id / Admin#12345
- Student account: student@testcraft.id / Student#12345
- Instructor account: instructor@testcraft.id / Instructor#12345
- Sample courses and categories

---

## How Authentication Works

TestCraft uses a two-token authentication system. Understanding this helps you write better tests.

### The Two Tokens

1. **Access Token** (expires in 15 minutes): This is included in every API request as a header: `Authorization: Bearer <token>`. It proves who you are. Because it expires quickly, a stolen token is only useful for a short time.

2. **Refresh Token** (expires in 30 days): This is used only to get a new access token when the old one expires. It is stored more securely than the access token.

### Login Flow

```
User enters email + password
    ↓
POST /auth/login
    ↓
API verifies password (Argon2id hash comparison)
    ↓
API issues: access token (15min) + refresh token (30 days)
    ↓
Browser stores tokens in localStorage
    ↓
Every API request includes: Authorization: Bearer <accessToken>
    ↓
When access token expires, browser automatically:
    → POST /auth/refresh with the refresh token
    → Gets new access token + new refresh token
    → Old refresh token is invalidated (rotation)
```

### Token Rotation

When you use a refresh token, it is immediately invalidated and a new one is issued. This means if a refresh token is stolen, the attacker can only use it once before it becomes invalid.

### Role-Based Access

Every user has one of these roles:
- `SUPER_ADMIN` / `ADMIN` — can do everything
- `INSTRUCTOR` — can manage their own courses and grade assignments
- `STUDENT` — can browse, enroll, and learn
- `CORPORATE_ADMIN` — can manage corporate seats and track employee progress

The role is included in the JWT token payload, so the API can enforce permissions on every request without a database query.

---

## How Payments Work (Midtrans)

### Payment Flow

```
Student clicks "Beli Kursus" (Buy Course)
    ↓
POST /payments/checkout
    → API creates a Payment record (status: PENDING)
    → API calls Midtrans to create a payment invoice
    → Midtrans returns a payment URL (snap token)
    ↓
Student is redirected to Midtrans payment page
    ↓
Student completes payment (bank transfer, credit card, etc.)
    ↓
Midtrans sends a webhook notification to:
    POST /payments/webhook/midtrans
    ↓
API receives the webhook:
    → Verifies the notification is genuine (signature check)
    → Updates Payment record (status: PAID)
    → Creates Enrollment record
    → Sends confirmation email to student
    ↓
Student now has access to the course
```

### For QA Testing: Simulate a Payment

Instead of going through the real Midtrans payment flow in testing, you can instantly mark a payment as paid:

```bash
curl -X POST http://localhost:4001/api/v1/payments/simulate-paid \
  -H "Authorization: Bearer <admin-token>" \
  -H "Content-Type: application/json" \
  -d '{"orderId": "TC-20260101-ABCD"}'
```

This endpoint is only available in development mode.

---

## How to Add a New Endpoint (Step-by-Step)

This is a simplified guide. Ask a developer to help if you get stuck.

**Example: Adding a `GET /users/{id}/stats` endpoint**

### Step 1 — Add the Route Handler

Open `apps/api/src/modules/users/users.controller.ts` and add:

```typescript
@Get(':id/stats')
@Roles(Role.ADMIN)
async getStats(@Param('id') id: string) {
  return this.usersService.getStats(id);
}
```

### Step 2 — Add the Business Logic

Open `apps/api/src/modules/users/users.service.ts` and add:

```typescript
async getStats(userId: string) {
  const enrollments = await this.prisma.enrollment.count({
    where: { userId }
  });
  return { userId, enrollments };
}
```

### Step 3 — Test Your Endpoint

```bash
# Get a token first
curl -X POST http://localhost:4001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@testcraft.id","password":"Admin#12345"}'

# Copy the accessToken from the response, then:
curl http://localhost:4001/api/v1/users/SOME_USER_ID/stats \
  -H "Authorization: Bearer <paste-token-here>"
```

### Step 4 — Write an E2E Test

See [tests/e2e/README.md](../../tests/e2e/README.md) for how to add a test.

---

## Troubleshooting Common Errors

### "Cannot connect to database"

```
Error: Can't reach database server at localhost:5433
```

**Fix:** The database Docker container is not running.

```bash
npm run docker:up
# Wait 10 seconds, then try again
```

### "Invalid token" or 401 Unauthorized

```
{"statusCode":401,"message":"Unauthorized"}
```

**Fix:** Your access token has expired or is missing.

1. Log in again to get a fresh token.
2. Make sure you are including `Authorization: Bearer <token>` in your request header.

### "Forbidden" or 403

```
{"statusCode":403,"message":"Forbidden resource"}
```

**Fix:** Your user account does not have the required role. For example, trying to call an Admin endpoint with a Student account.

### "Validation failed"

```
{"statusCode":400,"message":"Validation failed","errors":[...]}
```

**Fix:** The request body is missing required fields or has the wrong format. Check the `errors` array for specific field-level messages.

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::4001
```

**Fix:** Something else is already running on port 4001.

```bash
# Find what is using the port
lsof -i :4001

# Kill the process (replace XXXX with the PID from above)
kill -9 XXXX
```

### Migration Errors

```
Error: Migration failed to apply cleanly
```

**Fix:**

```bash
# Reset the database (WARNING: deletes all data)
cd apps/api
npx prisma migrate reset

# Then re-seed
npm run db:seed
```

### "Cannot find module" After Schema Change

```
PrismaClientKnownRequestError: Unknown field 'newField' for model 'User'
```

**Fix:** Regenerate the Prisma client after any schema change.

```bash
npm run db:generate
```
