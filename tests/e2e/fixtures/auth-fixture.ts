/**
 * auth-fixture.ts
 *
 * Extends the base Playwright `test` with three authenticated page fixtures:
 *   - `studentPage`    — browser page pre-logged-in as a student
 *   - `adminPage`      — browser page pre-logged-in as an admin
 *   - `instructorPage` — browser page pre-logged-in as an instructor
 *
 * Auth state is persisted to disk as storageState JSON files so the
 * browser skips the login UI on every test run.
 *
 * Usage:
 *   import { test, expect } from '../fixtures/auth-fixture';
 *   test('student can see dashboard', async ({ studentPage }) => { ... });
 */

import * as path from 'path';
import * as fs from 'fs';
import { test as base, type BrowserContext, type Page } from '@playwright/test';
import { testUsers } from './users';

// Paths where auth storage state JSON files are written by the auth setup spec
const AUTH_STATE_DIR = path.resolve(__dirname, '../results/auth-state');

export const studentStatePath = path.join(AUTH_STATE_DIR, 'student.json');
export const adminStatePath = path.join(AUTH_STATE_DIR, 'admin.json');
export const instructorStatePath = path.join(AUTH_STATE_DIR, 'instructor.json');

// ─── Fixture type augmentation ───────────────────────────────────────────────

type AuthFixtures = {
  studentPage: Page;
  adminPage: Page;
  instructorPage: Page;
};

// ─── Helper ──────────────────────────────────────────────────────────────────

async function pageWithAuth(
  context: BrowserContext,
  statePath: string,
): Promise<Page> {
  if (fs.existsSync(statePath)) {
    // Re-use persisted session
    await context.addCookies(
      (JSON.parse(fs.readFileSync(statePath, 'utf-8')) as { cookies: Parameters<BrowserContext['addCookies']>[0] }).cookies,
    );
  }
  return context.newPage();
}

// ─── Extended test ───────────────────────────────────────────────────────────

export const test = base.extend<AuthFixtures>({
  studentPage: async ({ browser }, use) => {
    const context = await browser.newContext(
      fs.existsSync(studentStatePath)
        ? { storageState: studentStatePath }
        : {},
    );
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext(
      fs.existsSync(adminStatePath)
        ? { storageState: adminStatePath }
        : {},
    );
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  instructorPage: async ({ browser }, use) => {
    const context = await browser.newContext(
      fs.existsSync(instructorStatePath)
        ? { storageState: instructorStatePath }
        : {},
    );
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

export { expect } from '@playwright/test';
export { testUsers };
