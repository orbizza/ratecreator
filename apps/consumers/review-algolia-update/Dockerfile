# Stage 1: Builder
FROM node:18-bullseye-slim as builder

WORKDIR /app

# Copy the entire monorepo
COPY . .

# Install dependencies at the repo root
RUN yarn install --frozen-lockfile

# Build only the review-algolia-update package
RUN cd apps/consumers/review-algolia-update && \
    yarn build-review-algolia-update

# Stage 2: Runtime
FROM node:18-bullseye-slim as runtime

WORKDIR /app

# Copy necessary files from builder
COPY --from=builder /app/apps/consumers/review-algolia-update/dist ./apps/consumers/review-algolia-update/dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/db ./packages/db

# Set environment variables
ENV NODE_ENV=production

# Default command
CMD ["node", "apps/consumers/review-algolia-update/dist/index.js"]
