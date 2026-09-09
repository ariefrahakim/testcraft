/**
 * Sync `logs/run-log.jsonl` → Azure DevOps Wiki. The parent page is pointed
 * to by `AZURE_WIKI_AGENT_LOGGER` in `.env`; this script groups entries by
 * `agent` and writes/updates **one child page per agent** under that parent
 * (e.g. `/Agent Logs/qa-codegen`, `/Agent Logs/qa-runner`, …), matching the
 * layout the Confluence side of `hubexo-spec-sprint:run-logger-sync` uses.
 *
 * Idempotent: each child page is fully rewritten from the current JSONL
 * every run. Never appends without reading first.
 */
import { readFileSync, existsSync } from "node:fs";
import { env } from "../shared/env.js";
import { logger } from "./logger.js";

const log = logger.scope("wiki-sync");

interface LogEntry {
  ts: string;
  agent: string;
  runId?: string;
  input?: string;
  input_url?: string;
  output?: string | string[];
  tag?: string;
  manual_effort?: number;
  duration?: number;
  token_cost?: number;
  notes?: string;
  hallucination?: string;
  improvement_point?: string;
  status?: string;
}

interface WikiTarget {
  orgUrl: string;      // https://thenbs.visualstudio.com
  project: string;     // Sirius - Template
  wikiId: string;      // Sirius---Template.wiki
  parentPageId: number;// 3399
  parentPagePath: string; // "/Agent Logs" — resolved from the parent page
}

function parseWikiUrl(raw: string): Omit<WikiTarget, "parentPagePath"> {
  const m = raw.match(/^(https:\/\/[^/]+)\/([^/]+)\/_wiki\/wikis\/([^/]+)\/(\d+)\//) as
    | [string, string, string, string, string]
    | null;
  if (!m) throw new Error(`AZURE_WIKI_AGENT_LOGGER does not look like a page URL: ${raw}`);
  return {
    orgUrl: m[1],
    project: decodeURIComponent(m[2]),
    wikiId: decodeURIComponent(m[3]),
    parentPageId: Number(m[4]),
  };
}

function authHeader(): string {
  const pat = env.azure.pat;
  if (!pat) throw new Error("AZURE_PAT is empty — cannot authenticate to Azure Wiki.");
  return "Basic " + Buffer.from(`:${pat}`).toString("base64");
}

function wikiBase(t: Pick<WikiTarget, "orgUrl" | "project" | "wikiId">): string {
  return `${t.orgUrl}/${encodeURIComponent(t.project)}/_apis/wiki/wikis/${encodeURIComponent(t.wikiId)}`;
}

async function getPageById(
  t: Pick<WikiTarget, "orgUrl" | "project" | "wikiId">,
  pageId: number,
): Promise<{ etag: string; content: string; path: string }> {
  const url = `${wikiBase(t)}/pages/${pageId}?includeContent=true&api-version=7.0`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
  });
  if (!res.ok) throw new Error(`GET wiki page ${pageId} → ${res.status} ${res.statusText}`);
  const json = (await res.json()) as { content?: string; path?: string };
  return {
    etag: res.headers.get("etag") ?? "",
    content: json.content ?? "",
    path: json.path ?? "",
  };
}

