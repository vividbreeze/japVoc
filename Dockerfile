# ─── Stage 1: Build Frontend ───────────────────────────────────────────────
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

COPY frontend/package*.json ./
RUN npm ci

COPY frontend/ ./
RUN npm run build

# ─── Stage 2: Build Backend ────────────────────────────────────────────────
# Use slim (Debian) so Prisma generates glibc binaries matching the runner
FROM node:20-slim AS backend-builder
WORKDIR /app/backend

COPY backend/package*.json ./
RUN npm ci

COPY backend/ ./
RUN npx prisma generate
RUN npm run build

# ─── Stage 3: Production Image ─────────────────────────────────────────────
FROM node:20-slim AS runner
WORKDIR /app

# Install production deps (includes prisma CLI for migrate deploy)
COPY backend/package*.json ./
RUN npm ci --omit=dev

# Copy compiled backend + generated Prisma client (glibc binaries)
COPY --from=backend-builder /app/backend/dist ./dist
COPY --from=backend-builder /app/backend/node_modules/.prisma ./node_modules/.prisma
COPY --from=backend-builder /app/backend/node_modules/@prisma ./node_modules/@prisma

# Copy Prisma schema, migrations and seed data
COPY backend/prisma ./prisma

# Copy built frontend
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

# Persistent data directory for SQLite
RUN mkdir -p /app/data

EXPOSE 3000

# Use node for health check — no wget/curl dependency needed
HEALTHCHECK --interval=30s --timeout=10s --start_period=60s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["sh", "-c", "npx prisma migrate deploy && node dist/src/index.js"]
