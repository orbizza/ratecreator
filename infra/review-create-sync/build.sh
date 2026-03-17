#!/bin/bash

# @fileoverview Build script for Review Create Sync service
# @description This script handles the build process for the Review Create Sync service,
# including environment setup, dependency installation, and Docker image building.
# It ensures proper configuration and builds the service for deployment.

# Exit on error
set -e

echo "🏗️  Setting up multi-architecture build environment..."

# Ensure we run from the repository root so Dockerfile paths resolve
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
cd "$REPO_ROOT"
echo "📁 Using repository root as build context: $REPO_ROOT"

# Create builder instance if it doesn't exist
if ! docker buildx ls | grep -q multiarch-builder; then
    docker buildx create --name multiarch-builder --driver docker-container --bootstrap
fi

# Use the multiarch builder
docker buildx use multiarch-builder

# Login to DigitalOcean registry
echo "🔐 Logging into DigitalOcean registry..."
docker login registry.digitalocean.com


echo "🏭 Building and pushing review-calculate amd64..."
docker buildx build \
    --platform linux/amd64 \
    -t registry.digitalocean.com/ratecreator/review-calculate:latest \
    -f apps/consumers/review-calculate/Dockerfile \
    --push \
    .

echo "🏭 Building and pushing review-calculate arm64..."
docker buildx build \
    --platform linux/arm64 \
    -t registry.digitalocean.com/ratecreator/review-calculate:latest \
    -f apps/consumers/review-calculate/Dockerfile \
    --push \
    .


echo "✅ Multi-architecture builds completed and pushed to registry!"
echo "📝 Images built for: linux/amd64, linux/arm64" 