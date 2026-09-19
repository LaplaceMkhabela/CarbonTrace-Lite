# Multi-stage production image (Next.js standalone, Node 24 for node:sqlite).
#   docker build -t carbontrace-lite .
#   docker run -p 3000:3000 --env-file .env carbontrace-lite

FROM node:24-alpine AS base
ENV NEXT_TELEMETRY_DISABLED=1
WORKDIR /app

# --- deps (cached unless manifests change) ---
FROM base AS deps
COPY package.json package-lock.json ./
RUN npm ci

# --- build ---
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# .env is never baked in (see .dockerignore); build with demo-safe defaults.
ENV USE_MOCK_DATA=true
RUN npm run build

# --- runner (minimal, non-root) ---
FROM node:24-alpine AS runner
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME="0.0.0.0" \
    USE_MOCK_DATA=true \
    STORAGE=sqlite \
    DB_PATH=/app/data/db/carbontrace.db \
    POLYGON_RPC_URL=https://rpc-amoy.polygon.technology
WORKDIR /app

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs \
 && mkdir -p /app/data/db /app/data/models \
 && chown -R nextjs:nodejs /app/data
USER nextjs

# Standalone server + static assets + public dir.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
# Trained anomaly model (runtime loads it from data/models/). The sqlite DB
# itself is created at runtime under DB_PATH — mount a volume to persist it.
COPY --from=builder --chown=nextjs:nodejs /app/data/models/anomaly-model.json ./data/models/anomaly-model.json

EXPOSE 3000
CMD ["node", "server.js"]
