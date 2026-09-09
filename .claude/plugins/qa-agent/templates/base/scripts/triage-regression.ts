/**
 * Deterministic triage of the regression sweep. Reads per-module Playwright
 * JSON reports downloaded into `reports/downloaded/results-json-<module>/`,
 * classifies each failed case into the qa_playwright_lite triage buckets
 * (Passed / Failed / Flaky / Upstream cascade / Heal candidates / Product
 * defects / Backend defects / In-run flakes / Investigate), writes a triage
 * report to $GITHUB_STEP_SUMMARY, and posts a compact triage card to the
 * same Teams channel as `post-run-summary.ts`. LLM-free.
 */
import { appendFileSync, existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Triage buckets — must stay in sync with the qa_playwright_lite card.
 * upstream-cascade: SSO/auth logout, browser crash, test-timeout-of-Xms
 *                   fallout (one root cause takes many tests down)
 * heal            : recoverable selector drift (locator waitFor/click
 *                   timeouts, "outside of viewport" — a re-resolve fixes it)
 * product-defect  : assertion mismatches (FE bug: wrong value shown)
 * backend-defect  : 4xx/5xx HTTP, API timeouts
 * flake           : recovered on retry — not a real failure
 * investigate     : anything else (unclassified error / test-data / config)
 */
type Bucket =
  | "upstream-cascade"
  | "heal"
  | "product-defect"
  | "backend-defect"
  | "flake"
  | "investigate";

interface FailureRecord {
  module: string;
  title: string;
  errorHead: string;
  bucket: Bucket;
}

const BUCKET_LABEL: Record<Bucket, string> = {
  "upstream-cascade": "Upstream cascade",
  heal: "Heal candidates",
  "product-defect": "Product defects",
  "backend-defect": "Backend defects",
  flake: "In-run flakes",
  investigate: "Investigate",
};

function parseArgs(): { artifactsDir: string } {
  const args = process.argv.slice(2);
  let artifactsDir = process.env.ARTIFACTS_DIR ?? "reports/downloaded";
  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--artifacts-dir" && args[i + 1]) {
      artifactsDir = args[i + 1];
      i++;
    }
  }
  return { artifactsDir };
}

const { artifactsDir: ARTIFACTS_DIR } = parseArgs();
const WEBHOOK = process.env.TEAMS_WEBHOOK_URL ?? "";
const CYCLE_KEY = process.env.CYCLE_KEY ?? "";
const QASE_PROJECT = process.env.QASE_PROJECT ?? "ATC";
const RUN_URL =
  process.env.GITHUB_ACTIONS_RUN_URL ??
  (process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
    ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
    : "");
const STEP_SUMMARY = process.env.GITHUB_STEP_SUMMARY ?? "";

function classifyBucket(errText: string): Bucket {
  const t = (errText.split("\n")[0] || "").toLowerCase();
  if (
    /\bsso\b|storagestate|auth\.setup|session expired|not logged in|redirected to \/login|browsertype\.launch|target page, context or browser has been closed|test timeout of \d+ms exceeded/.test(t)
  )
    return "upstream-cascade";
  if (
    /status (4\d\d|5\d\d)|api\/.*(failed|timed out|timeout)|net::err_|request failed with|http (4\d\d|5\d\d)|\b(4\d\d|5\d\d)\s+(bad request|unauthorized|forbidden|not found|internal server error|bad gateway|service unavailable|gateway timeout)|apirequestcontext|response.*status.*(4\d\d|5\d\d)|waitforresponse.*timeout/.test(t)
  )
    return "backend-defect";
  if (
    /locator\.[a-z]+.*(timed out|timeout|not found|element is)|waiting for locator|element is (not )?(visible|attached|enabled|outside)|no element found for selector|strict mode violation|page\.waitfor(url|selector)/.test(t)
  )
    return "heal";
  if (
    /expect\(.+\)\.(to|not)\.|expected.*received|assertion failed|to\s?equal|to\s?contain(text)?|to\s?match|to\s?have(url|text|count|value)|to be visible|to have text/.test(t)
  )
    return "product-defect";
  return "investigate";
}

function normaliseSignature(errText: string): string {
  return errText
    .split("\n")[0]
    .replace(/[0-9a-f]{8,}/gi, "<hash>")
    .replace(/\d+/g, "<n>")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 180);
}

interface WalkCtx {
  module: string;
  failures: FailureRecord[];
  flakyRecovered: number;
  totals: { passed: number; failed: number; skipped: number; total: number };
}

