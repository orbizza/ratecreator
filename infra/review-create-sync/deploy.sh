#!/bin/bash

/**
 * @fileoverview Deployment script for Review Create Sync service
 * @description This script handles the deployment process for the Review Create Sync service,
 * including environment validation, configuration updates, and service deployment.
 * It ensures proper deployment configuration and handles the deployment process.
 */

# Exit on error
set -e

# Check if .env file exists
if [ ! -f .env ]; then
    echo "Error: .env file not found!"
    exit 1
fi

# Source the environment variables
set -a
source .env
set +a

echo "🚀 Starting deployment of Review Services..."

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
if [ "$AVAILABLE_SPACE_GB" -lt 18 ]; then
    echo "⚠️  Warning: System has less than 18GB available space (${AVAILABLE_SPACE_GB}GB detected)"
    echo "Recommended: 18GB or more available space"
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

# Pull and start services
echo "🐳 Pulling latest images and starting services..."
docker-compose pull
docker-compose up -d

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

echo "✅ Deployment complete! Services are running."
echo "📝 Services deployed:"
echo "   - review-algolia-update"
echo "   - review-calculate"

# Show the logs
docker-compose logs -f 