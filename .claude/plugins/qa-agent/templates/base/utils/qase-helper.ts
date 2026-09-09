import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { env } from "../shared/env.js";
import { logger } from "./logger.js";
import type { TmsCase, TmsStep } from "./tms-types.js";

const log = logger.scope("qase");
const API_BASE = "https://api.qase.io/v1";

/**
 * Qase's case/step shapes ARE the neutral shapes — aliased rather than
 * re-declared so the two cannot drift apart. The neutral definitions (and the
 * documentation of `steps_type` / `automation`) live in `./tms-types.ts`.
 */
export type QaseStep = TmsStep;
export type QaseCase = TmsCase & {
  description?: string;
  postconditions?: string;
  severity?: number;
  priority?: number;
  suite_id?: number;
  tags?: Array<{ title: string; internal_id?: number }>;
};

export interface QaseSuite {
  id: number;
  title: string;
  parent_id?: number | null;
}

export interface QasePlanCaseRef {
  case_id: number;
  title?: string;
}

export interface QasePlan {
  id: number;
  title: string;
  description?: string;
  cases_count: number;
  cases: QasePlanCaseRef[];
}

interface QaseEnvelope<T> {
  status: boolean;
  result: T;
}

/**
 * Active Qase project code. Defaults to `env.qase.project` (QASE_PROJECT) and
 * can be retargeted for one process by `qase.useProject(...)` — used by the
 * `feature-sync` CLI's `--project` flag so a plan can be mirrored out of a
 * sibling project (e.g. a BDD-authored twin) without editing `.env`.
 */
let projectOverride: string | undefined;

/** Suite (test-folder) cache — see `qase.getSuite`. */
const suiteCache = new Map<number, QaseSuite>();

function project(): string {
  return projectOverride ?? env.qase.project;
}

function authHeaders(): Record<string, string> {
  if (!env.qase.token) {
    throw new Error("API_TOKEN is not set — cannot call the Qase API.");
  }
  return {
    Token: env.qase.token,
    "Content-Type": "application/json",
    Accept: "application/json",
  };
}

async function qaseGet<T>(path: string): Promise<T> {
  const url = `${API_BASE}${path}`;
  log.debug(`GET ${url}`);
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    throw new Error(`Qase GET ${path} failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as QaseEnvelope<T>;
  return body.result;
}

async function qasePost<T>(path: string, payload: unknown): Promise<T> {
  const url = `${API_BASE}${path}`;
  log.debug(`POST ${url}`, payload);
  const res = await fetch(url, {
    method: "POST",
    headers: authHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Qase POST ${path} failed: ${res.status} ${await res.text()}`);
  }
  const body = (await res.json()) as QaseEnvelope<T>;
  return body.result;
}

/** Normalises "TC-2045", "2045", or 2045 to the numeric Qase case id. */
export function parseCaseId(ref: string | number): number {
  const n = Number(String(ref).replace(/[^0-9]/g, ""));
  if (!Number.isFinite(n) || n <= 0) {
    throw new Error(`Cannot parse a Qase case id from "${ref}".`);
  }
  return n;
}

