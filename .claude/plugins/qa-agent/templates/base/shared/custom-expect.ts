import { expect as baseExpect, type Locator } from "@playwright/test";

/**
 * Project-specific matchers layered on Playwright's expect. Import `expect`
 * from here (or re-export through test-fixtures) when a spec needs them.
 * Keep matchers web-first (auto-retrying) — never assert on a stale snapshot.
 */
export const expect = baseExpect.extend({
  /** Asserts an element is visible AND enabled (ready to interact). */
  async toBeInteractive(locator: Locator) {
    const assertionName = "toBeInteractive";
    let pass = true;
    let detail = "";
    try {
      await baseExpect(locator).toBeVisible();
      await baseExpect(locator).toBeEnabled();
    } catch (e) {
      pass = false;
      detail = e instanceof Error ? e.message : String(e);
    }
    return {
      name: assertionName,
      pass,
      message: () =>
        pass
          ? `expected element not to be interactive`
          : `expected element to be visible and enabled\n${detail}`,
    };
  },
});
