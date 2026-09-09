import type { Page } from "@playwright/test";
import { LoginPage } from "../pages/login/login.page.js";

/**
 * The page-object fixtures, declared once and shared by every runner:
 *
 *  - `shared/test-fixtures.ts`  — classic specs under `tests/e2e/` (TDD)
 *  - `shared/bdd/fixtures.ts`   — BDD step definitions under `steps/`
 *
 * Add a new page object here **once** and both flows see it, so a BDD scenario
 * and a classic spec always drive the same POM (CLAUDE.md §5a).
 *
 * This file GROWS as qa-codegen generates modules — it is owned by this repo
 * and never overwritten by `qa-agent-upgrade`. The skeleton ships with the
 * login POM only.
 */
export interface Pages {
  loginPage: LoginPage;
}

/**
 * What a **business step** (`steps/<area>/<module>.steps.ts`) receives.
 *
 * The step layer is shared by both flows — `Feature → Step → Page → Locator`
 * (BDD) and `Spec → Step → Page → Locator` (TDD) — so a step takes the page
 * objects (and `page` when it genuinely needs the raw page, e.g. a viewport
 * change) and nothing runner-specific. Declare a step's own context as a
 * `Pick<>` of this type so its dependencies are visible in the signature:
 *
 * ```ts
 * export async function openProfileDropdown({
 *   loginPage,
 * }: Pick<StepContext, "loginPage">): Promise<void> {
 *   await loginPage.navigate();
 * }
 * ```
 */
export type StepContext = Pages & { page: Page };

type Use<T> = (value: T) => Promise<void>;

export const pomFixtures = {
  loginPage: async ({ page }: { page: Page }, use: Use<LoginPage>) => {
    await use(new LoginPage(page));
  },
};
