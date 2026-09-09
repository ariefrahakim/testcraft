/**
 * Auth setup — runs before the main test suite as the "setup:student" project.
 *
 * Logs in as each role and saves the storageState JSON files so that
 * auth-fixture.ts can reuse them without repeating the login UI flow.
 */

import { test as setup } from '@playwright/test';
import { testUsers } from '../../fixtures/users';
import { loginAndSaveState, AUTH_PATHS } from '../../utils/auth-helpers';

setup.describe('Auth state setup', () => {
  setup('save student auth state', async ({ page }) => {
    await loginAndSaveState(
      page,
      testUsers.student.email,
      testUsers.student.password,
      AUTH_PATHS.student,
    );
  });

  setup('save admin auth state', async ({ page }) => {
    await loginAndSaveState(
      page,
      testUsers.admin.email,
      testUsers.admin.password,
      AUTH_PATHS.admin,
    );
  });

  setup('save instructor auth state', async ({ page }) => {
    await loginAndSaveState(
      page,
      testUsers.instructor.email,
      testUsers.instructor.password,
      AUTH_PATHS.instructor,
    );
  });
});
