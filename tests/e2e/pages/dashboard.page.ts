import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * StudentDashboardPage — /dashboard
 *
 * Renders enrolled courses with progress bars (progressPct) and a
 * "Lanjut Belajar" (Continue Learning) button per course.
 */
export class StudentDashboardPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/dashboard');
    // The dashboard shows a greeting heading once the user data loads
    await this.page.waitForSelector('h1, [data-testid="dashboard-greeting"]', {
      state: 'visible',
      timeout: 15_000,
    });
  }

  /**
   * Return the list of enrolled course titles shown on the dashboard.
   * Each card has a course.title string inside a heading or named element.
   */
  async getEnrolledCourses(): Promise<string[]> {
    await this.page.waitForSelector(
      '[data-testid="enrollment-card"], [data-testid="course-card"]',
      { state: 'visible', timeout: 10_000 },
    );
    // Dashboard enrollment cards use <p> for course title (not h2/h3)
    const titles = await this.page
      .locator('[data-testid="enrollment-card"] p.font-semibold, [data-testid="enrollment-card"] p, [data-testid="course-card"] p')
      .allInnerTexts();
    return titles.map((t) => t.trim()).filter(Boolean);
  }

  /**
   * Return the progress percentage (0–100) for the course with the given title.
   * The LMS renders a <progress> or an aria-valuenow attribute.
   */
  async getProgress(courseTitle: string): Promise<number> {
    const card = this.page
      .locator('[data-testid="enrollment-card"]')
      .filter({ hasText: courseTitle });

    // Try aria-valuenow on the progress bar element
    const progressBar = card.locator('[role="progressbar"], progress').first();
    const ariaValue = await progressBar.getAttribute('aria-valuenow').catch(() => null);
    if (ariaValue !== null) return parseFloat(ariaValue);

    // Fallback: read the text label "75%" or "75 %"
    const label = await card.locator('text=/\\d+\\s*%/').first().innerText().catch(() => '0');
    const match = label.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }

  /**
   * Click the "Lanjut Belajar" / "Mulai Belajar" button for a course
   * to navigate to the /learn/[slug] page.
   */
  async openCourse(courseTitle: string): Promise<void> {
    const card = this.page
      .locator('[data-testid="enrollment-card"]')
      .filter({ hasText: courseTitle });
    // The card itself wraps a Link — click any link inside or the card's link
    await card.locator('a').first().click();
    await this.waitForLoad();
  }

  /** Return true if the empty state ("Belum ada kelas") is visible. */
  async isEmpty(): Promise<boolean> {
    return this.page
      .locator('[data-testid="empty-state"]')
      .isVisible()
      .catch(() => false);
  }

  /** Return the greeting text shown at the top of the dashboard. */
  async getGreeting(): Promise<string> {
    return this.page.locator('h1').first().innerText();
  }
}
