# TestCraft E2E Test Suite

Playwright-based end-to-end (E2E) and API smoke tests for the TestCraft Indonesia monorepo.

This test suite is written for QA engineers. You do not need to be a developer to add and run tests, but a basic familiarity with JavaScript/TypeScript syntax helps.

---

## What is Playwright?

Playwright is a tool that controls a real web browser (Chrome, Firefox, or Safari) programmatically. It simulates what a real user would do: click buttons, fill forms, navigate pages, and check that the right things appear on screen.

Think of it as a robot that uses the browser exactly like a human would — except it runs at machine speed and can do it hundreds of times without getting tired.

**Why use Playwright?**
- Catches bugs that unit tests miss (real browser behavior)
- Tests the full user journey end-to-end
- Runs automatically in CI/CD pipelines
- Produces screenshots, videos, and traces when tests fail

---

## Quick Start

```bash
# 1. Go to the e2e test folder
cd tests/e2e

# 2. Install dependencies (run once)
npm install

# 3. Install the Chromium browser for Playwright (run once)
npm run install:browsers

# 4. Copy and configure the environment file
cp .env.example .env.test
# For local development, the default values work without editing

# 5. Make sure all apps are running in another terminal:
#    (from the root of the project)
#    npm run dev

# 6. Run all tests
npm test

# 7. Run with a visible browser (great for debugging)
npm run test:headed

# 8. Open the interactive Playwright UI (best for development)
npm run test:ui

# 9. View the HTML report after a run
npm run test:report
```

---

## Environment Setup

Copy `.env.example` to `.env.test` and fill in the values. For local development, the default values work without any changes.

| Variable | Default | Purpose |
|----------|---------|---------|
| `BASE_URL` | `http://localhost:3000` | LMS frontend URL (the web app) |
| `MARKETING_URL` | `http://localhost:3001` | Marketing site URL |
| `API_URL` | `http://localhost:4001/api/v1` | NestJS API base URL |
| `ADMIN_EMAIL` | `admin@testcraft.id` | Admin account (seeded by `npm run db:seed`) |
| `ADMIN_PASSWORD` | `Admin#12345` | Admin password |
| `STUDENT_EMAIL` | `student@testcraft.id` | Student test account |
| `STUDENT_PASSWORD` | `Student#12345` | Student password |
| `INSTRUCTOR_EMAIL` | `instructor@testcraft.id` | Instructor test account |
| `INSTRUCTOR_PASSWORD` | `Instructor#12345` | Instructor password |
| `QASE_TOKEN` | *(Qase API key)* | For uploading test results to Qase |
| `QASE_PROJECT` | `TC` | Qase project code |
| `QASE_RUN_TITLE` | `E2E Test Run` | Title for the Qase test run |
| `HEADLESS` | `true` | `false` to show the browser window during test |
| `SLOW_MO` | `0` | Milliseconds to slow down each action (useful for watching tests) |

> The `global-setup.ts` file validates that all required environment variables are present before any test runs.

---

## Directory Structure

```
tests/e2e/
├── specs/                          ← Test files (what you write)
│   ├── auth/
│   │   ├── auth.setup.ts           ← Logs in and saves browser state (runs first)
│   │   ├── login.spec.ts           ← Login page tests
│   │   └── register.spec.ts        ← Registration tests
│   ├── catalog/
│   │   └── course-catalog.spec.ts  ← Course catalog tests
│   ├── enrollment/
│   │   └── enrollment-flow.spec.ts ← Full enrollment journey tests
│   ├── admin/
│   │   └── course-management.spec.ts ← Admin course management tests
│   ├── marketing/
│   │   └── landing-page.spec.ts    ← Marketing site tests
│   └── api/
│       └── health.spec.ts          ← API health check tests
│
├── pages/                          ← Page Object Models (POM)
│   ├── base.page.ts                ← Common methods (goto, wait for load, etc.)
│   ├── auth.page.ts                ← Login/register page interactions
│   ├── catalog.page.ts             ← Course catalog page interactions
│   ├── course-detail.page.ts       ← Course detail page interactions
│   ├── dashboard.page.ts           ← Student dashboard interactions
│   ├── admin.page.ts               ← Admin panel interactions
│   └── marketing.page.ts           ← Marketing site interactions
│
├── fixtures/                       ← Test data
│   ├── users.ts                    ← Test user data (emails, passwords)
│   ├── courses.ts                  ← Test course data
│   └── auth-fixture.ts             ← Extended test with pre-authenticated pages
│
├── utils/
│   ├── api-client.ts               ← Direct API calls for test setup/teardown
│   └── auth-helpers.ts             ← Session persistence helpers
│
├── results/                        ← Generated output (gitignored)
│   ├── auth-state/                 ← Saved browser login sessions
│   ├── html-report/                ← HTML test report
│   └── results.json                ← JSON test results
│
├── global-setup.ts                 ← Runs before all tests (validates env vars)
├── playwright.config.ts            ← Playwright configuration
├── tsconfig.json                   ← TypeScript config for tests
├── package.json                    ← Test dependencies and scripts
└── .env.example                    ← Example environment variables
```

