import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { env } from "../shared/env.js";
import { logger } from "./logger.js";

const log = logger.scope("selector");

/**
 * Selector strategy, highest priority first. The Locator Agent and reviewers
 * use this order both to choose and to grade selectors (see CLAUDE.md).
 */
export const SELECTOR_PRIORITY = [
  "data-testid",
  "aria-label",
  "role",
  "id",
  "css",
  "xpath",
] as const;
export type SelectorStrategy = (typeof SELECTOR_PRIORITY)[number];

export interface TestIdHit {
  testId: string;
  file: string; // path relative to the FE repo
  line: number;
}

const CODE_EXT = new Set([".tsx", ".ts", ".jsx", ".js"]);
const SKIP_DIRS = new Set([
  "node_modules",
  ".git",
  "build",
  "dist",
  "coverage",
  "graphify-out",
]);
const TESTID_RE = /data-testid=["'`]([^"'`]+)["'`]/g;

function* walk(dir: string): Generator<string> {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const name of entries) {
    if (SKIP_DIRS.has(name)) continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      yield* walk(full);
    } else if (CODE_EXT.has(name.slice(name.lastIndexOf(".")))) {
      yield full;
    }
  }
}

/**
 * Scan the frontend source checkout for `data-testid` values. Pass a substring
 * or /regex/ to filter; omit to return every hit. This is the Locator Agent's
 * fallback when no committed locator exists (priority 2 in the search order).
 */
export function findTestIds(filter?: string | RegExp): TestIdHit[] {
  const root = env.feRepoPath;
  if (!root) {
    throw new Error(
      "FE_REPO_PATH is empty — set it in .env to the frontend subtree that " +
        "should be scanned for data-testid (see .claude/app-profile.md).",
    );
  }
  const matcher =
    filter == null
      ? () => true
      : filter instanceof RegExp
        ? (id: string) => filter.test(id)
        : (id: string) => id.toLowerCase().includes(filter.toLowerCase());

  const hits: TestIdHit[] = [];
  for (const file of walk(root)) {
    let content: string;
    try {
      content = readFileSync(file, "utf8");
    } catch {
      continue;
    }
    if (!content.includes("data-testid")) continue;
    const lines = content.split("\n");
    lines.forEach((line, i) => {
      let m: RegExpExecArray | null;
      TESTID_RE.lastIndex = 0;
      while ((m = TESTID_RE.exec(line)) !== null) {
        const id = m[1]!;
        if (matcher(id)) {
          hits.push({ testId: id, file: relative(root, file), line: i + 1 });
        }
      }
    });
  }
  log.debug(`findTestIds(${String(filter ?? "*")}) → ${hits.length} hit(s).`);
  return hits;
}

/** Build the Playwright selector string for a discovered data-testid. */
export function testIdSelector(testId: string): string {
  return `[data-testid="${testId}"]`;
}

/** Reject selectors that violate the strategy (xpath / nth-child brittleness). */
export function gradeSelector(selector: string): {
  strategy: SelectorStrategy;
  ok: boolean;
  reason?: string;
} {
  if (selector.startsWith("xpath=") || selector.startsWith("//")) {
    return { strategy: "xpath", ok: false, reason: "xpath is last resort only" };
  }
  if (selector.includes("data-testid")) return { strategy: "data-testid", ok: true };
  if (selector.includes("aria-label")) return { strategy: "aria-label", ok: true };
  if (selector.startsWith("role=") || selector.includes("[role="))
    return { strategy: "role", ok: true };
  if (/^#[\w-]+$/.test(selector)) return { strategy: "id", ok: true };
  if (/:nth-(child|of-type)/.test(selector))
    return { strategy: "css", ok: false, reason: "positional css is brittle" };
  return { strategy: "css", ok: true };
}
