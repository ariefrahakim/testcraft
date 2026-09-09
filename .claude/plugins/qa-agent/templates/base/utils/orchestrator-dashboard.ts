/**
 * Orchestrator monitoring dashboard.
 *
 * Two roles, one CLI:
 *   • Event appender — `event '<json>'` writes a single JSON line to
 *     `logs/orchestrator-events.jsonl` (creating the file/dir if needed) and
 *     regenerates the HTML. Called by `/qa-agent <EPIC-KEY>` at the start and
 *     end of every workflow step.
 *   • Renderer — `render` (default) reads the events log plus the latest
 *     `logs/run-log.jsonl` entries from the Hubexo Spec Sprint plugin and
 *     writes a self-contained HTML dashboard to `reports/dashboard/index.html`.
 *
 * The HTML auto-refreshes every 5 seconds — open it once in a browser tab,
 * leave it running, and watch the orchestrator step through generate → run →
 * (heal → defect) live.
 *
 * Event schema (newline-delimited JSON, one event per line):
 *   {
 *     "ts":           "<ISO8601 — auto-set if omitted>",
 *     "runId":        "<uuid per orchestrator invocation — required>",
 *     "epic":         "<JIRA-EPIC-KEY, e.g. NLM-4 — required>",
 *     "epicTitle":    "<optional>",
 *     "testChild":    "<optional [T-…] child Jira key>",
 *     "scope":        "<plan:8 | TC-2045>",
 *     "agent":        "orchestrator | qa-codegen | qa-runner | qa-healer | qa-defect | qa-pr",
 *     "step":         "start | generate | run | heal | defect | pr | summary | end",
 *     "status":       "running | completed | failed | skipped",
 *     "qaseRunId":    <number, optional>,
 *     "qaseRunUrl":   "<url, optional>",
 *     "jiraLinks":    [{ "label": "...", "url": "..." }],
 *     "testScenarios":<number — total cases in scope, optional>,
 *     "results":      { "passed":7, "failed":1, "flaky":0, "skipped":0 },
 *     "durationSec":  <number, optional>,
 *     "tokenCost":    <number, optional>,
 *     "notes":        "<free text, optional>"
 *   }
 *
 * CLI:
 *   npx tsx utils/orchestrator-dashboard.ts render
 *   npx tsx utils/orchestrator-dashboard.ts event '<json>'
 *   npx tsx utils/orchestrator-dashboard.ts open    # render + open in browser
 */

import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { env } from "../shared/env.js";
import { logger } from "./logger.js";

const log = logger.scope("dashboard");

const EVENTS_PATH = "logs/orchestrator-events.jsonl";
const RUNLOG_PATH = "logs/run-log.jsonl";
const RESULTS_PATH = "reports/results.json";
const HTML_PATH = "reports/dashboard/index.html";

type AgentName =
  | "qa-agent-orchestrator"
  | "qa-codegen"
  | "qa-runner"
  | "qa-healer"
  | "qa-defect"
  | "qa-pr";

type StepName =
  | "start"
  | "generate"
  | "run"
  | "heal"
  | "defect"
  | "pr"
  | "summary"
  | "end";

type RunStatus = "running" | "completed" | "failed" | "skipped";

interface OrchEvent {
  ts: string;
  runId: string;
  epic: string;
  epicTitle?: string;
  testChild?: string;
  scope?: string;
  agent: AgentName;
  step: StepName;
  status: RunStatus;
  qaseRunId?: number;
  qaseRunUrl?: string;
  jiraLinks?: Array<{ label: string; url: string }>;
  testScenarios?: number;
  results?: { passed?: number; failed?: number; flaky?: number; skipped?: number };
  durationSec?: number;
  tokenCost?: number;
  notes?: string;
}

interface RunLogEntry {
  id?: string;
  date?: string;
  user?: string;
  agent?: string;
  model?: string;
  duration?: number;
  manual_effort?: number;
  input?: string;
  input_url?: string;
  output?: string[];
  tag?: string;
  status?: string;
  token_cost?: number;
}

// "2026-06-25 07:40 UTC" → epoch ms. Returns NaN on failure.
// Entries come from JSON.parse, so `date` may be any type at runtime whatever
// the declared type says — a non-string must yield NaN, never throw.
function parseRunLogDate(date: string | undefined): number {
  if (typeof date !== "string" || date.length === 0) return NaN;
  const iso = date.replace(" UTC", "Z").replace(" ", "T");
  return Date.parse(iso);
}

