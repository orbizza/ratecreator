#!/bin/bash

/**
 * @fileoverview Build script for Clerk User Sync service
 * @description This script handles the build process for the Clerk User Sync service,
 * including environment setup, dependency installation, and Docker image building.
 * It ensures proper configuration and builds the service for deployment.
 */

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

echo "🏭 Building and pushing clerk-user-sync..."
docker buildx build \
    --platform linux/amd64,linux/arm64 \
    -t registry.digitalocean.com/orbizza/clerk-user-sync:latest \
    -f apps/consumers/clerk-user-sync/Dockerfile \
    --push \
    .

echo "✅ Multi-architecture builds completed and pushed to registry!"
echo "📝 Images built for: linux/amd64, linux/arm64" 