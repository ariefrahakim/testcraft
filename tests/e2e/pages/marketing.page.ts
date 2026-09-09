import type { Page } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * MarketingPage — the public marketing site (http://localhost:3001).
 *
 * Pages covered:
 *   /           — homepage with hero, training programs, testimonials
 *   /privacy    — privacy policy
 *   /terms      — terms of service
 */
export class MarketingPage extends BasePage {
  private readonly marketingURL: string;

  constructor(page: Page) {
    // baseURL is set to the marketing site URL in playwright.config.ts
    // for the "marketing" project, but we also accept the env var directly.
    const mktUrl = process.env.MARKETING_URL ?? 'http://localhost:3001';
    super(page, mktUrl);
    this.marketingURL = mktUrl;
  }

  async goto(): Promise<void> {
    await this.navigate(this.marketingURL);
    await this.page.waitForSelector('h1, [data-testid="hero-title"]', { state: 'visible' });
  }

  async gotoPrivacy(): Promise<void> {
    await this.navigate(`${this.marketingURL}/privacy`);
    await this.page.waitForSelector('h1', { state: 'visible' });
  }

  // ─── Hero section ─────────────────────────────────────────────────────────

  /** Return the hero heading text (first <h1> on the page). */
  async getHeroTitle(): Promise<string> {
    return this.page.locator('h1').first().innerText();
  }

  /** Return the hero sub-headline / description paragraph text. */
  async getHeroSubtitle(): Promise<string> {
    return this.page
      .locator('[data-testid="hero-subtitle"], section p')
      .first()
      .innerText();
  }

  // ─── Lead / contact form ──────────────────────────────────────────────────

  /**
   * Fill and submit the lead capture / contact form.
   * The marketing site has a contact section with name, email, message fields.
   */
  async submitLeadForm(name: string, email: string, _message: string): Promise<void> {
    // Scroll to the form first
    const form = this.page.locator('form').last();
    await form.scrollIntoViewIfNeeded();
    await this.page.getByLabel(/nama/i).fill(name);
    await this.page.getByLabel(/email/i).fill(email);
    // Fill WhatsApp/phone field if present
    const waField = this.page.getByLabel(/whatsapp|telepon|phone/i);
    if (await waField.isVisible().catch(() => false)) {
      await waField.fill('08123456789');
    }
    // Check consent checkbox if present
    const consentCheckbox = this.page.locator('#reg-consent, input[type="checkbox"]').last();
    if (await consentCheckbox.isVisible().catch(() => false)) {
      await consentCheckbox.check();
    }
    await form.getByRole('button', { name: /kirim|send|hubungi|daftar/i }).click();
    // Wait for a WhatsApp link (success state) or alert
    await this.page.waitForSelector(
      'a[href*="wa.me"], [role="alert"], [data-testid="form-success"]',
      { state: 'visible', timeout: 15_000 },
    );
  }

  // ─── Navigation ──────────────────────────────────────────────────────────

  /**
   * Click the "Masuk Platform" / "Mulai Belajar" CTA that points to the LMS login.
   * After click, the browser navigates to the LMS (port 3000).
   */
  async navigateToLMS(): Promise<void> {
    await this.page
      .getByRole('link', { name: /masuk platform|mulai belajar|login|daftar gratis/i })
      .first()
      .click();
    await this.page.waitForURL(/localhost:3000|\/login/, { timeout: 10_000 });
  }

  // ─── Content checks ───────────────────────────────────────────────────────

  /** Return an array of training program / service titles shown on the homepage. */
  async getTrainingProgramTitles(): Promise<string[]> {
    const els = await this.page
      .locator('[data-testid="program-card"] h2, [data-testid="program-card"] h3, .program-title')
      .allInnerTexts();
    return els.map((t) => t.trim()).filter(Boolean);
  }

  /** Return true when the footer is visible. */
  async isFooterVisible(): Promise<boolean> {
    return this.page.locator('footer').isVisible().catch(() => false);
  }
}
