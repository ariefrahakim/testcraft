# Changelog

All notable changes to this plugin are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and this project
follows [SemVer](https://semver.org/) — see `CONTRIBUTING.md` for the bump
rules the QA team applies on every PR.

## [Unreleased]

### Added
- azure: qa-defect now transitions routed FE/BE children to "Test Failed/Bugs" when the run reports at least one bug (mirrors the all-green [TA-…] → Waiting to Deploy rule).

### Changed
- **Slash-command naming — namespaced only for lifecycle commands.**
  `/qa-agent:setup`, `/qa-agent:upgrade`, and `/qa-agent:tms` use the
  Claude Code namespaced form (colon), matching how
  `design-agent:setup` and `epic-suite:setup` are invoked.
  The atomic workflow commands (`/qa-agent-generate`, `/qa-agent-run`,
  `/qa-agent-heal`, `/qa-agent-defect`, `/qa-agent-pr`) and the
  orchestrator/router (`/qa-agent`) keep the hyphenated form for
  muscle-memory + brevity in the day-to-day loop. Command files renamed
  accordingly (`commands/setup.md`, `commands/upgrade.md`, `commands/tms.md`
  vs `commands/qa-agent-generate.md` and friends). Marketplace listing
  install command (`/plugin install qa-agent@hubexo-plugins`) unchanged.
- **Marketplace manifest slimmed to name + source per plugin**, matching
  the exact shape of `hubexo/hubexo-ai-agent-marketplace`'s
  `.claude-plugin/marketplace.json`. Marketplace `name` is now
  `hubexo-plugins`, `owner.name` is `Hubexo` — same as the reference — so
  a future PR that adds `qa-agent` to that marketplace shows only a
  single new entry in `plugins[]` with zero conflict on the other fields.
- **Repository layout — marketplace format.** The plugin now lives at
  `plugins/qa-agent/` inside a multi-plugin marketplace layout that mirrors
  `hubexo/hubexo-ai-agent-marketplace`. The root of the repo now holds only
  the marketplace manifest, a marketplace-scoped `README.md`, and a
  `CLAUDE.md` orientation file; everything plugin-specific (agents,
  commands, templates, scripts, docs, CHANGELOG, CONTRIBUTING, plugin
  manifest) moved into `plugins/qa-agent/`. Users' install command
  (`/plugin install qa-agent@hubexo-plugins`) is unchanged — the marketplace
  manifest points at the new source path internally. **This is a
  structural change that warrants a MAJOR bump when we cut the next
  release**; leaving the versions at `1.0.0` in `plugin.json` and
  `marketplace.json` on this branch so a follow-up bump PR can own the
  version step deliberately.
- Plugin manifest and marketplace manifest author fields switched from
  `"Hubexo QA"` to `"Arief Rahman Hakim"` to reflect current maintainership.
- Documentation cross-links updated to the new paths
  (`plugins/qa-agent/docs/RUNBOOK.md`, etc.).

### Added
- Root `README.md` — marketplace index listing `qa-agent` and pointing at
  its README, RUNBOOK, ROLLOUT, CHANGELOG, and CONTRIBUTING.
- Root `CLAUDE.md` — marketplace-scoped orientation for Claude Code
  contributors: repo layout, per-plugin conventions, how to add a new
  plugin, local development against a scaffolded repo.
- `scripts/lib/versions.mjs` — single source of truth for the pinned
  devDependencies (`@playwright/test`, `playwright-qase-reporter`,
  `playwright-bdd`). Both `init.mjs` and `upgrade.mjs` import from it.
- `/qa-agent:upgrade` now diffs and (with `--apply`) syncs `package.json`
  devDependencies against the plugin's pinned versions. Floating tooling
  packages (eslint, typescript, tsx, @types/node) are deliberately not
  policed.
- `.claude/qa-agent.json` now records `pluginVersion`, `scaffoldedWith`, and
  `lastUpgradedAt`. `/qa-agent:upgrade` refreshes `pluginVersion` and
  `lastUpgradedAt` on every apply.
- `CONTRIBUTING.md` — versioning policy, bump rules, review checklist, local
  dev instructions for hacking on the plugin against a scaffolded repo.
- `CHANGELOG.md` (this file) and `.github/pull_request_template.md` with a
  version-bump reminder.
- README "Versioning & upgrades" section pointing at the CHANGELOG.

## [1.0.0] - 2026-08-12

Baseline release covering the state of the plugin after merges #1 – #3.

### Added
- `/qa-agent:setup` (previously `/qa-agent-init`) — scaffolds a QA repo, asks
  for stack (jira/azure) and style (tdd/bdd/both), builds the Graphify FE
  knowledge graph, and can collect per-agent Confluence page URLs for
  informational overrides.
- `/qa-agent:tms` (previously `/qa-agent-plan`) — TMS-driven orchestrator.
  Accepts a plan id (`plan:<n>`, bare integer) OR a single case
  (`TC-<n>`, `case:<n>`). Runs generate → run → heal → summary → **PR**.
- `/qa-agent` — tracker-driven orchestrator. Accepts a Jira key
  (jira stack) or an Azure Boards work-item id `AB#<n>` (azure stack); runs
  the full generate → run → heal → defect → PR pipeline. Reads
  `.claude/qa-agent.json.stack` to pre-validate the input form.
- `/qa-agent:upgrade` — refresh plugin-owned files against the installed
  plugin, with dry-run by default.
- Azure stack alongside the Jira stack (Azure Boards + Qase).
  `utils/tms.ts` and `utils/tracker.ts` are the gateway modules; agents
  never import a provider directly.
- Every sub-agent (`qa-runner`, `qa-codegen`, `qa-defect`, `qa-healer`,
  `qa-agent-pr`) logs to `design-agent:run-logger` +
  `run-logger-sync` at end-of-run, orchestrated or standalone.
- Prerequisites section in README.

### Changed
- Reduced Jira usage to comment-only plus one workflow transition (all-green
  → `[TA-…]` moves to `WAITING TO DEPLOY`).

### Removed
- Watch mode.

[Unreleased]: https://github.com/hubexo/qa-agent-plugin/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/hubexo/qa-agent-plugin/releases/tag/v1.0.0
