#!/usr/bin/env tsx
/**
 * Turn the module list from `npm run modules` into an Azure Pipelines matrix.
 *
 * GitHub Actions consumes a JSON array directly; Azure wants an object keyed by
 * job name:
 *
 *   {"bid-search": {"moduleName": "bid-search"}, "login": {"moduleName": "login"}}
 *
 * Reading stdin rather than re-implementing discovery keeps ONE source of truth
 * for which modules exist (`scripts/list-modules.ts`) — two discovery paths
 * would drift, and the symptom would be a module silently missing from one CI
 * system but not the other.
 */

const chunks: Buffer[] = [];
process.stdin.on("data", (c: Buffer) => chunks.push(c));
process.stdin.on("end", () => {
  const raw = Buffer.concat(chunks).toString("utf8").trim();

  let modules: string[];
  try {
    const parsed: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(parsed)) throw new Error("expected a JSON array");
    modules = parsed.map(String);
  } catch (error) {
    process.stderr.write(
      `Could not read the module list from stdin: ${(error as Error).message}\n` +
        `Received: ${raw.slice(0, 200)}\n`,
    );
    process.exitCode = 1;
    return;
  }

  const matrix = Object.fromEntries(
    modules.map((m) => [m, { moduleName: m }]),
  );
  process.stdout.write(JSON.stringify(matrix));
});
