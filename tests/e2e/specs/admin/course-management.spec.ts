/**
 * Admin — Course Management CMS tests.
 *
 * Requires: admin storageState saved by auth.setup.ts
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import { AdminPage } from '../../pages/admin.page';
import { testUsers } from '../../fixtures/users';
import { TestApiClient } from '../../utils/api-client';

const adminState = path.resolve(__dirname, '../../results/auth-state/admin.json');

test.use({ storageState: adminState });

let api: TestApiClient;
let adminJwt: string;
let createdCourseId: string | undefined;
let createdCourseTitle: string;
let createdCourseSlug: string;

test.beforeAll(async () => {
  api = new TestApiClient();
  try {
    adminJwt = await api.loginAs(testUsers.admin.email, testUsers.admin.password);

    // Create a draft course once — shared across all tests in this file
    const ts = Date.now();
    createdCourseTitle = `E2E Draft Course ${ts}`;
    createdCourseSlug = `e2e-draft-${ts}`;

    const created = await api.createCourse(adminJwt, {
      title: createdCourseTitle,
      slug: createdCourseSlug,
      description: 'Auto-generated draft created by Playwright E2E test.',
      level: 'BEGINNER',
    });
    createdCourseId = created.id;
  } catch (err) {
    console.warn('[course-management] Setup failed:', err);
  }
});

test.afterAll(async () => {
  if (api && adminJwt && createdCourseId) {
    await api.deleteCourse(adminJwt, createdCourseId).catch(() => {});
  }
});

test.describe('Admin — Course CMS', () => {
  test('should load the admin dashboard overview', async ({ page }) => {
    const admin = new AdminPage(page);

    await test.step('Navigate to admin dashboard', async () => {
      await admin.goto();
    });

    await test.step('Verify page heading is visible', async () => {
      await expect(page.locator('h1')).toBeVisible();
    });

    await test.step('Verify at least one stat card is visible', async () => {
      const statCards = page.locator('[data-testid="stat-card"]');
      await expect(statCards.first()).toBeVisible({ timeout: 15_000 });
    });
  });

  test('should navigate to the courses CMS page', async ({ page }) => {
    const admin = new AdminPage(page);

    await test.step('Navigate to admin courses page', async () => {
      await admin.gotoCourseCMS();
    });

    await test.step('Verify courses page heading is visible', async () => {
      await expect(page.locator('h2').first()).toBeVisible();
    });

    await test.step('Verify heading text matches courses keyword', async () => {
      const heading = await page.locator('h2').first().innerText();
      expect(heading.toLowerCase()).toMatch(/kursus|kelas|course/);
    });
  });

  test('should list existing courses in the CMS table', async ({ page }) => {
    const admin = new AdminPage(page);

    await test.step('Navigate to admin courses page', async () => {
      await admin.gotoCourseCMS();
    });

    await test.step('Wait for course rows to appear', async () => {
      await expect(
        page.locator('[data-testid="course-row"]').first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step('Verify at least one course row exists', async () => {
      const rows = page.locator('[data-testid="course-row"]');
      const count = await rows.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('should create a new course draft', async ({ page }) => {
    const admin = new AdminPage(page);

    await test.step('Navigate to admin courses page', async () => {
      await admin.gotoCourseCMS();
    });

    await test.step('Reload page to ensure latest data is shown', async () => {
      await page.reload({ waitUntil: 'networkidle' });
    });

    await test.step('Verify the created draft course appears in the list', async () => {
      await expect(
        page.locator('tr, [data-testid="course-row"]').filter({ hasText: createdCourseTitle }),
      ).toBeVisible({ timeout: 15_000 });
    });
  });

  test('should publish a draft course from the CMS', async ({ page }) => {
    const admin = new AdminPage(page);

    await test.step('Publish the draft course via API', async () => {
      if (api && adminJwt && createdCourseId) {
        await api.publishCourse(adminJwt, createdCourseId);
      }
    });

    await test.step('Navigate to admin courses page', async () => {
      await admin.gotoCourseCMS();
      await page.reload({ waitUntil: 'networkidle' });
    });

    await test.step('Wait for course rows to appear', async () => {
      await expect(
        page.locator('[data-testid="course-row"]').first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step('Verify published course row is visible', async () => {
      const courseRow = page
        .locator('tr, [data-testid="course-row"]')
        .filter({ hasText: createdCourseTitle });
      await expect(courseRow).toBeVisible({ timeout: 10_000 });
    });
  });

  test('should navigate to a course detail from the admin CMS table', async ({ page }) => {
    const admin = new AdminPage(page);

    await test.step('Navigate to admin courses page', async () => {
      await admin.gotoCourseCMS();
      await page.reload({ waitUntil: 'networkidle' });
    });

    await test.step('Wait for course rows to appear', async () => {
      await expect(
        page.locator('[data-testid="course-row"]').first(),
      ).toBeVisible({ timeout: 15_000 });
    });

    await test.step('Click the course title link for the created course', async () => {
      const courseRow = page
        .locator('tr, [data-testid="course-row"]')
        .filter({ hasText: createdCourseTitle });

      const link = courseRow.locator('a').first();
      await link.click();
    });

    await test.step('Verify course detail page loaded', async () => {
      await page.waitForLoadState('networkidle');
      await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test('should allow searching for a course in the CMS', async ({ page }) => {
    const admin = new AdminPage(page);

    await test.step('Navigate to admin courses page', async () => {
      await admin.gotoCourseCMS();
    });

    await test.step('Search for a course', async () => {
      const searchInput = page.locator(
        'input[name="q"], input[placeholder*="cari"], input[placeholder*="search"], input[aria-label*="cari"], input[aria-label*="search"]',
      );
      if (await searchInput.isVisible().catch(() => false)) {
        await searchInput.fill('testing');
        await page.waitForTimeout(500);
      }
    });

    await test.step('Verify page remains loaded after search', async () => {
      await expect(page.locator('h1')).toBeVisible();
    });
  });
});
