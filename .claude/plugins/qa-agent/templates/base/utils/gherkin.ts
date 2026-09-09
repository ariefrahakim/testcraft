import type { TmsCase } from "./tms-types.js";
import { logger } from "./logger.js";

/**
 * Gherkin rendering — pure, stack-agnostic.
 *
 * Test management is Qase on both stacks. This module is extracted (rather
 * than living inside `qase-helper.ts`) so the rendering pipeline stays a
 * separate, side-effect-free layer: the `Jira` and `Azure Boards` stacks both
 * scaffold this file and both hand it the same neutral `TmsCase` shape from
 * `tms-types.ts`, so a feature file mirrored from Qase comes out byte-identical
 * on either stack.
 *
 * Nothing here performs I/O or knows which test-management system a case came
 * from — it operates on the neutral `TmsCase` shape in `tms-types.ts`.
 */

const log = logger.scope("gherkin");

const GHERKIN_KEYWORDS = /^(Given|When|Then|And|But|\*)\s+/;

/** `, _arg1, _arg2` — one param per `{…}` capture, for playwright-bdd's arity check. */
function captureParams(expression: string): string {
  const captures = expression.match(/\{(string|int|float|word)\}/g)?.length ?? 0;
  return Array.from({ length: captures }, (_, i) => `, _arg${i + 1}`).join("");
}

