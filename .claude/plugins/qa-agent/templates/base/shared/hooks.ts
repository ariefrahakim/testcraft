import { test } from "./test-fixtures.js";
import { logger } from "../utils/logger.js";

const log = logger.scope("hooks");

/**
 * Reusable lifecycle hooks. Import and call from a spec's top level to opt in:
 *
 *   import { attachFailureArtifacts } from "@shared/hooks";
 *   attachFailureArtifacts();
 *
 * Screenshots / videos / traces are configured globally in playwright.config
 * (retain-on-failure); this hook just adds a log breadcrumb the Defect Agent
 * keys off when summarising a failure.
 */
export function attachFailureArtifacts(): void {
  test.afterEach(async (_args, testInfo) => {
    if (testInfo.status !== testInfo.expectedStatus) {
      log.error(
        `FAILED: ${testInfo.title} (${testInfo.status}) — ${testInfo.errors[0]?.message ?? ""}`,
      );
      log.error(`Artifacts under: ${testInfo.outputDir}`);
    }
  });
}
