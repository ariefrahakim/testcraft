/**
 * CI half of the orchestrator scope resolver.
 *
 * Reads the Jira epic passed in `EPIC` (env var), finds its `[Test]/[T-…]/[QA]`
 * child, and extracts the Qase plan id from the child's summary + description.
 * Prints the numeric plan id as the LAST stdout line (so a shell wrapper can
 * capture it via `tail -1`) — matching the pattern used by
 * `utils/qase-helper.ts create-run`.
 *
 * Exit codes
 *   0 — resolved (plan id printed on the last line)
 *   2 — epic has no `[Test]/[T-…]/[QA]` child
 *   3 — `[Test]` child has neither a Qase plan id nor any `TC-xxxx` ref
 *
 * The agentic phases (heal + FE/BE defect routing + run-logger sync) remain
 * local-only — this script only covers the deterministic resolution step so
 * `/qa-agent <EPIC-KEY>` and `.github/workflows/qa.yml` can share it.
 */

// Through the gateway, not the provider: this file is stack-agnostic, and
// `./tracker.js` resolves to Jira or Azure Boards depending on how the repo was
// scaffolded (see utils/tracker.ts).
import {
  extractCaseRefs,
  extractPlanId,
  tracker,
} from "./tracker.js";
import { logger } from "./logger.js";

const log = logger.scope("orchestrator");

async function main(): Promise<void> {
  const epicKey = process.env.EPIC?.trim();
  if (!epicKey) {
    log.error("EPIC env var is required (e.g. EPIC=NLM-4).");
    process.exit(1);
  }

  const children = await tracker.getEpicChildren(epicKey);
  const testChild = children.find((c) => c.classification === "test");
  if (!testChild) {
    log.error(
      `Epic ${epicKey} has no [Test]/[T-…]/[QA] child. ` +
        `Children: ${children.map((c) => `${c.key} (${c.classification})`).join(", ") || "(none)"}.`,
    );
    process.exit(2);
  }

  const description = await tracker.getIssueDescription(testChild.key);
  const blob = `${testChild.summary}\n${description}`;
  const planId = extractPlanId(blob);
  const caseRefs = extractCaseRefs(blob);

  if (!planId) {
    log.error(
      `Test child ${testChild.key} has no Qase plan id in summary/description. ` +
        `Case refs found: ${caseRefs.join(", ") || "(none)"}.`,
    );
    process.exit(3);
  }

  log.info(
    `Resolved epic ${epicKey} → [Test] child ${testChild.key} → Qase plan ${planId}` +
      (caseRefs.length ? ` (also saw refs: ${caseRefs.join(", ")})` : ""),
  );

  // Last stdout line is the plan id for shell capture.
  process.stdout.write(`${planId}\n`);
}

main().catch((err) => {
  log.error("Failed to resolve epic.", err);
  process.exit(1);
});
