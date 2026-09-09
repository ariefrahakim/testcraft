import { type Page } from "@playwright/test";
import { LoginPage } from "../pages/login/login.page.js";
import { logger } from "../utils/logger.js";

const log = logger.scope("session");

// Must match playwright.config.ts (chromium project `storageState`) and
// shared/auth.setup.ts `STORAGE_STATE`. Kept as a local literal (not imported
// from auth.setup.ts) so importing this module never registers the setup test.
const STORAGE_STATE = "reports/.auth/user.json";

/** True when the page is currently sitting on the SSO login screen. */
export function isOnLoginPage(page: Page): boolean {
  return /\/login(\b|\/|\?|#|$)/.test(page.url());
}

/**
 * Single-SSO mid-run recovery.
 *
 * The app-under-test allows only one active session per user (see
 * `.claude/memories/project-single-sso-serial-runs.md`). Even running serially,
 * a long regression run can outlive the session (token TTL) or have it evicted
 * by an out-of-band login — the app then bounces protected routes to `/login`
 * and every remaining test would fail at its first data wait.
 *
 * This re-establishes the session IN the live browser context (a real form
 * login on the same page re-issues the auth cookies) and refreshes the shared
 * `storageState` file so the NEXT test in the run starts already authenticated —
 * i.e. one recovery heals the rest of the module. Returns `true` if it had to
 * re-authenticate, `false` when the session was already valid (the happy path,
 * zero cost). Safe under serial execution (`workers: 1`); do not call from
 * parallel workers sharing one account.
 */
export async function reauthenticateIfLoggedOut(page: Page): Promise<boolean> {
  if (!isOnLoginPage(page)) return false;

  log.warn("Session lost (bounced to /login) — re-authenticating in place.");
  await new LoginPage(page).login();
  // Refresh the shared storage state so subsequent tests in this invocation
  // start from the recovered session instead of hitting /login again.
  await page.context().storageState({ path: STORAGE_STATE }).catch(() => undefined);
  log.info("Re-authentication complete; storage state refreshed.");
  return true;
}
