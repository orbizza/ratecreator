# Review Services Infrastructure

This directory contains the infrastructure setup for the review services:

- `review-algolia-update`: Updates Algolia search indices with review data
- `review-calculate`: Calculates review metrics and updates the database

## Services Overview

### review-algolia-update

- Consumes messages from Digital Ocean Kafka topic `new-review-algolia-update`
- Updates Algolia search indices with review data (rating and review count)
- Requires Algolia and Kafka credentials

### review-calculate

- Consumes messages from Digital Ocean Kafka
- Calculates review metrics
- Updates the Digital Ocean Managed Database with calculated metrics
- Requires database and Kafka credentials

## Prerequisites

- Docker and Docker Compose
- Access to DigitalOcean container registry
- Required environment variables (see below)

## Required Environment Variables

```bash
# Kafka (Digital Ocean)
KAFKA_SERVICE_URI=<kafka-service-uri>
KAFKA_CA_CERT=<kafka-ca-cert>
KAFKA_USERNAME=<kafka-username>
KAFKA_PASSWORD=<kafka-password>

# Database (Digital Ocean Managed Database)
DATABASE_URL_ONLINE=<database-url>

# Algolia
ALGOLIA_APP_ID=<algolia-app-id>
ALGOLIA_WRITE_API_KEY=<algolia-admin-api-key>
```

## Building

To build the Docker images:

```bash
./build.sh
```

This will:

1. Set up multi-architecture build environment
2. Build images for both AMD64 and ARM64
3. Push images to DigitalOcean registry

## Deployment

To deploy the services:

```bash
./deploy.sh
```

This will:

1. Check system requirements
2. Set up Docker registry authentication
3. Pull latest images
4. Start services using Docker Compose

## Monitoring

You can monitor the services:

```bash
# View logs
docker-compose logs -f review-algolia-update
docker-compose logs -f review-calculate

# Check service status
docker-compose ps

# Restart services
docker-compose restart review-algolia-update
docker-compose restart review-calculate
```

## Troubleshooting

1. If services fail to start, check:

   - Environment variables are correctly set
   - Digital Ocean Kafka connection is available
   - Digital Ocean Managed Database connection is available
   - Algolia credentials are valid

2. Common issues:
   - Kafka connection errors: Check KAFKA\_\* environment variables
   - Database connection errors: Check DATABASE_URL_ONLINE
   - Algolia errors: Check ALGOLIA\_\* credentials
