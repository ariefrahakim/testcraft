# Deployment Guide

This guide explains how to deploy TestCraft to a real server (production environment). For local development setup, see [docs/QUICKSTART.md](QUICKSTART.md).

---

## Hosting Options

Three options are available, ordered from easiest to most complex.

### Option A — Managed Cloud Services (Recommended to Start)

Use third-party platforms that handle server management, TLS certificates, and backups for you.

| Component | Recommended Service | Estimated Cost/Month |
|-----------|--------------------|--------------------|
| LMS (Next.js) | Vercel Hobby/Pro | $0 – $20 |
| Marketing (Next.js) | Vercel Hobby/Pro | $0 – $20 |
| API (NestJS) | Railway / Render | $5 – $20 |
| PostgreSQL | Neon / Supabase | $0 – $25 |
| Redis | Upstash | $0 – $10 |
| File Storage | Cloudflare R2 | ~$0.015/GB |
| Video Streaming | Cloudflare Stream | $5 per 1,000 stored minutes |

**Pros:** No server management, automatic backups, TLS certificates auto-renewed, preview deployments per PR.

### Option B — Single VPS with Docker Compose (Best Value)

Run everything on one virtual private server (2 vCPU, 4 GB RAM). Suitable for thousands of active users.

**Recommended VPS providers:**
- **Hetzner** (Germany, very affordable): https://hetzner.com
- **DigitalOcean**: https://digitalocean.com
- **Biznet** (Indonesia): https://www.biznetgio.com
- **Niagahoster** (Indonesia): https://niagahoster.co.id

**Pros:** Lowest and most predictable cost.
**Cons:** You are responsible for backups, OS updates, and TLS certificates.

### Option C — Kubernetes

Not needed until you require multi-region autoscaling. Skip this for now.

---

## First-Time VPS Setup

### Step 1 — Run the Setup Script

The `scripts/setup-vps.sh` script automates the initial VPS configuration. Run it on a fresh Ubuntu 22.04 or 24.04 server:

```bash
# SSH into your VPS as root
ssh root@YOUR_SERVER_IP

# Download and run the setup script
curl -sL https://raw.githubusercontent.com/YOUR_ORG/testcraft/main/scripts/setup-vps.sh | bash
```

The script installs:
- Docker and Docker Compose
- Nginx or Caddy (reverse proxy)
- Certbot (for TLS/HTTPS certificates)
- Configures the firewall (only ports 80 and 443 exposed publicly)

### Step 2 — Clone the Repository

```bash
git clone <repo-url> /opt/testcraft
cd /opt/testcraft
```

### Step 3 — Configure Environment Variables

```bash
# Copy the example env file for the API
cp apps/api/.env.example apps/api/.env

# Edit it with production values
nano apps/api/.env
```

---

## Production Environment Variables

### API (`apps/api/.env`)

```bash
# Server
NODE_ENV=production
PORT=4001
API_PREFIX=api/v1
API_URL=https://api.testcraft.id
WEB_URL=https://lms.testcraft.id
# IMPORTANT: Only your production domains, NOT localhost
CORS_ORIGINS=https://lms.testcraft.id,https://testcraft.id

# Database (must use SSL in production)
DATABASE_URL="postgresql://user:password@host:5432/testcraft?sslmode=require"

# JWT Secrets (MUST be changed from defaults)
# Generate with: openssl rand -base64 48
JWT_ACCESS_SECRET=<generate-a-long-random-string>
JWT_REFRESH_SECRET=<generate-a-DIFFERENT-long-random-string>
JWT_ACCESS_TTL=15m
JWT_REFRESH_TTL=30d

# File Storage (use S3 in production for reliability)
STORAGE_DRIVER=s3
S3_BUCKET=testcraft-assets
S3_REGION=ap-southeast-1
AWS_ACCESS_KEY_ID=your-aws-key-id
AWS_SECRET_ACCESS_KEY=your-aws-secret

# Payments (get from Midtrans dashboard, use live keys NOT sandbox)
MIDTRANS_SERVER_KEY=Mid-server-xxxxxxxxxxxxx
MIDTRANS_CLIENT_KEY=Mid-client-xxxxxxxxxxxxx

# Email
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxx
EMAIL_FROM="TestCraft <no-reply@testcraft.id>"

# Admin seed account (change the password after first login!)
SEED_ADMIN_EMAIL=admin@testcraft.id
SEED_ADMIN_PASSWORD="ChangeThisImmediately#2026"
```

