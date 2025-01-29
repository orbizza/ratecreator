# Stage 1: Builder
FROM node:18-bullseye-slim as builder

WORKDIR /app

# Install dependencies needed for Prisma
RUN apt-get update && apt-get install -y openssl

# Copy monorepo and install dependencies
COPY . .
RUN yarn install --frozen-lockfile

# Build the project and generate Prisma Client
RUN yarn build && \
    cd packages/db && \
    npx prisma generate

# Stage 2: Runtime
FROM node:18-bullseye-slim as runtime

WORKDIR /app

# Install dependencies needed for runtime
RUN apt-get update && apt-get install -y openssl && apt-get clean

# Copy necessary files from the builder stage
COPY --from=builder /app/apps/consumers/user-sync/dist ./apps/consumers/user-sync/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db ./packages/db
COPY --from=builder /app/node_modules/.prisma/client ./node_modules/.prisma/client

# Set environment variables
ENV NODE_ENV=production
ENV PRISMA_QUERY_ENGINE_LIBRARY=/app/node_modules/.prisma/client/libquery_engine-debian-openssl-1.1.x.so.node

# Set default command
CMD ["node", "apps/consumers/user-sync/dist/index.js"]