export const qase = {
  /** Retarget every subsequent call at another Qase project (process-local). */
  useProject(code: string | undefined): void {
    projectOverride = code || undefined;
  },

  /** The project code calls currently resolve against. */
  project(): string {
    return project();
  },

  /**
   * Authoring style of a case — the switch qa-codegen branches on (CLAUDE.md
   * §5a). Qase reports it as `steps_type`; `"steps"` is a legacy alias for
   * classic that some projects still return.
   */
  caseStyle(testCase: QaseCase): "classic" | "bdd" {
    return testCase.steps_type === "gherkin" ? "bdd" : "classic";
  },

  /** Style breakdown of a plan — how many cases are BDD vs classic. */
  async getPlanStyle(planId: string | number): Promise<{
    plan: QasePlan;
    cases: QaseCase[];
    bdd: QaseCase[];
    classic: QaseCase[];
    style: "bdd" | "classic" | "mixed";
  }> {
    const plan = await this.getPlan(planId);
    const cases = await this.getPlanCases(planId);
    const bdd = cases.filter((c) => this.caseStyle(c) === "bdd");
    const classic = cases.filter((c) => this.caseStyle(c) === "classic");
    const style =
      bdd.length && classic.length ? "mixed" : bdd.length ? "bdd" : "classic";
    log.info(
      `Plan ${plan.id} style: ${style} (${bdd.length} bdd, ${classic.length} classic).`,
    );
    return { plan, cases, bdd, classic, style };
  },

  /** Fetch one test case (with steps) — the Requirement Agent's primary call. */
  async getCase(ref: string | number): Promise<QaseCase> {
    const id = parseCaseId(ref);
    return qaseGet<QaseCase>(`/case/${project()}/${id}`);
  },

  /**
   * Fetch a suite (the "test folder" in Qase). Cached per process — a plan's
   * cases usually all sit in one folder, and the folder name is what the BDD
   * feature file uses as its module tag.
   */
  async getSuite(suiteId: number): Promise<QaseSuite> {
    const cached = suiteCache.get(suiteId);
    if (cached) return cached;
    const suite = await qaseGet<QaseSuite>(`/suite/${project()}/${suiteId}`);
    suiteCache.set(suiteId, suite);
    return suite;
  },

  /** Fetch a test plan and the case ids it contains. */
  async getPlan(planId: string | number): Promise<QasePlan> {
    const id = parseCaseId(planId);
    return qaseGet<QasePlan>(`/plan/${project()}/${id}`);
  },

  /** Fetch every case referenced by a plan (resolves each case in full). */
  async getPlanCases(planId: string | number): Promise<QaseCase[]> {
    const plan = await this.getPlan(planId);
    log.info(`Plan ${plan.id} "${plan.title}" has ${plan.cases_count} case(s).`);
    return Promise.all(plan.cases.map((c) => this.getCase(c.case_id)));
  },

  /**
   * Create a fresh Qase run and return its id. Pass `planId` to create the run
   * directly from a Qase test plan (its cases are included automatically) — this
   * backs the "new cycle per plan run" behaviour. Otherwise pass explicit
   * `caseIds`, or neither to include all cases.
   */
  async createRun(
    title: string,
    opts: { planId?: number; caseIds?: number[] } = {},
  ): Promise<number> {
    const body: Record<string, unknown> = { title };
    if (opts.planId) body.plan_id = opts.planId;
    else if (opts.caseIds?.length) body.cases = opts.caseIds;
    else body.include_all_cases = true;

    const result = await qasePost<{ id: number }>(
      `/run/${project()}`,
      body,
    );
    log.info(`Created Qase run #${result.id} ("${title}").`);
    return result.id;
  },

  /** Create a run from a plan and return its id (one cycle per plan run). */
  async createRunFromPlan(planId: string | number, title?: string): Promise<number> {
    const id = parseCaseId(planId);
    return this.createRun(title ?? `Plan ${id} — automated run`, { planId: id });
  },

  /**
   * Mark an open Qase run Completed. Called at the end of a multi-module sweep
   * (e.g. `azure-pipelines.yml`) after every module has reported into the
   * shared CYCLE_KEY with `QASE_COMPLETE=false`. Idempotent — Qase returns 200
   * even if the run is already Completed.
   */
  async completeRun(runId: string | number): Promise<void> {
    const id = Number(runId);
    if (!Number.isFinite(id) || id <= 0) {
      throw new Error(`completeRun: invalid run id "${runId}"`);
    }
    await qasePost<Record<string, unknown>>(
      `/run/${project()}/${id}/complete`,
      {},
    );
    log.info(`Completed Qase run #${id}.`);
  },
};


