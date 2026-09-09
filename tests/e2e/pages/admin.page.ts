import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

export interface CourseFormData {
  title: string;
  slug?: string;
  description?: string;
  categoryName?: string;
  level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  priceIDR?: number;
}

/**
 * AdminPage — /admin and its sub-routes.
 *
 * The admin panel is protected by role=SUPER_ADMIN or ADMIN.
 * It uses the same workspace-shell layout as the student area.
 */
export class AdminPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/admin');
    await this.page.waitForSelector('h1', { state: 'visible', timeout: 15_000 });
  }

  async gotoCourseCMS(): Promise<void> {
    await this.navigate('/admin/courses');
    await this.page.waitForSelector('h1, [data-testid="cms-courses-heading"]', {
      state: 'visible',
    });
  }

  // ─── Course management ────────────────────────────────────────────────────

  /**
   * Open the "Buat Kursus" (Create Course) form, fill in the fields,
   * and submit.  Returns once the success toast or redirect appears.
   */
  async createCourse(data: CourseFormData): Promise<void> {
    const createBtn = this.page.getByRole('button', {
      name: /buat kursus|tambah kursus|new course|create course/i,
    });
    await createBtn.click();

    // Wait for modal or new-page form
    await this.page.waitForSelector('input[name="title"], input[placeholder*="judul"]', {
      state: 'visible',
    });

    await this.page.locator('input[name="title"], input[placeholder*="judul"]').fill(data.title);

    if (data.slug) {
      const slugInput = this.page.locator('input[name="slug"]');
      if (await slugInput.isVisible().catch(() => false)) {
        await slugInput.fill(data.slug);
      }
    }

    if (data.description) {
      const descInput = this.page.locator('textarea[name="description"]');
      if (await descInput.isVisible().catch(() => false)) {
        await descInput.fill(data.description);
      }
    }

    if (data.categoryName) {
      const catSelect = this.page.locator('select[name="categoryId"]');
      if (await catSelect.isVisible().catch(() => false)) {
        await catSelect.selectOption({ label: data.categoryName });
      }
    }

    if (data.level) {
      const levelSelect = this.page.locator('select[name="level"]');
      if (await levelSelect.isVisible().catch(() => false)) {
        await levelSelect.selectOption(data.level);
      }
    }

    await this.page.getByRole('button', { name: /simpan|save|buat|create/i }).click();
    await this.page.waitForSelector('[role="alert"], [data-testid="success-toast"]', {
      state: 'visible',
      timeout: 10_000,
    });
  }

  /**
   * Toggle the publish status for a course row matching the given title.
   * Clicks the "Terbitkan" / "Cabut Terbit" button in the course table row.
   */
  async publishCourse(title: string): Promise<void> {
    const row = this.page.locator('tr, [data-testid="course-row"]').filter({ hasText: title });
    const publishBtn = row.getByRole('button', { name: /terbit|publish|unpublish/i });
    await publishBtn.click();
    await this.page.waitForSelector('[role="alert"], [data-testid="success-toast"]', {
      state: 'visible',
      timeout: 8_000,
    });
  }

  /**
   * Navigate to the lesson editor for the given course and add a new lesson.
   */
  async addLesson(courseTitle: string, lessonTitle: string): Promise<void> {
    const row = this.page.locator('tr, [data-testid="course-row"]').filter({ hasText: courseTitle });
    await row.getByRole('link', { name: /kelola|manage|edit/i }).click();
    await this.page.waitForSelector('[data-testid="lesson-list"], h2', { state: 'visible' });

    await this.page.getByRole('button', { name: /tambah lesson|add lesson|new lesson/i }).click();
    await this.page.locator('input[name="title"]').fill(lessonTitle);
    await this.page.getByRole('button', { name: /simpan|save/i }).click();
    await this.page.waitForSelector('[role="alert"], [data-testid="success-toast"]', {
      state: 'visible',
      timeout: 8_000,
    });
  }

  // ─── Helpers ─────────────────────────────────────────────────────────────

  /** Return true if the admin panel overview stats are visible. */
  async isAdminOverviewVisible(): Promise<boolean> {
    return this.page
      .locator('[data-testid="stat-card"], [data-testid="admin-overview"]')
      .first()
      .isVisible()
      .catch(() => false);
  }
}
