import { readFileSync } from "node:fs";
import { basename } from "node:path";
import { azure, apiUrl, escapeHtml } from "./azure-client.js";
import type {
  DefectReport,
  TestCaseSummaryReport,
  TrackerChild,
  ChildClassification,
  FailureSource,
} from "./tracker-types.js";

/**
 * Azure Boards adapter — the `tracker` implementation for the `azure` stack.
 *
 * Mirrors the Jira adapter's surface (see `utils/tracker.ts`) so qa-defect and
 * the orchestrator never branch on which tracker a repo uses. Epics and User
 * Stories are the same shape in both systems; the differences that matter are:
 *
 *   - **Children** come from a WIQL query over the work-item link graph, not
 *     from a `parent = X` JQL.
 *   - **Comments are HTML**, not ADF. Screenshots embed as `<img>` pointing at
 *     the uploaded attachment URL rather than an ADF `media` node.
 *   - **There are no transitions.** A work item has a `System.State` field you
 *     set directly, so the one workflow write (CLAUDE.md §8) is a field patch
 *     guarded by a check that the target state is actually allowed for that
 *     work-item type.
 *
 * NOT YET EXERCISED AGAINST A LIVE ORG — the Boards side of the Azure stack
 * has been implemented against the REST spec but not run against a real
 * Azure DevOps organisation yet.
 */

const API = { workItem: "7.1", comments: "7.1-preview.3", wiql: "7.1" } as const;

// ---------------------------------------------------------------------------
// Classification — identical prefix rules to the Jira adapter
// ---------------------------------------------------------------------------

