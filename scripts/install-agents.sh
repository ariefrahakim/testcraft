#!/bin/bash
# install-agents.sh
# Installs Claude Code agent definitions and project settings.
# Run this ONCE after cloning the repo:
#   chmod +x scripts/install-agents.sh && ./scripts/install-agents.sh

set -e

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
AGENTS_SRC="$REPO_ROOT/docs/agents-staging"
AGENTS_DST="$REPO_ROOT/.claude/agents"
SETTINGS="$REPO_ROOT/.claude/settings.json"

echo "=== TestCraft — Installing Claude Code agents ==="
echo "Repo: $REPO_ROOT"

# 1. Create .claude/agents directory
mkdir -p "$AGENTS_DST"

# 2. Copy all agent definition files
echo ""
echo "Installing agents..."
for agent in "$AGENTS_SRC"/*.md; do
  name=$(basename "$agent")
  cp "$agent" "$AGENTS_DST/$name"
  echo "  ✓ $name"
done

# 3. Write .claude/settings.json (project-level env vars for QA)
echo ""
echo "Writing .claude/settings.json..."
cat > "$SETTINGS" << 'EOF'
{
  "env": {
    "QASE_TOKEN": "37a62456081995d96b403d9c4bf0f07915a35360baa1a9dda36548e55b71577c",
    "QASE_PROJECT": "TC",
    "QASE_MODE": "testops",
    "BASE_URL": "http://localhost:3000",
    "MARKETING_URL": "http://localhost:3001",
    "API_URL": "http://localhost:4001/api/v1",
    "FE_REPO_ROOT": "./apps/web",
    "FE_REPO_PATH": "./apps/web/src",
    "FE_BRANCH": "main"
  }
}
EOF
echo "  ✓ .claude/settings.json"

# 4. Create load test directory
mkdir -p "$REPO_ROOT/tests/load/scenarios"
mkdir -p "$REPO_ROOT/tests/load/utils"
mkdir -p "$REPO_ROOT/tests/load/results"
echo "  ✓ tests/load/ directory"

# 5. Add results to gitignore if not already there
GITIGNORE="$REPO_ROOT/.gitignore"
if ! grep -q "tests/load/results" "$GITIGNORE" 2>/dev/null; then
  echo "" >> "$GITIGNORE"
  echo "# Load test results" >> "$GITIGNORE"
  echo "tests/load/results/" >> "$GITIGNORE"
  echo "  ✓ Added tests/load/results/ to .gitignore"
fi

echo ""
echo "=== Done! ==="
echo ""
echo "Agents installed:"
ls "$AGENTS_DST"
echo ""
echo "Next steps:"
echo "  1. Run: cp .env.example .env && fill in secrets"
echo "  2. Run: cp apps/api/.env.example apps/api/.env && fill in DB + JWT"
echo "  3. Run: cp tests/e2e/.env.example tests/e2e/.env.test"
echo "  4. Run: docker compose up -d && npm install && npm run db:migrate && npm run db:seed"
echo "  5. Run: npm run dev"
echo ""
echo "QA Agent commands (in Claude Code):"
echo "  /qa-agent:setup      — initial QA repo setup"
echo "  /qa-agent:tms        — run full test suite"
echo ""
echo "See CLAUDE.md for full workflow documentation."
