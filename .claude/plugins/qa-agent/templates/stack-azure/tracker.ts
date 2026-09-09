/**
 * Issue-tracker gateway — **import tracker APIs from here, never from a
 * provider module directly.**
 *
 * This repo was scaffolded with the `azure` stack, so `tracker` is the Azure
 * Boards adapter. A repo on the `jira` stack has the same file re-exporting the
 * Jira adapter, with the same member names.
 */
export {
  tracker,
  buildDefectComment,
  buildTestCaseSummary,
  classifyChildBySummaryPrefix,
  extractPlanId,
  extractCaseRefs,
} from "./azure-boards-helper.js";

export type {
  DefectReport,
  TestCaseSummaryReport,
  TrackerChild,
  ChildClassification,
  FailureSource,
} from "./tracker-types.js";
