#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# TestCraft Indonesia — Manual deploy helper
#
# Usage:
#   ./scripts/deploy.sh [staging|production]
#
# Required env vars (or set in your shell):
#   VPS_HOST      — VPS IP or hostname
#   VPS_USER      — SSH user (default: deploy)
#   VPS_PORT      — SSH port (default: 22)
#   VPS_SSH_KEY   — path to private key file (default: ~/.ssh/id_rsa)
#   IMAGE_TAG     — Docker image tag to deploy (default: latest)
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ────────────────────────────────────────────────────────────────────
ENVIRONMENT="${1:-production}"
VPS_HOST="${VPS_HOST:?VPS_HOST is required}"
VPS_USER="${VPS_USER:-deploy}"
VPS_PORT="${VPS_PORT:-22}"
VPS_SSH_KEY="${VPS_SSH_KEY:-$HOME/.ssh/id_rsa}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
GITHUB_REPOSITORY="${GITHUB_REPOSITORY:-ariefrahakim/testcraft}"
DEPLOY_DIR="/opt/testcraft"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[deploy]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn  ]${NC} $*"; }
err()  { echo -e "${RED}[error ]${NC} $*" >&2; }

# ── Validation ────────────────────────────────────────────────────────────────
if [[ "$ENVIRONMENT" != "staging" && "$ENVIRONMENT" != "production" ]]; then
  err "Unknown environment: '$ENVIRONMENT'. Use 'staging' or 'production'."
  exit 1
fi

if [[ ! -f "$VPS_SSH_KEY" ]]; then
  err "SSH key not found at: $VPS_SSH_KEY"
  exit 1
fi

# ── Deploy ────────────────────────────────────────────────────────────────────
log "=== TestCraft Manual Deploy ==="
log "Environment : $ENVIRONMENT"
log "Target VPS  : $VPS_USER@$VPS_HOST:$VPS_PORT"
log "Image tag   : $IMAGE_TAG"
echo

SSH_OPTS=(
  -i "$VPS_SSH_KEY"
  -p "$VPS_PORT"
  -o StrictHostKeyChecking=accept-new
  -o ConnectTimeout=10
)

log "Connecting to VPS and pulling images..."
ssh "${SSH_OPTS[@]}" "$VPS_USER@$VPS_HOST" bash -s <<REMOTE
set -euo pipefail

cd "$DEPLOY_DIR"

echo "--> Pulling latest images (tag: $IMAGE_TAG)..."
IMAGE_TAG=$IMAGE_TAG \
GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
  docker compose -f docker-compose.prod.yml pull

echo "--> Restarting containers..."
IMAGE_TAG=$IMAGE_TAG \
GITHUB_REPOSITORY=$GITHUB_REPOSITORY \
  docker compose -f docker-compose.prod.yml up -d --no-build --remove-orphans

echo "--> Running database migrations..."
docker compose -f docker-compose.prod.yml exec -T api \
  node apps/api/dist/scripts/migrate.js 2>/dev/null || true

echo "--> Waiting for API health check..."
for i in \$(seq 1 12); do
  if curl -sf http://127.0.0.1:4001/api/v1/health > /dev/null; then
    echo "API is healthy."
    break
  fi
  if [ "\$i" -eq 12 ]; then
    echo "ERROR: API did not become healthy within 60 s" >&2
    docker compose -f docker-compose.prod.yml logs --tail=50 api
    exit 1
  fi
  echo "Waiting... (\$i/12)"
  sleep 5
done

echo "--> Container status:"
docker compose -f docker-compose.prod.yml ps
REMOTE

log "Deployment to $ENVIRONMENT complete."
