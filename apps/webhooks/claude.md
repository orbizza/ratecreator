# Webhooks - Project Memory

## What This Directory Contains

The `webhooks` directory contains webhook receivers that accept external events and publish them to Kafka for async processing.

## Architecture

All webhooks follow a similar pattern:
- **Framework**: Hono.js
- **Security**: Svix signature verification
- **Output**: Kafka message publishing
- **Build**: esbuild

### Event Flow

```
External Service → Webhook Endpoint → Verification → Kafka Topic
```

## Available Webhooks

### clerk-sync
- **Port**: 3010
- **Endpoint**: `/webhook/clerk`
- **Source**: Clerk authentication
- **Topic**: `clerk-user-events`
- **Events**: user.created, user.updated, user.deleted

## Shared Patterns

### Webhook Verification
```typescript
import { Webhook } from "svix"

const wh = new Webhook(process.env.WEBHOOK_SECRET)
const payload = wh.verify(body, headers)
```

### Kafka Publishing
```typescript
await producer.send({
  topic: "topic-name",
  messages: [{
    key: `${eventType}:${id}`,
    value: JSON.stringify(payload)
  }]
})
```

## Environment Variables

All webhooks require:
```env
KAFKA_SERVICE_URI=
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_CA_CERT=
```

Webhook-specific:
```env
CLERK_WEBHOOK_SECRET=whsec_...  # For clerk-sync
```

## Restrictions

### Security
- Always verify webhook signatures
- Reject invalid requests with 400 status
- Use TLS for Kafka connections

### Idempotency
- Include event type and ID in Kafka key
- Consumers must handle duplicate messages

## What Needs To Be Done

- [ ] Rate limiting
- [ ] Request logging
- [ ] Metrics collection
- [ ] Dead letter handling for Kafka failures
- [ ] Unit tests
- [ ] Integration tests
