/**
 * Test-management gateway — **import test-management APIs from here, never from
 * a provider module directly.**
 *
 * This repo was scaffolded with the `jira` stack, so `tms` is the Qase adapter.
 * A repo on the `azure` stack has the same file re-exporting the Azure Test
 * Plans adapter, with the same member names. Code and agent prompts that go
 * through this module work on either stack unchanged.
 *
 * `qase` is exported alongside `tms` as the same object: existing specs, steps
 * and helpers in Qase-stack repos import it by that name, and renaming them all
 * would be churn with no benefit. New code should prefer `tms`.
 *
 * Note: `qase.id(...)` inside a spec is a **different** thing — that comes from
 * `playwright-qase-reporter` via `shared/test-fixtures.ts` and tags the test for
 * the reporter. It is unrelated to this gateway.
 */
export {
  qase,
  qase as tms,
  featureSync,
  parseCaseId,
  slugify,
  caseToGherkin,
  renderFeature,
  renderStepStub,
} from "./qase-helper.js";

export type {
  TmsCase,
  TmsStep,
  TmsPlan,
  TmsPlanStyle,
  TmsAutomationStatus,
} from "./tms-types.js";
