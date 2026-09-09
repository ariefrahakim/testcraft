import { defineConfig, devices } from "@playwright/test";
// #region qa-agent:bdd
import { defineBddProject } from "playwright-bdd";
// #endregion qa-agent:bdd
import dotenv from "dotenv";
import { env } from "./shared/env.js";

// Load .env before anything reads process.env. The .env file is gitignored.
dotenv.config();

// Read through the typed gateway (shared/env.ts), which throws when HOST is
// missing. No literal fallback: a config that quietly points at someone
// else's staging host is worse than one that refuses to start.
const BASE_URL = env.host;
const IS_CI = !!process.env.CI;

// Full-screen (full-HD, 1920×1080) render surface — shared by the browser
// window, the page viewport, and the video recorder so recordings are always
// FHD. Mobile scenarios keep this outer surface at 1920×1080 and emulate the
// smaller device *centered* inside it via `shared/viewport.ts`
// (`emulateMobileCentered`), so the recording shows the phone frame in the
// middle of the video instead of pinned to the top-left corner.
const VIEWPORT = { width: 1920, height: 1080 };

/**
 * The test-management reporter is only attached when the stack's mode is
 * `testops` AND a token is present. In local runs without one we keep the noise
 * down with the list + html reporters and still produce the full local report.
 */
