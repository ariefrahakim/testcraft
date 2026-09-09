import { mkdirSync } from "node:fs";
import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const log = logger.scope("global");

/**
 * Optional global setup hook (wire into playwright.config `globalSetup` if you
 * want it to run once before everything). Validates config and ensures report
 * directories exist. Auth is handled separately by the `setup` project
 * (auth.setup.ts) so it can use the browser fixtures.
 */
export default async function globalSetup(): Promise<void> {
  for (const dir of [
    "reports/.auth",
    "reports/screenshots",
    "reports/traces",
    "reports/videos",
  ]) {
    mkdirSync(dir, { recursive: true });
  }

  log.info(`Target host: ${env.host}`);
  // Qase is TMS on both stacks (§7).
  log.info(`Qase mode: ${env.qase.mode} (project ${env.qase.project})`);
  if (env.qase.mode === "testops" && !env.qase.token) {
    log.warn("QASE_MODE=testops but API_TOKEN is empty — results won't upload.");
  }
}
