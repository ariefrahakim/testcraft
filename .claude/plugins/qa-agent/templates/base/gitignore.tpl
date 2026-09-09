# --- Secrets / local config (never commit) ---
.env
.env.local
.env.*.local
*.env
!.env.example

# --- Dependencies ---
node_modules/

# --- Playwright / generated reports & artifacts ---
reports/
playwright-report/
test-results/
blob-report/
.auth/
.cache/

# --- TypeScript / build ---
*.tsbuildinfo
dist/
build/

# --- Editors / OS ---
.DS_Store
.idea/
.vscode/
*.log

# --- Frontend source checkout (read-only reference, not part of this repo) ---
{{FE_DIR}}/
# Backup variants when swapping FE remotes (e.g. `.bitbucket-backup/`, `-old/`).
{{FE_DIR}}.*/
{{FE_DIR}}-*/

# --- Qase scratch pulls (regenerable via utils/qase-helper.ts) ---
exports/*.qase.json
exports/qase.json

# --- Run logs (local-only telemetry; entries are synced to Confluence) ---
logs/

# --- Playwright MCP local cache (snapshots, console logs from browser MCP runs) ---
.playwright-mcp/

# --- Graphify knowledge graphs (regenerable via `graphify update <path>`) ---
graphify-out/

# ignore scripts jira
scripts-*

# --- Ignore all other files ---
agentic-qa-deck.html
# playwright-bdd codegen output (bddgen) — generated specs, never committed
.features-gen/