// --- Feature mirroring (BDD-authored cases) -----------------------------------
// Qase stays the source of truth (CLAUDE.md §3): a `.feature` file is generated
// from the plan, never hand-authored. Only cases whose `steps_type` is
// `"gherkin"` carry Gherkin; classic cases are converted to a readable
// approximation so a mixed plan still yields one feature file.
// Gherkin rendering lives in `./gherkin.ts` — pure and stack-agnostic. It is
// consumed here (Jira stack) and by `stack-azure/tms.ts` (Azure stack, which
// re-exports this same adapter), so a feature file mirrored from Qase comes out
// byte-identical regardless of the stack. Re-exported here because the CLI
// below and existing callers import them from this module.
import {
  slugify,
  caseToGherkin,
  renderFeature,
  renderStepStub,
} from "./gherkin.js";

export { slugify, caseToGherkin, renderFeature, renderStepStub };

/**
 * Mirrors a plan (or one case) into `features/<area>/<module>.feature` and
 * returns the file contents plus the step skeleton. `qa-codegen` calls this via
 * the CLI. `area` defaults to the case's Qase test folder (suite).
 */
export async function featureSync(opts: {
  scope: string;
  moduleSlug: string;
  /** Folder under `features/` + `steps/`. Defaults to the Qase test folder. */
  areaSlug?: string;
  projectCode?: string;
  outPath?: string;
  write?: boolean;
}): Promise<{
  feature: string;
  stub: string;
  outPath: string;
  areaSlug: string;
  cases: QaseCase[];
}> {
  if (opts.projectCode) qase.useProject(opts.projectCode);
  const projectCode = qase.project();

  let cases: QaseCase[];
  let featureName: string;
  let sourceRef: string;

  if (opts.scope.startsWith("plan:")) {
    const planId = parseCaseId(opts.scope.slice("plan:".length));
    const { plan, cases: planCases, style } = await qase.getPlanStyle(planId);
    cases = planCases;
    featureName = plan.title;
    sourceRef = `plan ${planId} (${style})`;
  } else {
    const one = await qase.getCase(opts.scope);
    cases = [one];
    featureName = one.title;
    sourceRef = `case ${one.id} (${qase.caseStyle(one)})`;
  }

  // Module tag per case, read from its Qase test folder (suite).
  const moduleTagByCase = new Map<number, string>();
  for (const testCase of cases) {
    if (!testCase.suite_id) continue;
    try {
      const suite = await qase.getSuite(testCase.suite_id);
      moduleTagByCase.set(testCase.id, slugify(suite.title));
    } catch (err) {
      log.warn(
        `Could not resolve the Qase folder for case ${testCase.id} — falling back to the module slug.`,
        err,
      );
    }
  }

  // Area = the Qase test folder, unless the caller pins one. It names the
  // folder under `features/` and `steps/`, and tags the feature.
  const areaSlug =
    opts.areaSlug ??
    [...new Set(moduleTagByCase.values())][0] ??
    opts.moduleSlug;

  const feature = renderFeature({
    featureName,
    cases,
    projectCode,
    sourceRef,
    moduleSlug: opts.moduleSlug,
    areaSlug,
    moduleTagByCase,
  });
  const stub = renderStepStub(opts.moduleSlug, areaSlug, cases);
  const outPath =
    opts.outPath ?? `features/${areaSlug}/${opts.moduleSlug}.feature`;

  if (opts.write !== false) {
    const absolute = resolve(process.cwd(), outPath);
    mkdirSync(dirname(absolute), { recursive: true });
    writeFileSync(absolute, feature, "utf8");
    log.info(`Wrote ${outPath}`);
  }

  return { feature, stub, outPath, areaSlug, cases };
}