### Web App (`apps/web/.env.local`)

```bash
NEXT_PUBLIC_API_URL=https://api.testcraft.id/api/v1
API_INTERNAL_URL=http://api:4001/api/v1
NEXT_PUBLIC_SITE_URL=https://lms.testcraft.id
```

### Marketing (`apps/marketing/.env.local`)

```bash
NEXT_PUBLIC_LMS_URL=https://lms.testcraft.id
NEXT_PUBLIC_SITE_URL=https://testcraft.id
NEXT_PUBLIC_API_URL=https://api.testcraft.id/api/v1
NEXT_PUBLIC_SITE_NAME=TestCraft Indonesia
```

---

## Deployment Order

**Always follow this order.** The database must be updated before the apps are deployed.

### Step 1 — Migrate the Database

```bash
# On the server (or from your local machine pointing to production DB)
DATABASE_URL="postgresql://..." \
  npm run db:deploy --workspace @testcraft/api
```

**Important:** Always use `db:deploy` in production, never `db:migrate`. The `db:migrate` command can reset data; `db:deploy` only applies pending migrations safely.

**First deploy only:** Seed the admin account:

```bash
docker compose exec api npm run db:seed
```

After seeding, **immediately log in and change the admin password** through the app.

### Step 2 — Deploy the API

```bash
# Build the API Docker image
docker build -f apps/api/Dockerfile -t testcraft-api:1.0.0 .

# Push to your container registry
docker push registry.example.com/testcraft-api:1.0.0
```

Or, on the VPS directly with Docker Compose:

```bash
docker compose --profile full up -d --build api
```

**Health check:** Verify the API is up:
```bash
curl https://api.testcraft.id/api/v1/health
# Expected: {"status":"ok"}
```

### Step 3 — Deploy the Web and Marketing Apps

**Via Vercel (recommended):**

1. Connect the repository to Vercel
2. Set the root directory to `apps/web` (for LMS) or `apps/marketing` (for marketing)
3. Add the environment variables in the Vercel dashboard
4. Deploy

**Via Docker on VPS:**

```bash
# Build web app
docker build -f apps/web/Dockerfile -t testcraft-web:1.0.0 .

# Build marketing
docker build -f apps/marketing/Dockerfile -t testcraft-marketing:1.0.0 .

# Start/restart with Docker Compose
docker compose --profile full up -d --build
```

### Step 4 — Verify After Deployment

```bash
# Check API health
curl https://api.testcraft.id/api/v1/health

# Check that courses load
curl https://api.testcraft.id/api/v1/courses?limit=1

# Check that the web app responds
curl -I https://lms.testcraft.id

# Check marketing site
curl -I https://testcraft.id
```

Manual verification:
1. Log in as admin
2. Open the course catalog — verify courses load
3. Edit a price in the CMS — verify it changes in the catalog
4. Check the health endpoint shows database connected

---

## Docker Compose on VPS (Full Setup)

```bash
# On the VPS, in /opt/testcraft
git clone <repo-url> /opt/testcraft
cd /opt/testcraft

# Configure the API env file
cp apps/api/.env.example apps/api/.env
nano apps/api/.env  # Fill in all production values

# Start all services
docker compose --profile full up -d --build

# Run database migrations
docker compose exec api npm run db:deploy

# Seed admin account (FIRST TIME ONLY)
docker compose exec api npm run db:seed
```

---

## SSL Setup with Caddy (TLS Auto-Renewal)

Caddy is a reverse proxy that automatically obtains and renews TLS certificates from Let's Encrypt.

### Install Caddy

```bash
# On Ubuntu
sudo apt install -y caddy
```

