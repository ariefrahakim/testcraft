import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * CourseCatalogPage — /catalog
 *
 * The catalog renders a server component with a CatalogFilters client island.
 * Courses are displayed as cards containing the course title inside an <h2>/<h3>.
 */
export class CourseCatalogPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(): Promise<void> {
    await this.navigate('/catalog');
    // Wait for at least one course card to appear (or the empty state)
    await this.page.waitForSelector('[data-testid="course-card"], [data-testid="empty-state"], h1', {
      state: 'visible',
    });
  }

  /**
   * Type in the search input and submit.
   * The CatalogFilters island uses a controlled <input> that pushes search params.
   */
  async searchCourse(query: string): Promise<void> {
    const searchInput = this.page.getByRole('searchbox').or(
      this.page.locator('input[name="q"], input[placeholder*="cari"], input[placeholder*="search"]'),
    );
    await searchInput.fill(query);
    await this.page.keyboard.press('Enter');
    await this.waitForLoad();
  }

  /**
   * Select a category from the filter dropdown / tab list.
   * Matches by visible text (case-insensitive).
   */
  async filterByCategory(category: string): Promise<void> {
    // Try select element first, then button-group or link-based filter tabs
    const select = this.page.locator('select[name="category"]');
    if (await select.isVisible().catch(() => false)) {
      await select.selectOption({ label: category });
    } else {
      await this.page.getByRole('button', { name: new RegExp(category, 'i') }).click();
    }
    await this.waitForLoad();
  }

  /**
   * Return an array of visible course card titles.
   * Cards use <h2 data-testid="course-title"> or an <h2>/<h3> inside the card wrapper.
   */
  async getCourseCards(): Promise<string[]> {
    const titles = await this.page
      .locator('[data-testid="course-title"], [data-testid="course-card"] h2, [data-testid="course-card"] h3')
      .allInnerTexts();
    return titles.map((t) => t.trim()).filter(Boolean);
  }

  /** Click the course card whose title matches the given string. */
  async openCourse(title: string): Promise<void> {
    await this.page
      .locator('[data-testid="course-card"]')
      .filter({ hasText: title })
      .first()
      .click();
    await this.waitForLoad();
  }

  /** Return the total count label shown below the catalog heading. */
  async getTotalCount(): Promise<number> {
    const text = await this.page.locator('p').filter({ hasText: /kelas|courses?/i }).first().innerText();
    const match = text.match(/(\d+)/);
    return match ? parseInt(match[1], 10) : 0;
  }
}
