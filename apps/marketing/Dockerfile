# TestCraft Indonesia — Marketing (Next.js)
# Build dari root repo:  docker build -f apps/marketing/Dockerfile -t testcraft-marketing .

# ── Tahap 1: dependency ──────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/marketing/package.json apps/marketing/
COPY packages/shared/package.json packages/shared/
RUN npm ci --workspace @testcraft/marketing --workspace @testcraft/shared --include-workspace-root

# ── Tahap 2: build ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/shared packages/shared
COPY apps/marketing apps/marketing

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build --workspace @testcraft/marketing

# ── Tahap 3: runtime ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production NEXT_TELEMETRY_DISABLED=1

RUN addgroup -g 1001 -S nodejs && adduser -S nextjs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/marketing/.next ./apps/marketing/.next
COPY --from=builder /app/apps/marketing/public ./apps/marketing/public
COPY --from=builder /app/apps/marketing/package.json ./apps/marketing/
COPY --from=builder /app/apps/marketing/next.config.mjs ./apps/marketing/
COPY package.json ./

USER nextjs
EXPOSE 3001
WORKDIR /app/apps/marketing

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3001/').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["npx", "next", "start", "-p", "3001"]
