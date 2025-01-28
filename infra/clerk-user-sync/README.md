# Clerk User Sync Deployment

This directory contains the deployment configuration for the Clerk User Sync
services, including both the consumer and producer services with an Nginx
reverse proxy.

## System Requirements

Recommended droplet configuration:

- **CPU**: 2 vCPUs (minimum)
- **RAM**: 2GB (minimum)
  - Consumer service: ~300-400MB
  - Producer service: ~300-400MB
  - Nginx: ~50MB
  - System overhead: ~250MB
  - Buffer for peaks: ~1GB
- **Storage**: 25GB minimum
  - Operating system: ~8GB
  - Docker images and containers: ~4GB
  - Log files and data: ~10GB
  - Buffer space: ~3GB
- **Operating System**: Ubuntu 20.04 LTS or newer

Recommended DigitalOcean droplet size: **Basic Plan / Regular Intel / 2GB/2CPU**

- This provides a good balance of resources for running both services
- Allows for logs and metrics collection
- Provides headroom for traffic spikes

## Directory Structure

```
.
├── docker-compose.yml    # Docker Compose configuration
├── nginx.conf           # Nginx reverse proxy configuration
├── config.json         # Docker registry authentication
└── deploy.sh          # Deployment script
```

## Quick Start

1. Make the deployment script executable:

```bash
chmod +x deploy.sh
```

2. Run the deployment:

```bash
./deploy.sh
```

## Manual Deployment

If you prefer to run the commands manually, you can:

1. Create required directories:

```bash
mkdir -p ~/.docker
```

2. Setup registry authentication:

```bash
cp config.json ~/.docker/config.json
chmod 600 ~/.docker/config.json
```

3. Pull and start services:

```bash
docker-compose pull
docker-compose up -d
```

## Verification

- Check service status: `docker-compose ps`
- Test the health endpoint: `curl http://localhost/health`
- Webhook endpoint will be available at: `http://localhost/webhook/clerk`

## Troubleshooting

If you encounter any issues:

1. Check service logs:

```bash
docker-compose logs
```

2. Check individual service logs:

```bash
docker-compose logs clerk-producer
docker-compose logs clerk-consumer
docker-compose logs nginx
```

3. Restart services:

```bash
docker-compose restart
```

## Cleanup

To stop and remove all services:

```bash
docker-compose down
```
