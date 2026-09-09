/**
 * Registration flow — smoke tests for the /register page.
 */

import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { uniqueEmail } from '../../fixtures/users';

// No pre-authenticated state for registration tests
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Registration page', () => {
  test('should display the registration form', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to register page', async () => {
      await auth.gotoRegister();
    });

    await test.step('Verify name field is visible', async () => {
      await expect(page.getByLabel(/nama/i)).toBeVisible();
    });

    await test.step('Verify email field is visible', async () => {
      await expect(page.getByLabel(/email/i)).toBeVisible();
    });

    await test.step('Verify password field is visible', async () => {
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
    });
  });

  test('should register a new student account successfully', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to register page', async () => {
      await auth.gotoRegister();
    });

    await test.step('Fill and submit registration form with unique email', async () => {
      const email = uniqueEmail('student');
      await auth.register('QA Test Student', email, 'Secure#Password1');
    });

    await test.step('Verify redirect to dashboard after successful registration', async () => {
      await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 15_000 });
      expect(page.url()).not.toContain('/register');
      expect(page.url()).not.toContain('/login');
    });
  });

  test('should validate required fields — empty form submission', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to register page', async () => {
      await auth.gotoRegister();
    });

    await test.step('Submit empty form', async () => {
      await page.locator('button[type="submit"]').click();
    });

    await test.step('Verify still on register page due to validation', async () => {
      expect(page.url()).toContain('/register');
    });
  });

  test('should reject a duplicate email address', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to register page', async () => {
      await auth.gotoRegister();
    });

    await test.step('Submit form with existing email address', async () => {
      await auth.register('Duplicate User', 'student@testcraft.id', 'AnyPassword#1');
    });

    await test.step('Verify error message is shown for duplicate email', async () => {
      const error = await auth.getLoginError();
      expect(error.length).toBeGreaterThan(0);
    });
  });

  test('should have a link to the login page', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to register page', async () => {
      await auth.gotoRegister();
    });

    await test.step('Verify login link is visible', async () => {
      const loginLink = page.getByRole('link', { name: /masuk|login|sign in/i });
      await expect(loginLink).toBeVisible();
    });

    await test.step('Click login link and verify navigation', async () => {
      const loginLink = page.getByRole('link', { name: /masuk|login|sign in/i });
      await loginLink.click();
      await expect(page).toHaveURL(/\/login/);
    });
  });
});
