/**
 * Verify `logs/run-log.jsonl` carries the expected rows for a given runId.
 *
 * Called by the `/qa-agent` orchestrator after each sub-command returns
 * (see `commands/qa-agent.md` §Run-logger contract). If the sub-command
 * finished but no matching row was appended, the orchestrator forgot the
 * `hubexo-spec-sprint:run-logger` skill invocation — the missing row is
 * a contract violation and this checker returns non-zero so the
 * orchestrator can log a Rework entry and retry the logger call.
 *
 * Usage (via the wired-up npm script):
 *
 *   npm run run-log:check -- --run-id <RUN_ID> --expect qa-codegen
 *   npm run run-log:check -- --run-id <RUN_ID> --expect qa-codegen,qa-runner,qa-defect
 *
 * Exit codes:
 *   0 — every expected agent has at least one row for the runId.
 *   1 — one or more expected agents are missing (names printed).
 *   2 — arguments invalid.
 */
import { readFileSync, existsSync } from "node:fs";

interface LogEntry {
  ts: string;
  runId?: string;
  agent: string;
  duration?: number;
  token_cost?: number;
}

function parseArgs(argv: string[]): { runId: string; expect: string[]; requireMetrics: boolean } {
  const out: { runId: string; expect: string[]; requireMetrics: boolean } = {
    runId: "",
    expect: [],
    requireMetrics: true,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--run-id") out.runId = argv[++i] ?? "";
    else if (arg === "--expect") out.expect = (argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (arg === "--no-require-metrics") out.requireMetrics = false;
    else if (arg === "--help" || arg === "-h") {
      console.log(
        "Usage: run-log-check --run-id <RUN_ID> --expect <agent[,agent…]>\n" +
          "\n" +
          "  --run-id <id>            The orchestrator's runId (from `uuidgen | tr A-Z a-z`).\n" +
          "  --expect <a,b,c>         Comma-separated agent names that MUST have at least one row.\n" +
          "                           Valid names: qa-agent-orchestrator, qa-codegen, qa-runner,\n" +
          "                                        qa-healer, qa-defect, qa-pr.\n" +
          "  --no-require-metrics     Skip the duration+token_cost check on expected rows\n" +
          "                           (default: fail when either is missing).\n",
      );
      process.exit(0);
    }
  }
  return out;
}

function loadEntries(): LogEntry[] {
  const path = "logs/run-log.jsonl";
  if (!existsSync(path)) return [];
  return readFileSync(path, "utf8")
    .split("\n")
    .filter((line) => line.trim())
    .map((line) => {
      try {
        return JSON.parse(line) as LogEntry;
      } catch {
        return null;
      }
    })
    .filter((v): v is LogEntry => v !== null);
}

function main(): number {
  const args = parseArgs(process.argv.slice(2));
  if (!args.runId || args.expect.length === 0) {
    console.error("run-log-check: --run-id and --expect are both required. See --help.");
    return 2;
  }

  const entries = loadEntries();
  const forRun = entries.filter((e) => e.runId === args.runId);

  const missingRows: string[] = [];
  const partialRows: { agent: string; ts: string; missing: string }[] = [];

  for (const expectedAgent of args.expect) {
    const rows = forRun.filter((e) => e.agent === expectedAgent);
    if (rows.length === 0) {
      missingRows.push(expectedAgent);
      continue;
    }
    if (args.requireMetrics) {
      for (const r of rows) {
        const missing = [
          r.duration === undefined ? "duration" : null,
          r.token_cost === undefined ? "token_cost" : null,
        ]
          .filter(Boolean)
          .join(", ");
        if (missing) partialRows.push({ agent: r.agent, ts: r.ts, missing });
      }
    }
  }

  if (missingRows.length === 0 && partialRows.length === 0) {
    console.log(
      `run-log-check: OK — ${args.expect.length} agent(s) accounted for on runId ${args.runId.slice(0, 8)}.`,
    );
    return 0;
  }

  if (missingRows.length > 0) {
    console.error(
      `run-log-check: FAIL — no row on runId ${args.runId.slice(0, 8)} for: ${missingRows.join(", ")}. ` +
        `Re-fire hubexo-spec-sprint:run-logger for the missing step(s).`,
    );
  }
  if (partialRows.length > 0) {
    console.error(`run-log-check: FAIL — partial row(s) on runId ${args.runId.slice(0, 8)}:`);
    for (const p of partialRows) {
      console.error(`  ${p.ts}  ${p.agent}  (missing: ${p.missing})`);
    }
    console.error(
      "duration + token_cost can only be captured at write time by run-logger. " +
        "Re-fire the skill for the offending step(s) — do NOT edit the JSONL by hand.",
    );
  }
  return 1;
}

process.exit(main());
