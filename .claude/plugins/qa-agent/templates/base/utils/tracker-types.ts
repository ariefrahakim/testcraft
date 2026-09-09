/**
 * Neutral issue-tracker shapes, shared by the Jira and Azure Boards adapters.
 *
 * Epics and User Stories mean the same thing in both systems, and the ticket
 * prefixes (`[FE-…]`, `[BE-…]`, `[TM-…]`, `[TA-…]`) are a team convention rather
 * than a tracker feature — so a repo that migrates between them keeps its
 * naming and its routing.
 *
 * One difference is unavoidable and deliberately visible here rather than
 * hidden: **attachments**. Jira comments are ADF and reference an uploaded file
 * by media id; Azure comments are HTML and reference it by URL. Both fields are
 * optional; an adapter reads the one its format needs.
 */

export type FailureSource = "fe" | "be" | "unknown";

export type ChildClassification =
  | "fe"
  | "be"
  | "test"
  | "automation"
  | "unknown";

export interface TrackerChild {
  /** Jira issue key (`NLM-30`) or Azure work-item id as a string (`4821`). */
  key: string;
  summary: string;
  status: string;
  classification: ChildClassification;
}

export interface ReproStep {
  position?: number;
  action?: string;
  data?: string;
  expectedResult?: string;
}

export interface DefectReport {
  title: string;
  caseRef?: string;
  /** FE/BE child the comment was routed to. */
  routedTo?: string;
  source?: FailureSource;
  /** One line, e.g. "highlight span never renders". */
  sourceReason?: string;
  /** e.g. "Acme Portal EU — https://stage.acme.example" */
  env?: string;
  /** Test-management run, whichever system produced it. */
  tmsRunUrl?: string;
  tmsRunId?: number;
  tmsCaseUrl?: string;
  preconditions?: string;
  steps?: ReproStep[];
  actualResult?: string;
  expectedResult?: string;
  network?: string;
  error?: string;
  artifacts?: string[];
  /** Azure (HTML `<img src>`): uploaded attachment URLs. */
  attachmentUrls?: string[];
  /** Jira (ADF `media` node): uploaded attachment ids. */
  attachmentMediaIds?: string[];
}

export interface TestCaseSummaryReport {
  title?: string;
  passed?: number;
  failed?: number;
  skipped?: number;
  tmsRunUrl?: string;
  tmsRunId?: number;
  cases?: {
    caseRef: string;
    title: string;
    status: string;
    /** Deep-link to the per-failure comment on the routed child. */
    commentUrl?: string;
  }[];
}
