/**
 * Issue-tracker gateway — **import tracker APIs from here, never from a
 * provider module directly.**
 *
 * This repo was scaffolded with the `jira` stack, so `tracker` is the Jira
 * adapter. A repo on the `azure` stack has the same file re-exporting the Azure
 * Boards adapter, with the same member names.
 *
 * `jira` is exported alongside `tracker` as the same object, for existing code
 * that imports it by that name. New code should prefer `tracker`.
 */
export {
  jira,
  jira as tracker,
  buildDefectComment,
  buildTestCaseSummary,
  classifyChildBySummaryPrefix,
  extractQasePlanId,
  extractQasePlanId as extractPlanId,
  extractQaseCaseRefs,
  extractQaseCaseRefs as extractCaseRefs,
} from "./jira-helper.js";

export type {
  DefectReport,
  TestCaseSummaryReport,
  ChildClassification,
  FailureSource,
} from "./jira-helper.js";

/** Jira calls it an epic child; the neutral name is a tracker child. */
export type { EpicChild, EpicChild as TrackerChild } from "./jira-helper.js";