---

## Page Object Model (POM) — Explained

The Page Object Model is a design pattern that makes tests easier to write and maintain. Here is why it matters and how it works.

### The Problem Without POM

Imagine you have 20 tests that all click the login button. The login button's selector is `[data-testid="login-button"]`. Now the developer renames it to `[data-testid="submit-login"]`. You would have to update all 20 tests.

### The Solution: Page Object Model

Instead, you create one `AuthPage` class that wraps all interactions with the login page. All 20 tests use this class. When the selector changes, you update it in ONE place.

```typescript
// pages/auth.page.ts
export class AuthPage extends BasePage {
  // All selectors for the login page are defined here
  private emailInput = this.page.getByLabel('Email');
  private passwordInput = this.page.getByLabel('Password');
  private loginButton = this.page.getByRole('button', { name: /masuk|login/i });

  // All actions are methods on this class
  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }
}
```

```typescript
// In your test file — clean and readable
test('student can log in', async ({ page }) => {
  const auth = new AuthPage(page);
  await auth.goto('/login');
  await auth.login('student@testcraft.id', 'Student#12345');
  // Test continues...
});
```

**Benefits:**
- Tests are shorter and more readable
- Selector changes only need to be made in one place
- Encourages reuse — multiple tests share the same page objects

---

## Step-by-Step Guide: How to Add a New Test

This section explains exactly how to add a test from scratch.

### Step 1 — Decide What to Test

Write down the user scenario in plain English first. For example:
> "As a student, when I open the dashboard, I should see a 'My Courses' section."

### Step 2 — Create the Test File

Tests are organized by feature. Create a new file in the appropriate folder.

If the folder does not exist yet, create it:

```
tests/e2e/specs/dashboard/student-dashboard.spec.ts
```

### Step 3 — Write the Test

Here is a complete, working example:

```typescript
// tests/e2e/specs/dashboard/student-dashboard.spec.ts

import { test, expect } from '@playwright/test';
import { StudentDashboardPage } from '../../pages/dashboard.page';

// Tell Playwright to use a pre-authenticated student session
// (This avoids logging in from scratch in every test)
import { studentStatePath } from '../../fixtures/auth-fixture';
test.use({ storageState: studentStatePath });

// Group related tests together
test.describe('Student Dashboard', () => {

  test('should show My Courses section', async ({ page }) => {
    // 1. Create a page object for the dashboard
    const dashboard = new StudentDashboardPage(page);

    // 2. Navigate to the dashboard
    await dashboard.goto();

    // 3. Check that the expected content is visible
    await expect(page.getByRole('heading', { name: /kursus saya|my courses/i }))
      .toBeVisible();
  });

  test('should show student name in header', async ({ page }) => {
    const dashboard = new StudentDashboardPage(page);
    await dashboard.goto();

    // The student name from .env.test should appear somewhere
    await expect(page.getByText('Student')).toBeVisible();
  });

  test('should navigate to a course when clicked', async ({ page }) => {
    const dashboard = new StudentDashboardPage(page);
    await dashboard.goto();

    // Click the first course card
    await page.locator('[data-testid="course-card"]').first().click();

    // Check that we navigated to a course page
    await expect(page).toHaveURL(/\/courses\//);
  });
});
```

### Step 4 — Run Your New Test

```bash
# Run only your new test file
npx playwright test specs/dashboard/student-dashboard.spec.ts

# Run only a specific test by name
npx playwright test --grep "should show My Courses section"

# Run with a visible browser to watch what happens
npx playwright test specs/dashboard/student-dashboard.spec.ts --headed
```

### Step 5 — Debug If It Fails

If the test fails, check these things:

1. **Is the app running?** Open http://localhost:3000 in your browser and verify.
2. **Is the database seeded?** Run `npm run db:seed` from the root.
3. **Take a screenshot manually** during the test:
   ```typescript
   await page.screenshot({ path: 'debug-screenshot.png' });
   ```
4. **Slow down the test** to watch what happens:
   ```typescript
   test.slow(); // Makes Playwright 3x slower
   ```
