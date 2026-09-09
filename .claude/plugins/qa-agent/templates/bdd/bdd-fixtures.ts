import type { TestInfo } from "@playwright/test";
import { test as base, createBdd } from "playwright-bdd";
// Qase is the TMS on BOTH stacks (§7 of CLAUDE.md) — do NOT wrap this
// import in a stack region.
import { qase } from "playwright-qase-reporter";
import { env } from "../env.js";
import { logger } from "../../utils/logger.js";
import { pomFixtures, type Pages } from "../pom-fixtures.js";

/**
 * BDD runner wiring — the `playwright-bdd` counterpart of
 * `shared/test-fixtures.ts`.
 *
 * `test` is playwright-bdd's test extended with **the same page-object
 * fixtures** the classic specs use (`shared/pom-fixtures.ts`), so a step
 * definition drives the app through the existing `pages/<m>/<m>.page.ts` +
 * `locators/<m>/<m>.locator.ts` and never touches a raw selector
 * (CLAUDE.md §4/§6, ESLint-enforced).
 *
 * Step definitions import `Given` / `When` / `Then` from here:
 *
 * ```ts
 * import { Given, When, Then } from "../../shared/bdd/fixtures.js";
 *
 * Given("the user has opened the profile dropdown", async ({ somePage }) => {
 *   await somePage.openProfileDropdown();
 * });
 * ```
 *
 * This file is listed in the `steps` patterns of the `bdd` project in
 * `playwright.config.ts`, so the scenario hooks below are registered by
 * `bddgen`.
 */
export const test = base.extend<Pages>(pomFixtures);

export const { Given, When, Then, Step, Before, After, BeforeAll, AfterAll } =
  createBdd(test);

/**
 * Placeholder body for a declared-but-unimplemented step — what
 * `qase:feature-sync --emit-steps` fills every stub with.
 *
 * It marks the scenario **skipped**, naming the step, so a half-built module is
 * visibly incomplete instead of falsely green (and without the false red a
 * `throw` would produce). Same outcome as the project's
 * `missingSteps: "skip-scenario"` setting for steps that are not declared at
 * all. Replace it with a real body once the page object has the method it needs.
 */
export const pending = ({
  $testInfo,
  $step,
}: {
  $testInfo: TestInfo;
  $step: { title: string };
}): void => {
  $testInfo.skip(true, `pending step definition: ${$step.title}`);
};

/**
 * Qase wiring, driven entirely by Gherkin tags:
 *
 *   `@qase-id:159`         → `qase.id(159)`; repeat the tag for a multi-id case.
 *   `@qase-project:<CODE>` → the scenario is skipped unless `QASE_PROJECT`
 *                            matches, so a feature mirrored from another Qase
 *                            project can never upload results into the wrong
 *                            one.
 *   `@manual`              → the case is not flagged **"To be automated"** in
 *                            Qase (automation status ≠ 1). We still emit the
 *                            scenario so it appears in the Qase run — pinned by
 *                            `@qase-id` — but skip execution. This surfaces the
 *                            case as `skipped` in Qase results instead of a
 *                            false green, and keeps the feature file 1:1 with
 *                            the plan.
 */
Before(async ({ $tags, $testInfo }) => {
  const values = (prefix: string) =>
    $tags
      .filter((tag) => tag.startsWith(`@${prefix}:`))
      .map((tag) => tag.slice(prefix.length + 2));

  // Qase is the TMS on both stacks (§7 of CLAUDE.md), so this wiring is
  // stack-agnostic.
  const activeProject = env.qase.project;

  const [featureProject] = values("qase-project");
  $testInfo.skip(
    Boolean(featureProject && featureProject !== activeProject),
    `scenario is authored against test-management project ${featureProject}; the active project is ${activeProject}`,
  );

  const ids = values("qase-id")
    .map((value) => Number(value))
    .filter((id) => Number.isFinite(id) && id > 0);

  // The Qase reporter needs the id set through its own API.
  const [firstId] = ids;
  if (ids.length > 1) qase.id(ids);
  else if (firstId !== undefined) qase.id(firstId);

  // Honor Qase's "To be automated" checkbox — a case tagged `@manual` is not
  // flagged for automation, so we report it as skipped rather than running it.
  $testInfo.skip(
    $tags.includes("@manual"),
    "case is not flagged 'To be automated' in Qase (@manual) — reporting as skipped",
  );
});

const log = logger.scope("bdd");

/**
 * Failure breadcrumb — the BDD counterpart of `attachFailureArtifacts()` in
 * `shared/hooks.ts` (which only serves classic specs). Screenshots, videos and
 * traces are configured globally in `playwright.config.ts`; this hook just logs
 * the line the Defect Agent keys off when summarising a failure.
 */
After(async ({ $testInfo }) => {
  if ($testInfo.status !== $testInfo.expectedStatus) {
    log.error(
      `FAILED: ${$testInfo.title} (${$testInfo.status}) — ${$testInfo.errors[0]?.message ?? ""}`,
    );
    log.error(`Artifacts under: ${$testInfo.outputDir}`);
  }
});
