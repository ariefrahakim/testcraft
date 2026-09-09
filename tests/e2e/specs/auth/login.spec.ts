/**
 * Login flow — smoke tests for the /login page.
 *
 * These tests run without a pre-authenticated state so they always exercise
 * the real login UI.
 */

import { test, expect } from '@playwright/test';
import { AuthPage } from '../../pages/auth.page';
import { testUsers } from '../../fixtures/users';

// Ensure every test in this file starts from an unauthenticated browser
test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Login page', () => {
  test('should display the login form', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to login page', async () => {
      await auth.goto();
    });

    await test.step('Verify email field is visible', async () => {
      await expect(page.locator('#email')).toBeVisible();
    });

    await test.step('Verify password field is visible', async () => {
      await expect(page.locator('#password')).toBeVisible();
    });

    await test.step('Verify submit button is visible', async () => {
      await expect(page.getByRole('button', { name: /masuk|login|sign in/i })).toBeVisible();
    });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to login page', async () => {
      await auth.goto();
    });

    await test.step('Submit login form with valid student credentials', async () => {
      await auth.login(testUsers.student.email, testUsers.student.password);
    });

    await test.step('Verify redirect away from login page', async () => {
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
      expect(page.url()).not.toContain('/login');
    });
  });

  test('should show error message for invalid password', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to login page', async () => {
      await auth.goto();
    });

    await test.step('Submit login form with wrong password', async () => {
      await auth.login(testUsers.student.email, 'Wrong$Password99');
    });

    await test.step('Verify error message is displayed', async () => {
      const error = await auth.getLoginError();
      expect(error.length).toBeGreaterThan(0);
    });

    await test.step('Verify still on login page', async () => {
      expect(page.url()).toContain('/login');
    });
  });

  test('should show error message for non-existent email', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to login page', async () => {
      await auth.goto();
    });

    await test.step('Submit login form with unknown email', async () => {
      await auth.login('nobody@does.not.exist', 'SomePassword#1');
    });

    await test.step('Verify error message is displayed', async () => {
      const error = await auth.getLoginError();
      expect(error.length).toBeGreaterThan(0);
    });
  });

  test('should redirect to dashboard after successful student login', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to login page', async () => {
      await auth.goto();
    });

    await test.step('Login as student', async () => {
      await auth.login(testUsers.student.email, testUsers.student.password);
    });

    await test.step('Verify redirect to dashboard', async () => {
      await page.waitForURL(/\/dashboard/, { timeout: 15_000 });
      expect(page.url()).toContain('/dashboard');
    });
  });

  test('should maintain session on page refresh', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to login page', async () => {
      await auth.goto();
    });

    await test.step('Login as student', async () => {
      await auth.login(testUsers.student.email, testUsers.student.password);
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
    });

    await test.step('Refresh the page', async () => {
      await page.reload({ waitUntil: 'networkidle' });
    });

    await test.step('Verify session persists after refresh', async () => {
      expect(page.url()).not.toContain('/login');
      expect(page.url()).not.toContain('/register');
    });
  });

  test('should logout successfully', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to login page', async () => {
      await auth.goto();
    });

    await test.step('Login as student', async () => {
      await auth.login(testUsers.student.email, testUsers.student.password);
      await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });
    });

    await test.step('Click logout button', async () => {
      await auth.logout();
    });

    await test.step('Verify redirected to login page', async () => {
      await expect(page).toHaveURL(/\/login/);
      await expect(page.locator('#email')).toBeVisible();
    });
  });

  test('should redirect admin to admin panel after login', async ({ page }) => {
    const auth = new AuthPage(page);

    await test.step('Navigate to login page', async () => {
      await auth.goto();
    });

    await test.step('Login as admin', async () => {
      await auth.login(testUsers.admin.email, testUsers.admin.password);
    });

    await test.step('Verify redirect to admin panel', async () => {
      await page.waitForURL(/\/admin/, { timeout: 15_000 });
      expect(page.url()).toContain('/admin');
    });
  });
});
