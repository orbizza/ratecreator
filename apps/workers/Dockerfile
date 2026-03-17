# ============================================
# Rate Creator Workers - Docker Image
# ============================================
# HTTP service that receives Pub/Sub push messages.
# Deployed as a GCP Cloud Run Service.
#
# Build (from monorepo root):
#   docker build -t gcr.io/sinuous-aviary-410323/ratecreator-workers:latest -f apps/workers/Dockerfile .
# ============================================

FROM node:20-alpine AS builder

WORKDIR /app

RUN apk add --no-cache openssl

# Copy root package files
COPY package.json yarn.lock ./

# Copy all workspace packages and the workers app
COPY packages ./packages
COPY apps/workers ./apps/workers

# Install dependencies
RUN yarn install --frozen-lockfile --network-timeout 600000

# Generate Prisma client
WORKDIR /app/packages/db
RUN npx prisma generate --schema=prisma/schema.prisma

# Build workers
WORKDIR /app/apps/workers
RUN yarn build

# ============================================
# Production image
# ============================================
FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache openssl

COPY --from=builder /app/apps/workers/dist ./dist
COPY --from=builder /app/apps/workers/package.json ./
COPY --from=builder /app/node_modules ./node_modules

ENV NODE_ENV=production
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

CMD ["node", "dist/index.js"]
