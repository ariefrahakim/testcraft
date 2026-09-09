# TestCraft Indonesia — LMS Monorepo

> **Learn. Build. Automate.** — Quality Software. Confident Delivery.

TestCraft Indonesia is an IT training company specializing in Software Testing, QA Automation, API Testing, Performance Testing, AI for QA, and DevOps for Test Automation. This monorepo contains the complete platform: a marketing website, a Learning Management System (LMS), and the backend API that powers both.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USERS / BROWSERS                             │
└───────┬──────────────────────────┬──────────────────────────────────┘
        │                          │
        ▼                          ▼
┌───────────────┐        ┌─────────────────────┐
│  Marketing    │        │   LMS Web App        │
│  (Next.js)    │        │   (Next.js 14)       │
│  Port 3001    │        │   Port 3000          │
│               │        │                     │
│  Landing page │        │  Student portal     │
│  Lead form    │        │  Instructor tools   │
│  SEO pages    │        │  Admin dashboard    │
└───────┬───────┘        └──────────┬──────────┘
        │                           │
        │         REST API          │
        └──────────┬────────────────┘
                   │
                   ▼
        ┌──────────────────┐
        │   NestJS API      │
        │   Port 4001       │
        │                  │
        │  Auth / JWT      │
        │  Courses         │
        │  Enrollments     │
        │  Payments        │
        │  CMS             │
        │  Certificates    │
        └────────┬─────────┘
                 │ Prisma ORM
                 │
        ┌────────▼─────────┐
        │   PostgreSQL      │
        │   Port 5433       │
        │   (via Docker)    │
        └──────────────────┘
```

---

## Quick Start

Copy and paste these commands one at a time into your terminal.

### Step 1 — Prerequisites

Make sure you have these installed first:
- **Node.js 20+**: https://nodejs.org/
- **Docker Desktop**: https://www.docker.com/products/docker-desktop/
- **Git**: https://git-scm.com/

### Step 2 — Clone and Install

```bash
# Clone the repository
git clone <repo-url> testcraft
cd testcraft

# Install all dependencies for all apps at once
npm install
```

### Step 3 — Start the Database

```bash
# Start PostgreSQL (and Redis) in Docker — runs in the background
npm run docker:up
```

Wait about 10 seconds for Docker to start, then verify it is running:

```bash
docker ps
# You should see testcraft-db and testcraft-redis listed
```

### Step 4 — Configure Environment Variables

```bash
# Copy the example environment file for the API
cp apps/api/.env.example apps/api/.env
```

For local development, the default values in `.env` work out of the box. You do not need to change anything to get started.

### Step 5 — Set Up the Database

```bash
# Create all database tables using the schema
npm run db:migrate