// Merge token_cost from run-log.jsonl into RunSummary by (agent, time-window).
//
// Costs ACCUMULATE: an agent invoked more than once in one pipeline (e.g.
// qa-codegen re-run after a heal) contributes every invocation, so the cell is
// the true total for that step and not just the first call. To avoid
// double-counting the same step, run-log and event costs are kept in separate
// accumulators and reconciled in `finalizeTokenCosts` — run-log wins when it has
// anything for that agent, because it is the durable, per-invocation record.
function mergeRunLogTokenCosts(runs: RunSummary[], runLog: RunLogEntry[]): void {
  for (const entry of runLog) {
    try {
      mergeOneRunLogEntry(runs, entry);
    } catch (err) {
      log.warn(
        `Skipping run-log entry ${String(entry?.id ?? "?")} during cost merge: ${(err as Error).message}`,
      );
    }
  }
  finalizeTokenCosts(runs);
}

function mergeOneRunLogEntry(runs: RunSummary[], entry: RunLogEntry): void {
  if (!entry.agent || typeof entry.token_cost !== "number") return;
  if (!PIPELINE_AGENTS.includes(entry.agent as Exclude<AgentName, "qa-agent-orchestrator">)) return;
  const t = parseRunLogDate(entry.date);
  if (!Number.isFinite(t)) return;

  let best: RunSummary | undefined;
  let bestDelta = Infinity;
  for (const r of runs) {
    if (r.source === "playwright-report") continue;
    const start = Date.parse(r.startedAt);
    const end = r.endedAt ? Date.parse(r.endedAt) : start + 60 * 60 * 1000;
    if (t < start - 5 * 60 * 1000 || t > end + 15 * 60 * 1000) continue;
    const delta = Math.min(Math.abs(t - start), Math.abs(t - end));
    if (delta < bestDelta) {
      bestDelta = delta;
      best = r;
    }
  }
  if (!best) return;

  const agentState = best.agents[entry.agent];
  if (!agentState) return;
  agentState.runLogTokenCost = (agentState.runLogTokenCost ?? 0) + entry.token_cost;
  agentState.logEntries = (agentState.logEntries ?? 0) + 1;
}

// Reconcile the two accumulators into the displayed `tokenCost` + run total.
// Run-log is authoritative when present; event-carried costs are the fallback
// for steps that never produced a run-log entry.
function finalizeTokenCosts(runs: RunSummary[]): void {
  for (const r of runs) {
    for (const a of PIPELINE_AGENTS) {
      const s = r.agents[a];
      if (!s) continue;
      s.tokenCost = s.runLogTokenCost ?? s.eventTokenCost;
    }
    r.totalTokenCost = PIPELINE_AGENTS.reduce(
      (sum, a) => sum + (r.agents[a]?.tokenCost ?? 0),
      0,
    );
  }
}

interface AgentState {
  status: RunStatus | "pending";
  durationSec?: number;
  /** Displayed cost — reconciled from the two accumulators below. */
  tokenCost?: number;
  /** Sum of `tokenCost` carried on this agent's events. */
  eventTokenCost?: number;
  /** Sum of `token_cost` across every run-log entry matched to this agent. */
  runLogTokenCost?: number;
  /** How many run-log entries matched — >1 means the agent ran repeatedly. */
  logEntries?: number;
  notes?: string;
}

interface RunSummary {
  runId: string;
  startedAt: string;
  endedAt?: string;
  epic: string;
  epicTitle?: string;
  testChild?: string;
  scope?: string;
  qaseRunId?: number;
  qaseRunUrl?: string;
  testScenarios?: number;
  results?: { passed?: number; failed?: number; flaky?: number; skipped?: number };
  jiraLinks: Array<{ label: string; url: string }>;
  status: "running" | "completed" | "failed";
  /**
   * Where the row came from. `orchestrator` = reconstructed from
   * `logs/orchestrator-events.jsonl`. `playwright-report` = synthesised from
   * `reports/results.json` for a run nobody logged (a bare `npm test` /
   * sub-command invocation), so the dashboard is never blind to a real run.
   */
  source: "orchestrator" | "playwright-report";
  outcome?: "all-green" | "healed" | "defects-routed" | "aborted" | "unlogged";
  durationSec?: number;
  totalTokenCost: number;
  agents: Record<string, AgentState>;
  events: OrchEvent[];
}

// --- IO -----------------------------------------------------------------------

async function readJsonl<T>(path: string): Promise<T[]> {
  if (!existsSync(path)) return [];
  const text = await readFile(path, "utf8");
  const lines = text.split("\n").filter((l) => l.trim().length > 0);
  const out: T[] = [];
  for (const line of lines) {
    try {
      out.push(JSON.parse(line) as T);
    } catch {
      log.warn(`Skipping malformed line in ${path}: ${line.slice(0, 80)}…`);
    }
  }
  return out;
}

