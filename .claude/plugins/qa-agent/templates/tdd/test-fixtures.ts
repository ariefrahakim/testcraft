import { test as base, expect } from "@playwright/test";
// Qase is the TMS on both stacks (§7). Import the tagging helper directly —
// no stack branch here.
import { qase } from "playwright-qase-reporter";
import { pomFixtures, type Pages } from "./pom-fixtures.js";

/**
 * Extended Playwright `test` with page objects injected as fixtures. Classic
 * specs (`tests/e2e/<module>/<module>.spec.ts`) import `test` and `expect` from
 * here (never from "@playwright/test" directly) so every test shares the same
 * POM wiring and the Qase tagging helper.
 *
 * The fixture definitions live in `shared/pom-fixtures.ts` because the BDD
 * runner (`shared/bdd-fixtures.ts`, built on `playwright-bdd`) needs the exact
 * same page objects. Add a page object there, not here.
 */
export const test = base.extend<Pages>(pomFixtures);

export { expect, qase };
export type { Pages };
