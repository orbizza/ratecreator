# Consumers - Project Memory

## What This Directory Contains

The `consumers` directory contains Kafka message consumers for asynchronous event processing. These are standalone services that process events from Kafka topics.

## Architecture

All consumers follow a similar pattern:
- **Framework**: Hono.js
- **Message Queue**: Kafka (Digital Ocean managed)
- **Build**: esbuild
- **Deployment**: Kubernetes/Docker

### Event Flow

```
Apps → Kafka Topics → Consumers → Database/Services
```

## Available Consumers

### review-calculate
- **Topic**: Review events
- **Purpose**: Calculate and update creator ratings
- **Actions**: Updates MongoDB, caches to Redis

### review-algolia-update
- **Topic**: Review events
- **Purpose**: Sync review data to Algolia search
- **Actions**: Updates Algolia indices

### user-sync
- **Topic**: `clerk-user-events`
- **Purpose**: Sync Clerk user events to MongoDB
- **Actions**: User CRUD in database

## Shared Patterns

### Kafka Consumer Setup
```typescript
const consumer = kafka.consumer({ groupId: "consumer-name" })
await consumer.connect()
await consumer.subscribe({ topic: "topic-name" })
await consumer.run({
  eachMessage: async ({ message }) => {
    // Process message
  }
})
```

### Health Check
All consumers expose a health endpoint:
```
GET /health
```

## Environment Variables

All consumers require:
```env
KAFKA_SERVICE_URI=
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_CA_CERT=
DATABASE_URL_ONLINE=
```

## Restrictions

### Message Processing
- Process messages sequentially per partition
- Handle idempotency (same message may arrive twice)
- Use soft deletes for audit trail

### Error Handling
- Log failed messages
- Consider dead letter queue for persistent failures
- Retry with exponential backoff

## What Needs To Be Done

- [ ] Dead letter queue for all consumers
- [ ] Retry logic with exponential backoff
- [ ] Metrics and monitoring (Prometheus)
- [ ] Health check improvements
- [ ] Unit tests
- [ ] Integration tests
- [ ] Docker/Kubernetes configs