async function ensureParentDir(filePath: string): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
}

// --- Append event -------------------------------------------------------------

async function appendEvent(rawJson: string): Promise<OrchEvent> {
  let evt: Partial<OrchEvent>;
  try {
    evt = JSON.parse(rawJson) as Partial<OrchEvent>;
  } catch (err) {
    throw new Error(
      `Invalid JSON passed to \`event\` (got: ${rawJson.slice(0, 120)}…): ${(err as Error).message}`,
    );
  }
  const required: Array<keyof OrchEvent> = ["runId", "epic", "agent", "step", "status"];
  const missing = required.filter((k) => !evt[k]);
  if (missing.length > 0) {
    throw new Error(
      `Event missing required field(s): ${missing.join(", ")}. ` +
        `Required: runId, epic, agent, step, status.`,
    );
  }
  evt.ts ??= new Date().toISOString();
  const line = JSON.stringify(evt);
  await ensureParentDir(EVENTS_PATH);
  await appendFile(EVENTS_PATH, line + "\n");
  log.info(`event appended (${evt.agent}:${evt.step}:${evt.status}) for run ${evt.runId}.`);
  return evt as OrchEvent;
}

// --- Aggregate ----------------------------------------------------------------

const PIPELINE_AGENTS: Exclude<AgentName, "qa-agent-orchestrator">[] = [
  "qa-codegen",
  "qa-runner",
  "qa-healer",
  "qa-defect",
  "qa-pr",
];

function aggregateRuns(events: OrchEvent[]): RunSummary[] {
  const byRun = new Map<string, RunSummary>();
  const sorted = [...events].sort((a, b) => a.ts.localeCompare(b.ts));

  for (const e of sorted) {
    let r = byRun.get(e.runId);
    if (!r) {
      r = {
        runId: e.runId,
        startedAt: e.ts,
        epic: e.epic,
        jiraLinks: [],
        status: "running",
        source: "orchestrator",
        totalTokenCost: 0,
        agents: Object.fromEntries(
          PIPELINE_AGENTS.map((a) => [a, { status: "pending" as const }]),
        ),
        events: [],
      };
      byRun.set(e.runId, r);
    }
    r.events.push(e);

    // Merge meta — latest non-empty wins.
    if (e.epicTitle) r.epicTitle = e.epicTitle;
    if (e.testChild) r.testChild = e.testChild;
    if (e.scope) r.scope = e.scope;
    if (e.qaseRunId !== undefined) r.qaseRunId = e.qaseRunId;
    if (e.qaseRunUrl) r.qaseRunUrl = e.qaseRunUrl;
    if (e.testScenarios !== undefined) r.testScenarios = e.testScenarios;
    if (e.results) r.results = { ...r.results, ...e.results };
    if (e.jiraLinks && e.jiraLinks.length > 0) {
      const seen = new Set(r.jiraLinks.map((l) => l.url));
      for (const link of e.jiraLinks) {
        if (!seen.has(link.url)) {
          r.jiraLinks.push(link);
          seen.add(link.url);
        }
      }
    }

    // Per-agent state — status/duration/notes: latest wins. Token cost
    // ACCUMULATES, so an agent that ran twice reports both invocations.
    if (e.agent !== "qa-agent-orchestrator") {
      const prev = r.agents[e.agent];
      r.agents[e.agent] = {
        ...prev,
        status: e.status,
        durationSec: e.durationSec ?? prev?.durationSec,
        eventTokenCost:
          e.tokenCost === undefined
            ? prev?.eventTokenCost
            : (prev?.eventTokenCost ?? 0) + e.tokenCost,
        notes: e.notes ?? prev?.notes,
      };
    }

    // Run-level start/end from orchestrator events.
    if (e.agent === "qa-agent-orchestrator") {
      if (e.step === "start") r.startedAt = e.ts;
      if (e.step === "end" || e.step === "summary") {
        r.endedAt = e.ts;
        r.status = e.status === "failed" ? "failed" : "completed";
      }
    }
  }

  for (const r of byRun.values()) {
    if (r.endedAt) {
      r.durationSec = Math.max(
        0,
        Math.round((Date.parse(r.endedAt) - Date.parse(r.startedAt)) / 1000),
      );
    } else {
      r.durationSec = Math.max(
        0,
        Math.round((Date.now() - Date.parse(r.startedAt)) / 1000),
      );
    }
    // Outcome inference.
    if (r.status === "failed") {
      r.outcome = "aborted";
    } else if (r.status === "completed") {
      const defectDone = r.agents["qa-defect"]?.status === "completed";
      const healDone = r.agents["qa-healer"]?.status === "completed";
      if (defectDone) r.outcome = "defects-routed";
      else if (healDone) r.outcome = "healed";
      else r.outcome = "all-green";
    }
  }

  const runs = Array.from(byRun.values());
  finalizeTokenCosts(runs);
  return runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
}