function walk(node: unknown, ctx: WalkCtx) {
  if (!node || typeof node !== "object") return;
  const n = node as Record<string, unknown>;
  const specs = Array.isArray(n.specs) ? (n.specs as unknown[]) : [];
  for (const spec of specs) {
    const s = spec as Record<string, unknown>;
    const title = (s.title as string) ?? "";
    const tests = Array.isArray(s.tests) ? (s.tests as unknown[]) : [];
    for (const t of tests) {
      const tt = t as Record<string, unknown>;
      const results = Array.isArray(tt.results) ? (tt.results as unknown[]) : [];
      if (!results.length) continue;
      ctx.totals.total += 1;
      const statuses = results.map((r) => ((r as Record<string, unknown>).status as string) ?? "skipped");
      const finalStatus = statuses[statuses.length - 1];
      const hasFail = statuses.some((s) => s === "failed" || s === "timedOut" || s === "interrupted");
      if (hasFail && finalStatus === "passed") ctx.flakyRecovered += 1;
      if (finalStatus === "passed") {
        ctx.totals.passed += 1;
        continue;
      }
      if (finalStatus === "skipped") {
        ctx.totals.skipped += 1;
        continue;
      }
      ctx.totals.failed += 1;
      const lastFail = [...results].reverse().find((r) => {
        const s = (r as Record<string, unknown>).status;
        return s === "failed" || s === "timedOut" || s === "interrupted";
      }) as Record<string, unknown> | undefined;
      let errText = "";
      if (lastFail) {
        const err = lastFail.error as { message?: string; stack?: string } | undefined;
        const errors = lastFail.errors as Array<{ message?: string }> | undefined;
        errText = err?.message ?? err?.stack ?? errors?.[0]?.message ?? "";
      }
      ctx.failures.push({
        module: ctx.module,
        title,
        errorHead: normaliseSignature(errText || "no error message"),
        bucket: classifyBucket(errText),
      });
    }
  }
  const children = Array.isArray(n.suites) ? (n.suites as unknown[]) : [];
  for (const child of children) walk(child, ctx);
}

interface ModuleReport {
  module: string;
  failures: FailureRecord[];
  flakyRecovered: number;
  totals: { passed: number; failed: number; skipped: number; total: number };
}

function readModule(dir: string, moduleName: string): ModuleReport | null {
  const jsonPath = join(dir, "results.json");
  if (!existsSync(jsonPath)) return null;
  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(jsonPath, "utf8"));
  } catch {
    return null;
  }
  const ctx: WalkCtx = {
    module: moduleName,
    failures: [],
    flakyRecovered: 0,
    totals: { passed: 0, failed: 0, skipped: 0, total: 0 },
  };
  const suites = (parsed as { suites?: unknown[] }).suites ?? [];
  for (const s of suites) walk(s, ctx);
  return { module: moduleName, failures: ctx.failures, flakyRecovered: ctx.flakyRecovered, totals: ctx.totals };
}

function collect(): ModuleReport[] {
  if (!existsSync(ARTIFACTS_DIR)) {
    console.warn(`Artifacts dir ${ARTIFACTS_DIR} missing.`);
    return [];
  }
  const out: ModuleReport[] = [];
  for (const entry of readdirSync(ARTIFACTS_DIR)) {
    const dir = join(ARTIFACTS_DIR, entry);
    if (!statSync(dir).isDirectory()) continue;
    const rep = readModule(dir, entry.replace(/^results-json-/, ""));
    if (rep) out.push(rep);
  }
  return out.sort((a, b) => a.module.localeCompare(b.module));
}

async function post(body: unknown) {
  const res = await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text().catch(() => "");
  if (!res.ok)
    throw new Error(`Teams webhook responded ${res.status} ${res.statusText}: ${text.slice(0, 300)}`);
  return { status: res.status, text };
}

