---
description: Refresh this repo's framework files (contract, configs, utils, shared wiring) from the installed qa-agent plugin.
argument-hint: "[--apply]"
allowed-tools: Bash, Read, Grep, Glob
---

# /qa-agent:upgrade

Pull the current framework files out of the installed plugin into this repo, so
generated code, Qase payloads and Jira defect comments keep the same shape
across every team using the plugin.

Arguments: `$ARGUMENTS`

## What you do

### 1. Dry run first, always

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/upgrade.mjs"
```

This writes nothing and lists every plugin-owned file that differs. Only files
declared `owner: "plugin"` are in scope; `.env`, `.mcp.json`,
`.claude/app-profile.md`, `.claude/memories/`, `shared/env.ts`,
`shared/auth.setup.ts`, `shared/pom-fixtures.ts`, `pages/`, `locators/`,
`tests/`, `features/`, `steps/`, `fixtures/` and `package.json` are never
touched.

### 2. Show the user what would change, and why it matters

For each differing file, `git diff` it after applying — or read the plugin's
version first — and summarise the actual change. "3 files would change" is not
a review. Call out specifically:

- a **locally patched plugin-owned file**: the patch will be lost. Say which
  file, what the local change was, and propose moving it into a repo-owned file
  (or upstreaming it into the plugin) *before* applying.
- a change to `CLAUDE.md`: the contract the agents obey has moved. Summarise the
  rule that changed.

If the working tree is dirty, ask the user to commit or stash first so the
upgrade lands as a reviewable diff on its own.

### 3. Apply, then verify

```bash
node "${CLAUDE_PLUGIN_ROOT}/scripts/upgrade.mjs" --apply
npm run typecheck && npm run lint
```

A plugin-owned file may reference something a repo-owned file has to provide
(a new `shared/env.ts` key, for example). If typecheck goes red, fix the
repo-owned side — never edit the plugin-owned file back, since the next upgrade
would revert it.

### 4. Report

State which files changed, what behaviour changed with them, whether typecheck
and lint are green, and any local patch that was dropped. If typecheck or lint
is red, say so with the output — do not report the upgrade as done.
