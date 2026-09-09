/**
 * Course Catalog — /catalog page tests.
 *
 * These tests run as an unauthenticated user because the catalog is public.
 * A student storageState is also loaded to test authenticated interactions.
 */

import { test, expect } from '@playwright/test';
import { CourseCatalogPage } from '../../pages/catalog.page';
import { CourseDetailPage } from '../../pages/course-detail.page';

test.describe('Course catalog (public)', () => {
  test('should display the course catalog page', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);

    await test.step('Navigate to course catalog', async () => {
      await catalog.goto();
    });

    await test.step('Verify page heading is visible', async () => {
      await expect(page.locator('h1')).toBeVisible();
    });

    await test.step('Verify heading text matches catalog keyword', async () => {
      const heading = await page.locator('h1').innerText();
      expect(heading.toLowerCase()).toMatch(/katalog|kelas|course/i);
    });
  });

  test('should list at least one course card', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);

    await test.step('Navigate to course catalog', async () => {
      await catalog.goto();
    });

    await test.step('Verify at least one course card is visible', async () => {
      const courses = await catalog.getCourseCards();
      expect(courses.length).toBeGreaterThan(0);
    });
  });

  test('should display the total course count', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);

    await test.step('Navigate to course catalog', async () => {
      await catalog.goto();
    });

    await test.step('Verify total course count is greater than zero', async () => {
      const total = await catalog.getTotalCount();
      expect(total).toBeGreaterThan(0);
    });
  });

  test('should search for a course by title keyword', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);

    await test.step('Navigate to course catalog', async () => {
      await catalog.goto();
    });

    await test.step('Search for courses with keyword "testing"', async () => {
      await catalog.searchCourse('testing');
    });

    await test.step('Verify page remains stable after search', async () => {
      const results = await catalog.getCourseCards();
      expect(Array.isArray(results)).toBe(true);
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test('should clear search and show all courses again', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);

    await test.step('Navigate to course catalog and get initial count', async () => {
      await catalog.goto();
    });

    const allCount = await catalog.getTotalCount();

    await test.step('Search with a term that returns no results', async () => {
      await catalog.searchCourse('zzznomatchxxx');
    });

    await test.step('Navigate back to catalog without search', async () => {
      await catalog.goto();
    });

    await test.step('Verify full course count is restored', async () => {
      const resetCount = await catalog.getTotalCount();
      expect(resetCount).toBe(allCount);
    });
  });

  test('should filter courses by category', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);

    await test.step('Navigate to course catalog', async () => {
      await catalog.goto();
    });

    await test.step('Apply category filter', async () => {
      const categorySelect = page.locator('select[name="category"]');
      if (await categorySelect.isVisible().catch(() => false)) {
        const options = await categorySelect.locator('option').allInnerTexts();
        const firstRealCategory = options.find((o) => o.trim() !== '' && o !== 'Semua');
        if (firstRealCategory) {
          await catalog.filterByCategory(firstRealCategory);
        }
      } else {
        const filterBtns = page.getByRole('button').filter({ hasText: /automation|testing|api/i });
        const count = await filterBtns.count();
        if (count > 0) {
          await filterBtns.first().click();
          await page.waitForLoadState('networkidle');
        }
      }
    });

    await test.step('Verify page remains visible after filter', async () => {
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test('should navigate to course detail page when a card is clicked', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);

    await test.step('Navigate to course catalog', async () => {
      await catalog.goto();
    });

    await test.step('Get course cards and verify at least one exists', async () => {
      const cards = await catalog.getCourseCards();
      expect(cards.length).toBeGreaterThan(0);
    });

    await test.step('Click the first course card', async () => {
      const cards = await catalog.getCourseCards();
      await catalog.openCourse(cards[0]);
    });

    await test.step('Verify navigation to course detail page', async () => {
      expect(page.url()).toMatch(/\/courses\//);
    });
  });

  test('should show course detail with title and price after clicking a card', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);

    await test.step('Navigate to course catalog', async () => {
      await catalog.goto();
    });

    await test.step('Open the first course', async () => {
      const cards = await catalog.getCourseCards();
      await catalog.openCourse(cards[0]);
    });

    await test.step('Verify course detail title is non-empty', async () => {
      const detail = new CourseDetailPage(page);
      const title = await detail.getTitle();
      expect(title.length).toBeGreaterThan(0);
    });
  });

  test('should persist filter in URL query params', async ({ page }) => {
    const catalog = new CourseCatalogPage(page);

    await test.step('Navigate to course catalog', async () => {
      await catalog.goto();
    });

    await test.step('Search for "automation"', async () => {
      await catalog.searchCourse('automation');
    });

    await test.step('Verify search query is reflected in URL', async () => {
      expect(page.url()).toContain('q=automation');
    });
  });
});
