import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { env } from "../shared/env.js";
import { logger } from "./logger.js";

const log = logger.scope("fe-sync");

export interface FeSyncResult {
  repoRoot: string;
  branch: string;
  action: "cloned" | "pulled" | "fast-forwarded" | "already-up-to-date";
  headBefore: string | null;
  headAfter: string;
}

/**
 * Sync the FE source checkout used by qa-codegen for selector discovery.
 *
 * - Clones `env.fe.gitUrl` into `env.fe.repoRoot` if the directory is missing.
 * - Otherwise fetches `env.fe.branch` and fast-forwards the working tree.
 * - Authenticates:
 *   - Azure Repos over HTTPS (`https://dev.azure.com/<org>/…` or
 *     `https://<org>.visualstudio.com/…`) → Basic auth from `AZURE_PAT` via
 *     `http.extraheader` (PAT never lands in the remote URL, git config, or
 *     reflog). PAT scope required: **Code (Read)**.
 *   - Otherwise → SSH using `env.fe.sshKey` (sets `GIT_SSH_COMMAND`).
 *
 * Called automatically by /qa-agent-generate (and the qa-codegen agent) before
 * any FE source is mined, so generation always runs against the latest
 * `master`. Throws on any git failure — the codegen contract treats a stale FE
 * tree as a hard error.
 */
export function syncFeRepo(): FeSyncResult {
  const { repoRoot, gitUrl, branch, sshKey } = env.fe;
  if (!gitUrl) throw new Error("FE_REPO_URL is empty — set it in .env (legacy: FE_GITHUB_LINK)");

  const absRoot = resolve(repoRoot);
  const gitEnv: NodeJS.ProcessEnv = { ...process.env };

  // Azure Repos over HTTPS with a PAT: pass Basic auth via http.extraheader so
  // the PAT never lands in the remote URL, git config, or reflog. The header
  // is scoped to this process' git invocations only. Falls through to SSH auth
  // when the URL isn't Azure Repos or AZURE_PAT is empty.
  const isAzureHttps =
    /^https:\/\/(.*@)?(dev\.azure\.com|.*\.visualstudio\.com)\//i.test(gitUrl);
  // env.azure exists only when the azure region is scaffolded; read defensively
  // so this file compiles on both jira and azure stacks.
  const azurePat = (env as { azure?: { pat?: string } }).azure?.pat;
  const azureAuthArgs: string[] = [];
  if (isAzureHttps && azurePat) {
    const basic = Buffer.from(`:${azurePat}`).toString("base64");
    azureAuthArgs.push("-c", `http.extraheader=Authorization: Basic ${basic}`);
    log.info("authenticating to Azure Repos via AZURE_PAT (http.extraheader)");
  } else if (isAzureHttps && !azurePat) {
    log.warn(
      "FE_REPO_URL looks like Azure Repos but AZURE_PAT is empty — git will fall back to any system credential helper.",
    );
  } else if (sshKey) {
    // Accept either a path to a private-key file (preferred) or a value that
    // looks like a public-key blob (`ssh-ed25519 AAAA…`). The blob form is a
    // common misconfig — fall back to the default ssh-agent so the operator
    // doesn't get blocked, but warn loudly so they fix `.env`.
    const looksLikePublicKeyBlob =
      sshKey.startsWith("ssh-") || sshKey.includes(" ");
    if (looksLikePublicKeyBlob) {
      log.warn(
        "SSH_KEY looks like a public-key blob, not a file path — falling back to the default ssh-agent. Set SSH_KEY to a private-key file (e.g. ~/.ssh/id_ed25519) to pin the identity.",
      );
    } else {
      const absKey = resolve(sshKey);
      if (existsSync(absKey)) {
        gitEnv.GIT_SSH_COMMAND = `ssh -i ${absKey} -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new`;
      } else {
        log.warn(
          `SSH_KEY points to "${absKey}" but the file does not exist — falling back to the default ssh-agent.`,
        );
      }
    }
  } else {
    log.info(
      "SSH_KEY not set — using the default ssh-agent / ~/.ssh keys.",
    );
  }

  const run = (args: string[], cwd?: string): string =>
    execFileSync("git", [...azureAuthArgs, ...args], {
      cwd,
      env: gitEnv,
      stdio: ["ignore", "pipe", "pipe"],
      encoding: "utf8",
    }).trim();

  if (!existsSync(absRoot)) {
    log.info(`cloning ${gitUrl} → ${absRoot} (branch ${branch})`);
    run(["clone", "--branch", branch, "--single-branch", gitUrl, absRoot]);
    const head = run(["rev-parse", "HEAD"], absRoot);
    log.info(`cloned at ${head.slice(0, 8)}`);
    return {
      repoRoot: absRoot,
      branch,
      action: "cloned",
      headBefore: null,
      headAfter: head,
    };
  }

  const before = run(["rev-parse", "HEAD"], absRoot);
  log.info(`fetching ${branch} in ${absRoot} (HEAD ${before.slice(0, 8)})`);
  run(["fetch", "origin", branch], absRoot);
  run(["checkout", branch], absRoot);
  run(["pull", "--ff-only", "origin", branch], absRoot);
  const after = run(["rev-parse", "HEAD"], absRoot);

  if (before === after) {
    log.info(`already up to date at ${after.slice(0, 8)}`);
    return {
      repoRoot: absRoot,
      branch,
      action: "already-up-to-date",
      headBefore: before,
      headAfter: after,
    };
  }
  log.info(`fast-forwarded ${before.slice(0, 8)} → ${after.slice(0, 8)}`);
  return {
    repoRoot: absRoot,
    branch,
    action: "fast-forwarded",
    headBefore: before,
    headAfter: after,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const r = syncFeRepo();
    console.log(JSON.stringify(r, null, 2));
  } catch (err) {
    log.error((err as Error).message);
    process.exit(1);
  }
}
