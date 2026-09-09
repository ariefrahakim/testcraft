/**
 * The neutral test-management shapes the generator operates on.
 *
 * Test management is **Qase on both stacks** — the only per-stack difference
 * is the issue tracker (Jira vs Azure Boards). The generator still consumes
 * this neutral shape (rather than the raw Qase types) because it lets
 * `gherkin.ts`, qa-codegen and the agents stay provider-agnostic: if a case's
 * origin ever changes, only the adapter boundary moves — the layers above
 * never learn about it.
 *
 * The `tms` gateway lives in `utils/tms.ts`, which re-exports the Qase
 * implementation on both stacks. Import from there, never from a provider
 * module directly.
 */

/** One authored step of a test case. */
export interface TmsStep {
  /** 1-indexed position within the case. */
  position: number;
  /** What the tester does. For a Gherkin case, one or more Gherkin lines. */
  action: string;
  /** Optional data column. */
  data?: string;
  /** What should happen. Empty for a Gherkin case (the Then lines carry it). */
  expected_result?: string;
}

/**
 * Automation status, normalised across systems.
 *
 * The value decides **execution, not emission**: every case in a plan is
 * generated either way, so the generated file stays 1:1 with the plan; a case
 * that is not flagged for automation is emitted and skipped, surfacing in the
 * run as `skipped` rather than a false pass (CLAUDE.md §7).
 *
 *   0 — not automated / manual
 *   1 — to be automated  (Qase "TO BE AUTOMATED"; Azure "Planned")
 *   2 — automated        (Qase "Automated";       Azure "Automated")
 */
export type TmsAutomationStatus = 0 | 1 | 2;

export interface TmsCase {
  /** Numeric id used by `qase.id(...)` / the Azure result payload. */
  id: number;
  title: string;
  /**
   * How the case is authored — decides TDD spec vs BDD feature (CLAUDE.md §5a).
   *
   * `"steps"` is Qase's legacy alias for `"classic"` and is accepted here so an
   * older project does not have to be re-tagged; `caseStyle()` treats anything
   * that is not `"gherkin"` as classic.
   *
   * Optional because Qase omits the field on older cases; absent reads as
   * classic, which is the safe default (a spec, not a feature file).
   */
  steps_type?: "classic" | "gherkin" | "steps";
  steps: TmsStep[];
  preconditions?: string;
  /** The folder/suite the case lives in — becomes the `<area>` path segment. */
  suite_title?: string;
  automation?: TmsAutomationStatus;
}

export interface TmsPlanCaseRef {
  case_id: number;
}

export interface TmsPlan {
  id: number;
  title: string;
  description?: string;
  cases: TmsPlanCaseRef[];
}

/** What `tms.getPlanStyle()` reports for a whole plan. */
export interface TmsPlanStyle {
  style: "classic" | "bdd" | "mixed";
  classic: number;
  bdd: number;
}
