/**
 * auth-helpers.ts
 *
 * Utilities for persisting and loading browser authentication state.
 * Used by the auth setup spec (specs/auth/auth.setup.ts) to save storageState
 * files that are then consumed by the auth-fixture.ts.
 */

import * as path from 'path';
import * as fs from 'fs';
import type { Page } from '@playwright/test';

const AUTH_STATE_DIR = path.resolve(__dirname, '../results/auth-state');

export const AUTH_PATHS = {
  student: path.join(AUTH_STATE_DIR, 'student.json'),
  admin: path.join(AUTH_STATE_DIR, 'admin.json'),
  instructor: path.join(AUTH_STATE_DIR, 'instructor.json'),
} as const;

/** Ensure the auth-state output directory exists. */
export function ensureAuthDir(): void {
  if (!fs.existsSync(AUTH_STATE_DIR)) {
    fs.mkdirSync(AUTH_STATE_DIR, { recursive: true });
  }
}

/**
 * Perform a full browser login flow for the given credentials and
 * save the resulting storageState to `savePath`.
 *
 * Call this inside a `test.use({ storageState: undefined })` project so
 * the page starts fresh (no existing cookies).
 */
export async function loginAndSaveState(
  page: Page,
  email: string,
  password: string,
  savePath: string,
): Promise<void> {
  ensureAuthDir();

  const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';

  await page.goto(`${baseURL}/login`);
  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);
  await page.getByRole('button', { name: /masuk|login|sign in/i }).click();

  // Wait until redirected away from /login — indicates success
  await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 15_000 });

  // Persist cookies + localStorage
  await page.context().storageState({ path: savePath });
}

/**
 * Return true if a valid (non-expired) storageState file exists for the given path.
 * Currently only checks file existence; can be extended to inspect token expiry.
 */
export function hasValidAuthState(statePath: string): boolean {
  return fs.existsSync(statePath);
}

/**
 * Delete all saved auth state files (useful when seeded accounts have changed).
 */
export function clearAllAuthStates(): void {
  for (const p of Object.values(AUTH_PATHS)) {
    if (fs.existsSync(p)) {
      fs.unlinkSync(p);
    }
  }
}
