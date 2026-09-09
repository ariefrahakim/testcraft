import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * AuthPage — covers /login and /register pages of the LMS.
 *
 * The login form uses standard HTML id attributes:
 *   - #email  (type="email")
 *   - #password (type="password")
 *
 * The register form mirrors the same pattern plus a "name" field.
 */
export class AuthPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  async goto(): Promise<void> {
    await this.navigate('/login');
    await this.page.waitForSelector('#email', { state: 'visible' });
  }

  async gotoRegister(): Promise<void> {
    await this.navigate('/register');
    await this.page.waitForSelector('[name="name"]', { state: 'visible' });
  }

  // ─── Login ────────────────────────────────────────────────────────────────

  /**
   * Fill and submit the login form.
   * Resolves after the browser either redirects (success) or shows an error.
   */
  async login(email: string, password: string): Promise<void> {
    await this.page.locator('#email').fill(email);
    await this.page.locator('#password').fill(password);
    await this.page.getByRole('button', { name: /masuk|login|sign in/i }).click();
  }

  // ─── Register ─────────────────────────────────────────────────────────────

  async register(name: string, email: string, password: string): Promise<void> {
    await this.page.getByLabel(/nama/i).fill(name);
    await this.page.getByLabel(/email/i).fill(email);
    // Some forms split into password + confirm-password
    const pwInputs = this.page.locator('input[type="password"]');
    await pwInputs.first().fill(password);
    const count = await pwInputs.count();
    if (count > 1) {
      await pwInputs.nth(1).fill(password);
    }
    // Check terms/privacy agreement checkbox if present
    const termsCheckbox = this.page.locator('input[type="checkbox"]');
    if (await termsCheckbox.count().then((c) => c > 0)) {
      await termsCheckbox.check();
    }
    await this.page.locator('button[type="submit"]').click();
  }

  // ─── Logout ───────────────────────────────────────────────────────────────

  async logout(): Promise<void> {
    // The workspace sidebar has a logout button visible on desktop
    await this.page.getByRole('button', { name: /keluar|sign out/i }).click();
    // Wait until we land back on the login page
    await this.page.waitForURL(/\/login/, { timeout: 10_000 });
  }

  // ─── State checks ────────────────────────────────────────────────────────

  /**
   * Returns true when the current URL is NOT the login or register page
   * and at least one authenticated UI element is visible.
   */
  async isLoggedIn(): Promise<boolean> {
    const url = this.page.url();
    if (url.includes('/login') || url.includes('/register')) return false;
    // The workspace shell renders the user's avatar or a "Dashboard" nav link
    const navAuth = this.page.locator('[data-testid="user-menu"], [aria-label="User menu"]');
    return navAuth.isVisible().catch(() => false);
  }

  /** Return the error/alert text shown after a failed login attempt. */
  async getLoginError(): Promise<string> {
    // Wait for the specific login error element
    const el = this.page.locator('[data-testid="login-error"]');
    try {
      await el.waitFor({ state: 'visible', timeout: 10_000 });
      return el.innerText();
    } catch {
      // Fall back to any visible role=alert
      return this.getAlertText();
    }
  }
}