// Qase is the test-management system on BOTH stacks. The gate is the same
// regardless of tracker: `QASE_MODE=testops` + `API_TOKEN`.
const tmsEnabled =
  process.env.QASE_MODE === "testops" && !!process.env.API_TOKEN;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./reports/test-results",
  // The app-under-test allows only ONE active session per user (single SSO):
  // two workers logging in with the same account evict each other's session,
  // bouncing in-flight tests back to /login (search returns 0 rows). So the
  // suite MUST run serially — `workers: 1` everywhere (CI included). Do not
  // raise this without a pool of distinct test accounts. `fullyParallel` is
  // left off for the same reason; it has no effect at one worker but documents
  // the intent.
  fullyParallel: false,
  forbidOnly: IS_CI,
  // Retries are ENV-driven so the regression pipeline can pin them to 0 for a
  // deterministic sweep (each red is a real red, no flake-masking retries).
  // Defaults: 2 in CI so ad-hoc local dispatches still tolerate transient
  // infra flake, 0 locally. `regression.yml` / `azure-pipelines.yml` set
  // `PW_RETRIES=0` explicitly.
  retries: process.env.PW_RETRIES !== undefined
    ? Number(process.env.PW_RETRIES)
    : IS_CI ? 2 : 0,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },

  reporter: [
    ["list"],
    ["html", { outputFolder: "reports/html", open: "never" }],
    ["json", { outputFile: "reports/results.json" }],
    ...(tmsEnabled
      ? [
          // Qase is the test-management system on BOTH stacks (`jira` and
          // `azure`) — the tracker differs, TMS does not. Reporter wiring is
          // therefore identical regardless of stack.
          [
            "playwright-qase-reporter",
            {
              mode: "testops",
              debug: false,
              testops: {
                api: { token: process.env.API_TOKEN },
                // Read strictly from QASE_PROJECT (via shared/env.ts semantics)
                // — no hardcoded fallback so the same config serves Core / Lite
                // repos: each sets its own QASE_PROJECT in `.env`.
                project: env.qase.project,
                // Run handling (qa-runner):
                //  - CYCLE_KEY set   → reuse that existing run.
                //  - CYCLE_KEY unset → the reporter AUTO-CREATES a new run
                //    (cycle) on this execution using the title below.
                run: {
                  id: process.env.CYCLE_KEY
                    ? Number(process.env.CYCLE_KEY)
                    : undefined,
                  title:
                    process.env.QASE_RUN_TITLE ??
                    `Automated run ${new Date().toISOString()}`,
                  // Per-module regression (utils/run-regression.ts) reuses one
                  // CYCLE_KEY across several playwright invocations and must NOT
                  // complete the run after each module — only after the last.
                  // It sets QASE_COMPLETE=false for every module but the final
                  // one. Default stays `true` so single invocations still close.
                  complete: process.env.QASE_COMPLETE !== "false",
                },
                uploadAttachments: true,
              },
            },
          ] as const,
          // After the run, sync each PASSED case to Automated in Qase so the
          // test-management status tracks what the repo actually automates
          // (utils/qase-automation-reporter.ts). Same gate as the qase reporter.
          // Applies on both `jira` and `azure` stacks (§7 of CLAUDE.md).
          ["./utils/qase-automation-reporter.ts"] as const,
        ]
      : []),
  ],

  use: {
    baseURL: BASE_URL,
    headless: true,
    // Full-screen (full-HD) viewport so the recorded video shows the whole app.
    viewport: VIEWPORT,
    // Match the OS browser window to the viewport so headed runs are full-screen
    // too (headless already renders at the full VIEWPORT). Without this the
    // headed window opens smaller than 1920×1080 and the page is letter-boxed.
    launchOptions: {
      args: [`--window-size=${VIEWPORT.width},${VIEWPORT.height}`, "--window-position=0,0"],
    },
    actionTimeout: 15_000,
    navigationTimeout: 30_000,
    trace: "retain-on-failure",
    // Screenshot: failures only. Video: recorded for EVERY test, full-screen.
    screenshot: "only-on-failure",
    video: { mode: "on", size: VIEWPORT },
  },

  projects: [
    // #region qa-agent:tdd
    // chromium is intentionally listed FIRST. Playwright UI (`--ui`) keeps the
    // project-checkbox state in plain component state (reset empty each launch)
    // and, with no persisted selection, defaults to enabling the FIRST project
    // in this array. Keeping chromium first makes the UI open on the real tests
    // instead of the auth-only `setup` project.
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        viewport: VIEWPORT,
        storageState: "reports/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    // #endregion qa-agent:tdd
    // #region qa-agent:bdd
    // BDD project — Gherkin mirrored from BDD-authored Qase cases
    // (`steps_type: "gherkin"`). `bddgen` turns every
    // `features/<area>/<module>.feature` into a generated spec under
    // `.features-gen/` (gitignored), bound to the shared business steps in
    // `steps/<area>/<module>.steps.ts` and the POM fixtures in
    // `shared/bdd/fixtures.ts`. Both flows end at the same layers:
    //   BDD:  Feature → Step → Page → Locator
    //   TDD:  Spec    → Step → Page → Locator
    // Classic Qase cases keep using the plain `chromium` project above — see
    // CLAUDE.md §5a.
    //
    // `missingSteps: "skip-scenario"` keeps a half-built module honest: a
    // scenario whose steps are not implemented yet is reported as skipped,
    // never as a false green.
    {
      ...defineBddProject({
        name: "bdd",
        features: "features/**/*.feature",
        steps: ["steps/**/*.steps.ts", "shared/bdd/fixtures.ts"],
        outputDir: ".features-gen",
        missingSteps: "skip-scenario",
        quotes: "double",
      }),
      use: {
        ...devices["Desktop Chrome"],
        viewport: VIEWPORT,
        storageState: "reports/.auth/user.json",
      },
      dependencies: ["setup"],
    },
    // #endregion qa-agent:bdd
    // Authenticate once and persist storage state for the rest. auth.setup.ts
    // lives in shared/ (outside the ./tests testDir), so the setup project needs
    // its own testDir or it matches 0 files — which also makes it invisible in
    // `--ui` and silently skips real authentication. Declared after chromium;
    // the `dependencies: ["setup"]` reference resolves by name, not array order.
    {
      name: "setup",
      testDir: "./shared",
      testMatch: /auth\.setup\.ts/,
    },
  ],
});
