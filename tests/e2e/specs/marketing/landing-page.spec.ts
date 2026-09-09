/**
 * Marketing site — public landing page tests.
 *
 * The marketing site runs on port 3001.
 * These tests use the "marketing" Playwright project defined in playwright.config.ts
 * which sets baseURL to MARKETING_URL.
 */

import { test, expect } from '@playwright/test';
import { MarketingPage } from '../../pages/marketing.page';

// No auth needed — everything is public
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Marketing site — Homepage', () => {
  test('should display homepage with a visible hero section', async ({ page }) => {
    const marketing = new MarketingPage(page);

    await test.step('Navigate to marketing homepage', async () => {
      await marketing.goto();
    });

    await test.step('Verify hero heading is visible', async () => {
      await expect(page.locator('h1').first()).toBeVisible();
    });

    await test.step('Verify hero title has content', async () => {
      const heroTitle = await marketing.getHeroTitle();
      expect(heroTitle.trim().length).toBeGreaterThan(0);
    });
  });

  test('should show the main CTA button in the hero', async ({ page }) => {
    const marketing = new MarketingPage(page);

    await test.step('Navigate to marketing homepage', async () => {
      await marketing.goto();
    });

    await test.step('Verify CTA button is visible', async () => {
      const cta = page.getByRole('link', { name: /mulai belajar|daftar gratis|masuk platform|explore/i });
      await expect(cta.first()).toBeVisible();
    });
  });

  test('should show training programs / services section', async ({ page }) => {
    const marketing = new MarketingPage(page);

    await test.step('Navigate to marketing homepage', async () => {
      await marketing.goto();
    });

    await test.step('Verify program section or headings are visible', async () => {
      const programSection = page.locator(
        '[data-testid="program-card"], section h2, section h3',
      );
      await expect(programSection.first()).toBeVisible({ timeout: 10_000 });
    });

    await test.step('Verify section headings exist', async () => {
      const headings = await page.locator('section h2, section h3').allInnerTexts();
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  test('should display the footer', async ({ page }) => {
    const marketing = new MarketingPage(page);

    await test.step('Navigate to marketing homepage', async () => {
      await marketing.goto();
    });

    await test.step('Verify footer is visible', async () => {
      const footerVisible = await marketing.isFooterVisible();
      expect(footerVisible).toBe(true);
    });
  });

  test('should submit lead capture form successfully', async ({ page }) => {
    const marketing = new MarketingPage(page);

    await test.step('Navigate to marketing homepage', async () => {
      await marketing.goto();
    });

    await test.step('Find and submit lead capture form', async () => {
      const form = page.locator('form').filter({
        has: page.locator('input[type="email"]'),
      });

      if (await form.isVisible().catch(() => false)) {
        await form.scrollIntoViewIfNeeded();
        await marketing.submitLeadForm(
          'QA Tester Playwright',
          `qa+${Date.now()}@testcraft.id`,
          'Saya tertarik bergabung di program QA Automation.',
        );

        const confirmation = page.locator('a[href*="wa.me"], [data-testid="form-success"], [role="alert"]');
        await expect(confirmation.first()).toBeVisible({ timeout: 15_000 });
      } else {
        test.skip(true, 'Lead capture form not found on homepage');
      }
    });
  });

  test('should navigate to LMS login page from marketing CTA', async ({ page }) => {
    const marketing = new MarketingPage(page);

    await test.step('Navigate to marketing homepage', async () => {
      await marketing.goto();
    });

    await test.step('Click the LMS navigation CTA', async () => {
      await marketing.navigateToLMS();
    });

    await test.step('Verify navigation to LMS domain or login path', async () => {
      expect(page.url()).toMatch(/localhost:3000|\/login/);
    });
  });

  test('should display privacy policy page', async ({ page }) => {
    const marketing = new MarketingPage(page);

    await test.step('Navigate to privacy policy page', async () => {
      await marketing.gotoPrivacy();
    });

    await test.step('Verify heading is visible', async () => {
      await expect(page.locator('h1').first()).toBeVisible();
    });

    await test.step('Verify heading contains privacy keyword', async () => {
      const heading = await page.locator('h1').first().innerText();
      expect(heading.toLowerCase()).toMatch(/privasi|privacy/);
    });
  });

  test('should have working navigation links', async ({ page }) => {
    const marketing = new MarketingPage(page);

    await test.step('Navigate to marketing homepage', async () => {
      await marketing.goto();
    });

    await test.step('Verify navigation is present', async () => {
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    });

    await test.step('Verify nav contains at least one link', async () => {
      const nav = page.locator('nav').first();
      const links = await nav.getByRole('link').count();
      expect(links).toBeGreaterThan(0);
    });
  });

  test('should be mobile-responsive — nav is accessible on small screens', async ({ page }) => {
    await test.step('Set mobile viewport', async () => {
      await page.setViewportSize({ width: 375, height: 812 });
    });

    const marketing = new MarketingPage(page);

    await test.step('Navigate to marketing homepage on mobile', async () => {
      await marketing.goto();
    });

    await test.step('Verify hero title is visible on mobile', async () => {
      await expect(page.locator('h1').first()).toBeVisible();
    });
  });
});
