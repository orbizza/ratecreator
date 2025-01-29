# Stage 1: Builder
FROM node:18-bullseye-slim as builder

# Set working directory
WORKDIR /app

# Install OpenSSL 1.1 for Prisma
RUN apt-get update && apt-get install -y openssl

# Copy the entire monorepo
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile

# Generate Prisma Client with correct binary targets
RUN yarn build && \
    cd packages/db && \
    npx prisma generate

# Stage 2: Runtime
FROM node:18-bullseye-slim as runtime

# Install OpenSSL 1.1
RUN apt-get update && apt-get install -y openssl

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/apps/webhooks/clerk-sync/dist ./apps/webhooks/clerk-sync/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Create directory for logs
RUN mkdir -p /var/log/clerk-sync && \
    chown -R node:node /var/log/clerk-sync

# Use non-root user
USER node

ENV NODE_ENV=production
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-debian-openssl-1.1.x.so.node

# Start the webhook server
CMD ["node", "apps/webhooks/clerk-sync/dist/index.js"]
