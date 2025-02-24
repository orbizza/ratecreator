# Stage 1: Builder
FROM node:18-bullseye-slim as builder

WORKDIR /app

# Install dependencies needed for Prisma
RUN apt-get update && apt-get install -y openssl libssl-dev && apt-get clean

# Copy package files first for better caching
COPY . .

# Install dependencies
RUN yarn install --frozen-lockfile

# Build only the review-calculate package
RUN cd apps/consumers/review-calculate && \
    yarn build-review-calculate

# Ensure Prisma Query Engine is available for both arm64 & amd64
RUN cd packages/db && \
    PRISMA_CLI_QUERY_ENGINE_TYPE=binary \
    npx prisma generate --schema=prisma/schema.prisma


# Stage 2: Runtime
FROM node:18-bullseye-slim as runtime

WORKDIR /app

# Install dependencies needed for runtime
RUN apt-get update && apt-get install -y openssl libssl-dev && apt-get clean

# Copy necessary files from builder
COPY --from=builder /app/apps/consumers/review-calculate/dist ./apps/consumers/review-calculate/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Set environment variables for Prisma binary
ENV NODE_ENV=production
ENV PRISMA_BINARY_PLATFORM="debian-openssl-1.1.x"

# Default command
CMD ["node", "apps/consumers/review-calculate/dist/index.js"]
