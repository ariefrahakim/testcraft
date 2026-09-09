/**
 * Test-management gateway — **import test-management APIs from here, never from
 * a provider module directly.**
 *
 * The platform uses **Qase for test management on both stacks**. This file
 * exists so code that imports `utils/tms.js` stays stack-agnostic — the Azure
 * stack differs only in its **issue tracker** (Azure Boards work-items with the
 * `[PBI]` → `[TA]` hierarchy; see `stack-azure/tracker.ts`). Test cases,
 * plans, `steps_type`, results upload, and the automation-status flip on
 * passed cases (§7) all flow through `qase-helper.js` regardless of stack.
 *
 * Azure Test Plans is intentionally NOT the source of truth here — carrying
 * two TMS providers doubles the surface area agents have to reason about,
 * and Qase is the one both stacks already use for authoring `steps_type`
 * (classic / gherkin).
 *
 * `qase` is exported alongside `tms` as the same object so existing specs and
 * steps that reference it by name continue to work; new code should prefer
 * `tms`.
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
