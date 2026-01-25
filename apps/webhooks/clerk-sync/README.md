# Clerk Sync Webhook

Receives Clerk authentication events and publishes them to Kafka for async processing.

## Overview

This webhook service:

1. Receives Clerk webhook events
2. Verifies signatures using Svix
3. Publishes events to Kafka `clerk-user-events` topic

## Architecture

- **Framework**: Hono.js
- **Port**: 3010
- **Package**: `@ratecreator/webhooks-clerk-sync`
- **Build**: esbuild

## Event Flow

```
Clerk → POST /webhook/clerk → Svix Verification → Kafka
```

## Endpoints

| Endpoint         | Method | Description                  |
| ---------------- | ------ | ---------------------------- |
| `/webhook/clerk` | POST   | Receive Clerk webhook events |
| `/health`        | GET    | Health check                 |

## Functions

| Function                       | Description                  |
| ------------------------------ | ---------------------------- |
| `verifyWebhook(headers, body)` | Verify Svix signature        |
| `publishToKafka(event)`        | Publish event to Kafka topic |
| `formatKey(event)`             | Generate Kafka message key   |

## Security

1. **Svix Verification**: All webhooks verified using Svix library
2. **Secret Validation**: Uses `CLERK_WEBHOOK_SECRET`
3. **TLS**: Kafka connection uses SSL certificates

## Message Key Format

```
{eventType}:{userId}
// Example: user.created:user_2abc123
```

## Environment Variables

```env
CLERK_WEBHOOK_SECRET=whsec_...
KAFKA_SERVICE_URI=
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_CA_CERT=
```

## Development

```bash
# Install dependencies
yarn install

# Build
yarn build

# Run locally
yarn start
```

Open [http://localhost:3010](http://localhost:3010)