// --- CLI -----------------------------------------------------------------------
//   npm run qase:create-run -- "<title>"            → new run (all cases)
//   npx tsx utils/qase-helper.ts create-run --plan 1 "<title>"  → cycle per plan
// The numeric run id is printed alone on the LAST stdout line for shell capture:
//   RUN_ID=$(npx tsx utils/qase-helper.ts create-run --plan 1 | tail -1)
const isCli = process.argv[1]?.endsWith("qase-helper.ts");
if (isCli && process.argv[2] === "create-run") {
  const rest = process.argv.slice(3);
  const planFlag = rest.indexOf("--plan");
  const planId = planFlag !== -1 ? rest[planFlag + 1] : undefined;
  const title = rest.filter((a, i) => a !== "--plan" && i !== planFlag + 1)[0];

  const run = planId
    ? qase.createRunFromPlan(planId, title)
    : qase.createRun(title ?? `Automated run ${new Date().toISOString()}`);

  run
    .then((id) => {
      log.info(`Run created. Export CYCLE_KEY=${id} to report into it.`);
      // Machine-readable last line:
      process.stdout.write(`${id}\n`);
    })
    .catch((err) => {
      log.error("Failed to create run", err);
      process.exit(1);
    });
}

//   npx tsx utils/qase-helper.ts plan-style plan:<id> | TC-<id>
// Prints the authoring style so a caller can branch before generating. The last
// stdout line is machine-readable: `bdd`, `classic`, or `mixed`.
if (isCli && process.argv[2] === "plan-style") {
  const scope = process.argv[3];
  if (!scope) {
    log.error("Usage: qase-helper.ts plan-style <plan:<id> | TC-<id>>");
    process.exit(1);
  }

  const resolve_ = scope.startsWith("plan:")
    ? qase
        .getPlanStyle(scope.slice("plan:".length))
        .then(({ style, bdd, classic }) => {
          log.info(
            `bdd cases: ${bdd.map((c) => c.id).join(", ") || "-"} | classic cases: ${classic.map((c) => c.id).join(", ") || "-"}`,
          );
          return style;
        })
    : qase.getCase(scope).then((one) => qase.caseStyle(one));

  resolve_
    .then((style) => process.stdout.write(`${style}\n`))
    .catch((err) => {
      log.error("Could not resolve the authoring style", err);
      process.exit(1);
    });
}

//   npx tsx utils/qase-helper.ts feature-sync plan:1 --module <slug> \
//     [--project CODE] [--out path] [--stdout] [--emit-steps]
// Mirrors a BDD-authored Qase plan into features/<slug>.feature. `--emit-steps`
// prints the steps/<slug>.steps.ts skeleton on stdout (domain-grouped, pending).
if (isCli && process.argv[2] === "feature-sync") {
  const argv = process.argv.slice(3);
  const flag = (name: string): string | undefined => {
    const i = argv.indexOf(`--${name}`);
    return i === -1 ? undefined : argv[i + 1];
  };
  const has = (name: string) => argv.includes(`--${name}`);
  const scope = argv.find((a) => !a.startsWith("--"));

  const moduleSlug = flag("module");
  if (!scope || !moduleSlug) {
    log.error(
      "Usage: qase-helper.ts feature-sync <plan:<id> | TC-<id>> --module <slug> [--area <slug>] [--project CODE] [--out path] [--stdout] [--emit-steps]",
    );
    process.exit(1);
  }

  featureSync({
    scope,
    moduleSlug,
    areaSlug: flag("area"),
    projectCode: flag("project"),
    outPath: flag("out"),
    write: !has("stdout"),
  })
    .then(({ feature, stub }) => {
      if (has("stdout")) process.stdout.write(feature);
      if (has("emit-steps")) process.stdout.write(`\n${stub}`);
    })
    .catch((err) => {
      log.error("Feature sync failed", err);
      process.exit(1);
    });
}

//   npx tsx utils/qase-helper.ts complete-run <runId>
// Mark a Qase run Completed. Used by multi-module sweeps (e.g. the Azure
// pipeline's tail job) after every job has reported into the shared CYCLE_KEY
// with `QASE_COMPLETE=false`.
if (isCli && process.argv[2] === "complete-run") {
  const runId = process.argv[3];
  if (!runId) {
    log.error("Usage: qase-helper.ts complete-run <runId>");
    process.exit(1);
  }
  qase
    .completeRun(runId)
    .catch((err) => {
      log.error("Failed to complete run", err);
      process.exit(1);
    });
}
