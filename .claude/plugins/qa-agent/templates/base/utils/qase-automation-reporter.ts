import type { Reporter, TestCase, TestResult } from "@playwright/test/reporter";
import { readFileSync } from "node:fs";
import { env } from "../shared/env.js";
import { logger } from "./logger.js";

const log = logger.scope("qase-auto");
const QASE_API = "https://api.qase.io/v1";
const AUTOMATED = 2; // Qase automation flag: 0 not-automated, 1 to-be-automated, 2 automated

/**
 * Custom Playwright reporter: after a Qase-reporting run, flip every case whose
 * test PASSED to "Automated" (automation = 2) in Qase, so the test-management
 * status stays in sync with what the repo actually automates — no manual patch.
 *
 * Resolves the qase id per passed test in two ways:
 *   1. `TestCase.tags` — the BDD entry point (playwright-bdd) mirrors the
 *      `@qase-id:<n>` tag from the feature file onto the generated spec's
 *      `{ tag: [...] }`, so tags are the authoritative source there.
 *   2. Source parse — TDD specs call `qase.id(<n>)` in the test body; the
 *      value is not on `TestCase.tags`/`annotations`, so we grep the source.
 *
 * Gated on `QASE_MODE=testops` + `API_TOKEN` (same gate as the qase reporter) —
 * a no-op for local/offline runs. Only PASSED tests are synced; skipped/failed
 * are left untouched.
 */
export default class QaseAutomationReporter implements Reporter {
  private readonly passedByFile = new Map<string, Set<string>>();
  private readonly idsFromTags = new Set<number>();

  onTestEnd(test: TestCase, result: TestResult): void {
    if (result.status !== "passed") return;
    for (const id of extractQaseIdsFromTags(test.tags)) this.idsFromTags.add(id);
    const file = test.location.file;
    if (!this.passedByFile.has(file)) this.passedByFile.set(file, new Set());
    this.passedByFile.get(file)!.add(test.title);
  }

  async onEnd(): Promise<void> {
    if (env.qase.mode !== "testops" || !env.qase.token) return;

    const ids = new Set<number>(this.idsFromTags);
    for (const [file, titles] of this.passedByFile) {
      const titleToIds = parseQaseIds(file);
      for (const title of titles) {
        for (const id of titleToIds.get(title) ?? []) ids.add(id);
      }
    }
    if (ids.size === 0) return;

    log.info(`Syncing ${ids.size} passed case(s) → Automated in Qase…`);
    let ok = 0;
    for (const id of ids) {
      const res = await fetch(`${QASE_API}/case/${env.qase.project}/${id}`, {
        method: "PATCH",
        headers: {
          Token: env.qase.token,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ automation: AUTOMATED }),
      }).catch(() => null);
      if (res && res.ok) ok++;
      else log.warn(`Could not mark case ${id} automated (${res ? res.status : "network error"}).`);
    }
    log.info(`Qase automation sync: ${ok}/${ids.size} case(s) marked Automated.`);
  }
}

/** Extract numeric qase ids from `@qase-id:<n>` tags (single or comma list). */
function extractQaseIdsFromTags(tags: readonly string[]): number[] {
  const out: number[] = [];
  for (const tag of tags) {
    const m = /^@qase-id:([\d,\s]+)$/.exec(tag);
    if (!m) continue;
    for (const chunk of m[1]!.split(",")) {
      const n = Number(chunk.trim());
      if (Number.isFinite(n) && n > 0) out.push(n);
    }
  }
  return out;
}

/** Map each `test("title", …)` to the `qase.id(...)` declared in its body. */
function parseQaseIds(file: string): Map<string, number[]> {
  const map = new Map<string, number[]>();
  let src: string;
  try {
    src = readFileSync(file, "utf8");
  } catch {
    return map;
  }
  // test(.skip|.only|.fixme)?("title", …  qase.id( 12 | [12, 13] )
  const re =
    /\btest(?:\.(?:skip|only|fixme))?\s*\(\s*(["'`])((?:\\.|(?!\1)[\s\S])*?)\1[\s\S]*?\bqase\.id\(\s*\[?\s*([\d,\s]+?)\s*\]?\s*\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(src)) !== null) {
    const rawTitle = m[2];
    const rawIds = m[3];
    if (rawTitle === undefined || rawIds === undefined) continue;
    const title = rawTitle.replace(/\\(["'`\\])/g, "$1");
    const idList = rawIds
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (idList.length) map.set(title, idList);
  }
  return map;
}