// --- Playwright-report fallback ----------------------------------------------
//
// The events log only gets written by `/qa-agent` / `/qa-agent:tms`. A run
// started any other way (bare `npm test`, a direct `/qa-agent-run`, CI) leaves
// no event — and used to be invisible here. This reads Playwright's own JSON
// report as ground truth and surfaces such a run as an "unlogged" row.

interface PlaywrightReport {
  stats?: {
    startTime?: string;
    duration?: number;
    expected?: number;
    unexpected?: number;
    flaky?: number;
    skipped?: number;
  };
  suites?: Array<{ title?: string }>;
}

// "e2e/plan-holders/plan-holders.spec.ts" → "plan-holders"; setup files dropped.
function scopeFromSuites(suites: PlaywrightReport["suites"]): string | undefined {
  const modules = new Set<string>();
  for (const s of suites ?? []) {
    const m = /(?:^|\/)e2e\/([^/]+)\//.exec(s.title ?? "");
    if (m?.[1]) modules.add(m[1]);
  }
  return modules.size > 0 ? Array.from(modules).sort().join(", ") : undefined;
}

async function readPlaywrightRun(): Promise<RunSummary | undefined> {
  if (!existsSync(RESULTS_PATH)) return undefined;
  let report: PlaywrightReport;
  try {
    report = JSON.parse(await readFile(RESULTS_PATH, "utf8")) as PlaywrightReport;
  } catch (err) {
    log.warn(`Ignoring unreadable ${RESULTS_PATH}: ${(err as Error).message}`);
    return undefined;
  }
  const stats = report.stats;
  if (!stats?.startTime || !Number.isFinite(Date.parse(stats.startTime))) return undefined;

  const passed = stats.expected ?? 0;
  const failed = stats.unexpected ?? 0;
  const flaky = stats.flaky ?? 0;
  const skipped = stats.skipped ?? 0;
  const durationSec = Math.round((stats.duration ?? 0) / 1000);
  const startedAt = new Date(Date.parse(stats.startTime)).toISOString();

  return {
    runId: `local-${startedAt.slice(0, 19).replace(/[:T-]/g, "")}`,
    startedAt,
    endedAt: new Date(Date.parse(stats.startTime) + (stats.duration ?? 0)).toISOString(),
    epic: "",
    scope: scopeFromSuites(report.suites),
    testScenarios: passed + failed + flaky + skipped,
    results: { passed, failed, flaky, skipped },
    jiraLinks: [],
    status: "completed",
    source: "playwright-report",
    outcome: "unlogged",
    durationSec,
    totalTokenCost: 0,
    agents: Object.fromEntries(
      PIPELINE_AGENTS.map((a) => [
        a,
        a === "qa-runner"
          ? { status: (failed > 0 ? "failed" : "completed") as RunStatus }
          : { status: "pending" as const },
      ]),
    ),
    events: [],
  };
}

// True when an orchestrator run already accounts for this Playwright report, so
// the same execution is not listed twice.
function isCoveredByOrchestratorRun(local: RunSummary, runs: RunSummary[]): boolean {
  const t = Date.parse(local.startedAt);
  return runs.some((r) => {
    if (r.source !== "orchestrator") return false;
    const start = Date.parse(r.startedAt);
    const end = r.endedAt ? Date.parse(r.endedAt) : start + 60 * 60 * 1000;
    return t >= start - 5 * 60 * 1000 && t <= end + 30 * 60 * 1000;
  });
}

// --- HTML helpers -------------------------------------------------------------