5. **Open Playwright UI** for interactive debugging:
   ```bash
   npm run test:ui
   ```

---

## Pre-Authenticated Tests (storageState)

Logging in before every single test would be slow. Instead, Playwright saves the browser's authenticated state (cookies and localStorage) to a JSON file. Tests can then restore this state instantly.

### How It Works

1. `specs/auth/auth.setup.ts` runs first. It logs in as student, admin, etc., and saves the browser state.
2. Other tests use `test.use({ storageState: studentStatePath })` to start already logged in.

### Available State Files

```typescript
import { studentStatePath, adminStatePath, instructorStatePath } from '../../fixtures/auth-fixture';
```

### Example: Test That Requires Admin Login

```typescript
import { test, expect } from '@playwright/test';
import { adminStatePath } from '../../fixtures/auth-fixture';

test.use({ storageState: adminStatePath });

test('admin can see all users', async ({ page }) => {
  await page.goto('http://localhost:3000/admin/users');
  await expect(page.locator('[data-testid="user-row"]').first()).toBeVisible();
});
```

---

## Running Specific Tests

```bash
# Run all tests
npm test

# Run a specific file
npx playwright test specs/auth/login.spec.ts

# Run tests matching a keyword
npx playwright test --grep "login"

# Run tests in a specific folder
npx playwright test specs/admin/

# Run on a specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Run with 1 worker (serial, not parallel)
npx playwright test --workers=1

# Run in headed mode (visible browser)
npm run test:headed

# Open the Playwright UI (best for writing new tests)
npm run test:ui
```

---

## Test Data Management

### Fixtures

Static test data is stored in `fixtures/`:

```typescript
// fixtures/users.ts
export const ADMIN_USER = {
  email: process.env.ADMIN_EMAIL ?? 'admin@testcraft.id',
  password: process.env.ADMIN_PASSWORD ?? 'Admin#12345',
};

export const STUDENT_USER = {
  email: process.env.STUDENT_EMAIL ?? 'student@testcraft.id',
  password: process.env.STUDENT_PASSWORD ?? 'Student#12345',
};
```

### Environment Variables

Test credentials come from `.env.test` (which mirrors `.env.example`). This means tests work both locally and in CI without code changes.

### API Client for Setup/Teardown

For tests that need to create or clean up data, use the API client:

```typescript
import { apiClient } from '../../utils/api-client';

test.beforeEach(async () => {
  // Create test data before each test
  await apiClient.post('/cms/banners', {
    title: 'Test Banner',
    message: 'Test message',
    isActive: true,
  });
});

test.afterEach(async () => {
  // Clean up after each test
  await apiClient.delete('/cms/banners/test-banner-id');
});
```

---

## Debugging Failed Tests

### 1. View the HTML Report

After a test run, open the visual report:

```bash
npm run test:report
```

The report shows:
- Which tests passed, failed, or were skipped
- Screenshots taken on failure
- Videos of the test run (on first retry in CI)
- Error messages and stack traces

### 2. View Screenshots

When a test fails, Playwright automatically takes a screenshot. Find it in:
```
tests/e2e/results/artifacts/
```

### 3. View Traces (Step-by-Step Replay)

Traces are captured on the first retry. To view a trace:

```bash
npx playwright show-trace results/artifacts/trace.zip
```

The trace viewer shows every action the test took, the DOM at each step, and network requests.

### 4. Interactive Debugging with Playwright UI

```bash
npm run test:ui
```

This opens a visual interface where you can:
- Browse all test files
- Click on a test to run it
- Step through actions one at a time
- Inspect the page at any point

### 5. Add Debug Output to a Test

```typescript
test('debug example', async ({ page }) => {
  await page.goto('/login');

  // Take a screenshot at any point
  await page.screenshot({ path: 'debug-step1.png' });

  // Print text of an element
  const heading = await page.locator('h1').textContent();
  console.log('Heading text:', heading);

  // Pause and open browser devtools (only works in headed mode)
  await page.pause();
});
```

---

## CI Integration (GitHub Actions)

Tests run automatically in GitHub Actions on every push and pull request.

### How It Is Set Up

The CI pipeline:
1. Starts a PostgreSQL database service
2. Runs database migrations and seeding
3. Starts all three apps (API, LMS, Marketing)
4. Waits for them to be ready
5. Runs the Playwright test suite
6. Uploads the HTML report as an artifact

### Example GitHub Actions Step