/** "Bid Ocean Support" → "bid-ocean-support" — the module-tag/slug form. */
export function slugify(title: string): string {
  return title
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Gherkin body of one case, indented for a `Scenario:`.
 *
 * BDD cases pass through verbatim (the QA author's wording is authoritative).
 * Classic cases are approximated: preconditions → `Given`, each `action` →
 * `When`, each `expected_result` → `Then`.
 */
export function caseToGherkin(testCase: TmsCase): string {
  if (testCase.steps_type === "gherkin") {
    const block = testCase.steps.map((s) => s.action ?? "").join("\n").trim();
    if (!block) return "    # (no steps authored in the test-management system)";
    const lines = block.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    const unkeyed = lines.filter((l) => !GHERKIN_KEYWORDS.test(l));
    if (unkeyed.length) {
      log.warn(
        `Case ${testCase.id}: ${unkeyed.length} line(s) carry no Gherkin keyword — emitted as comments.`,
      );
    }
    return lines
      .map((l) => (GHERKIN_KEYWORDS.test(l) ? `    ${l}` : `    # ${l}`))
      .join("\n");
  }

  const lines: string[] = [];
  for (const line of (testCase.preconditions ?? "").split(/\r?\n/)) {
    const text = line.replace(/^[-*]\s*/, "").trim();
    if (text) lines.push(`    Given ${text}`);
  }
  for (const step of testCase.steps) {
    const action = (step.action ?? "").trim();
    if (action) lines.push(`    When ${action}`);
    const expected = (step.expected_result ?? "").trim();
    if (expected) lines.push(`    Then ${expected}`);
    const data = (step.data ?? "").trim();
    if (data && data !== "-") lines.push(`    # data: ${data}`);
  }
  return lines.length ? lines.join("\n") : "    # (no steps authored in Qase)";
}

/**
 * Renders the whole `.feature` file for a plan (or a single case).
 *
 * Tagging is deliberately minimal:
 *  - Feature level: `@qase-project:<CODE>` (the upload guard) and `@<module>` —
 *    the module tag, taken from the case's **Qase test folder** (suite) so the
 *    feature is tagged by module, not by a pile of semantic labels.
 *  - Scenario level: `@qase-id:<id>` (the case pin), plus `@manual` for a case
 *    that is not flagged for automation.
 * Cases sitting in a different folder than the rest carry their own module tag
 * on the scenario.
 */
export function renderFeature(opts: {
  featureName: string;
  cases: TmsCase[];
  projectCode: string;
  sourceRef: string;
  moduleSlug: string;
  areaSlug: string;
  /** case id → module tag, resolved from the case's Qase suite. */
  moduleTagByCase?: Map<number, string>;
}): string {
  const tagOf = (testCase: TmsCase) =>
    opts.moduleTagByCase?.get(testCase.id) ?? opts.moduleSlug;
  const moduleTags = [...new Set(opts.cases.map(tagOf))];
  const featureModuleTag = moduleTags.length === 1 ? moduleTags[0] : undefined;

  const out: string[] = [];
  out.push(
    [
      `@qase-project:${opts.projectCode}`,
      ...(featureModuleTag ? [`@${featureModuleTag}`] : []),
    ].join(" "),
  );
  out.push(`Feature: ${opts.featureName}`);
  out.push(
    `  Mirrored from Qase ${opts.sourceRef} (project ${opts.projectCode}) by`,
    `  npm run qase:feature-sync — Qase remains the source of truth.`,
    `  Step definitions: steps/${opts.areaSlug}/${opts.moduleSlug}.steps.ts`,
    "",
  );

  for (const testCase of opts.cases) {
    const tags = [
      `@qase-id:${testCase.id}`,
      // Only when the case sits outside the feature's single module folder.
      ...(featureModuleTag ? [] : [`@${tagOf(testCase)}`]),
      ...(testCase.automation === 0 ? ["@manual"] : []),
    ];
    out.push(`  ${tags.join(" ")}`);
    out.push(`  Scenario: ${testCase.title}`);
    out.push(caseToGherkin(testCase));
    out.push("");
  }

  return `${out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd()}\n`;
}

/**
 * Renders a `steps/<area>/<module>.steps.ts` skeleton: every distinct step text,
 * with quoted literals collapsed to `{string}` and left `pending`, sorted
 * Given → When → Then. Implement each one against the module's page object and
 * group them into domain sections as you go (CLAUDE.md §5a).
 */
export function renderStepStub(
  moduleSlug: string,
  areaSlug: string,
  cases: TmsCase[],
): string {
  const seen = new Map<string, "Given" | "When" | "Then">();
  for (const testCase of cases) {
    // `And` / `But` inherit the previous keyword's kind.
    let kind: "Given" | "When" | "Then" = "Given";
    for (const raw of caseToGherkin(testCase).split("\n")) {
      const line = raw.trim();
      const matched = line.match(GHERKIN_KEYWORDS);
      if (!matched) continue;
      const keyword = matched[1] ?? "";
      if (keyword === "Given") kind = "Given";
      else if (keyword === "When") kind = "When";
      else if (keyword === "Then") kind = "Then";
      const text = line.slice(keyword.length).trim();
      const expression = text.replace(/"[^"]*"/g, "{string}");
      if (!seen.has(expression)) seen.set(expression, kind);
    }
  }

  // Emitted as ONE sorted list (Given → When → Then, alphabetical within each).
  // Grouping is deliberately NOT guessed here: qa-codegen splits the list into
  // domain sections when it implements the steps (CLAUDE.md §5a) — a keyword
  // heuristic mislabels assertions and would bake app-specific wording into
  // this shared helper.
  const rank: Record<string, number> = { Given: 0, When: 1, Then: 2 };
  const body = [...seen.entries()]
    .sort(
      ([textA, fnA], [textB, fnB]) =>
        (rank[fnA] ?? 9) - (rank[fnB] ?? 9) || textA.localeCompare(textB),
    )
    .flatMap(([text, fn]) => [
      // playwright-bdd reads the injected fixtures from the destructuring
      // pattern of the first argument, and its arity check compares the
      // argument count with the number of captures — so the stub destructures
      // explicitly and declares one param per capture even though `pending`
      // ignores them.
      `${fn}("${text.replace(/"/g, '\\"')}", ({ $testInfo, $step }${captureParams(text)}) =>\n  pending({ $testInfo, $step }),\n);`,
      "",
    ])
    .join("\n");

  return [
    `import { expect } from "@playwright/test";`,
    `import type { StepContext } from "../../shared/pom-fixtures.js";`,
    `import { Given, When, Then, pending } from "../../shared/bdd/fixtures.js";`,
    ``,
    `// steps/${areaSlug}/${moduleSlug}.steps.ts — the shared business-step layer.`,
    `//`,
    `//   BDD:  features/${areaSlug}/${moduleSlug}.feature  →  Step  →  Page  →  Locator`,
    `//   TDD:  tests/e2e/${areaSlug}/${moduleSlug}.spec.ts  →  Step  →  Page  →  Locator`,
    `//`,
    `// One implementation, two entry points: put the body in an exported business`,
    `// function and let the Gherkin binding delegate to it, so a classic spec can`,
    `// import the very same step:`,
    `//`,
    `//   export async function openProfileDropdown({`,
    `//     ${moduleSlug.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Page,`,
    `//   }: Pick<StepContext, "${moduleSlug.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Page">): Promise<void> {`,
    `//     await ${moduleSlug.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Page.openProfileDropdown();`,
    `//   }`,
    `//   Given("the user has opened the profile dropdown", openProfileDropdown);`,
    `//`,
    `// Drive the app only through pages/${areaSlug}/*.page.ts — never a raw`,
    `// selector.`,
    `//`,
    `// TODO: as you implement these, split the list into banner-commented DOMAIN`,
    `// sections (// Authentication & session, // Navigation, …) — matching`,
    `// ignores Given/When/Then, so domain is the only grouping that scales`,
    `// (CLAUDE.md §5a).`,
    ``,
    body.trimEnd(),
    ``,
  ].join("\n");
}
