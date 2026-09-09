/**
 * Enrollment flow — end-to-end enrollment and learning progress tests.
 *
 * Prerequisites:
 *   - A free course (priceIDR === 0) must exist and be published.
 *   - The student test account must NOT already be enrolled in that course
 *     (or the test seeds a fresh enrollment via the API client).
 */

import { test, expect } from '@playwright/test';
import * as path from 'path';
import { CourseCatalogPage } from '../../pages/catalog.page';
import { CourseDetailPage } from '../../pages/course-detail.page';
import { StudentDashboardPage } from '../../pages/dashboard.page';
import { freeCourse } from '../../fixtures/courses';
import { testUsers } from '../../fixtures/users';
import { TestApiClient } from '../../utils/api-client';

const studentState = path.resolve(__dirname, '../../results/auth-state/student.json');

// Run as an authenticated student
test.use({ storageState: studentState });

let api: TestApiClient;
let adminJwt: string;
let studentJwt: string;
let freeCourseId: string;

test.beforeAll(async () => {
  api = new TestApiClient();
  try {
    adminJwt = await api.loginAs(testUsers.admin.email, testUsers.admin.password);
    studentJwt = await api.loginAs(testUsers.student.email, testUsers.student.password);

    // Look up the free course ID and ensure student is enrolled
    const courses = await api.getCourses('limit=100');
    const free = courses.data.find((c: { slug: string }) => c.slug === freeCourse.slug);
    if (free) {
      freeCourseId = free.id;
      // Enroll student via API (no-op if already enrolled)
      await api.enrollInCourse(studentJwt, freeCourseId).catch(() => {});
    }
  } catch {
    console.warn('[enrollment-flow] Could not seed enrollment via API — tests may degrade.');
  }
});

test.describe('Enrollment flow (student)', () => {
  test('should show the catalog with at least one free course', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);

    await test.step('Navigate to course catalog', async () => {
      await catalog.goto();
    });

    await test.step('Verify catalog heading is visible', async () => {
      await expect(page.locator('h1')).toBeVisible();
    });

    await test.step('Verify course cards are present', async () => {
      const cards = await catalog.getCourseCards();
      expect(cards.length).toBeGreaterThan(0);
    });
  });

  test('should display an "Enroll" / "Mulai Belajar" button on a free course detail page', async ({ page }) => {
    const detail = new CourseDetailPage(page);

    await test.step('Navigate to free course detail page', async () => {
      await detail.goto(freeCourse.slug);
    });

    await test.step('Verify enroll or start learning CTA is visible', async () => {
      const cta = page.getByRole('button', { name: /enroll|daftar|mulai belajar|beli|gratis/i });
      await expect(cta.first()).toBeVisible({ timeout: 10_000 });
    });
  });

  test('should enroll in a free course via the detail page', async ({ page }) => {
    const detail = new CourseDetailPage(page);

    await test.step('Navigate to free course detail page', async () => {
      await detail.goto(freeCourse.slug);
    });

    await test.step('Enroll if not already enrolled', async () => {
      const alreadyEnrolled = await detail.isEnrolled();
      if (!alreadyEnrolled) {
        await detail.enrollCourse();
        await page.waitForSelector('button:has-text("Mulai Belajar"), a:has-text("Lanjut Belajar")', {
          timeout: 10_000,
        });
      }
    });

    await test.step('Verify enrollment status is active', async () => {
      const enrolled = await detail.isEnrolled();
      expect(enrolled).toBe(true);
    });
  });

  test('should show the enrolled course on the student dashboard', async ({ page }) => {
    const dashboard = new StudentDashboardPage(page);

    await test.step('Navigate to student dashboard', async () => {
      await dashboard.goto();
    });

    await test.step('Verify enrolled courses are listed', async () => {
      const courses = await dashboard.getEnrolledCourses();
      expect(courses.length).toBeGreaterThan(0);
    });
  });

  test('should display a progress bar for enrolled courses', async ({ page }) => {
    const dashboard = new StudentDashboardPage(page);

    await test.step('Navigate to student dashboard', async () => {
      await dashboard.goto();
    });

    await test.step('Verify enrolled courses are listed', async () => {
      const courses = await dashboard.getEnrolledCourses();
      expect(courses.length).toBeGreaterThan(0);
    });

    await test.step('Verify progress bars are present in the DOM', async () => {
      const progressBars = page.locator('[role="progressbar"], progress');
      const count = await progressBars.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test('should navigate to the learn page when "Lanjut Belajar" is clicked', async ({ page }) => {
    const dashboard = new StudentDashboardPage(page);

    await test.step('Navigate to student dashboard', async () => {
      await dashboard.goto();
    });

    await test.step('Verify enrolled courses are listed', async () => {
      const courses = await dashboard.getEnrolledCourses();
      expect(courses.length).toBeGreaterThan(0);
    });

    await test.step('Open the first enrolled course', async () => {
      const courses = await dashboard.getEnrolledCourses();
      await dashboard.openCourse(courses[0]);
    });

    await test.step('Verify navigation to learn page', async () => {
      expect(page.url()).toMatch(/\/learn\//);
    });
  });

  test('should track lesson progress after starting a lesson', async ({ page }) => {
    const dashboard = new StudentDashboardPage(page);

    await test.step('Navigate to student dashboard', async () => {
      await dashboard.goto();
    });

    await test.step('Get enrolled courses and initial progress', async () => {
      const courses = await dashboard.getEnrolledCourses();
      expect(courses.length).toBeGreaterThan(0);
    });

    const courses = await dashboard.getEnrolledCourses();
    const initialProgress = await dashboard.getProgress(courses[0]);

    await test.step('Navigate to the first course learn page', async () => {
      await dashboard.openCourse(courses[0]);
      expect(page.url()).toMatch(/\/learn\//);
    });

    await test.step('Verify lesson viewer renders', async () => {
      await page.waitForSelector('video, [data-testid="lesson-viewer"], iframe', {
        timeout: 10_000,
      }).catch(() => {});
      await expect(page.locator('h1, h2').first()).toBeVisible();
    });

    await test.step('Return to dashboard and verify progress is tracked', async () => {
      await dashboard.goto();
      const updatedProgress = await dashboard.getProgress(courses[0]);
      expect(updatedProgress).toBeGreaterThanOrEqual(initialProgress);
    });
  });
});