// Coerces first: log records are parsed JSON, so a field typed `string` here can
// still arrive as a number/object at runtime.
function htmlEscape(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function jiraIssueUrl(key: string): string {
  // #region qa-agent:jira
  return `${env.jira.baseUrl}/browse/${key}`;
  // #endregion qa-agent:jira
  // #region qa-agent:azure
  // Azure work items are addressed by numeric id under the project.
  return `${env.azure.orgUrl}/${encodeURIComponent(env.azure.project)}/_workitems/edit/${key}`;
  // #endregion qa-agent:azure
}

function jiraLink(key: string | undefined): string {
  if (!key) return "<span class=muted>—</span>";
  return `<a href="${jiraIssueUrl(key)}" target="_blank" rel="noopener">${htmlEscape(key)}</a>`;
}

function qaseLink(run: { qaseRunId?: number; qaseRunUrl?: string }): string {
  if (!run.qaseRunId && !run.qaseRunUrl) return "<span class=muted>—</span>";
  // #region qa-agent:jira
  const url =
    run.qaseRunUrl ??
    `https://app.qase.io/run/${env.qase.project}/dashboard/${run.qaseRunId}`;
  // #endregion qa-agent:jira
  // #region qa-agent:azure
  const url =
    run.qaseRunUrl ??
    `${env.azure.orgUrl}/${encodeURIComponent(env.azure.project)}/_testManagement/runs?runId=${run.qaseRunId}&_a=runCharts`;
  // #endregion qa-agent:azure
  return `<a href="${url}" target="_blank" rel="noopener">Run #${run.qaseRunId ?? "?"}</a>`;
}

function formatDuration(sec?: number): string {
  if (sec === undefined) return "—";
  if (sec < 60) return `${sec}s`;
  const totalMin = Math.floor(sec / 60);
  const s = sec % 60;
  if (totalMin < 60) return s === 0 ? `${totalMin}m` : `${totalMin}m ${s}s`;
  const totalHr = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (totalHr < 24) return m === 0 ? `${totalHr}h` : `${totalHr}h ${m}m`;
  const d = Math.floor(totalHr / 24);
  const h = totalHr % 24;
  return h === 0 ? `${d}d` : `${d}d ${h}h`;
}

function statusChip(status: AgentState["status"]): string {
  const label =
    status === "pending"
      ? "—"
      : status === "running"
        ? "● running"
        : status === "completed"
          ? "✓ done"
          : status === "failed"
            ? "✗ failed"
            : "skipped";
  return `<span class="chip chip-${status}">${label}</span>`;
}

function outcomeChip(outcome: RunSummary["outcome"], status: RunSummary["status"]): string {
  if (status === "running") return `<span class="chip chip-running">● running</span>`;
  if (outcome === "unlogged") {
    return `<span class="chip chip-pending" title="From reports/results.json — this run never went through /qa-agent, so it has no epic, Jira or token data.">⚪ unlogged</span>`;
  }
  const map: Record<string, [string, string]> = {
    "all-green": ["✅ all green", "chip-completed"],
    healed: ["🟠 healed", "chip-healed"],
    "defects-routed": ["🔴 defects routed", "chip-failed"],
    aborted: ["⛔ aborted", "chip-failed"],
  };
  const [label, cls] = map[outcome ?? "all-green"] ?? ["?", "chip-pending"];
  return `<span class="chip ${cls}">${label}</span>`;
}

function resultsCell(r: RunSummary): string {
  if (!r.results) return "<span class=muted>—</span>";
  const { passed = 0, failed = 0, flaky = 0, skipped = 0 } = r.results;
  const parts = [
    `<span class="num num-pass">${passed}</span>`,
    `<span class="num num-fail">${failed}</span>`,
  ];
  if (flaky > 0) parts.push(`<span class="num num-flaky">${flaky}f</span>`);
  if (skipped > 0) parts.push(`<span class="num num-skip">${skipped}s</span>`);
  return parts.join(" / ");
}

function timelineRow(events: OrchEvent[]): string {
  return events
    .slice()
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .map((e) => {
      const time = htmlEscape(e.ts.replace("T", " ").replace(/\.\d+Z$/, "Z"));
      const meta = [
        `<span class="t-agent">${htmlEscape(e.agent)}</span>`,
        `<span class="t-step">${htmlEscape(e.step)}</span>`,
        statusChip(e.status),
      ].join(" ");
      const extras: string[] = [];
      if (e.durationSec !== undefined) extras.push(`<span class="t-dur">${formatDuration(e.durationSec)}</span>`);
      if (e.tokenCost !== undefined) extras.push(`<span class="t-tok">${e.tokenCost} tok</span>`);
      if (e.notes) extras.push(`<span class="t-notes">${htmlEscape(e.notes)}</span>`);
      return `<li><span class="t-ts">${time}</span> ${meta} ${extras.join(" ")}</li>`;
    })
    .join("");
}

function runRow(r: RunSummary): string {
  const pipeline = PIPELINE_AGENTS.map((a) => {
    const s = r.agents[a]?.status ?? "pending";
    const tok = r.agents[a]?.tokenCost;
    // >1 run-log entry means the agent was invoked repeatedly (e.g. codegen
    // re-run after a heal); the cost shown is the sum, so label the multiplier.
    const calls = r.agents[a]?.logEntries ?? 0;
    const callsBadge =
      calls > 1
        ? `<span class="pipe-calls" title="${calls} invocations — cost is the total of all of them">×${calls}</span>`
        : "";
    const tokCell =
      tok !== undefined && tok > 0
        ? `<span class="pipe-tok">${tok.toLocaleString()} tok${callsBadge}</span>`
        : `<span class="pipe-tok muted">—</span>`;
    return `<div class="pipe-cell"><span class="pipe-label">${a.replace("qa-", "")}</span>${statusChip(s)}${tokCell}</div>`;
  }).join("");

  return `
    <tr class="run-row run-${r.status}" id="run-${htmlEscape(r.runId)}">
      <td class="cell-run"><code>${htmlEscape(r.runId.slice(0, 8))}</code></td>
      <td class="cell-time">${htmlEscape(r.startedAt.replace("T", " ").replace(/\.\d+Z$/, "Z"))}</td>
      <td>${jiraLink(r.epic)}${r.epicTitle ? `<div class="muted small">${htmlEscape(r.epicTitle)}</div>` : ""}</td>
      <td>${jiraLink(r.testChild)}</td>
      <td><code>${htmlEscape(r.scope ?? "—")}</code></td>
      <td class="cell-num">${r.testScenarios ?? "<span class=muted>—</span>"}</td>
      <td class="cell-results">${resultsCell(r)}</td>
      <td class="cell-pipeline">${pipeline}</td>
      <td>${qaseLink(r)}</td>
      <td>${outcomeChip(r.outcome, r.status)}</td>
      <td class="cell-num">${formatDuration(r.durationSec)}</td>
      <td class="cell-num">${r.totalTokenCost > 0 ? r.totalTokenCost.toLocaleString() : "<span class=muted>—</span>"}</td>
    </tr>
    <tr class="timeline-row">
      <td colspan="12">
        <details><summary>Timeline (${r.events.length} events)</summary>
          <ul class="timeline">${timelineRow(r.events)}</ul>
        </details>
      </td>
    </tr>
  `;
}

// `output` is contractually a string[], but a hand-written or older entry may
// carry a bare string — coerce instead of throwing, which used to take the whole
// render down rather than just this row.
function outputList(output: RunLogEntry["output"]): string[] {
  if (output === undefined || output === null) return [];
  if (Array.isArray(output)) return output.map((o) => String(o));
  return [String(output)];
}

function runLogRow(e: RunLogEntry): string {
  const status = e.status ?? "—";
  const input = e.input_url
    ? `<a href="${e.input_url}" target="_blank" rel="noopener">${htmlEscape(e.input ?? "—")}</a>`
    : htmlEscape(e.input ?? "—");
  const outputs = outputList(e.output)
    .map((u, i) =>
      /^https?:\/\//.test(u)
        ? `<a href="${u}" target="_blank" rel="noopener">${i + 1}</a>`
        : htmlEscape(u),
    )
    .join(", ");
  return `
    <tr>
      <td class="cell-time">${htmlEscape(e.date ?? "—")}</td>
      <td>${htmlEscape(e.agent ?? "—")}</td>
      <td>${htmlEscape(e.tag ?? "—")}</td>
      <td>${input}</td>
      <td>${outputs || "<span class=muted>—</span>"}</td>
      <td class="cell-num">${e.duration ?? "—"}s</td>
      <td class="cell-num">${
        typeof e.token_cost === "number"
          ? e.token_cost.toLocaleString()
          : "<span class=muted>—</span>"
      }</td>
      <td><span class="chip chip-${status === "synced" ? "completed" : "running"}">${htmlEscape(status)}</span></td>
    </tr>
  `;
}

// Renders one row, containing any failure to that row. A single bad record must
// never blank the whole dashboard.
function safeRow<T>(
  render: (item: T) => string,
  item: T,
  colspan: number,
  kind: string,
): string {
  try {
    return render(item);
  } catch (err) {
    const msg = (err as Error).message;
    log.warn(`Skipping malformed ${kind} row: ${msg}`);
    return `<tr class="row-error"><td colspan="${colspan}">⚠ malformed ${htmlEscape(kind)} record skipped — ${htmlEscape(msg)}</td></tr>`;
  }
}

// --- Render -------------------------------------------------------------------

function renderHtml(runs: RunSummary[], runLog: RunLogEntry[]): string {
  const active = runs.filter((r) => r.status === "running");
  const completed = runs.filter((r) => r.status !== "running").slice(0, 30);
  const now = new Date().toISOString().replace("T", " ").replace(/\.\d+Z$/, "Z");

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>QA-Agent Orchestrator Dashboard</title>
<meta http-equiv="refresh" content="5">
<style>
  :root {
    color-scheme: dark;
    --bg: #0d1117;
    --bg-elev: #161b22;
    --bg-row: #1f242c;
    --fg: #e6edf3;
    --muted: #7d8590;
    --border: #30363d;
    --accent: #58a6ff;
    --pass: #3fb950;
    --fail: #f85149;
    --flaky: #d29922;
    --healed: #db8a17;
    --skip: #8b949e;
    --running: #58a6ff;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif;
    font-size: 13px;
    background: var(--bg);
    color: var(--fg);
    line-height: 1.5;
  }
  header {
    padding: 16px 24px;
    border-bottom: 1px solid var(--border);
    background: var(--bg-elev);
    display: flex;
    justify-content: space-between;
    align-items: baseline;
  }
  header h1 { font-size: 18px; margin: 0; font-weight: 600; }
  header .meta { color: var(--muted); font-size: 12px; }
  main { padding: 24px; max-width: 1800px; margin: 0 auto; }
  section { margin-bottom: 32px; }
  section h2 {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: var(--muted);
    border-bottom: 1px solid var(--border);
    padding-bottom: 6px;
    margin: 0 0 12px;
  }
  table { width: 100%; border-collapse: collapse; }
  th, td {
    text-align: left;
    padding: 8px 10px;
    border-bottom: 1px solid var(--border);
    vertical-align: top;
  }
  thead th {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.4px;
    color: var(--muted);
    background: var(--bg-elev);
  }
  tbody tr.run-row:hover { background: var(--bg-row); }
  tbody tr.run-running { box-shadow: inset 2px 0 0 var(--running); }
  tbody tr.run-failed  { box-shadow: inset 2px 0 0 var(--fail); }
  tbody tr.run-completed { box-shadow: inset 2px 0 0 var(--pass); }
  tr.timeline-row td { border-bottom: 2px solid var(--bg-elev); padding-top: 0; }
  tr.timeline-row details { padding: 4px 0 8px 8px; }
  tr.timeline-row summary { cursor: pointer; color: var(--muted); }
  ul.timeline { list-style: none; padding: 8px 0 0 0; margin: 0; }
  ul.timeline li {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11.5px;
    padding: 2px 0;
    color: var(--fg);
  }
  .t-ts { color: var(--muted); margin-right: 8px; }
  .t-agent { color: var(--accent); }
  .t-step { color: var(--fg); margin-left: 4px; }
  .t-dur, .t-tok { color: var(--muted); margin-left: 6px; }
  .t-notes { color: var(--muted); margin-left: 6px; font-style: italic; }
  code {
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 12px;
    background: var(--bg-elev);
    padding: 1px 5px;
    border-radius: 4px;
  }
  a { color: var(--accent); text-decoration: none; }
  a:hover { text-decoration: underline; }
  .muted { color: var(--muted); }
  .small { font-size: 11px; }
  .chip {
    display: inline-block;
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 500;
    background: var(--bg-elev);
    color: var(--muted);
    border: 1px solid var(--border);
    white-space: nowrap;
  }
  .chip-running   { color: var(--running); border-color: var(--running); }
  .chip-completed { color: var(--pass); border-color: rgba(63,185,80,0.5); }
  .chip-failed    { color: var(--fail); border-color: rgba(248,81,73,0.5); }
  .chip-healed    { color: var(--healed); border-color: rgba(219,138,23,0.5); }
  .chip-skipped   { color: var(--skip); }
  .chip-pending   { color: var(--muted); }
  .cell-num { text-align: right; font-variant-numeric: tabular-nums; }
  .cell-run code { background: transparent; padding: 0; color: var(--accent); }
  .cell-time { white-space: nowrap; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11.5px; color: var(--muted); }
  .cell-pipeline { display: flex; gap: 4px; flex-wrap: wrap; padding-top: 8px; }
  .pipe-cell { display: flex; flex-direction: column; gap: 2px; align-items: flex-start; min-width: 76px; }
  .pipe-label { font-size: 10px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.4px; }
  .pipe-tok { font-size: 10px; font-variant-numeric: tabular-nums; color: var(--muted); }
  .num { font-variant-numeric: tabular-nums; padding: 1px 6px; border-radius: 4px; font-size: 11.5px; }
  .num-pass  { color: var(--pass); }
  .num-fail  { color: var(--fail); }
  .num-flaky { color: var(--flaky); }
  .num-skip  { color: var(--skip); }
  .empty {
    text-align: center;
    padding: 32px;
    color: var(--muted);
    border: 1px dashed var(--border);
    border-radius: 6px;
  }
  details > summary::-webkit-details-marker { color: var(--muted); }
  .pipe-calls {
    margin-left: 4px;
    padding: 0 3px;
    border-radius: 3px;
    font-size: 10px;
    color: var(--flaky);
    border: 1px solid var(--border);
  }
  .row-error td {
    color: var(--fail);
    font-size: 12px;
    background: color-mix(in srgb, var(--fail) 8%, transparent);
  }
</style>
</head>
<body>
<header>
  <h1>QA-Agent Orchestrator Dashboard</h1>
  <span class="meta">auto-refreshes every 5s · last rendered ${htmlEscape(now)} · ${runs.length} run${runs.length === 1 ? "" : "s"}</span>
</header>

<main>
  <section>
    <h2>Active runs (${active.length})</h2>
    ${
      active.length === 0
        ? `<div class="empty">No active orchestrator runs. Trigger one with <code>/qa-agent &lt;EPIC-KEY&gt;</code>.</div>`
        : `<table>
            <thead><tr>
              <th>Run</th><th>Started</th><th>Epic</th><th>[Test]</th>
              <th>Scope</th><th>Tests</th><th>Results</th><th>Pipeline</th>
              <th>Qase</th><th>Outcome</th><th>Duration</th><th>Tokens</th>
            </tr></thead>

            <tbody>${active.map((r) => safeRow(runRow, r, 12, "run")).join("")}</tbody>
          </table>`
    }
  </section>

  <section>
    <h2>Recent runs (${completed.length})</h2>
    ${
      completed.length === 0
        ? `<div class="empty">No completed runs yet.</div>`
        : `<table>
            <thead><tr>
              <th>Run</th><th>Started</th><th>Epic</th><th>[Test]</th>
              <th>Scope</th><th>Tests</th><th>Results</th><th>Pipeline</th>
              <th>Qase</th><th>Outcome</th><th>Duration</th><th>Tokens</th>
            </tr></thead>

            <tbody>${completed.map((r) => safeRow(runRow, r, 12, "run")).join("")}</tbody>
          </table>`
    }
  </section>

  <section>
    <h2>Recent run-logger entries (${runLog.length})</h2>
    ${
      runLog.length === 0
        ? `<div class="empty">No <code>logs/run-log.jsonl</code> entries yet.</div>`
        : `<table>
            <thead><tr>
              <th>Date</th><th>Agent</th><th>Tag</th><th>Input</th>
              <th>Output</th><th>Duration</th><th>Tokens</th><th>Sync</th>
            </tr></thead>
            <tbody>${runLog.map((e) => safeRow(runLogRow, e, 8, "run-log")).join("")}</tbody>
          </table>`
    }
  </section>
</main>
</body>
</html>
`;
}

async function render(): Promise<string> {
  const events = await readJsonl<OrchEvent>(EVENTS_PATH);
  const runs = aggregateRuns(events);
  const allRunLog = await readJsonl<RunLogEntry>(RUNLOG_PATH);
  mergeRunLogTokenCosts(runs, allRunLog);

  // Ground-truth fallback: surface the latest Playwright run when no
  // orchestrator run covers it (bare `npm test`, direct sub-command, CI).
  const local = await readPlaywrightRun();
  if (local && !isCoveredByOrchestratorRun(local, runs)) {
    runs.push(local);
    runs.sort((a, b) => b.startedAt.localeCompare(a.startedAt));
    log.info(`Surfaced unlogged Playwright run from ${RESULTS_PATH} (${local.startedAt}).`);
  }

  const runLog = allRunLog.slice(-20).reverse();
  const html = renderHtml(runs, runLog);
  await ensureParentDir(HTML_PATH);
  await writeFile(HTML_PATH, html);
  const abs = resolve(HTML_PATH);
  log.info(`Dashboard written to ${abs} (${runs.length} runs, ${runLog.length} run-log entries).`);
  return abs;
}

function openInBrowser(filePath: string): void {
  const platform = process.platform;
  const opener =
    platform === "darwin" ? "open" : platform === "win32" ? "start" : "xdg-open";
  const child = spawn(opener, [filePath], { detached: true, stdio: "ignore" });
  child.unref();
}

// --- CLI ----------------------------------------------------------------------

const isCli = process.argv[1]?.endsWith("orchestrator-dashboard.ts");
if (isCli) {
  const cmd = (process.argv[2] ?? "render").toLowerCase();
  const arg = process.argv[3];
  const main = async (): Promise<void> => {
    if (cmd === "render") {
      await render();
    } else if (cmd === "event") {
      if (!arg) {
        log.error("Usage: orchestrator-dashboard.ts event '<json>'");
        process.exit(1);
      }
      await appendEvent(arg);
      await render();
    } else if (cmd === "open") {
      const abs = await render();
      openInBrowser(abs);
    } else {
      log.error(`Unknown command: ${cmd}. Use: render | event '<json>' | open`);
      process.exit(1);
    }
  };
  main().catch((err) => {
    log.error("Dashboard CLI failed.", err);
    process.exit(1);
  });
}
