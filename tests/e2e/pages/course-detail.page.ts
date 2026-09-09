import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * CourseDetailPage — /courses/[slug]
 *
 * The detail page shows the course hero (title, price, lesson count)
 * and an "Enroll" / "Mulai Belajar" button depending on enrollment status.
 */
export class CourseDetailPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(slug: string): Promise<void> {
    await this.navigate(`/courses/${slug}`);
    await this.page.waitForSelector('h1', { state: 'visible' });
  }

  /** Click the enroll / payment button. */
  async enrollCourse(): Promise<void> {
    await this.page
      .getByRole('button', { name: /enroll|daftar|mulai belajar|beli/i })
      .first()
      .click();
    await this.waitForLoad();
  }

  /** Return the main course title (h1). */
  async getTitle(): Promise<string> {
    return this.page.locator('h1').first().innerText();
  }

  /**
   * Return the displayed price string (e.g. "Rp 299.000" or "Gratis").
   * Looks for elements with data-testid="course-price" first, then
   * falls back to text patterns.
   */
  async getPrice(): Promise<string> {
    const priceEl = this.page
      .locator('[data-testid="course-price"]')
      .or(this.page.locator('text=/Rp|Gratis|Free/i').first());
    return priceEl.innerText();
  }

  /**
   * Return the number of lessons shown on the detail page.
   * Typically rendered as "12 lesson" or "12 video".
   */
  async getLessonCount(): Promise<number> {
    const el = this.page.locator('[data-testid="lesson-count"]').or(
      this.page.locator('text=/\\d+ (lesson|video|materi)/i').first(),
    );
    const text = await el.innerText();
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /** Return true when the "Mulai Belajar" (start learning) button is visible. */
  async isEnrolled(): Promise<boolean> {
    return this.page
      .getByRole('button', { name: /mulai belajar|lanjut belajar|continue/i })
      .isVisible()
      .catch(() => false);
  }
}
