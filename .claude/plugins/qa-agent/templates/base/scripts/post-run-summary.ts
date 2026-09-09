/**
 * Post the regression sweep summary to a Microsoft Teams channel via Incoming
 * Webhook. Aggregates per-module Playwright JSON reports downloaded into
 * `reports/downloaded/results-json-<module>/results.json` and posts a single
 * Adaptive Card (Power Automate workflow webhook) OR a legacy MessageCard
 * (classic Office 365 connector webhook) — chosen by the shape of
 * $TEAMS_WEBHOOK_URL. Layout mirrors the qa_playwright_lite Regression card:
 * header + fact grid + big stat row + per-module breakdown + failed test list.
 *
 * Called from .github/workflows/regression.yml (job: notify). No-op when
 * TEAMS_WEBHOOK_URL is missing; the workflow logs a notice in that case.
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

type PwStatus = "passed" | "failed" | "timedOut" | "interrupted" | "skipped";

interface FailedTitle {
  module: string;
  title: string;
}

interface ModuleCounts {
  module: string;
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
  total: number;
  durationMs: number;
  failedTitles: FailedTitle[];
}

const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR ?? "reports/downloaded";
const WEBHOOK = process.env.TEAMS_WEBHOOK_URL ?? "";
const CYCLE_KEY = process.env.CYCLE_KEY ?? "";
const QASE_PROJECT = process.env.QASE_PROJECT ?? "ATC";
const APP_ENV = process.env.APP_ENV ?? "staging";
const RUN_TITLE = process.env.RUN_TITLE ?? `Automated run ${new Date().toISOString()}`;
const RUN_URL =
  process.env.GITHUB_ACTIONS_RUN_URL ??
  (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : "");
const TRIGGER = process.env.GITHUB_EVENT_NAME ?? "manual";
const BRANCH = process.env.GITHUB_REF_NAME ?? "";
const COMMIT_SHA = (process.env.GITHUB_SHA ?? "").slice(0, 7);

if (!WEBHOOK) {
  console.log("TEAMS_WEBHOOK_URL not set — nothing to post.");
  process.exit(0);
}

function walkResults(
  node: unknown,
  moduleName: string,
  counts: {
    passed: number;
    failed: number;
    skipped: number;
    flaky: number;
    total: number;
    durationMs: number;
    failedTitles: FailedTitle[];
  },
) {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  const specs = Array.isArray(n.specs) ? (n.specs as unknown[]) : [];
  for (const spec of specs) {
    const s = spec as Record<string, unknown>;
    const specTitle = typeof s.title === "string" ? (s.title as string) : "undefined";
    const tests = Array.isArray(s.tests) ? (s.tests as unknown[]) : [];
    for (const t of tests) {
      const tt = t as Record<string, unknown>;
      const results = Array.isArray(tt.results) ? (tt.results as unknown[]) : [];
      if (!results.length) continue;
      counts.total += 1;
      const statuses = results.map((r) => ((r as Record<string, unknown>).status as PwStatus) ?? "skipped");
      const durations = results.map((r) => Number((r as Record<string, unknown>).duration ?? 0));
      counts.durationMs += durations.reduce((a, b) => a + b, 0);
      const finalStatus = statuses[statuses.length - 1];
      const hasFail = statuses.some((s) => s === "failed" || s === "timedOut" || s === "interrupted");
      const isFlaky = hasFail && finalStatus === "passed";
      if (isFlaky) counts.flaky += 1;
      if (finalStatus === "passed") counts.passed += 1;
      else if (finalStatus === "skipped") counts.skipped += 1;
      else {
        counts.failed += 1;
        counts.failedTitles.push({ module: moduleName, title: specTitle });
      }
    }
  }
  const children = Array.isArray(n.suites) ? (n.suites as unknown[]) : [];
  for (const child of children) walkResults(child, moduleName, counts);
}

function readModuleReport(moduleDir: string, moduleName: string): ModuleCounts | null {
  const jsonPath = join(moduleDir, "results.json");
  if (!existsSync(jsonPath)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(jsonPath, "utf8"));
  } catch (err) {
    console.warn(`[${moduleName}] failed to parse results.json: ${(err as Error).message}`);
    return null;
  }
  const counts = {
    passed: 0,
    failed: 0,
    skipped: 0,
    flaky: 0,
    total: 0,
    durationMs: 0,
    failedTitles: [] as FailedTitle[],
  };
  const suites = (parsed as { suites?: unknown[] }).suites ?? [];
  for (const s of suites) walkResults(s, moduleName, counts);
  const stats = (parsed as { stats?: { duration?: number } }).stats;
  if (counts.durationMs === 0 && stats?.duration) counts.durationMs = stats.duration;
  return { module: moduleName, ...counts };
}

function collectModules(): ModuleCounts[] {
  if (!existsSync(ARTIFACTS_DIR)) {
    console.warn(`Artifacts dir ${ARTIFACTS_DIR} missing — no per-module reports to aggregate.`);
    return [];
  }
  const entries = readdirSync(ARTIFACTS_DIR);
  const out: ModuleCounts[] = [];
  for (const entry of entries) {
    const dir = join(ARTIFACTS_DIR, entry);
    if (!statSync(dir).isDirectory()) continue;
    const moduleName = entry.replace(/^results-json-/, "");
    const rep = readModuleReport(dir, moduleName);
    if (rep) out.push(rep);
  }
  return out.sort((a, b) => a.module.localeCompare(b.module));
}

const modules = collectModules();
const totals = modules.reduce(
  (acc, m) => {
    acc.passed += m.passed;
    acc.failed += m.failed;
    acc.skipped += m.skipped;
    acc.flaky += m.flaky;
    acc.total += m.total;
    acc.durationMs += m.durationMs;
    return acc;
  },
  { passed: 0, failed: 0, skipped: 0, flaky: 0, total: 0, durationMs: 0 },
);

const passRate = totals.total > 0 ? ((totals.passed / totals.total) * 100).toFixed(1) : "0.0";
const statusEmoji = totals.failed > 0 ? "🟡" : totals.total === 0 ? "⚪" : "🟢";
const failingLine =
  totals.failed > 0 ? `${totals.failed} failing` : totals.total === 0 ? "no results" : "all passing";
const title = `${statusEmoji} Regression — ${APP_ENV} · ${RUN_TITLE}`;
const qaseUrl = CYCLE_KEY ? `https://app.qase.io/run/${QASE_PROJECT}/dashboard/${CYCLE_KEY}` : "";

const allFailedTitles: FailedTitle[] = modules.flatMap((m) => m.failedTitles);

const isWorkflowWebhook = /logic\.azure\.com|powerautomate|workflows/i.test(WEBHOOK);
const themeColor = totals.failed > 0 ? "E8A33D" : totals.total === 0 ? "808080" : "2EB886";

async function post(body: unknown) {
  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok) {
    throw new Error(`Teams webhook responded ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
  }
  return { status: res.status, body: text.slice(0, 500) };
}

function twoColumn(labelText: string, valueText: string) {
  return {
    type: "ColumnSet",
    columns: [
      {
        type: "Column",
        width: "110px",
        items: [{ type: "TextBlock", text: labelText, weight: "Bolder", wrap: true }],
      },
      {
        type: "Column",
        width: "stretch",
        items: [{ type: "TextBlock", text: valueText, wrap: true }],
      },
    ],
  };
}

function bigStatCell(label: string, value: string, color?: string) {
  return {
    type: "Column",
    width: "stretch",
    items: [
      { type: "TextBlock", text: label, weight: "Bolder", spacing: "None", size: "Small", ...(color ? { color } : {}) },
      { type: "TextBlock", text: value, size: "ExtraLarge", weight: "Bolder", spacing: "None" },
    ],
  };
}

function buildAdaptiveCard() {
  const actions: Array<Record<string, unknown>> = [];
  if (qaseUrl) actions.push({ type: "Action.OpenUrl", title: "Open Qase run", url: qaseUrl });
  if (RUN_URL) actions.push({ type: "Action.OpenUrl", title: "Open GitHub Actions run", url: RUN_URL });

  const body: Array<Record<string, unknown>> = [
    { type: "TextBlock", text: title, weight: "Bolder", size: "Large", wrap: true },
    { type: "TextBlock", text: failingLine, isSubtle: true, spacing: "None", wrap: true },
    twoColumn("Environment", APP_ENV),
    twoColumn("Trigger", TRIGGER),
    ...(BRANCH ? [twoColumn("Branch", BRANCH)] : []),
    ...(COMMIT_SHA ? [twoColumn("Commit", COMMIT_SHA)] : []),
    {
      type: "ColumnSet",
      spacing: "Medium",
      columns: [
        bigStatCell("Total", `${totals.total}`),
        bigStatCell("Passed", `${totals.passed}`, "Good"),
        bigStatCell("Failed", `${totals.failed}`, totals.failed > 0 ? "Attention" : "Default"),
        bigStatCell("Skipped", `${totals.skipped}`, "Warning"),
        bigStatCell("Pass rate", `${passRate}%`),
      ],
    },
  ];

  if (allFailedTitles.length > 0) {
    body.push({
      type: "TextBlock",
      text: `Failed tests (${allFailedTitles.length})`,
      weight: "Bolder",
      size: "Medium",
      spacing: "Medium",
    });
    const shown = allFailedTitles.slice(0, 15);
    body.push({
      type: "TextBlock",
      text: shown.map((f) => `• ${f.module} › ${f.title || "undefined"}`).join("\n"),
      wrap: true,
    });
    if (allFailedTitles.length > shown.length) {
      body.push({
        type: "TextBlock",
        text: `…and ${allFailedTitles.length - shown.length} more`,
        isSubtle: true,
        spacing: "None",
        wrap: true,
      });
    }
  }

  return {
    type: "message",
    attachments: [
      {
        contentType: "application/vnd.microsoft.card.adaptive",
        contentUrl: null,
        content: {
          $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
          type: "AdaptiveCard",
          version: "1.5",
          msteams: { width: "Full" },
          body,
          actions,
        },
      },
    ],
  };
}

function buildMessageCard() {
  const facts = [
    { name: "Environment", value: APP_ENV },
    { name: "Trigger", value: TRIGGER },
    ...(BRANCH ? [{ name: "Branch", value: BRANCH }] : []),
    ...(COMMIT_SHA ? [{ name: "Commit", value: COMMIT_SHA }] : []),
    { name: "Total", value: `${totals.total}` },
    { name: "Passed", value: `${totals.passed}` },
    { name: "Failed", value: `${totals.failed}` },
    { name: "Skipped", value: `${totals.skipped}` },
    { name: "Pass rate", value: `${passRate}%` },
  ];
  const failedLines = allFailedTitles.slice(0, 15).map((f) => `- ${f.module} › ${f.title || "undefined"}`).join("\n");
  return {
    "@type": "MessageCard",
    "@context": "https://schema.org/extensions",
    themeColor,
    summary: title,
    title,
    text: failingLine,
    sections: [
      { facts },
      ...(allFailedTitles.length > 0
        ? [{ title: `Failed tests (${allFailedTitles.length})`, text: failedLines }]
        : []),
    ],
    potentialAction: [
      ...(qaseUrl
        ? [{ "@type": "OpenUri", name: "Open Qase run", targets: [{ os: "default", uri: qaseUrl }] }]
        : []),
      ...(RUN_URL
        ? [{ "@type": "OpenUri", name: "Open GitHub Actions run", targets: [{ os: "default", uri: RUN_URL }] }]
        : []),
    ],
  };
}

async function main() {
  const primary = isWorkflowWebhook ? buildAdaptiveCard() : buildMessageCard();
  const fallback = isWorkflowWebhook ? buildMessageCard() : buildAdaptiveCard();

  try {
    const r = await post(primary);
    console.log(`Posted to Teams (${isWorkflowWebhook ? "AdaptiveCard" : "MessageCard"}): HTTP ${r.status}`);
  } catch (err) {
    console.warn(`Primary payload failed: ${(err as Error).message}`);
    console.warn("Retrying with fallback payload shape...");
    const r = await post(fallback);
    console.log(`Posted to Teams (fallback): HTTP ${r.status}`);
  }
}

main().catch((err) => {
  console.error(`Failed to post Teams summary: ${(err as Error).message}`);
  process.exit(1);
});