# Fill the database with test data (admin, student, instructor accounts)
npm run db:seed
```

### Step 6 — Start All Apps

```bash
# Start the API, LMS, and marketing site simultaneously
npm run dev
```

All three apps start at the same time. Give them about 30 seconds to compile.

### Step 7 — Verify Everything Works

Open these URLs in your browser:

| App | URL | Login |
|-----|-----|-------|
| LMS (student/admin portal) | http://localhost:3000 | admin@testcraft.id / Admin#12345 |
| Marketing site | http://localhost:3001 | (no login needed) |
| API documentation | http://localhost:4001/docs | (no login needed) |

---

## Available Scripts

All scripts are run from the **root folder** of the project.

### Development

| Script | What it does |
|--------|--------------|
| `npm run dev` | Starts all three apps at the same time (API + LMS + Marketing) |
| `npm run dev:api` | Starts only the backend API on port 4001 |
| `npm run dev:web` | Starts only the LMS frontend on port 3000 |
| `npm run dev:marketing` | Starts only the marketing site on port 3001 |

### Database

| Script | What it does |
|--------|--------------|
| `npm run db:migrate` | Creates or updates database tables based on the schema (for development) |
| `npm run db:seed` | Fills the database with test users, courses, and sample data |
| `npm run db:studio` | Opens a visual browser-based database viewer at http://localhost:5555 |
| `npm run db:generate` | Regenerates the Prisma client after schema changes |

### Docker

| Script | What it does |
|--------|--------------|
| `npm run docker:up` | Starts the database and Redis containers in the background |
| `npm run docker:down` | Stops and removes all Docker containers |
| `npm run docker:prod` | Starts all services including apps using production Docker images |

### Build and Quality

| Script | What it does |
|--------|--------------|
| `npm run build` | Builds all apps for production |
| `npm run lint` | Checks code style across all apps |
| `npm run test` | Runs unit tests for all apps |
| `npm run typecheck` | Checks TypeScript types without building |

---

## App URLs

| Application | Local URL | Purpose |
|-------------|-----------|---------|
| LMS Web App | http://localhost:3000 | Student learning, instructor tools, admin dashboard |
| Marketing Site | http://localhost:3001 | Public landing page, lead capture form |
| API | http://localhost:4001/api/v1 | Backend REST API |
| API Docs (Swagger) | http://localhost:4001/docs | Interactive API documentation |
| Database Viewer | http://localhost:5555 | Visual database browser (when studio is running) |
| PostgreSQL | localhost:5433 | Direct database connection |

---

## Directory Structure

```
testcraft/                          ← Root of the monorepo
├── apps/
│   ├── api/                        ← NestJS backend API (the brain)
│   │   ├── src/
│   │   │   ├── modules/            ← Feature modules (auth, courses, payments, etc.)
│   │   │   ├── common/             ← Shared guards, filters, decorators
│   │   │   ├── config/             ← App configuration
│   │   │   └── prisma/             ← Database client service
│   │   └── prisma/
│   │       ├── schema.prisma       ← Database schema (defines all tables)
│   │       ├── migrations/         ← Database migration history
│   │       └── seed.ts             ← Script to populate test data
│   │
│   ├── web/                        ← LMS frontend (student/instructor/admin)
│   │   └── src/
│   │       ├── app/                ← Next.js pages (routes)
│   │       ├── components/         ← Reusable UI components
│   │       └── lib/                ← API client, auth context, utilities
│   │
│   └── marketing/                  ← Marketing/landing page
│       └── src/
│           ├── app/                ← Pages (home, privacy, terms)
│           └── components/         ← Marketing-specific components
│
├── packages/
│   └── shared/                     ← TypeScript types shared between apps
│       └── src/
│           ├── dtos/               ← Data transfer objects (API contracts)
│           └── enums.ts            ← Shared enumerations (Role, Status, etc.)
│
├── tests/
│   └── e2e/                        ← Playwright end-to-end tests
│       ├── specs/                  ← Test files organized by feature
│       ├── pages/                  ← Page Object Models
│       ├── fixtures/               ← Test data and helpers
│       └── playwright.config.ts    ← Playwright configuration
│
├── docs/                           ← Extended documentation
│   ├── ARCHITECTURE.md             ← Technical architecture decisions
│   ├── API-ENDPOINTS.md            ← Full API endpoint reference
│   ├── CMS.md                      ← CMS usage guide
│   ├── DATABASE.md                 ← Database documentation
│   ├── DEPLOYMENT.md               ← Deployment guide
│   └── QUICKSTART.md               ← Beginner-friendly setup guide
│
├── docker/                         ← Docker configuration files
├── docker-compose.yml              ← Local development containers
├── docker-compose.prod.yml         ← Production containers
├── package.json                    ← Root package.json with workspace scripts
└── README.md                       ← This file
```

---

## Test Accounts (After Seeding)

After running `npm run db:seed`, these accounts are available:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@testcraft.id | Admin#12345 |
| Student | student@testcraft.id | Student#12345 |
| Instructor | instructor@testcraft.id | Instructor#12345 |

---

## How to Run Tests

### End-to-End (E2E) Tests

E2E tests use Playwright to simulate a real user clicking through the app in a browser.

```bash
# Navigate to the e2e test folder
cd tests/e2e

# Install dependencies (first time only)
npm install

# Install the test browser (first time only)
npm run install:browsers

# Copy and configure environment file
cp .env.example .env.test
# Edit .env.test if needed (defaults work for local dev)

# Run all tests
npm test

# Run with a visible browser (good for debugging)
npm run test:headed

# Open interactive test UI
npm run test:ui

# View the test results report
npm run test:report
```

For detailed guidance, see [tests/e2e/README.md](tests/e2e/README.md).

### API Unit Tests

```bash
# Run unit tests for the API
npm run test --workspace @testcraft/api
```

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| LMS Frontend | Next.js 14, React 18, TypeScript | Student/instructor/admin portal |
| Marketing Site | Next.js, TypeScript | SEO-optimized public landing page |
| Backend API | NestJS, TypeScript | REST API, business logic |
| Database | PostgreSQL 16 | Primary data store |
| ORM | Prisma | Type-safe database queries |
| Authentication | JWT (access + refresh tokens) | Session management |
| Caching | Redis | Session/token storage |
| Styling | Tailwind CSS, Framer Motion | UI styling and animations |
| Payments | Midtrans | Indonesian payment gateway |
| Email | Resend | Transactional emails |
| Storage | Local / AWS S3 | File and video uploads |
| Containerization | Docker, Docker Compose | Local dev and production |
| E2E Testing | Playwright | Browser automation tests |
| Test Reporting | Qase | Test case management and reporting |

---

## More Documentation

| Document | Description |
|----------|-------------|
| [docs/QUICKSTART.md](docs/QUICKSTART.md) | Step-by-step setup guide for QA engineers |
| [docs/DATABASE.md](docs/DATABASE.md) | Database schema, queries, and management |
| [docs/CMS.md](docs/CMS.md) | How to manage content (pages, banners, settings) |
| [docs/API-ENDPOINTS.md](docs/API-ENDPOINTS.md) | Complete API endpoint reference |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Technical architecture decisions |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | How to deploy to production |
| [apps/api/README.md](apps/api/README.md) | Backend API documentation |
| [apps/web/README.md](apps/web/README.md) | LMS frontend documentation |
| [apps/marketing/README.md](apps/marketing/README.md) | Marketing site documentation |
| [tests/e2e/README.md](tests/e2e/README.md) | E2E testing guide |

---

## Getting Help

- **WhatsApp:** +62 823-9556-8743
- **Email:** testcraftindonesia@gmail.com
