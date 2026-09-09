# TestCraft LMS — API (NestJS)
# Build dari root repo:  docker build -f apps/api/Dockerfile -t testcraft-lms-api .

# ── Tahap 1: dependency ──────────────────────────────────────────────────
FROM node:20-alpine AS deps
WORKDIR /app

# Salin manifest saja dulu agar layer cache tidak batal tiap kali kode berubah.
COPY package.json package-lock.json ./
COPY apps/api/package.json apps/api/
COPY packages/shared/package.json packages/shared/
COPY apps/api/prisma apps/api/prisma

# `postinstall` di apps/api menjalankan `prisma generate`, jadi skema harus
# sudah tersalin sebelum langkah ini.
RUN npm ci --workspace @testcraft/api --workspace @testcraft/shared --include-workspace-root

# ── Tahap 2: build ───────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY packages/shared packages/shared
COPY apps/api apps/api

RUN npm run build --workspace @testcraft/shared \
 && npm run build --workspace @testcraft/api

# ── Tahap 3: runtime ─────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Jalankan sebagai pengguna non-root.
RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/api/dist ./apps/api/dist
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma
COPY --from=builder /app/apps/api/package.json ./apps/api/
COPY package.json ./

USER nestjs
EXPOSE 4001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:4001/api/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]