### Configure Caddy

Create `/etc/caddy/Caddyfile`:

```caddyfile
lms.testcraft.id {
    reverse_proxy localhost:3000
}

api.testcraft.id {
    reverse_proxy localhost:4001
}

testcraft.id {
    reverse_proxy localhost:3001
}

www.testcraft.id {
    redir https://testcraft.id{uri} permanent
}
```

Apply the configuration:

```bash
sudo systemctl reload caddy
```

Caddy will automatically:
- Obtain TLS certificates from Let's Encrypt
- Renew them before they expire
- Redirect HTTP to HTTPS

### Close Unnecessary Ports

After the reverse proxy is set up, only expose ports 80 and 443 to the internet:

```bash
# UFW firewall rules
sudo ufw default deny incoming
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

Internal ports (3000, 3001, 4001, 5433, 6380) should NOT be accessible from the internet.

---

## SSL Setup with Let's Encrypt + Nginx (Alternative)

If you prefer Nginx:

```nginx
server {
    listen 443 ssl;
    server_name api.testcraft.id;

    ssl_certificate /etc/letsencrypt/live/api.testcraft.id/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.testcraft.id/privkey.pem;

    location / {
        proxy_pass http://localhost:4001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Obtain certificate:

```bash
sudo certbot --nginx -d api.testcraft.id -d lms.testcraft.id -d testcraft.id
```

---

## How to View Logs

```bash
# View API logs (live, press Ctrl+C to stop)
docker logs testcraft-api -f

# View LMS web logs
docker logs testcraft-web -f

# View database logs
docker logs testcraft-db -f

# View all service logs at once
docker compose logs -f

# View last 100 lines only
docker logs testcraft-api --tail 100
```

---

## Updating an Existing Deployment

For subsequent deploys (not the first time), follow these steps:

```bash
# On the VPS
cd /opt/testcraft

# Pull the latest code
git pull origin main

# Run any new database migrations FIRST
docker compose exec api npm run db:deploy

# Rebuild and restart the services
docker compose --profile full up -d --build
```

---

## Health Check Commands

Use these to quickly verify the system is working after a deploy:

```bash
# API health
curl https://api.testcraft.id/api/v1/health
# Expected: {"status":"ok","database":"ok"}

# Load one course (tests database connectivity)
curl "https://api.testcraft.id/api/v1/courses?limit=1"
# Expected: JSON with courses array

# LMS web app
curl -I https://lms.testcraft.id
# Expected: HTTP/2 200

# Marketing site
curl -I https://testcraft.id
# Expected: HTTP/2 200
```

---

## Rollback Procedure

### Rolling Back the App

```bash
# On the VPS — restart with the previous Docker image tag
docker compose --profile full up -d --force-recreate
```

If you tagged your images before deploying (e.g., `testcraft-api:1.0.0`, `testcraft-api:1.1.0`), update `docker-compose.prod.yml` to use the previous tag and redeploy.

### Rolling Back the Database

Prisma does not support automatic rollback (`migrate down`). Options:

1. **Restore from backup** (if the migration broke data):
   ```bash
   gunzip -c /backup/testcraft-2026-09-07.sql.gz \
     | docker exec -i testcraft-db psql -U testcraft -d testcraft
   ```

2. **Write a reverse migration** (safer, no data loss):
   - Create a new migration that undoes the breaking change
   - Apply it with `db:deploy`

**Prevention:** Always write backward-compatible migrations. Add nullable columns first, populate the data, then in the next release make the column required.

---

## Backup and Restore

### Automated Daily Backup

Add this to cron on the VPS (`crontab -e`):

```cron
# Run daily at 2 AM Jakarta time (UTC+7 = 19:00 UTC)
0 19 * * * docker exec testcraft-db pg_dump -U testcraft testcraft | gzip > /backup/testcraft-$(date +%F).sql.gz
```

Create the backup folder first:

```bash
mkdir -p /backup
```

### Manual Backup

```bash
docker exec testcraft-db pg_dump -U testcraft testcraft \
  | gzip > /backup/testcraft-$(date +%F-%H%M).sql.gz
```

### Restore from Backup

```bash
# WARNING: This overwrites the current database
gunzip -c /backup/testcraft-2026-09-07.sql.gz \
  | docker exec -i testcraft-db psql -U testcraft -d testcraft
```

**Always test your restore procedure.** A backup you have never restored is not a real backup.

---

## GitHub Actions CI/CD

The project includes a GitHub Actions workflow that runs on every push and pull request.

### What the Workflow Does

1. Starts a PostgreSQL service container
2. Installs Node.js dependencies
3. Runs database migrations (`db:deploy`)
4. Builds all apps (`npm run build`)
5. Runs unit tests (`npm run test`)
6. (Optional) Runs E2E tests

### Minimal CI/CD Workflow

```yaml
name: CI
on: [push, pull_request]

jobs:
  build:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_USER: testcraft
          POSTGRES_PASSWORD: testcraft
          POSTGRES_DB: testcraft
        options: >-
          --health-cmd "pg_isready -U testcraft"
          --health-interval 5s
          --health-retries 10
        ports: ['5432:5432']

    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: npm

      - run: npm ci

      - name: Run database migrations
        run: npm run db:deploy --workspace @testcraft/api
        env:
          DATABASE_URL: postgresql://testcraft:testcraft@localhost:5432/testcraft

      - run: npm run build

      - run: npm run test
```

### Adding E2E Tests to CI

```yaml
  e2e:
    runs-on: ubuntu-latest
    needs: build  # Only run after build succeeds
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: npm }
      - run: npm ci
      - run: npm run db:seed --workspace @testcraft/api
        env:
          DATABASE_URL: postgresql://testcraft:testcraft@localhost:5432/testcraft

      # Start apps in background
      - run: npm run dev &
      - run: sleep 30  # Wait for apps to be ready

      # Run tests
      - name: Run E2E Tests
        working-directory: tests/e2e
        env:
          CI: true
          BASE_URL: http://localhost:3000
          API_URL: http://localhost:4001/api/v1
          ADMIN_EMAIL: ${{ secrets.ADMIN_EMAIL }}
          ADMIN_PASSWORD: ${{ secrets.ADMIN_PASSWORD }}
        run: npm test

      # Upload report as artifact
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: tests/e2e/results/html-report/
```

---

## Security Checklist

Review this list before any production deployment:

- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are random and different from each other
- [ ] Admin password has been changed from the seed default
- [ ] `CORS_ORIGINS` only contains production domains (not `*`, not localhost)
- [ ] `DATABASE_URL` uses `sslmode=require`
- [ ] Database port (5433) is NOT exposed to the internet
- [ ] Midtrans webhook signature verification is enabled in `PaymentsController`
- [ ] The `POST /payments/simulate-paid` endpoint is disabled or restricted to internal IPs
- [ ] Rate limiting is configured (`ThrottlerModule` in `app.module.ts`)
- [ ] Security headers are active (already configured via `helmet`)
- [ ] Dependencies are scanned periodically: `npm audit`
- [ ] Backups have been tested (restore verified at least once)
- [ ] TLS certificate renewal is working (Caddy auto-renews, Certbot via cron)

---

## Monitoring

Minimum monitoring setup:

| Aspect | Tool | How |
|--------|------|-----|
| Uptime | UptimeRobot or Better Stack | Ping `GET /api/v1/health` every minute |
| Application errors | Sentry | Add to both API and web apps |
| Logs | Docker logs or Grafana Loki | `docker compose logs -f api` |
| Database performance | Neon/Supabase dashboard | Slow query monitoring |
| Business metrics | Built-in | `GET /api/v1/analytics/overview` |

---

## Useful Production Commands

```bash
# Restart just the API without downtime
docker compose up -d --no-deps --build api

# Scale the API (if using Docker Swarm or Compose)
docker compose up -d --scale api=2

# Check disk usage
df -h

# Check Docker resource usage
docker stats

# View running containers
docker ps

# Remove unused Docker images (free up disk space)
docker image prune -f
```
