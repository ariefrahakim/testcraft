#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# TestCraft Indonesia — One-shot VPS provisioning script
# Target OS: Ubuntu 22.04 LTS
#
# Usage (run as root or with sudo):
#   curl -fsSL https://raw.githubusercontent.com/ariefrahakim/testcraft/main/scripts/setup-vps.sh | bash
#   — OR —
#   chmod +x scripts/setup-vps.sh && sudo ./scripts/setup-vps.sh
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

DEPLOY_DIR="/opt/testcraft"
DEPLOY_USER="${DEPLOY_USER:-deploy}"
GITHUB_REPO="${GITHUB_REPO:-ariefrahakim/testcraft}"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[setup]${NC} $*"; }
warn() { echo -e "${YELLOW}[warn ]${NC} $*"; }
err()  { echo -e "${RED}[error]${NC} $*" >&2; }

require_root() {
  if [[ "$EUID" -ne 0 ]]; then
    err "This script must be run as root (or via sudo)."
    exit 1
  fi
}

# ── 1. System update ──────────────────────────────────────────────────────────
update_system() {
  log "Updating system packages..."
  apt-get update -qq
  apt-get upgrade -y -qq
  apt-get install -y -qq \
    curl \
    wget \
    gnupg \
    ca-certificates \
    lsb-release \
    apt-transport-https \
    software-properties-common \
    git \
    unzip \
    jq
  log "System updated."
}

# ── 2. Docker + Docker Compose plugin ────────────────────────────────────────
install_docker() {
  if command -v docker &>/dev/null; then
    warn "Docker already installed ($(docker --version)). Skipping."
    return
  fi

  log "Installing Docker..."
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
    -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc

  echo \
    "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] \
    https://download.docker.com/linux/ubuntu \
    $(. /etc/os-release && echo "$VERSION_CODENAME") stable" \
    | tee /etc/apt/sources.list.d/docker.list > /dev/null

  apt-get update -qq
  apt-get install -y -qq \
    docker-ce \
    docker-ce-cli \
    containerd.io \
    docker-buildx-plugin \
    docker-compose-plugin

  systemctl enable --now docker
  log "Docker $(docker --version) installed."
}

# ── 3. GitHub CLI ─────────────────────────────────────────────────────────────
install_gh_cli() {
  if command -v gh &>/dev/null; then
    warn "GitHub CLI already installed ($(gh --version | head -1)). Skipping."
    return
  fi

  log "Installing GitHub CLI..."
  curl -fsSL https://cli.github.com/packages/githubcli-archive-keyring.gpg \
    | dd of=/usr/share/keyrings/githubcli-archive-keyring.gpg
  chmod go+r /usr/share/keyrings/githubcli-archive-keyring.gpg

  echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/githubcli-archive-keyring.gpg] \
    https://cli.github.com/packages stable main" \
    | tee /etc/apt/sources.list.d/github-cli.list > /dev/null

  apt-get update -qq
  apt-get install -y -qq gh
  log "GitHub CLI $(gh --version | head -1) installed."
}

# ── 4. Deploy user + directory ────────────────────────────────────────────────
setup_deploy_user() {
  if ! id "$DEPLOY_USER" &>/dev/null; then
    log "Creating system user '$DEPLOY_USER'..."
    useradd -r -m -s /bin/bash "$DEPLOY_USER"
  else
    warn "User '$DEPLOY_USER' already exists."
  fi

  # Add to docker group so deploy user can run docker commands
  usermod -aG docker "$DEPLOY_USER"

  log "Creating deploy directory at $DEPLOY_DIR..."
  mkdir -p "$DEPLOY_DIR"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR"

  # Docker nginx cert dirs
  mkdir -p "$DEPLOY_DIR/docker/nginx/certs"
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_DIR/docker"
}

# ── 5. UFW firewall ───────────────────────────────────────────────────────────
configure_firewall() {
  if ! command -v ufw &>/dev/null; then
    apt-get install -y -qq ufw
  fi

  log "Configuring UFW firewall..."
  ufw --force reset
  ufw default deny incoming
  ufw default allow outgoing
  ufw allow 22/tcp   comment "SSH"
  ufw allow 80/tcp   comment "HTTP"
  ufw allow 443/tcp  comment "HTTPS"
  ufw --force enable
  log "UFW configured. Status:"
  ufw status
}

