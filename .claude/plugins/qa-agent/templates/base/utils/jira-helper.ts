import { readFile } from "node:fs/promises";
import path from "node:path";
import { env } from "../shared/env.js";
import { logger } from "./logger.js";

const log = logger.scope("jira");

// --- Types -------------------------------------------------------------------

/** Where the test failure originated. FE = selector/locator/render/assertion;
 *  BE = HTTP 4xx/5xx, payload-shape mismatch, or timeout on an `**\/api/**` call. */
export type FailureSource = "fe" | "be" | "unknown";

/** Classification derived from a child issue's summary prefix.
 *  `automation` = the `[TA-…]` Playwright-automation ticket (the comment-trigger
 *  home + run-summary target); `test` covers the manual `[TM-…]` / legacy
 *  `[T-…]` / `[QA]` family (the Qase-plan source). */
export type ChildClassification =
  | "fe"
  | "be"
  | "test"
  | "automation"
  | "unknown";

export interface EpicChild {
  key: string;
  summary: string;
  status: string;
  classification: ChildClassification;
}

/** One step of the case-under-test, mirroring `QaseStep` from `qase-helper`. */
export interface ReproStep {
  position: number;
  action: string;
  data?: string;
  expectedResult?: string;
}

/** Structured failure payload following the QA bug-report template. */
export interface DefectReport {
  // Identity
  caseRef: string; // "TC-2045"
  title: string; // readable scenario title (also used as the bug title)
  status: "failed" | "broken";
  // Context (the "Summary" section in the rendered comment)
  epicKey?: string;
  routedTo?: string; // FE/BE child key, e.g. "NLM-30"
  source?: FailureSource;
  sourceReason?: string; // one line, e.g. "highlight span never renders"
  env?: string; // e.g. "Acme Portal EU — https://stage.acme.example"
  qaseRunUrl?: string;
  qaseRunId?: number;
  qaseCaseUrl?: string; // direct link to the Qase case page
  transitionApplied?: string; // transition name fired, or undefined
  // Repro (the QA-template sections)
  preconditions?: string; // free text, often from Qase case `preconditions`
  steps?: ReproStep[]; // from Qase case `steps`
  actualResult?: string; // what happened (cleaned, human)
  expectedResult?: string; // what should happen (often the last step's expected)
  // Evidence
  failedStep?: string; // the Playwright step name that threw
  error: string; // trimmed error message (kept short — code block)
  networkSummary?: string; // failing API call summary, or "no failing API call"
  /**
   * Already-uploaded Jira attachments to embed inline as image previews.
   * Each entry is `{ id, contentUrl }` from `jira.uploadAttachment(...)`.
   * The builder emits an ADF `media` `external` node referencing `contentUrl`
   * (works on Jira tenants both with and without Atlassian Media Services —
   * the `file` node form fails with `ATTACHMENT_VALIDATION_ERROR` on tenants
   * without Media Services, so we use `external` everywhere).
   */
  attachmentMedia?: Array<{ id: string; contentUrl: string }>;
  /** Local artifact paths (video, trace) — listed as text for the dev. */
  artifactPaths?: { screenshot?: string; video?: string; trace?: string };
}

/** Per-run summary posted on the `[T-…]` test-case child. */
export interface TestCaseSummaryReport {
  epicKey: string;
  qaseRunUrl: string;
  qaseRunId: number;
  env?: string;
  cases: Array<{
    ref: string;
    title: string;
    status: "passed" | "failed" | "skipped" | "broken";
    /** When failed: the FE/BE child the defect comment landed on, with comment id for deep-link. */
    routedTo?: string;
    routedCommentId?: string;
    /** One-line summary of the failure (for quick scanning). */
    failureBrief?: string;
  }>;
}

interface JiraTransition {
  id: string;
  name: string;
  to?: { id: string; name: string };
}

interface JiraIssueResponse {
  key: string;
  fields: {
    summary: string;
    status?: { name: string };
    issuetype?: { name: string };
    parent?: { key: string };
  };
}

interface JiraAttachmentResponse {
  id: string;
  filename: string;
  size?: number;
  mimeType?: string;
  /** Direct URL to the attachment binary — required for the ADF `media`
   *  `external` node form (tenants without Atlassian Media Services). */
  content?: string;
}

interface JiraCommentResponse {
  id: string;
  self: string;
}

// --- Auth + low-level fetch --------------------------------------------------

