import type { Page } from '@playwright/test';

/**
 * BasePage — shared foundation for all Page Object Models.
 *
 * Every POM extends this class so common utilities (navigation,
 * loading waits, toast reads, etc.) live in one place.
 */
export class BasePage {
  readonly page: Page;
  readonly baseURL: string;

  constructor(page: Page, baseURL?: string) {
    this.page = page;
    this.baseURL = baseURL ?? process.env.BASE_URL ?? 'http://localhost:3000';
  }

  /** Navigate to an absolute URL or a path relative to baseURL. */
  async navigate(urlOrPath: string): Promise<void> {
    const url = urlOrPath.startsWith('http') ? urlOrPath : `${this.baseURL}${urlOrPath}`;
    await this.page.goto(url);
  }

  /** Wait for the page network to settle and the main content to appear. */
  async waitForLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Wait for a toast / flash message to appear and return its text.
   * The LMS uses [role=alert] for inline form errors as well as toast banners.
   */
  async getAlertText(): Promise<string> {
    const alert = this.page.locator('[role="alert"]').first();
    await alert.waitFor({ state: 'visible', timeout: 8_000 });
    return alert.innerText();
  }

  /** Return the current page <title>. */
  async getPageTitle(): Promise<string> {
    return this.page.title();
  }

  /** Click the element and wait for navigation to complete. */
  async clickAndNavigate(selector: string): Promise<void> {
    await Promise.all([
      this.page.waitForNavigation({ waitUntil: 'networkidle' }),
      this.page.click(selector),
    ]);
  }

  /** Fill an input identified by its label text. */
  async fillByLabel(label: string, value: string): Promise<void> {
    await this.page.getByLabel(label).fill(value);
  }

  /** Press Enter in the focused element — handy for search inputs. */
  async pressEnter(): Promise<void> {
    await this.page.keyboard.press('Enter');
  }

  /** Return true if the given URL path is the current pathname. */
  async isAtPath(path: string): Promise<boolean> {
    const url = new URL(this.page.url());
    return url.pathname === path;
  }
}