async function getPageByPath(
  t: Pick<WikiTarget, "orgUrl" | "project" | "wikiId">,
  path: string,
): Promise<{ etag: string; content: string } | null> {
  const url = `${wikiBase(t)}/pages?path=${encodeURIComponent(path)}&includeContent=true&api-version=7.0`;
  const res = await fetch(url, {
    headers: { Authorization: authHeader(), Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`GET wiki path "${path}" → ${res.status} ${res.statusText}`);
  const json = (await res.json()) as { content?: string };
  return {
    etag: res.headers.get("etag") ?? "",
    content: json.content ?? "",
  };
}

async function putPage(
  t: Pick<WikiTarget, "orgUrl" | "project" | "wikiId">,
  path: string,
  markdown: string,
  etag: string | null,
): Promise<void> {
  const url = `${wikiBase(t)}/pages?path=${encodeURIComponent(path)}&api-version=7.0`;
  const headers: Record<string, string> = {
    Authorization: authHeader(),
    "Content-Type": "application/json",
    Accept: "application/json",
  };
  if (etag) headers["If-Match"] = etag;
  const res = await fetch(url, {
    method: "PUT",
    headers,
    body: JSON.stringify({ content: markdown }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`PUT wiki path "${path}" → ${res.status} ${res.statusText}\n${text.slice(0, 600)}`);
  }
}

function loadEntries(): LogEntry[] {
  const path = "logs/run-log.jsonl";
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line, i) => {
      try {
        return JSON.parse(line) as LogEntry;
      } catch (err) {
        log.warn(`skipping malformed line ${i + 1}: ${(err as Error).message}`);
        return null;
      }
    })
    .filter((v): v is LogEntry => v !== null);
}

function escapeCell(value: unknown): string {
  if (value === undefined || value === null) return "";
  const s = Array.isArray(value) ? value.map(String).join("<br>") : String(value);
  return s.replace(/\|/g, "\\|").replace(/\n/g, "<br>");
}

function renderAgentPage(agent: string, entries: LogEntry[]): string {
  const rows = entries.sort((a, b) => a.ts.localeCompare(b.ts));
  const parts: string[] = [
    `# ${agent}`,
    "",
    `> Auto-synced from \`logs/run-log.jsonl\` via \`utils/run-log-to-azure-wiki.ts\`.`,
    `> Last sync: ${new Date().toISOString()} · ${rows.length} entr${rows.length === 1 ? "y" : "ies"}.`,
    "",
    "| ts | runId | input | tag | manual_effort (s) | duration (s) | tokens | notes | output |",
    "|---|---|---|---|---|---|---|---|---|",
  ];
  for (const e of rows) {
    const input = e.input_url ? `[${e.input ?? e.input_url}](${e.input_url})` : e.input ?? "";
    const output = Array.isArray(e.output)
      ? e.output.map((o) => (o.startsWith("http") ? `[${o}](${o})` : o)).join("<br>")
      : e.output ?? "";
    const notes = [
      e.notes,
      e.hallucination ? `hallucination: ${e.hallucination}` : null,
      e.improvement_point ? `improvement_point: ${e.improvement_point}` : null,
      e.status ? `status: ${e.status}` : null,
    ]
      .filter(Boolean)
      .join("<br>");
    parts.push(
      `| ${escapeCell(e.ts)} | ${escapeCell((e.runId ?? "").slice(0, 8))} | ${escapeCell(input)} | ${escapeCell(e.tag)} | ${escapeCell(e.manual_effort)} | ${escapeCell(e.duration)} | ${escapeCell(e.token_cost)} | ${escapeCell(notes)} | ${escapeCell(output)} |`,
    );
  }
  return parts.join("\n");
}

function renderIndexPage(agents: string[], parentPath: string): string {
  const parts: string[] = [
    "# Agent Logs",
    "",
    `> Auto-synced from \`logs/run-log.jsonl\` via \`utils/run-log-to-azure-wiki.ts\`.`,
    `> One child page per agent. Last sync: ${new Date().toISOString()}.`,
    "",
    "## Agents",
    "",
  ];
  for (const agent of agents) {
    parts.push(`- [${agent}](${parentPath}/${encodeURIComponent(agent)})`);
  }
  parts.push("");
  return parts.join("\n");
}

async function main() {
  const raw = process.env.AZURE_WIKI_AGENT_LOGGER;
  if (!raw) throw new Error("AZURE_WIKI_AGENT_LOGGER not set in .env");
  const partial = parseWikiUrl(raw);

  // Resolve the parent page's real path (Azure returns it — trust that over the URL slug).
  const parent = await getPageById(partial, partial.parentPageId);
  const target: WikiTarget = { ...partial, parentPagePath: parent.path };
  log.info(`parent: ${target.parentPagePath} (id ${target.parentPageId})`);

  const entries = loadEntries();
  log.info(`local entries: ${entries.length}`);

  // Preflight — every entry must carry duration + token_cost, or the Wiki
  // table renders blank cells the operator cannot recover. If any row is
  // partial, warn per-row (with agent + ts) and count. Never edit or drop
  // the row — JSONL is source of truth, recovery is via a new run-logger
  // call from the operator; the syncer just refuses to hide the problem.
  const strict = process.env.RUN_LOG_STRICT === "1";
  const incomplete = entries.filter((e) => e.duration === undefined || e.token_cost === undefined);
  if (incomplete.length > 0) {
    log.warn(
      `${incomplete.length} entr${incomplete.length === 1 ? "y" : "ies"} missing duration/token_cost — ` +
        `re-fire the offending step's hubexo-spec-sprint:run-logger to append a fresh, complete row.`,
    );
    for (const e of incomplete) {
      const missing = [
        e.duration === undefined ? "duration" : null,
        e.token_cost === undefined ? "token_cost" : null,
      ].filter(Boolean).join(", ");
      log.warn(`  ${e.ts}  ${e.agent}  (missing: ${missing})`);
    }
    if (strict) {
      throw new Error(
        `RUN_LOG_STRICT=1 and ${incomplete.length} incomplete row(s) — aborting sync. ` +
          `Re-fire run-logger for the listed steps and retry.`,
      );
    }
  }

  const byAgent = new Map<string, LogEntry[]>();
  for (const e of entries) {
    const list = byAgent.get(e.agent) ?? [];
    list.push(e);
    byAgent.set(e.agent, list);
  }
  const agents = [...byAgent.keys()].sort();

  // Rewrite parent page as an index of child pages.
  await putPage(target, target.parentPagePath, renderIndexPage(agents, target.parentPagePath), parent.etag);
  log.info(`updated index page ${target.parentPagePath}`);

  // One child page per agent — create if missing, update if exists (etag).
  for (const agent of agents) {
    const childPath = `${target.parentPagePath}/${agent}`;
    const existing = await getPageByPath(target, childPath);
    const markdown = renderAgentPage(agent, byAgent.get(agent) ?? []);
    await putPage(target, childPath, markdown, existing?.etag ?? null);
    log.info(`  ${existing ? "updated" : "created"} ${childPath} (${(byAgent.get(agent) ?? []).length} rows)`);
  }
  log.info(`sync complete — ${agents.length} agent page(s) under ${target.parentPagePath}`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    log.error((err as Error).message);
    process.exit(1);
  });
}

export { main as syncRunLogToAzureWiki };
