# Stage 1: Builder
FROM node:18-bullseye-slim as builder

# Set working directory
WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install dependencies at the repo root (assuming Yarn workspace)
RUN yarn install --frozen-lockfile

# Build the entire repo (this ensures dependencies for clerk-sync)
RUN yarn build

# Stage 2: Runtime
FROM node:18-bullseye-slim as runtime

WORKDIR /app

# Copy just the needed parts from builder
COPY --from=builder /app/apps/webhooks/clerk-sync/dist ./apps/webhooks/clerk-sync/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db ./packages/db

ENV NODE_ENV=production

# Assuming your app listens on port 3000
EXPOSE 3010

CMD ["node", "apps/webhooks/clerk-sync/dist/index.js"]
