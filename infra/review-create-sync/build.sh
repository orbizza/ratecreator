#!/bin/bash

# Exit on error
set -e

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

echo "🏭 Building and pushing review-calculate..."
docker buildx build \
    --platform linux/arm64 \
    -t registry.digitalocean.com/orbizza/review-calculate:latest \
    -f apps/consumers/review-calculate/Dockerfile \
    --push \
    .

docker buildx build \
    --platform linux/amd64 \
    -t registry.digitalocean.com/orbizza/review-calculate:latest \
    -f apps/consumers/review-calculate/Dockerfile \
    --push \
    .


echo "🏭 Building and pushing review-algolia-update..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t registry.digitalocean.com/orbizza/review-algolia-update:latest \
    -f apps/consumers/review-algolia-update/Dockerfile \
    --push \
    .



echo "✅ Multi-architecture builds completed and pushed to registry!"
echo "📝 Images built for: linux/amd64, linux/arm64" 