# Contributing

Thanks for picking this up. This plugin is shared across every QA team that
runs the QA-Agent platform, so a few conventions keep the rollout painless.

## What lives where

| Change | Files | Version impact |
|---|---|---|
| Command behavior, agent behavior, contract in CLAUDE.md, scaffolder logic, upgrade logic | `commands/`, `agents/`, `templates/base/CLAUDE.md`, `scripts/*.mjs` | Bump version |
| Pinned devDependency (Playwright, playwright-qase-reporter, playwright-bdd) | `scripts/lib/versions.mjs` | Bump version |
| Templates that end up in a scaffolded repo | `templates/**` | Bump version |
| Docs (README, RUNBOOK, examples) | `README.md`, `docs/**` | Patch bump when substantive |
| Repo-only meta (this file, CHANGELOG, PR template, .gitignore) | root | No version bump |

Everything under `commands/`, `agents/`, `scripts/`, `templates/` is
**plugin-owned** — teams get it via `/qa-agent:setup` and `/qa-agent:upgrade`.
Never write app- or team-specific values into those files; the profile they
render into is `.claude/app-profile.md` (repo-owned, never upgraded).

## Versioning policy

We follow [SemVer](https://semver.org/) on the `version` field in
`.claude-plugin/plugin.json` **and** `.claude-plugin/marketplace.json`. The two
must stay in lock-step — a mismatch fails the sanity check in review.

| Bump | Trigger | Examples |
|---|---|---|
| **MAJOR** (`2.0.0`) | A repo scaffolded with the previous version needs manual steps to keep working. | Renaming a command, changing a `utils/tms.ts` / `utils/tracker.ts` signature, changing the shape of `.claude/qa-agent.json`, removing a scaffolder flag, changing selector priority order. |
| **MINOR** (`1.2.0`) | New capability, additive. `/qa-agent:upgrade` is enough — no repo edits. | Adding an agent or command, adding a stack/style option, adding a new `.env` key with a default, bumping a pinned devDependency to a new minor. |
| **PATCH** (`1.1.1`) | Bug fix, prompt tightening, doc edit that changes behavior wording. | Fixing a defect-comment bug, correcting a step number, patching an upgrade edge case. |

**Any PR that touches `commands/`, `agents/`, `scripts/`, `templates/`, or
`scripts/lib/versions.mjs` must bump the version and add a CHANGELOG entry.**
CI (once wired) enforces this; reviewers enforce it in the meantime.

### How to bump

1. Update `version` in both `.claude-plugin/plugin.json` and
   `.claude-plugin/marketplace.json`.
2. Add a `## [x.y.z] - YYYY-MM-DD` section at the top of `CHANGELOG.md` under
   `## [Unreleased]`. Move the accumulated `Added` / `Changed` / etc. entries
   from `Unreleased` into it.
3. After merge, tag the release: `git tag v<x.y.z> && git push --tags`. The
   tag is what teams cite when reporting bugs ("we're on v1.3.0, seeing …").

## Playwright and reporter pins

`scripts/lib/versions.mjs` is the single source of truth for `@playwright/test`,
`playwright-qase-reporter`, and `playwright-bdd`. Both `scripts/init.mjs`
(scaffolder) and `scripts/upgrade.mjs` (upgrade) import the same values.

- Bump those pins **only** when the whole platform has been tested against the
  new version. That includes: the Playwright MCP self-verify in qa-codegen,
  the Qase upload contract, and the Qase automation-status reporter.
- Bumps are always MINOR (or MAJOR if the browser default changes force test
  edits).
- After a bump lands, teams pick it up by running `/qa-agent:upgrade --apply`
  followed by `npm install && npm run install:browsers`. The browser binary
  is version-locked to `@playwright/test`, so skipping `install:browsers`
  leaves the repo running the previous Chromium.

## Testing your change

Before opening a PR:

```bash
# 1. Dry-run the scaffolder for both stacks, both styles
node scripts/init.mjs --app "X" --url https://x --qase X --fe-repo git@github.com:x/x.git \
  --jira-base https://x.atlassian.net --jira-key X --jira-parent 1 \
  --style tdd --stack jira --dry-run
node scripts/init.mjs …same flags… --style bdd --stack azure --azure-org https://dev.azure.com/x --dry-run

# 2. Scaffold to a temp dir + verify typecheck/lint don't regress
TMP=$(mktemp -d) && (cd "$TMP" && node <plugin>/scripts/init.mjs …flags…) && \
  (cd "$TMP" && cp .env.example .env && sed -i '' 's/=$/=stub/' .env && \
   npm install && npm run typecheck && npm run lint)

# 3. Upgrade dry-run from an older version
# (Manually edit .claude/qa-agent.json.pluginVersion in the temp dir to an
#  earlier version, then run upgrade.mjs — confirm it reports diffs correctly.)
```

If your change touches an agent's behavior, run the corresponding `/qa-agent:*`
command in a real scaffolded repo and check that:

- the sub-agent invokes `design-agent:run-logger` (prefilled) +
  `run-logger-sync` — one entry per invocation;
- typecheck and lint still pass;
- `.claude/memories/*` are updated (for qa-healer) or unchanged (everything
  else).

## Reviewing a PR

- The version bumped? CHANGELOG entry present?
- Did the PR touch templates but forget to update the CLAUDE.md contract, or
  vice versa? Those two evolve together.
- If a pinned dep was bumped, does the CHANGELOG entry say what the browser /
  reporter behavior change is?
- Grep for hard-coded app values (`NLM-`, `ONEBID`, `bidOcean`) that snuck
  into a plugin-owned file. Those belong in `.claude/app-profile.md` on a
  concrete repo, not in the shipped templates.
- `.claude-plugin/plugin.json.version` and
  `.claude-plugin/marketplace.json.version` match?

## Local development against a real repo

Point Claude Code at your working copy of this plugin, then run
`/qa-agent:upgrade` inside a scaffolded repo — it will pull your local changes
into that repo the same way a released plugin would.

```
# In a repo that was scaffolded by an earlier version:
CLAUDE_PLUGIN_ROOT=/path/to/this/checkout node "$CLAUDE_PLUGIN_ROOT/scripts/upgrade.mjs"
CLAUDE_PLUGIN_ROOT=/path/to/this/checkout node "$CLAUDE_PLUGIN_ROOT/scripts/upgrade.mjs" --apply
```

## Communication

- **Bugs / feature requests:** GitHub issues on this repo.
- **Design discussions:** open a draft PR with the proposed change and tag
  the QA leads for review — don't wait for a green build.
- **Rollout announcements:** when a MAJOR or a Playwright bump lands, post a
  message in the QA channel with the CHANGELOG excerpt and the upgrade
  command, so teams know to run `/qa-agent:upgrade` intentionally rather than
  discovering it during a red build.
