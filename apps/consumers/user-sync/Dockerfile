# Stage 1: Builder
FROM node:18-bullseye-slim as builder

# Set working directory
WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install dependencies at the repo root (assuming Yarn workspace)
RUN yarn install --frozen-lockfile

# Generate Prisma Client with correct binary targets
RUN cd packages/db && \
    npx prisma generate && \
    cd ../.. && \
    yarn build

# Stage 2: Runtime
FROM node:18-bullseye-slim as runtime

WORKDIR /app

# Copy just the needed parts from builder
COPY --from=builder /app/apps/consumers/user-sync/dist ./apps/consumers/user-sync/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db/prisma ./packages/db/prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create directory for logs
RUN mkdir -p /var/log/user-sync && \
    chown -R node:node /var/log/user-sync

# Use non-root user
USER node

ENV NODE_ENV=production

# Start the consumer
CMD ["node", "apps/consumers/user-sync/dist/index.js"] 