```yaml
- name: Run E2E tests
  working-directory: tests/e2e
  env:
    CI: true
    BASE_URL: ${{ vars.LMS_URL }}
    API_URL: ${{ vars.API_URL }}
    ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
    ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
    STUDENT_EMAIL: ${{ secrets.STUDENT_EMAIL }}
    STUDENT_PASSWORD: ${{ secrets.STUDENT_PASSWORD }}
    INSTRUCTOR_EMAIL: ${{ secrets.INSTRUCTOR_EMAIL }}
    INSTRUCTOR_PASSWORD: ${{ secrets.INSTRUCTOR_PASSWORD }}
    MARKETING_URL: ${{ vars.MARKETING_URL }}
  run: npm test
```

### CI Behavior Differences

When `CI=true` is set, Playwright:
- Retries failing tests up to 3 times before marking them as failed
- Captures a screenshot on every failure
- Records a video on the first retry
- Runs with 2 workers (parallel) instead of unlimited
- Does NOT open the HTML report automatically

### Accessing Test Reports in CI

In GitHub Actions, the HTML report is uploaded as a workflow artifact. Find it in:
GitHub → Repository → Actions → Your workflow run → Artifacts → `playwright-report`

---

## Qase Integration

Qase is a test management platform where test cases are documented and test run results are tracked.

### What Qase Does

1. Stores your test case documentation (expected behavior, steps, etc.)
2. Receives test results from automated Playwright runs
3. Shows pass/fail trends over time
4. Links test failures to bug reports

### Linking Playwright Tests to Qase Cases

Add a Qase annotation to your test:

```typescript
import { test, expect } from '@playwright/test';

test('student can log in @TC-123', async ({ page }) => {
  // This test is linked to Qase test case TC-123
  await page.goto('/login');
  // ...
});
```

### Running with Qase Reporting

When `QASE_TOKEN` is set in `.env.test`, test results are automatically uploaded to Qase after each run.

```bash
# Runs tests and uploads results to Qase
QASE_TOKEN=your-token npm test
```

---

## Test Naming Conventions

Good test names make it easy to understand what failed without reading the code.

### Format

```
[role or context] [action] [expected result]
```

### Examples

```typescript
// Good test names:
test('student can log in with valid credentials')
test('login page shows error when password is wrong')
test('catalog displays course cards')
test('course card shows price in IDR')
test('admin can change user role')
test('enrollment is blocked for unpaid courses')

// Bad test names (too vague):
test('test login')
test('should work')
test('course test 1')
```

### Describe Blocks

Group related tests under `test.describe()`:

```typescript
test.describe('Login Page', () => {
  test('shows error for invalid email format', ...)
  test('shows error for wrong password', ...)
  test('redirects student to dashboard after login', ...)
  test('redirects admin to admin panel after login', ...)
});
```

---

## Locator Strategy (Priority Order)

Use the most stable selectors. Listed from best to worst:

1. **`data-testid` attributes** — Most stable. Developers add these specifically for tests.
   ```typescript
   page.locator('[data-testid="course-card"]')
   ```

2. **ARIA roles + accessible name** — Stable and also checks accessibility.
   ```typescript
   page.getByRole('button', { name: /masuk|login/i })
   page.getByRole('heading', { name: /kursus saya/i })
   ```

3. **Form labels** — Stable for form elements.
   ```typescript
   page.getByLabel('Email')
   page.getByPlaceholder('Masukkan email Anda')
   ```

4. **Semantic text content** — Somewhat stable if text doesn't change often.
   ```typescript
   page.getByText('Daftar Sekarang')
   ```

5. **CSS class selectors** — Fragile. Avoid unless no better option exists.
   ```typescript
   page.locator('.course-card-title')  // Fragile — avoid
   ```

---

## Page Object Reference

### BasePage

All page objects extend `BasePage`, which provides:

```typescript
await page.goto('/path');          // Navigate and wait for load
await page.waitForLoad();         // Wait for network to be idle
```

### AuthPage (`pages/auth.page.ts`)

```typescript
await authPage.login(email, password);
await authPage.register(name, email, password, phone);
await authPage.getErrorMessage();  // Returns the error text if visible
```

### CourseCatalogPage (`pages/catalog.page.ts`)

```typescript
await catalogPage.goto();
await catalogPage.search('selenium');
await catalogPage.getCourseCards();     // Returns array of course elements
await catalogPage.filterByCategory('QA Automation');
```

### StudentDashboardPage (`pages/dashboard.page.ts`)

```typescript
await dashboardPage.goto();
await dashboardPage.getEnrolledCourses();
await dashboardPage.getProgressBar(courseName);
```

### AdminPage (`pages/admin.page.ts`)

```typescript
await adminPage.goto();
await adminPage.navigateTo('users');    // Opens /admin/users
await adminPage.getUserCount();
```