const TA_RE = /^\[?\s*TA\b/i;
const TM_RE = /^\[?\s*TM\b/i;
const TEST_RE = /^\[?\s*(T-|Test Case|QA)\b/i;
const FE_RE = /^\[?\s*(FE|Frontend)\b/i;
const BE_RE = /^\[?\s*(BE|Backend|DB|Database)\b/i;

/**
 * Route a child by its title prefix. Same convention as the Jira stack, because
 * the prefixes are a team convention rather than a tracker feature — a repo that
 * migrates from Jira to Azure keeps its ticket naming and keeps working.
 */
export function classifyChildBySummaryPrefix(
  summary: string,
): ChildClassification {
  const head = summary.trim();
  const check = (value: string): ChildClassification | null => {
    if (TA_RE.test(value)) return "automation";
    if (TM_RE.test(value)) return "test";
    if (TEST_RE.test(value)) return "test";
    if (FE_RE.test(value)) return "fe";
    if (BE_RE.test(value)) return "be";
    return null;
  };
  const direct = check(head);
  if (direct) return direct;
  for (const tag of head.match(/\[[^\]]+\]/g) ?? []) {
    const tagged = check(tag.replace(/^\[|\]$/g, ""));
    if (tagged) return tagged;
  }
  return "unknown";
}

/** `Plan: 12` / `plan:12` anywhere in a description → 12. */
export function extractPlanId(text: string): number | null {
  const match = text.match(/\bplan\s*[:#]?\s*(\d+)\b/i);
  return match ? Number(match[1]) : null;
}

/** Every `TC-1234` reference in a description, de-duplicated, in order. */
export function extractCaseRefs(text: string): string[] {
  const seen = new Set<string>();
  for (const m of text.matchAll(/\bTC-(\d+)\b/gi)) seen.add(`TC-${m[1]}`);
  return [...seen];
}

// ---------------------------------------------------------------------------
// Comment rendering — HTML, the format Azure Boards comments accept
// ---------------------------------------------------------------------------

function section(title: string, body: string): string {
  return body.trim() ? `<h3>${escapeHtml(title)}</h3>${body}` : "";
}

function list(items: string[]): string {
  const rows = items.filter(Boolean).map((i) => `<li>${i}</li>`).join("");
  return rows ? `<ul>${rows}</ul>` : "";
}

function pre(text: string | undefined): string {
  return text?.trim() ? `<pre>${escapeHtml(text.trim())}</pre>` : "";
}

/**
 * The standard QA bug-report comment, as HTML.
 *
 * Same section order as the Jira/ADF renderer — Title, Summary, Preconditions,
 * Steps to Reproduce, Actual, Expected, Attachment, Network, Error, Footer —
 * so a defect reads identically whichever tracker a team is on. The Actual
 * Result is the agent's human summary, never a raw stack trace.
 *
 * Artifact local file paths (video / trace / screenshot on the runner) are
 * NOT included — they are unusable to reviewers. The screenshot uploaded to
 * the tracker is embedded via the Attachment section.
 */
export function buildDefectComment(d: DefectReport): string {
  const summary = list([
    d.caseRef ? `<b>Case:</b> ${escapeHtml(d.caseRef)}` : "",
    d.routedTo ? `<b>Routed to:</b> ${escapeHtml(d.routedTo)}` : "",
    d.source ? `<b>Source:</b> ${escapeHtml(d.source.toUpperCase())}${d.sourceReason ? ` — ${escapeHtml(d.sourceReason)}` : ""}` : "",
    d.env ? `<b>Environment:</b> ${escapeHtml(d.env)}` : "",
    d.tmsRunUrl ? `<b>Run:</b> <a href="${d.tmsRunUrl}">${escapeHtml(String(d.tmsRunId ?? d.tmsRunUrl))}</a>` : "",
  ]);

  const steps = list(
    (d.steps ?? []).map((s) => {
      const parts = [escapeHtml(s.action ?? "")];
      if (s.data) parts.push(`<i>Data:</i> ${escapeHtml(s.data)}`);
      if (s.expectedResult) parts.push(`<i>Expected:</i> ${escapeHtml(s.expectedResult)}`);
      return parts.join("<br/>");
    }),
  );

  const attachment = (d.attachmentUrls ?? [])
    .map((url) => `<img src="${url}" alt="failure screenshot" />`)
    .join("");

  return [
    `<h2>${escapeHtml(d.title)}</h2>`,
    summary,
    section("Preconditions", d.preconditions ? `<p>${escapeHtml(d.preconditions)}</p>` : ""),
    section("Steps to Reproduce", steps),
    section("Actual Result", d.actualResult ? `<p>${escapeHtml(d.actualResult)}</p>` : ""),
    section("Expected Result", d.expectedResult ? `<p>${escapeHtml(d.expectedResult)}</p>` : ""),
    section("Attachment", attachment),
    section("Network", pre(d.network)),
    section("Error", pre(d.error)),
    `<p><i>Posted by qa-defect. Comment-only — no issue was created and no state was changed.</i></p>`,
  ]
    .filter(Boolean)
    .join("");
}

/** The per-run results summary posted on every test + automation child. */
export function buildTestCaseSummary(s: TestCaseSummaryReport): string {
  const rows = (s.cases ?? [])
    .map(
      (c) =>
        `<tr><td>${escapeHtml(c.caseRef)}</td><td>${escapeHtml(c.title)}</td><td>${escapeHtml(
          c.status,
        )}</td><td>${c.commentUrl ? `<a href="${c.commentUrl}">defect</a>` : ""}</td></tr>`,
    )
    .join("");

  return [
    `<h2>${escapeHtml(s.title ?? "Automated run summary")}</h2>`,
    list([
      `<b>Passed:</b> ${s.passed ?? 0}`,
      `<b>Failed:</b> ${s.failed ?? 0}`,
      `<b>Skipped:</b> ${s.skipped ?? 0}`,
      s.tmsRunUrl ? `<b>Run:</b> <a href="${s.tmsRunUrl}">${escapeHtml(String(s.tmsRunId ?? ""))}</a>` : "",
    ]),
    rows
      ? `<table><thead><tr><th>Case</th><th>Title</th><th>Status</th><th>Defect</th></tr></thead><tbody>${rows}</tbody></table>`
      : "",
    `<p><i>Posted by qa-defect.</i></p>`,
  ]
    .filter(Boolean)
    .join("");
}

// ---------------------------------------------------------------------------
// API
// ---------------------------------------------------------------------------

interface AzureWorkItem {
  id: number;
  fields: Record<string, unknown>;
  relations?: { rel: string; url: string }[];
}

function str(wi: AzureWorkItem, name: string): string {
  const v = wi.fields[name];
  return typeof v === "string" ? v : "";
}

function toChild(wi: AzureWorkItem): TrackerChild {
  const summary = str(wi, "System.Title");
  return {
    key: String(wi.id),
    summary,
    status: str(wi, "System.State"),
    classification: classifyChildBySummaryPrefix(summary),
  };
}

export const tracker = {
  /** A work item by id. `key` is the numeric id as a string, for parity with Jira keys. */
  async getIssue(key: string | number): Promise<TrackerChild> {
    const wi = await azure.get<AzureWorkItem>(
      apiUrl(`/wit/workitems/${key}`, API.workItem),
    );
    return toChild(wi);
  },

  async getIssueDescription(key: string | number): Promise<string> {
    const wi = await azure.get<AzureWorkItem>(
      apiUrl(`/wit/workitems/${key}`, API.workItem),
    );
    return str(wi, "System.Description");
  },

  /** Parent work-item id, or null at the top of the tree. */
  async getParentKey(key: string | number): Promise<string | null> {
    const wi = await azure.get<AzureWorkItem>(
      apiUrl(`/wit/workitems/${key}`, API.workItem, { $expand: "relations" }),
    );
    const parent = wi.relations?.find((r) => r.rel === "System.LinkTypes.Hierarchy-Reverse");
    if (!parent) return null;
    const id = parent.url.split("/").pop();
    return id ?? null;
  },

  /**
   * Descendants of an Epic, Product Backlog Item (PBI), or User Story.
   *
   * WIQL runs `MODE (Recursive)` over `Hierarchy-Forward`, so passing an Epic
   * id returns every descendant (Feature → PBI → Task) and passing a PBI id
   * returns its Task children — the `[TM-…]` / `[TA-…]` / `[FE-…]` / `[BE-…]`
   * quartet — in one shot. This is what lets the orchestrator accept all
   * three parent kinds through the same code path.
   *
   * WIQL returns ids only, so this follows with one batch read — Azure caps a
   * batch at 200 ids, which is far above any realistic child count but the
   * chunking keeps it honest rather than silently truncating.
   */
  async getEpicChildren(parentKey: string | number): Promise<TrackerChild[]> {
    const wiql = {
      query:
        `SELECT [System.Id] FROM WorkItemLinks ` +
        `WHERE ([Source].[System.Id] = ${Number(parentKey)}) ` +
        `AND ([System.Links.LinkType] = 'System.LinkTypes.Hierarchy-Forward') ` +
        `MODE (Recursive)`,
    };
    const res = await azure.post<{
      workItemRelations?: { target?: { id: number } }[];
    }>(apiUrl("/wit/wiql", API.wiql), wiql);

    const ids = [
      ...new Set(
        (res.workItemRelations ?? [])
          .map((r) => r.target?.id)
          .filter((id): id is number => typeof id === "number" && id !== Number(parentKey)),
      ),
    ];
    if (!ids.length) return [];

    const children: TrackerChild[] = [];
    for (let i = 0; i < ids.length; i += 200) {
      const chunk = ids.slice(i, i + 200);
      const batch = await azure.get<{ value: AzureWorkItem[] }>(
        apiUrl("/wit/workitems", API.workItem, {
          ids: chunk.join(","),
          fields: "System.Id,System.Title,System.State",
        }),
      );
      children.push(...(batch.value ?? []).map(toChild));
    }
    return children;
  },

  async getIssueComments(
    key: string | number,
  ): Promise<{ id: number; author: string; body: string; created: string }[]> {
    const res = await azure.get<{
      comments?: {
        id: number;
        text: string;
        createdBy?: { uniqueName?: string; displayName?: string };
        createdDate: string;
      }[];
    }>(apiUrl(`/wit/workItems/${key}/comments`, API.comments));

    return (res.comments ?? []).map((c) => ({
      id: c.id,
      author: c.createdBy?.uniqueName ?? c.createdBy?.displayName ?? "",
      body: c.text,
      created: c.createdDate,
    }));
  },

  /** Post an HTML comment. Returns the comment id for deep-linking. */
  async addComment(key: string | number, html: string): Promise<number> {
    const res = await azure.post<{ id: number }>(
      apiUrl(`/wit/workItems/${key}/comments`, API.comments),
      { text: html },
    );
    azure.log.info(`Commented on work item ${key} (comment ${res.id}).`);
    return res.id;
  },

  /**
   * Upload a file and return its URL.
   *
   * Azure attachments are uploaded to the project, not to a work item, and are
   * referenced by URL. Embedding that URL in an `<img>` inside the comment is
   * what renders the screenshot inline — a bare URL in text is not acceptable
   * (CLAUDE.md §8).
   */
  async uploadAttachment(fileName: string, data: Buffer): Promise<string> {
    const res = await azure.postBinary<{ url: string }>(
      apiUrl("/wit/attachments", API.workItem, { fileName }),
      data,
    );
    return res.url;
  },

  async uploadAttachmentFromPath(_key: string | number, path: string): Promise<string> {
    return this.uploadAttachment(basename(path), readFileSync(path));
  },

  /**
   * The ONE workflow write (CLAUDE.md §8): move a `[TA-…]` work item to
   * **WAITING TO DEPLOY** when every scenario in the run passed.
   *
   * Azure has no transition objects — a state change is a field patch. That
   * makes it easy to set a state the work-item type does not allow, which the
   * API rejects with a rule error. So the allowed states are read first and
   * matched case-insensitively; if the target is not among them we return null
   * and log what *was* available, exactly like the Jira adapter. Callers must
   * report that rather than claiming the item moved.
   */
  async transitionToWaitingToDeploy(
    key: string | number,
  ): Promise<{ id: string; name: string } | null> {
    const wi = await azure.get<AzureWorkItem>(
      apiUrl(`/wit/workitems/${key}`, API.workItem),
    );
    const type = str(wi, "System.WorkItemType");
    const current = str(wi, "System.State");

    const states = await azure.get<{ value?: { name: string }[] }>(
      apiUrl(
        `/wit/workitemtypes/${encodeURIComponent(type)}/states`,
        API.workItem,
      ),
    );
    const target = /^waiting\s*(to|for)?\s*deploy(ment)?$/i;
    const match = (states.value ?? []).find((s) => target.test(s.name));

    if (!match) {
      azure.log.warn(
        `Work item ${key} (${type}) has no state matching WAITING TO DEPLOY. ` +
          `Available: ${(states.value ?? []).map((s) => s.name).join(", ") || "(none)"}.`,
      );
      return null;
    }
    if (current.toLowerCase() === match.name.toLowerCase()) {
      azure.log.info(`Work item ${key} is already in "${match.name}".`);
      return { id: match.name, name: match.name };
    }

    await azure.patchWorkItem(apiUrl(`/wit/workitems/${key}`, API.workItem), [
      { op: "add", path: "/fields/System.State", value: match.name },
    ]);
    azure.log.info(`Work item ${key}: "${current}" → "${match.name}".`);
    return { id: match.name, name: match.name };
  },

  /**
   * Failed-path counterpart to {@link transitionToWaitingToDeploy}: called by
   * qa-defect whenever the latest Qase run reports at least one bug, to move
   * the routed FE / BE child work item to **Test Failed/Bugs**.
   *
   * Mirrors the all-green rule for `[TA-…]` but on the red side, and only for
   * the child that actually receives the bug comment (FE or BE) — never the
   * `[TA-…]` or `[TM-…]` ticket. As with the sibling method, allowed states
   * are read first and matched case-insensitively; if the work-item type's
   * workflow does not offer a Failed/Bugs state, we log what *was* available
   * and return null — the caller must report that rather than claim the item
   * moved. Tolerates the common Azure spellings: "Test Failed/Bugs",
   * "Test Failed / Bugs", "Failed/Bugs", "Bugs".
   */
  async transitionToTestFailed(
    key: string | number,
  ): Promise<{ id: string; name: string } | null> {
    const wi = await azure.get<AzureWorkItem>(
      apiUrl(`/wit/workitems/${key}`, API.workItem),
    );
    const type = str(wi, "System.WorkItemType");
    const current = str(wi, "System.State");

    const states = await azure.get<{ value?: { name: string }[] }>(
      apiUrl(
        `/wit/workitemtypes/${encodeURIComponent(type)}/states`,
        API.workItem,
      ),
    );
    const target =
      /^test\s*failed(?:\s*[/&]\s*bugs?)?$|^failed(?:\s*[/&]\s*bugs?)?$|^bugs?$/i;
    const match = (states.value ?? []).find((s) => target.test(s.name));

    if (!match) {
      azure.log.warn(
        `Work item ${key} (${type}) has no state matching TEST FAILED/BUGS. ` +
          `Available: ${(states.value ?? []).map((s) => s.name).join(", ") || "(none)"}.`,
      );
      return null;
    }
    if (current.toLowerCase() === match.name.toLowerCase()) {
      azure.log.info(`Work item ${key} is already in "${match.name}".`);
      return { id: match.name, name: match.name };
    }

    await azure.patchWorkItem(apiUrl(`/wit/workitems/${key}`, API.workItem), [
      { op: "add", path: "/fields/System.State", value: match.name },
    ]);
    azure.log.info(`Work item ${key}: "${current}" → "${match.name}".`);
    return { id: match.name, name: match.name };
  },
};

export type { DefectReport, TestCaseSummaryReport, TrackerChild, FailureSource };
