#!/bin/bash
# install-hooks.sh — installs all git hooks for Stage 5 approval gates
# Run once after cloning: bash scripts/hooks/install-hooks.sh

set -e

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
HOOKS_SRC="$REPO_ROOT/scripts/hooks"
HOOKS_DST="$REPO_ROOT/.git/hooks"

echo "=== Installing TestCraft git hooks (Stage 5: Deploy) ==="

for hook in pre-commit pre-push; do
  if [ -f "$HOOKS_SRC/$hook" ]; then
    cp "$HOOKS_SRC/$hook" "$HOOKS_DST/$hook"
    chmod +x "$HOOKS_DST/$hook"
    echo "  ✓ $hook"
  fi
done

echo ""
echo "Hooks installed:"
echo "  pre-commit  → TypeScript + lint + OpenAPI sync check"
echo "  pre-push    → Playwright smoke tests (@smoke tag)"
echo ""
echo "To bypass a hook temporarily (use sparingly):"
echo "  git commit --no-verify   # skips pre-commit"
echo "  git push --no-verify     # skips pre-push"