# ── 6. .env template ──────────────────────────────────────────────────────────
create_env_template() {
  ENV_FILE="$DEPLOY_DIR/.env"
  if [[ -f "$ENV_FILE" ]]; then
    warn ".env already exists at $ENV_FILE. Skipping template creation."
    return
  fi

  log "Creating .env template at $ENV_FILE..."
  cat > "$ENV_FILE" <<'ENVEOF'
# TestCraft Indonesia — Production Environment
# Fill in all values before starting the stack.

# Database
DB_USER=testcraft
DB_PASSWORD=CHANGE_ME
DB_NAME=testcraft

# Redis
REDIS_PASSWORD=CHANGE_ME

# JWT (use long random strings: openssl rand -hex 64)
JWT_SECRET=CHANGE_ME
JWT_REFRESH_SECRET=CHANGE_ME
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=30d

# App URLs
NEXT_PUBLIC_API_URL=https://api.testcraft.id/api/v1
NEXT_PUBLIC_LMS_URL=https://app.testcraft.id
NEXT_PUBLIC_SITE_URL=https://testcraft.id
CORS_ORIGINS=https://app.testcraft.id,https://testcraft.id

# Payments
MIDTRANS_SERVER_KEY=CHANGE_ME
MIDTRANS_CLIENT_KEY=CHANGE_ME

# OAuth (optional)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=

# Deployment
GITHUB_REPOSITORY=ariefrahakim/testcraft
IMAGE_TAG=latest
ENVEOF

  chmod 600 "$ENV_FILE"
  chown "$DEPLOY_USER:$DEPLOY_USER" "$ENV_FILE"
  log ".env template created. Edit it before starting the stack!"
}

# ── 7. Systemd Docker Compose service ─────────────────────────────────────────
setup_systemd_service() {
  SERVICE_FILE="/etc/systemd/system/testcraft.service"
  log "Creating systemd service at $SERVICE_FILE..."

  cat > "$SERVICE_FILE" <<SVCEOF
[Unit]
Description=TestCraft Indonesia (Docker Compose)
Requires=docker.service
After=docker.service network-online.target

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=$DEPLOY_DIR
EnvironmentFile=$DEPLOY_DIR/.env
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml up -d --remove-orphans
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
TimeoutStartSec=300
User=$DEPLOY_USER
Group=$DEPLOY_USER

[Install]
WantedBy=multi-user.target
SVCEOF

  systemctl daemon-reload
  systemctl enable testcraft.service
  log "Systemd service 'testcraft' registered (auto-starts on reboot)."
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  require_root

  log "=== TestCraft VPS Setup ==="
  log "Target: Ubuntu 22.04 LTS"
  log "Deploy directory: $DEPLOY_DIR"
  log "Deploy user: $DEPLOY_USER"
  echo

  update_system
  install_docker
  install_gh_cli
  setup_deploy_user
  configure_firewall
  create_env_template
  setup_systemd_service

  echo
  log "=== Setup complete! ==="
  echo
  echo -e "${YELLOW}Next steps:${NC}"
  echo "  1. Edit $DEPLOY_DIR/.env with real secrets"
  echo "  2. Copy docker-compose.prod.yml and docker/ to $DEPLOY_DIR/"
  echo "     scp -r docker-compose.prod.yml docker/ ${DEPLOY_USER}@<VPS_IP>:$DEPLOY_DIR/"
  echo "  3. Obtain SSL certificates (e.g. via Certbot) and place them in:"
  echo "     $DEPLOY_DIR/docker/nginx/certs/<domain>/{fullchain.pem,privkey.pem}"
  echo "  4. Add a GitHub Actions secret VPS_SSH_KEY with a private key for user '$DEPLOY_USER'"
  echo "  5. Push to main — CI/CD will build images and deploy automatically."
  echo
}

main "$@"
