import { test as setup, expect } from "@playwright/test";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { LoginPage } from "../pages/login/login.page.js";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const log = logger.scope("auth");

export const STORAGE_STATE = "reports/.auth/user.json";

/**
 * Runs once (the `setup` project) before the test projects. Performs a real
 * form login and persists cookies + localStorage so individual specs start
 * already authenticated. Tests that specifically exercise login should NOT use
 * this state — they navigate to the login screen themselves.
 *
 * The login flow differs per app, so this file is **owned by this repo**:
 * `qa-agent-upgrade` never overwrites it. Adjust the post-login assertion via
 * `POST_LOGIN_URL_PATTERN` in `.env` rather than editing the regex here.
 */
setup("authenticate primary {{APP_NAME}} user", async ({ page }) => {
  mkdirSync(dirname(STORAGE_STATE), { recursive: true });

  log.info(`Logging in as ${env.userId} at ${env.host}`);
  const login = new LoginPage(page);
  await login.login();

  // Confirm we actually landed in the app before trusting the session.
  await expect(page).toHaveURL(new RegExp(env.postLoginUrlPattern));

  await page.context().storageState({ path: STORAGE_STATE });
  log.info(`Saved authenticated storage state → ${STORAGE_STATE}`);
});