async function main() {
  const reports = collect();
  const totals = reports.reduce(
    (acc, r) => {
      acc.passed += r.totals.passed;
      acc.failed += r.totals.failed;
      acc.skipped += r.totals.skipped;
      acc.total += r.totals.total;
      acc.flakyRecovered += r.flakyRecovered;
      return acc;
    },
    { passed: 0, failed: 0, skipped: 0, total: 0, flakyRecovered: 0 },
  );

  const bucketCounts: Record<Bucket, number> = {
    "upstream-cascade": 0,
    heal: 0,
    "product-defect": 0,
    "backend-defect": 0,
    flake: totals.flakyRecovered,
    investigate: 0,
  };
  for (const r of reports) {
    for (const f of r.failures) bucketCounts[f.bucket] += 1;
  }

  const qaseUrl = CYCLE_KEY ? `https://app.qase.io/run/${QASE_PROJECT}/dashboard/${CYCLE_KEY}` : "";

  // --- GitHub step summary ---
  if (STEP_SUMMARY) {
    const lines: string[] = [];
    lines.push(`## 🔍 Regression triage`);
    lines.push("");
    lines.push(`- Total ${totals.total} · Passed ${totals.passed} · Failed ${totals.failed} · Skipped ${totals.skipped}`);
    lines.push("");
    lines.push("| Bucket | Count |");
    lines.push("|---|---:|");
    for (const b of Object.keys(BUCKET_LABEL) as Bucket[]) {
      lines.push(`| ${BUCKET_LABEL[b]} | ${bucketCounts[b]} |`);
    }
    lines.push("");
    if (qaseUrl) lines.push(`- Qase run: ${qaseUrl}`);
    if (RUN_URL) lines.push(`- GitHub run: ${RUN_URL}`);
    appendFileSync(STEP_SUMMARY, lines.join("\n") + "\n");
  }

  if (!WEBHOOK) {
    console.log("TEAMS_WEBHOOK_URL not set — triage card skipped (step summary was written).");
    return;
  }
  if (totals.total === 0) {
    console.log("No results parsed — nothing to triage.");
    return;
  }

  const isWorkflowWebhook = /logic\.azure\.com|powerautomate|workflows/i.test(WEBHOOK);
  const themeColor = totals.failed > 0 ? "E8A33D" : "2EB886";
  const title = `🔍 Regression triage`;

  function twoColumn(labelText: string, valueText: string) {
    return {
      type: "ColumnSet",
      spacing: "Small",
      columns: [
        {
          type: "Column",
          width: "stretch",
          items: [{ type: "TextBlock", text: labelText, weight: "Bolder", wrap: true }],
        },
        {
          type: "Column",
          width: "auto",
          items: [{ type: "TextBlock", text: valueText, wrap: false }],
        },
      ],
    };
  }

  function buildAdaptive() {
    const body: Array<Record<string, unknown>> = [
      { type: "TextBlock", text: title, weight: "Bolder", size: "Large", wrap: true },
      twoColumn("Passed", `${totals.passed}`),
      twoColumn("Failed", `${totals.failed}`),
      twoColumn("Flaky", `${totals.flakyRecovered}`),
      twoColumn("Upstream cascade", `${bucketCounts["upstream-cascade"]}`),
      twoColumn("Heal candidates", `${bucketCounts.heal}`),
      twoColumn("Product defects", `${bucketCounts["product-defect"]}`),
      twoColumn("Backend defects", `${bucketCounts["backend-defect"]}`),
      twoColumn("In-run flakes", `${bucketCounts.flake}`),
      twoColumn("Investigate", `${bucketCounts.investigate}`),
    ];
    const actions: Array<Record<string, unknown>> = [];
    if (RUN_URL) actions.push({ type: "Action.OpenUrl", title: "Workflow run", url: RUN_URL });
    if (qaseUrl) actions.push({ type: "Action.OpenUrl", title: "Qase run", url: qaseUrl });
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
      { name: "Passed", value: `${totals.passed}` },
      { name: "Failed", value: `${totals.failed}` },
      { name: "Flaky", value: `${totals.flakyRecovered}` },
      { name: "Upstream cascade", value: `${bucketCounts["upstream-cascade"]}` },
      { name: "Heal candidates", value: `${bucketCounts.heal}` },
      { name: "Product defects", value: `${bucketCounts["product-defect"]}` },
      { name: "Backend defects", value: `${bucketCounts["backend-defect"]}` },
      { name: "In-run flakes", value: `${bucketCounts.flake}` },
      { name: "Investigate", value: `${bucketCounts.investigate}` },
    ];
    return {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      themeColor,
      summary: title,
      title,
      sections: [{ facts }],
      potentialAction: [
        ...(RUN_URL
          ? [{ "@type": "OpenUri", name: "Workflow run", targets: [{ os: "default", uri: RUN_URL }] }]
          : []),
        ...(qaseUrl
          ? [{ "@type": "OpenUri", name: "Qase run", targets: [{ os: "default", uri: qaseUrl }] }]
          : []),
      ],
    };
  }

  const primary = isWorkflowWebhook ? buildAdaptive() : buildMessageCard();
  const fallback = isWorkflowWebhook ? buildMessageCard() : buildAdaptive();

  try {
    const r = await post(primary);
    console.log(`Triage card posted (${isWorkflowWebhook ? "AdaptiveCard" : "MessageCard"}): HTTP ${r.status}`);
  } catch (err) {
    console.warn(`Primary triage payload failed: ${(err as Error).message}`);
    console.warn("Retrying with fallback payload shape...");
    const r = await post(fallback);
    console.log(`Triage card posted (fallback): HTTP ${r.status}`);
  }
}

main().catch((err) => {
  console.error(`Triage failed: ${(err as Error).message}`);
  process.exit(1);
});
