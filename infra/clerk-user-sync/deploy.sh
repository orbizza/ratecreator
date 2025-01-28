#!/bin/bash

# Exit on error
set -e

echo "🚀 Starting deployment of Clerk User Sync services..."

# Check system requirements
echo "🔍 Checking system requirements..."

# Check CPU cores
CPU_CORES=$(nproc)
if [ "$CPU_CORES" -lt 2 ]; then
    echo "⚠️  Warning: System has less than 2 CPU cores ($CPU_CORES cores detected)"
    echo "Recommended: 2 or more CPU cores"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check available memory
TOTAL_MEM_KB=$(grep MemTotal /proc/meminfo | awk '{print $2}')
TOTAL_MEM_GB=$((TOTAL_MEM_KB/1024/1024))
if [ "$TOTAL_MEM_GB" -lt 2 ]; then
    echo "⚠️  Warning: System has less than 2GB RAM (${TOTAL_MEM_GB}GB detected)"
    echo "Recommended: 2GB or more RAM"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check available disk space
AVAILABLE_SPACE_KB=$(df -k / | tail -1 | awk '{print $4}')
AVAILABLE_SPACE_GB=$((AVAILABLE_SPACE_KB/1024/1024))
if [ "$AVAILABLE_SPACE_GB" -lt 25 ]; then
    echo "⚠️  Warning: System has less than 25GB available space (${AVAILABLE_SPACE_GB}GB detected)"
    echo "Recommended: 25GB or more available space"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Create required directories
echo "📁 Creating directories..."
mkdir -p ~/.docker

# Setup Docker registry authentication
echo "🔐 Setting up registry authentication..."
cp config.json ~/.docker/config.json
chmod 600 ~/.docker/config.json

# Set platform for Docker
export DOCKER_DEFAULT_PLATFORM=linux/amd64

# Pull the images (this will use the auth config we just set up)
echo "📥 Pulling Docker images..."
docker-compose pull

# Start the services
echo "🌟 Starting services..."
docker-compose up -d

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo "✅ Deployment complete! Services should be running."
echo "🌐 You can check the webhook health at: http://localhost/health" 