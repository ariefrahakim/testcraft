# TestCraft Indonesia — App Profile

## Application

TestCraft Indonesia is a professional QA training platform built as a Next.js + NestJS monorepo.
It has two web frontends:

- **LMS** (`http://localhost:3000`) — student, instructor, and admin portal
- **Marketing** (`http://localhost:3001`) — public landing page and lead capture

## Key flows to test

1. **Auth** — register → login → logout → forgot-password → session persistence
2. **Student** — browse catalog → enroll in free course → start lesson → track progress → earn certificate
3. **Instructor** — create course → add lessons → upload material → grade assignments
4. **Admin** — CMS pages, course management, user management, analytics overview
5. **Payments** — checkout → Midtrans webhook → enrollment created → receipt emailed
6. **Marketing** — hero section → lead capture form → navigate to LMS login

## Auth

- Login endpoint: `POST /api/v1/auth/login` — body: `{ email, password }`
- Response: `{ accessToken, refreshToken, expiresIn }`
- LMS login page path: `/login`
- LMS register page path: `/register`
- Auth context: `apps/web/src/lib/auth-context.tsx`

## Role-based redirect after login

| Role | Home path |
|---|---|
| `SUPER_ADMIN` | `/admin` |
| `ADMIN` | `/admin` |
| `INSTRUCTOR` | `/instructor` |
| `STUDENT` | `/dashboard` |

## Test accounts (seeded in DB)

| Role | Email | Password |
|---|---|---|
| Admin | `admin@testcraft.id` | `Admin#12345` |
| Student | `student@testcraft.id` | `Student#12345` |
| Instructor | `instructor@testcraft.id` | `Instructor#12345` |

## Locator strategy (priority order)

1. `data-testid` attributes
2. ARIA roles + accessible name (`getByRole`)
3. Semantic HTML (`getByLabel`, button text, heading text)
4. CSS class (last resort — avoid)

## Important routes

### LMS (port 3000)
| Path | Description |
|---|---|
| `/login` | Login page |
| `/register` | Student registration |
| `/catalog` | Public course catalog |
| `/courses/[slug]` | Course detail page |
| `/dashboard` | Student dashboard (enrolled courses + progress) |
| `/learn/[slug]` | Lesson viewer |
| `/admin` | Admin overview |
| `/admin/courses` | Course CMS |
| `/instructor` | Instructor portal |

### Marketing (port 3001)
| Path | Description |
|---|---|
| `/` | Homepage (hero, programs, testimonials) |
| `/privacy` | Privacy policy |
| `/terms` | Terms of service |

### API (port 4001)
| Endpoint | Description |
|---|---|
| `GET /api/v1/health` | Liveness check |
| `POST /api/v1/auth/login` | Login — returns JWT |
| `POST /api/v1/auth/register` | Register new student |
| `GET /api/v1/auth/me` | Current user profile |
| `GET /api/v1/courses` | Public course list |
| `GET /api/v1/categories` | Category list |
| `POST /api/v1/enrollments` | Enroll in a course |
| `GET /api/v1/enrollments/me` | My enrollments |
| `POST /api/v1/cms/courses` | Create course (admin) |
| `POST /api/v1/cms/courses/:id/publish` | Publish course (admin) |

## Stack

- **Frontend**: Next.js 14 App Router, Tailwind CSS, TypeScript
- **Backend**: NestJS 10, Prisma ORM, PostgreSQL
- **Auth**: JWT (access + refresh rotation), Google OAuth
- **Payments**: Midtrans (webhook-based enrollment)
- **Tests**: Playwright 1.48, TypeScript

## E2E Test location

```
tests/e2e/
├── specs/          # Test specs by feature
├── pages/          # Page Object Models
├── fixtures/       # Test data & auth fixtures
├── utils/          # API client & helpers
└── playwright.config.ts
```
