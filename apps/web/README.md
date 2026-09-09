# TestCraft Indonesia — LMS Web App

> **Learn. Build. Automate.** — Quality Software. Confident Delivery.

This is the Learning Management System (LMS) frontend for TestCraft Indonesia. It is a Next.js 14 application that serves as the student learning portal, instructor workspace, and admin dashboard.

**Contact:** WhatsApp [+62 823-9556-8743](https://wa.me/6282395568743) · testcraftindonesia@gmail.com

---

## What This App Does

The LMS web app is what users see and interact with after they sign up. It includes:

- **Student Portal**: Browse courses, enroll, watch lessons, track progress, earn certificates
- **Instructor Workspace**: Manage courses, view student submissions, grade assignments
- **Admin Dashboard**: Manage users, courses, content, analytics, and site settings
- **CMS Admin**: Edit pages, banners, testimonials, FAQ, and site settings

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | Next.js 14 (App Router) | Page routing, server-side rendering |
| UI Library | React 18 | Component-based UI |
| Language | TypeScript | Type-safe code |
| Styling | Tailwind CSS | Utility-first CSS framework |
| Animation | Framer Motion | Smooth UI transitions |
| Auth | JWT (access + refresh tokens) | Session management |

---

## How to Run Locally

### Prerequisites

- Node.js 20+ installed
- The API must be running (`npm run dev:api` from the root)

### Steps

```bash
# From the root of the project
npm run dev:web

# Or to start all apps at once (recommended):
npm run dev
```

The LMS will be available at **http://localhost:3000**.

### First Time Setup

```bash
# 1. Install dependencies (from root)
npm install

# 2. Start the database
npm run docker:up

# 3. Configure the API (only needed once)
cp apps/api/.env.example apps/api/.env

# 4. Set up the database
npm run db:migrate && npm run db:seed

# 5. Copy the web environment file
cp apps/web/.env.example apps/web/.env.local

# 6. Start everything
npm run dev
```

---

## Environment Variables

Create a file `apps/web/.env.local` (this file is gitignored — never commit it):

```bash
cp apps/web/.env.example apps/web/.env.local
```

| Variable | Default Value | Explanation |
|----------|---------------|-------------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:4001/api/v1` | The API URL that the browser uses to make requests. `NEXT_PUBLIC_` means it is visible in the browser. |
| `API_INTERNAL_URL` | `http://localhost:4001/api/v1` | The API URL used by server-side code (Next.js server components). In Docker, this points to the API container's internal address. |
| `NEXT_PUBLIC_SITE_URL` | `http://localhost:3000` | The base URL of this app. Used for generating absolute URLs (e.g., in emails). |
| `NEXT_PUBLIC_GOOGLE_OAUTH_ENABLED` | `false` | Set to `true` to show the "Login with Google" button. Requires `GOOGLE_CLIENT_ID` to be configured in the API. |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | *(empty)* | Google Analytics ID (e.g., `G-XXXXXXXXXX`). Leave empty to disable analytics. |

---

## Pages and URLs

### Public Pages (No Login Required)

| URL | Page | Description |
|-----|------|-------------|
| `/` | Homepage | Course highlights, testimonials, lead form |
| `/catalog` | Course Catalog | Browse all published courses with search and filters |
| `/courses/{slug}` | Course Detail | Course info, curriculum preview, enroll button |
| `/paths` | Learning Paths | Curated learning path recommendations |
| `/pricing` | Pricing | Pricing plans and bundles |
| `/verify` | Certificate Verify | Verify a certificate number |
| `/login` | Login | Email/password login form |
| `/register` | Register | New student account registration |
| `/forgot-password` | Forgot Password | Password reset request |
| `/privacy` | Privacy Policy | Privacy policy page |
| `/terms` | Terms of Service | Terms and conditions page |
| `/about` | About | Company information |
| `/contact` | Contact | Contact form |

### Student Pages (Login Required — STUDENT role)

| URL | Page | Description |
|-----|------|-------------|
| `/dashboard` | Student Dashboard | Progress overview, streaks, badges, leaderboard |
| `/learn/{slug}` | Learning Player | Lesson video/content player with notes and discussion |
| `/notifications` | Notifications | In-app notification inbox |

### Instructor Pages (Login Required — INSTRUCTOR role)

| URL | Page | Description |
|-----|------|-------------|
| `/instructor` | Instructor Dashboard | Course performance, submissions to grade |

### Admin Pages (Login Required — ADMIN or SUPER_ADMIN role)

| URL | Page | Description |
|-----|------|-------------|
| `/admin` | Admin Dashboard | Revenue analytics, user stats, course performance |
| `/admin/users` | User Management | View, search, and manage user accounts and roles |
| `/admin/courses` | Course Management | Create, edit, archive courses |
| `/admin/courses/new` | New Course | Course creation form |
| `/admin/enrollments` | Enrollments | View all student enrollments |
| `/admin/payments` | Payments | View all transactions, payment status |
| `/admin/categories` | Categories | Manage course categories |
| `/admin/pages` | CMS Pages | Manage public website pages |
| `/admin/pages/{slug}` | Page Editor | Edit page content blocks |
| `/admin/banners` | Banners | Manage promotional announcement banners |
| `/admin/testimonials` | Testimonials | Manage student testimonials |
| `/admin/faqs` | FAQ Management | Manage frequently asked questions |
| `/admin/coupons` | Coupons | Create and manage discount coupons |
| `/admin/leads` | Leads | View leads from the marketing site form |
| `/admin/settings` | Site Settings | Company info, social links, tax rates, currencies |

### Corporate Pages (Login Required — CORPORATE_ADMIN role)

| URL | Page | Description |
|-----|------|-------------|
| `/corporate` | Corporate Dashboard | Seat management, employee progress, reports |

---

## Component Structure

```
apps/web/src/
├── app/                        ← Next.js App Router pages
│   ├── layout.tsx              ← Root layout (fonts, providers)
│   ├── page.tsx                ← Homepage
│   ├── admin/                  ← All /admin/* pages
│   ├── catalog/                ← Course catalog
│   ├── courses/[slug]/         ← Course detail pages
│   ├── dashboard/              ← Student dashboard
│   ├── instructor/             ← Instructor workspace
│   ├── learn/[slug]/           ← Learning player
│   └── ...
│
├── components/
│   ├── ui/                     ← Base UI components (Button, Input, Modal, etc.)
│   ├── brand/                  ← Logo and branding components
│   ├── admin/                  ← Admin-specific components (ResourceManager, etc.)
│   ├── workspace/              ← Instructor workspace components
│   └── blocks/                 ← CMS content block renderers
│       └── block-renderer.tsx  ← Renders different block types (HERO, STATS, etc.)
│
├── lib/
│   ├── api.ts                  ← HTTP client for making API calls
│   ├── auth-context.tsx        ← Authentication state management (React Context)
│   ├── use-api.ts              ← React hooks for data fetching
│   ├── format.ts               ← Number and date formatting utilities
│   ├── utils.ts                ← General helper functions
│   └── theme.tsx               ← Dark mode toggle
│
└── types/                      ← TypeScript type definitions
```

---

## How to Add a New Page

### Example: Adding `/admin/reports`

**Step 1 — Create the page file**

Create `apps/web/src/app/admin/reports/page.tsx`:

```tsx
// Tell Next.js this is a client component (has interactivity)
'use client';

import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

// TypeScript type for our data
interface ReportData {
  totalRevenue: number;
  totalStudents: number;
}

export default function ReportsPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch data from the API when the page loads
    apiFetch<ReportData>('/analytics/overview', { auth: true })
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Loading...</p>;
  if (!data) return <p>No data found.</p>;

  return (
    <div>
      <h1>Reports</h1>
      <p>Total Revenue: {data.totalRevenue}</p>
      <p>Total Students: {data.totalStudents}</p>
    </div>
  );
}
```

**Step 2 — Add a link in the admin navigation**

Find the admin sidebar component (likely in `apps/web/src/components/admin/`) and add a link:

```tsx
<a href="/admin/reports">Reports</a>
```

**Step 3 — Test it**

Navigate to `http://localhost:3000/admin/reports` (you must be logged in as admin).

---

## How API Integration Works (`lib/api.ts`)

The `apiFetch` function in `apps/web/src/lib/api.ts` handles all communication with the backend API.

### Basic Usage

```typescript
import { apiFetch } from '@/lib/api';

// GET request (public, no auth needed)
const courses = await apiFetch<Course[]>('/courses');

// GET request with authentication
const myEnrollments = await apiFetch<Enrollment[]>('/enrollments/me', { auth: true });

// POST request with a body
const result = await apiFetch<LoginResponse>('/auth/login', {
  method: 'POST',
  body: { email: 'user@example.com', password: 'password123' },
});

// PATCH request
await apiFetch(`/users/me`, {
  method: 'PATCH',
  auth: true,
  body: { name: 'New Name' },
});
```

### Smart URL Selection

The API client automatically uses the right URL depending on context:
- **In the browser**: uses `NEXT_PUBLIC_API_URL` (e.g., `http://localhost:4001/api/v1`)
- **In server components**: uses `API_INTERNAL_URL` (e.g., `http://api:4001/api/v1` in Docker)

This means you write the same code and it works in both environments.

### Error Handling

If the API returns an error, `apiFetch` throws an `ApiError`:

```typescript
try {
  await apiFetch('/protected-endpoint', { auth: true });
} catch (err) {
  if (err instanceof ApiError) {
    console.log(err.status);   // HTTP status code, e.g., 401
    console.log(err.message);  // Error message from the API
    console.log(err.code);     // Stable error code, e.g., "auth.invalidCredentials"
  }
}
```

---

## How Authentication Works

The `AuthContext` in `apps/web/src/lib/auth-context.tsx` manages the logged-in state across the entire app.

### What AuthContext Provides

```typescript
const {
  user,          // The logged-in user object, or null if not logged in
  loading,       // True while checking if the user is logged in (on page load)
  login,         // Function to log in
  logout,        // Function to log out
  register,      // Function to create a new account
  refreshUser,   // Function to reload the user profile from the API
} = useAuth();
```

### Checking the Current User

```typescript
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>Please log in.</p>;

  return <p>Welcome, {user.name}! Your role is {user.role}.</p>;
}
```

### Redirecting Based on Role

After login, users are automatically redirected based on their role:

| Role | Redirected To |
|------|---------------|
| `SUPER_ADMIN` / `ADMIN` | `/admin` |
| `INSTRUCTOR` | `/instructor` |
| `STUDENT` / `CORPORATE_ADMIN` | `/dashboard` |

### Token Storage

- Access token: stored in `localStorage` with key `tc.accessToken`
- Refresh token: stored in `localStorage` with key `tc.refreshToken`
- Remembered email: stored in `localStorage` with key `tc.rememberedEmail`

Tokens are automatically refreshed in the background. If both tokens expire, the user is redirected to `/login`.

---

## User Roles (RBAC)

| Role | Abbreviation | Can Access |
|------|--------------|------------|
| `SUPER_ADMIN` | Super Admin | Everything, including system settings |
| `ADMIN` | Admin | Users, courses, payments, CMS, analytics |
| `INSTRUCTOR` | Instructor | Own courses, submissions, grading, payouts |
| `STUDENT` | Student | Catalog, enrolled courses, dashboard, certificates |
| `CORPORATE_ADMIN` | Corporate Admin | Seat management, employee progress reports |

---

## Running the App in Production Mode

To build and run the app as it would run in production:

```bash
# Build the app
npm run build --workspace @testcraft/web

# Or use Docker
docker build -f apps/web/Dockerfile -t testcraft-web:local .
docker run -p 3000:3000 testcraft-web:local
```

---

## Brand

- **Primary Blue:** `#2563EB`
- **Navy:** `#0F172A`
- **Light Background:** `#F8FAFC`
- **Green (success):** `#10B981`
- **Body Font:** Inter
- **Display Font:** Poppins
- **Dark mode:** class-based (`dark:`), toggle in navbar
