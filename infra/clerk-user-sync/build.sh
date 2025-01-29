#!/bin/bash

# Exit on error
set -e

# Navigate to the root of the monorepo (assuming we're in infra/clerk-user-sync)
cd ../../

echo "🏗️  Setting up multi-architecture build environment..."

# Create builder instance if it doesn't exist
if ! docker buildx ls | grep -q multiarch-builder; then
    docker buildx create --name multiarch-builder --driver docker-container --bootstrap
fi

# Use the multiarch builder
docker buildx use multiarch-builder

# Login to DigitalOcean registry
echo "🔐 Logging into DigitalOcean registry..."
docker login registry.digitalocean.com

echo "🏭 Building and pushing clerk-producer..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t registry.digitalocean.com/orbizza/clerk-producer:latest \
    -f apps/webhooks/clerk-sync/Dockerfile \
    --push \
    .

echo "🏭 Building and pushing clerk-consumer..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t registry.digitalocean.com/orbizza/clerk-consumer:latest \
    -f apps/consumers/user-sync/Dockerfile \
    --push \
    .


echo "✅ Multi-architecture builds completed and pushed to registry!"
echo "📝 Images built for: linux/amd64, linux/arm64" 