function basicAuthHeader(): string {
  if (!env.jira.email || !env.jira.token) {
    throw new Error("EMAIL / ATLASSIAN_TOKEN not set — cannot call Jira.");
  }
  const token = Buffer.from(`${env.jira.email}:${env.jira.token}`).toString(
    "base64",
  );
  return `Basic ${token}`;
}

async function jiraGet<T>(path: string): Promise<T> {
  const url = `${env.jira.baseUrl}${path}`;
  log.debug(`GET ${url}`);
  const res = await fetch(url, {
    headers: {
      Authorization: basicAuthHeader(),
      Accept: "application/json",
    },
  });
  if (!res.ok) {
    throw new Error(`Jira GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  return (await res.json()) as T;
}

async function jiraPost<T>(path: string, payload: unknown): Promise<T> {
  const url = `${env.jira.baseUrl}${path}`;
  log.debug(`POST ${url}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Jira POST ${path} failed: ${res.status} ${await res.text()}`);
  }
  const text = await res.text();
  return (text ? JSON.parse(text) : undefined) as T;
}

async function jiraPostMultipart<T>(
  path: string,
  form: FormData,
): Promise<T> {
  const url = `${env.jira.baseUrl}${path}`;
  log.debug(`POST (multipart) ${url}`);
  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: basicAuthHeader(),
      // Jira CSRF bypass for REST attachments; the API rejects without it.
      "X-Atlassian-Token": "no-check",
      Accept: "application/json",
      // DO NOT set Content-Type — runtime sets it with the multipart boundary.
    },
    body: form,
  });
  if (!res.ok) {
    throw new Error(
      `Jira POST (multipart) ${path} failed: ${res.status} ${await res.text()}`,
    );
  }
  return (await res.json()) as T;
}

// --- ADF building blocks -----------------------------------------------------

function p(text: string) {
  return { type: "paragraph", content: [{ type: "text", text }] };
}

function heading(text: string, level = 3) {
  return {
    type: "heading",
    attrs: { level },
    content: [{ type: "text", text }],
  };
}

function rule() {
  return { type: "rule" };
}

function strong(text: string) {
  return { type: "text", text, marks: [{ type: "strong" }] };
}

function bullet(label: string, value: string) {
  return {
    type: "listItem",
    content: [
      {
        type: "paragraph",
        content: [strong(`${label}: `), { type: "text", text: value }],
      },
    ],
  };
}

function bulletList(rows: Array<{ label: string; value?: string }>) {
  const items = rows
    .filter((r) => r.value && r.value.length > 0)
    .map((r) => bullet(r.label, r.value!));
  return items.length > 0 ? { type: "bulletList", content: items } : null;
}

function orderedList(items: string[]) {
  return {
    type: "orderedList",
    content: items.map((text) => ({
      type: "listItem",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    })),
  };
}

function codeBlock(text: string, language = "text") {
  return {
    type: "codeBlock",
    attrs: { language },
    content: [{ type: "text", text: text.slice(0, 6000) }],
  };
}

/**
 * Embed an uploaded attachment inline as a media block. Uses the `external`
 * form (`{ type: 'external', url: <attachment content URL> }`) which Jira
 * Cloud renders on every tenant — the `file` form (`{ type: 'file', id }`)
 * requires Atlassian Media Services and fails with
 * `ATTACHMENT_VALIDATION_ERROR` on tenants without it.
 */
function mediaSingle(contentUrl: string) {
  return {
    type: "mediaSingle",
    attrs: { layout: "center" },
    content: [
      {
        type: "media",
        attrs: { type: "external", url: contentUrl },
      },
    ],
  };
}

function pushIf<T>(arr: T[], item: T | null | undefined): void {
  if (item) arr.push(item);
}

// --- QA bug-report comment builder -------------------------------------------

/**
 * Build the FAILED defect comment in Atlassian Document Format following the
 * standard QA bug-report template:
 *   Title → Summary → Preconditions → Steps to Reproduce → Actual Result →
 *   Expected Result → Attachment → Network → Error → Footer.
 *
 * Artifacts (video / trace / screenshot local file paths) are NOT included —
 * they point at the runner's local filesystem and are unusable to reviewers.
 * The screenshot uploaded to Jira is embedded via the Attachment media node.
 */
export function buildDefectComment(d: DefectReport) {
  const sourceLabel =
    d.source === "fe"
      ? "Frontend (FE)"
      : d.source === "be"
        ? "Backend (BE)"
        : "Unclassified";

  const content: unknown[] = [];

  // Title — the bug title is the readable scenario title.
  content.push(heading(`🔴 ${d.title}`, 2));

  // Summary bullets.
  const summary = bulletList([
    { label: "Test case", value: `${d.caseRef} — ${d.title}` },
    { label: "Status", value: d.status.toUpperCase() },
    { label: "Epic", value: d.epicKey },
    { label: "Routed to", value: d.routedTo },
    {
      label: "Source",
      value: d.sourceReason ? `${sourceLabel} — ${d.sourceReason}` : sourceLabel,
    },
    { label: "Environment", value: d.env },
    { label: "Qase run", value: d.qaseRunUrl },
    { label: "Qase case", value: d.qaseCaseUrl },
    { label: "Transition applied", value: d.transitionApplied },
  ]);
  pushIf(content, summary);

  // Preconditions.
  if (d.preconditions && d.preconditions.trim().length > 0) {
    content.push(rule());
    content.push(heading("Preconditions", 4));
    content.push(p(d.preconditions.trim()));
  }

  // Steps to Reproduce — ordered list, optionally annotated with data/expected.
  if (d.steps && d.steps.length > 0) {
    content.push(rule());
    content.push(heading("Steps to Reproduce", 4));
    const lines = d.steps
      .slice()
      .sort((a, b) => a.position - b.position)
      .map((s) => {
        const extras: string[] = [];
        if (s.data) extras.push(`Data: ${s.data}`);
        if (s.expectedResult) extras.push(`Expected: ${s.expectedResult}`);
        return extras.length > 0
          ? `${s.action}\n   ${extras.join("\n   ")}`
          : s.action;
      });
    content.push(orderedList(lines));
  }

  // Actual / Expected.
  if (d.actualResult || d.failedStep) {
    content.push(rule());
    content.push(heading("Actual Result", 4));
    content.push(
      p(
        d.actualResult ??
          `Test failed at step "${d.failedStep ?? "unknown"}" — see Error section.`,
      ),
    );
  }
  if (d.expectedResult) {
    content.push(heading("Expected Result", 4));
    content.push(p(d.expectedResult));
  }

  // Attachment (embedded screenshot preview).
  if (d.attachmentMedia && d.attachmentMedia.length > 0) {
    content.push(rule());
    content.push(heading("Attachment", 4));
    for (const m of d.attachmentMedia) content.push(mediaSingle(m.contentUrl));
  }

  // Network.
  if (d.networkSummary && d.networkSummary.trim().length > 0) {
    content.push(rule());
    content.push(heading("Network", 4));
    const looksJson = d.networkSummary.trim().startsWith("{");
    content.push(codeBlock(d.networkSummary, looksJson ? "json" : "text"));
  }

  // Error (trimmed Playwright error).
  if (d.error && d.error.trim().length > 0) {
    content.push(rule());
    content.push(heading("Error", 4));
    content.push(codeBlock(d.error));
  }

  // Footer.
  content.push(rule());
  content.push(
    p(
      "Auto-posted by qa-defect (Playwright + Qase). Comment only — no bug ticket created. " +
        "If this is a selector regression rather than a product defect, route to /qa-agent-heal.",
    ),
  );

  return { type: "doc", version: 1, content };
}

// --- Test-case summary comment (posted on the [T-…] child every run) --------

export function buildTestCaseSummary(s: TestCaseSummaryReport) {
  const totals = s.cases.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );
  const passed = totals.passed ?? 0;
  const failed = totals.failed ?? 0;
  const skipped = totals.skipped ?? 0;
  const broken = totals.broken ?? 0;
  const headlineIcon = failed === 0 && broken === 0 ? "✅" : "🟠";

  const content: unknown[] = [
    heading(`${headlineIcon} Automated QA run — ${s.epicKey}`, 2),
  ];

  const summary = bulletList([
    { label: "Epic", value: s.epicKey },
    { label: "Qase run", value: s.qaseRunUrl },
    { label: "Environment", value: s.env },
    {
      label: "Totals",
      value:
        `${s.cases.length} cases — passed ${passed}, failed ${failed}` +
        (skipped ? `, skipped ${skipped}` : "") +
        (broken ? `, broken ${broken}` : ""),
    },
  ]);
  pushIf(content, summary);

  content.push(rule());
  content.push(heading("Results", 4));
  const rows = s.cases.map((c) => {
    const icon =
      c.status === "passed"
        ? "✅"
        : c.status === "failed"
          ? "🔴"
          : c.status === "broken"
            ? "🟠"
            : "⏭️";
    const tail = c.routedTo
      ? c.routedCommentId
        ? ` — see ${c.routedTo} comment ${env.jira.baseUrl}/browse/${c.routedTo}?focusedCommentId=${c.routedCommentId}`
        : ` — routed to ${c.routedTo}`
      : "";
    const brief = c.failureBrief ? ` — ${c.failureBrief}` : "";
    return `${icon} ${c.ref} — ${c.title}${brief}${tail}`;
  });
  content.push({
    type: "bulletList",
    content: rows.map((text) => ({
      type: "listItem",
      content: [{ type: "paragraph", content: [{ type: "text", text }] }],
    })),
  });

  content.push(rule());
  content.push(
    p(
      "Auto-posted by qa-defect on the test-case child. Per-failure detail comments " +
        "land on the matching [FE…] / [BE…] children — links above.",
    ),
  );

  return { type: "doc", version: 1, content };
}

// --- Epic / child / transition helpers --------------------------------------

// `[DB-…]` persistence tickets are backend-sourced for routing purposes.
const FE_RE = /^\s*\[\s*(?:fe(?:-\d+)?|frontend)\s*\]/i;
const BE_RE = /^\s*\[\s*(?:be(?:-\d+)?|backend|db(?:-\d+)?|database)\s*\]/i;
// `[TM-…]` (manual cases authored in Qase) joins the legacy `[T-…]`/`[QA]`
// family as the Qase-plan source; `[TA-…]` is the Playwright-automation ticket.
const TM_RE = /^\s*\[\s*tm(?:-\d+)?\s*\]/i;
const TA_RE = /^\s*\[\s*ta(?:-\d+)?\s*\]/i;
const TEST_RE = /^\s*\[\s*(?:t(?:-\d+)?|test\s*case|qa)\s*\]/i;

/** Classify an epic child by the bracketed prefix on its summary. The new
 *  `[TM]`/`[TA]`/`[DB]` checks run first so they aren't shadowed by the looser
 *  `[T-…]`/`[BE]` patterns. */
export function classifyChildBySummaryPrefix(
  summary: string,
): ChildClassification {
  const head = summary.slice(0, 60);
  if (TA_RE.test(head)) return "automation";
  if (TM_RE.test(head)) return "test";
  if (TEST_RE.test(head)) return "test";
  if (FE_RE.test(head)) return "fe";
  if (BE_RE.test(head)) return "be";
  const tags = head.match(/\[[^\]]+\]/g) ?? [];
  for (const tag of tags) {
    if (TA_RE.test(tag)) return "automation";
    if (TM_RE.test(tag)) return "test";
    if (TEST_RE.test(tag)) return "test";
    if (FE_RE.test(tag)) return "fe";
    if (BE_RE.test(tag)) return "be";
  }
  return "unknown";
}

function pickTransition(
  transitions: JiraTransition[],
  patterns: RegExp[],
): JiraTransition | undefined {
  for (const pat of patterns) {
    const hit = transitions.find((t) => t.to?.name && pat.test(t.to.name));
    if (hit) return hit;
  }
  for (const pat of patterns) {
    const hit = transitions.find((t) => pat.test(t.name));
    if (hit) return hit;
  }
  return undefined;
}

// --- Jira API surface --------------------------------------------------------

/** Walk an ADF tree, flattening text nodes into a single newline-separated string. */
function adfToPlainText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const n = node as { type?: string; text?: string; content?: unknown[] };
  const parts: string[] = [];
  if (typeof n.text === "string") parts.push(n.text);
  if (Array.isArray(n.content)) {
    for (const child of n.content) parts.push(adfToPlainText(child));
  }
  // Insert a newline after block-level nodes to preserve readable structure.
  const blockTypes = new Set([
    "paragraph",
    "heading",
    "listItem",
    "codeBlock",
    "blockquote",
  ]);
  return blockTypes.has(n.type ?? "") ? `${parts.join("")}\n` : parts.join("");
}

/** Extract a Qase plan id from free text. Recognises `plan:8`, `Plan 8`,
 *  `Test Plan #8`, `app.qase.io/plan/<project>/8`, etc. Returns the numeric id
 *  or null if none is found. */
export function extractQasePlanId(text: string): number | null {
  if (!text) return null;
  const patterns: RegExp[] = [
    /plan[\s/_:#-]*?(\d+)/i,
    /qase[^\d]{0,40}?(\d+)/i,
    /app\.qase\.io\/plan\/[A-Z0-9_-]+\/(\d+)/i,
  ];
  for (const re of patterns) {
    const m = text.match(re);
    if (m?.[1]) {
      const n = Number(m[1]);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return null;
}

/** Extract Qase case refs (`TC-1234`) from free text, deduped + sorted. */
export function extractQaseCaseRefs(text: string): string[] {
  if (!text) return [];
  const matches = text.match(/TC-\d+/gi) ?? [];
  const unique = Array.from(new Set(matches.map((m) => m.toUpperCase())));
  unique.sort((a, b) => Number(a.slice(3)) - Number(b.slice(3)));
  return unique;
}

export const jira = {
  /** Fetch a single issue (summary, status, issuetype). */
  async getIssue(issueKey: string): Promise<EpicChild> {
    const raw = await jiraGet<JiraIssueResponse>(
      `/rest/api/3/issue/${issueKey}?fields=summary,status,issuetype,parent`,
    );
    return {
      key: raw.key,
      summary: raw.fields.summary,
      status: raw.fields.status?.name ?? "",
      classification: classifyChildBySummaryPrefix(raw.fields.summary),
    };
  },

  /** Resolve an issue's parent/epic key (the `parent` field, falling back to
   *  none). Used by the `[TA]`-driven orchestrator to walk
   *  `[TA]` child → parent → sibling tickets. Returns `null` if the issue has
   *  no parent. */
  async getParentKey(issueKey: string): Promise<string | null> {
    const raw = await jiraGet<JiraIssueResponse>(
      `/rest/api/3/issue/${issueKey}?fields=parent`,
    );
    return raw.fields.parent?.key ?? null;
  },

  /** Fetch an issue's comments, newest last, as flattened plain text. Used by
   *  the poller to detect `QA Agent <KEY>` directives + the `🤖 picked up` ack,
   *  and by the orchestrator to scan a `[TM]`/`[QA]` ticket's comments for a
   *  Qase plan URL (mirrors the [QA]-child-comment-scan lookup rule). */
  async getIssueComments(issueKey: string): Promise<
    {
      id: string;
      authorEmail: string;
      bodyText: string;
      created: string;
    }[]
  > {
    interface CommentListResponse {
      comments?: {
        id: string;
        author?: { emailAddress?: string };
        body?: unknown;
        created?: string;
      }[];
    }
    const raw = await jiraGet<CommentListResponse>(
      `/rest/api/3/issue/${issueKey}/comment?maxResults=200&orderBy=created`,
    );
    return (raw.comments ?? []).map((c) => ({
      id: c.id,
      authorEmail: c.author?.emailAddress ?? "",
      bodyText: adfToPlainText(c.body).trim(),
      created: c.created ?? "",
    }));
  },

  /** Run an arbitrary JQL query, returning the matched issues classified by
   *  their summary prefix. Used by the poller to list `[TA]` tickets. Shares
   *  the /rest/api/3/search/jql shape with `getEpicChildren`. */
  async searchByJql(jql: string): Promise<EpicChild[]> {
    interface SearchResponse {
      issues: JiraIssueResponse[];
      nextPageToken?: string;
    }
    const issues: JiraIssueResponse[] = [];
    let nextPageToken: string | undefined;
    do {
      const body: Record<string, unknown> = {
        jql,
        fields: ["summary", "status", "issuetype", "parent"],
        maxResults: 100,
      };
      if (nextPageToken) body.nextPageToken = nextPageToken;
      const res = await jiraPost<SearchResponse>(`/rest/api/3/search/jql`, body);
      issues.push(...(res.issues ?? []));
      nextPageToken = res.nextPageToken;
    } while (nextPageToken);

    return issues.map((i) => ({
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status?.name ?? "",
      classification: classifyChildBySummaryPrefix(i.fields.summary),
    }));
  },

  /** Fetch an issue's description as plain text (ADF flattened). Empty string
   *  if the issue has no description. Used by the orchestrator to extract the
   *  Qase plan id from the `[Test]` child of an epic. */
  async getIssueDescription(issueKey: string): Promise<string> {
    interface DescResponse {
      fields: { description?: unknown };
    }
    const raw = await jiraGet<DescResponse>(
      `/rest/api/3/issue/${issueKey}?fields=description`,
    );
    return adfToPlainText(raw.fields.description).trim();
  },

  /**
   * List children of an epic. Uses /rest/api/3/search/jql (the legacy
   * /rest/api/3/search endpoint was retired in 2025 and returns 410 Gone).
   */
  async getEpicChildren(epicKey: string): Promise<EpicChild[]> {
    interface SearchResponse {
      issues: JiraIssueResponse[];
      nextPageToken?: string;
    }
    const issues: JiraIssueResponse[] = [];
    let nextPageToken: string | undefined;
    do {
      const body: Record<string, unknown> = {
        jql: `parent = ${epicKey} OR "Epic Link" = ${epicKey}`,
        fields: ["summary", "status", "issuetype"],
        maxResults: 100,
      };
      if (nextPageToken) body.nextPageToken = nextPageToken;
      const res = await jiraPost<SearchResponse>(
        `/rest/api/3/search/jql`,
        body,
      );
      issues.push(...(res.issues ?? []));
      nextPageToken = res.nextPageToken;
    } while (nextPageToken);

    return issues.map((i) => ({
      key: i.key,
      summary: i.fields.summary,
      status: i.fields.status?.name ?? "",
      classification: classifyChildBySummaryPrefix(i.fields.summary),
    }));
  },

  /** Available transitions on an issue. */
  async getTransitions(issueKey: string): Promise<JiraTransition[]> {
    interface TransitionsResponse {
      transitions: JiraTransition[];
    }
    const res = await jiraGet<TransitionsResponse>(
      `/rest/api/3/issue/${issueKey}/transitions`,
    );
    return res.transitions;
  },

  /** Execute the first available transition matching one of `namePatterns`. */
  async transitionByName(
    issueKey: string,
    namePatterns: RegExp[],
  ): Promise<JiraTransition | null> {
    const transitions = await this.getTransitions(issueKey);
    const pick = pickTransition(transitions, namePatterns);
    if (!pick) {
      log.warn(
        `No transition on ${issueKey} matched ${namePatterns.map(String).join(", ")}. ` +
          `Available: ${transitions.map((t) => t.name).join(", ") || "(none)"}.`,
      );
      return null;
    }
    log.info(`Transitioning ${issueKey} → "${pick.name}" (id ${pick.id}).`);
    await jiraPost<void>(`/rest/api/3/issue/${issueKey}/transitions`, {
      transition: { id: pick.id },
    });
    return pick;
  },

  /**
   * The ONLY workflow transition this platform performs: move a `[TA-…]`
   * automation ticket to **WAITING TO DEPLOY** when a run is fully green.
   *
   * Everything else is comment-only. There is deliberately no failed-state
   * transition and no transition of FE/BE/QA children — driving a developer's
   * board from a test run creates more confusion than it saves, and the
   * previous pattern lists were tuned to one tenant's workflow, so any other
   * team got a silent no-op.
   *
   * The transition is discovered live and matched on the destination state, so
   * no transition id is ever hardcoded. The surface name differs per tenant
   * (on some boards the button reads "Pull request"), which is why the match is
   * on `to.name` rather than the transition's own label.
   *
   * Returns `null` — and logs what WAS available — when the ticket offers no
   * path to that state. Callers must report that plainly rather than treating
   * it as success: a run that says "transitioned" when nothing moved is how a
   * board silently drifts out of sync with reality.
   */
  async transitionToWaitingToDeploy(
    issueKey: string,
  ): Promise<JiraTransition | null> {
    const transitions = await this.getTransitions(issueKey);
    const target = /^waiting\s*(to|for)?\s*deploy(ment)?$/i;
    const pick =
      transitions.find((t) => target.test(t.to?.name ?? "")) ??
      transitions.find((t) => target.test(t.name));

    if (!pick) {
      log.warn(
        `${issueKey}: no transition leads to WAITING TO DEPLOY. ` +
          `Available: ${
            transitions
              .map((t) => `${t.name}${t.to?.name ? ` → ${t.to.name}` : ""}`)
              .join(", ") || "(none)"
          }.`,
      );
      return null;
    }

    log.info(
      `Transitioning ${issueKey} → "${pick.to?.name ?? pick.name}" via "${pick.name}" (id ${pick.id}).`,
    );
    await jiraPost<void>(`/rest/api/3/issue/${issueKey}/transitions`, {
      transition: { id: pick.id },
    });
    return pick;
  },

  /**
   * Failed-path counterpart to {@link transitionToWaitingToDeploy}: routes an
   * `[FE-…]` / `[BE-…]` child to a `TEST: FAILED/BUGS`-shaped state on a red
   * run. Mirrors the Azure Boards helper so `tracker.transitionToTestFailed`
   * works stack-agnostically. Discovered live and matched on the destination
   * state — never a hardcoded transition id. Returns `null` (and logs what
   * WAS available) if the ticket offers no such path.
   */
  async transitionToTestFailed(
    issueKey: string,
  ): Promise<JiraTransition | null> {
    const transitions = await this.getTransitions(issueKey);
    const target = /^test:?\s*(failed|bugs?|failure)|failed\/?bugs?$/i;
    const pick =
      transitions.find((t) => target.test(t.to?.name ?? "")) ??
      transitions.find((t) => target.test(t.name));

    if (!pick) {
      log.warn(
        `${issueKey}: no transition leads to TEST: FAILED/BUGS. ` +
          `Available: ${
            transitions
              .map((t) => `${t.name}${t.to?.name ? ` → ${t.to.name}` : ""}`)
              .join(", ") || "(none)"
          }.`,
      );
      return null;
    }

    log.info(
      `Transitioning ${issueKey} → "${pick.to?.name ?? pick.name}" via "${pick.name}" (id ${pick.id}).`,
    );
    await jiraPost<void>(`/rest/api/3/issue/${issueKey}/transitions`, {
      transition: { id: pick.id },
    });
    return pick;
  },

  /**
   * Upload a file as an issue attachment. Returns the attachment id used to
   * embed the file inline via the ADF `media` node.
   */
  async uploadAttachment(
    issueKey: string,
    filename: string,
    content: Buffer,
    mimeType = "application/octet-stream",
  ): Promise<JiraAttachmentResponse> {
    const form = new FormData();
    form.append(
      "file",
      new Blob([new Uint8Array(content)], { type: mimeType }),
      filename,
    );
    log.info(`Uploading attachment ${filename} → ${issueKey}…`);
    const res = await jiraPostMultipart<JiraAttachmentResponse[]>(
      `/rest/api/3/issue/${issueKey}/attachments`,
      form,
    );
    const first = Array.isArray(res) ? res[0] : undefined;
    if (!first) {
      throw new Error(`Jira attachment upload returned no entries.`);
    }
    // Backfill `content` if Jira returned it under another field, or build it
    // from the id (the REST endpoint is stable per Atlassian docs).
    if (!first.content) {
      first.content = `${env.jira.baseUrl}/rest/api/3/attachment/content/${first.id}`;
    }
    log.info(`Uploaded ${filename} as attachment ${first.id} (${first.content}).`);
    return first;
  },

  /** Convenience: upload from a local file path. */
  async uploadAttachmentFromPath(
    issueKey: string,
    filePath: string,
  ): Promise<JiraAttachmentResponse> {
    const buf = await readFile(filePath);
    const name = path.basename(filePath);
    const mime = filePath.endsWith(".png")
      ? "image/png"
      : filePath.endsWith(".webm")
        ? "video/webm"
        : filePath.endsWith(".zip")
          ? "application/zip"
          : "application/octet-stream";
    return this.uploadAttachment(issueKey, name, buf, mime);
  },

  /**
   * Post a comment. Returns the comment id so callers can deep-link via
   * `<baseUrl>/browse/<issue>?focusedCommentId=<id>`.
   */
  async addComment(
    issueKey: string,
    body: ReturnType<typeof buildDefectComment> | string,
  ): Promise<JiraCommentResponse> {
    const url = `/rest/api/3/issue/${issueKey}/comment`;
    const adf =
      typeof body === "string"
        ? { type: "doc", version: 1, content: [p(body)] }
        : body;
    log.info(`Commenting on ${issueKey}…`);
    const res = await jiraPost<JiraCommentResponse>(url, { body: adf });
    log.info(`Comment posted to ${issueKey} (id ${res?.id}).`);
    return res;
  },

  /** Legacy single-issue convenience. Defaults to the configured story key. */
  async reportDefect(report: DefectReport): Promise<void> {
    await this.addComment(env.jira.storyKey, buildDefectComment(report));
  },
};
