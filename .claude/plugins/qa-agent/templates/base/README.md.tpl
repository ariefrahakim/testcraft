# QA-Agent — {{APP_NAME}} ({{REGION}})

Autonomous, spec-driven Playwright test platform. Qase test cases are the source
of truth; tests are generated, executed, reported back to Qase, and failures are
commented onto Jira.

Scaffolded by the [`qa-agent`](https://github.com/{{PLUGIN_REPO}}) Claude Code
plugin in **{{STYLE}}** style on {{INIT_DATE}}.

## Setup

```bash
cp .env.example .env      # then fill in USER_ID / USER_PWD / API_TOKEN / ATLASSIAN_TOKEN
npm install
npm run install:browsers  # one-time Playwright chromium download
npm run fe:sync           # clone/pull the FE source used for selector discovery
```

## Run

```bash
npm test                  # everything (auth setup runs first)
npm run test:login        # one module
npm run typecheck         # MUST pass before any work is done
npm run lint              # MUST pass before any work is done
npm run report            # open the last HTML report
```

{{STYLE_RUN_NOTES}}

## Agent workflow

| Command | What it does |
|---|---|
| `/qa-agent <JIRA-KEY>` | End-to-end: plan → generate → run → heal → defect → PR |
| `/qa-agent-generate plan:<id>` | Generate assets from a Qase plan (does not run) |
| `/qa-agent-run plan:<id>` | Execute + upload results to Qase |
| `/qa-agent-defect <EPIC-KEY>` | Comment failures onto the matching Jira children |
| `/qa-agent-heal <module>` | Re-resolve broken selectors, re-run, record the heal |
| `/qa-agent:upgrade` | Pull the latest framework files from the plugin |

The contract every agent obeys is [CLAUDE.md](CLAUDE.md); everything specific to
this app lives in [.claude/app-profile.md](.claude/app-profile.md).

## What is owned by whom

- **Plugin-owned** (overwritten by `/qa-agent:upgrade`): `CLAUDE.md`,
  `eslint.config.js`, `tsconfig.json`, `playwright.config.ts`, `utils/*`,
  `scripts/*`, the generic parts of `shared/`, `.github/workflows/`.
- **Repo-owned** (never touched): `.env`, `.mcp.json`, `.claude/app-profile.md`,
  `.claude/memories/`, `shared/env.ts`, `shared/auth.setup.ts`,
  `shared/pom-fixtures.ts`, `pages/`, `locators/`, `tests/`, `features/`,
  `steps/`, `fixtures/`, `package.json`.

## Browser session (Playwright MCP)

`.mcp.json` starts the Playwright MCP server that `qa-codegen` uses for its
live self-verify pass. The scaffolded default is **`--headless --isolated`**:
headless matches CI (so a green codegen verify implies a green CI run) and
isolated gives each session a clean context — important for the single-SSO
app-under-test. To debug a flow visually, drop `--headless` from `.mcp.json`
locally; the file is repo-owned, so `/qa-agent:upgrade` won't revert it.
