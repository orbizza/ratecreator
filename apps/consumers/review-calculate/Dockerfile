# Stage 1: Builder
FROM node:18-bullseye-slim as builder

WORKDIR /app

# Install dependencies needed for Prisma & runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl libssl-dev curl gnupg && \
    rm -rf /var/lib/apt/lists/*  # Free up space

# Copy the monorepo
COPY . .

# Install dependencies at the repo root
RUN yarn install --frozen-lockfile --network-timeout 600000

# Build only the review-calculate package
RUN cd apps/consumers/review-calculate && yarn build-review-calculate

# Generate Prisma Client
RUN cd packages/db && npx prisma generate --schema=prisma/schema.prisma

# Stage 2: Runtime
FROM node:18-bullseye-slim as runtime

WORKDIR /app

# Install minimal dependencies needed for runtime
RUN apt-get update && \
    apt-get install -y --no-install-recommends openssl libssl-dev && \
    rm -rf /var/lib/apt/lists/*  # Free up space

# Copy necessary files from builder
COPY --from=builder /app/apps/consumers/review-calculate/dist ./apps/consumers/review-calculate/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Set environment variables for Prisma
ENV NODE_ENV=production
ENV PRISMA_BINARY_PLATFORM="debian-openssl-1.1.x"

# Default command
CMD ["node", "apps/consumers/review-calculate/dist/index.js"]
