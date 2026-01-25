# Clerk Sync Webhook - Project Memory

## What This Webhook Does

The `clerk-sync` webhook receives Clerk authentication events and publishes them to Kafka for async processing. It serves as the entry point for user lifecycle events.

## Architecture

- **Framework**: Hono.js
- **Port**: 3010
- **Package**: `@ratecreator/webhooks-clerk-sync`
- **Build**: esbuild

### Event Flow

```
Clerk → POST /webhook/clerk → Svix Verification → Kafka (clerk-user-events topic)
```

### Endpoint

```
POST /webhook/clerk
Headers:
  - svix-id
  - svix-timestamp
  - svix-signature
Body: Clerk webhook payload (JSON)
```

## What Has Been Done

- Hono.js server setup
- Svix webhook signature verification
- Kafka producer integration
- Event publishing to `clerk-user-events` topic
- Health check endpoint

### Security

1. **Svix Verification**: All webhooks are verified using Svix library
2. **Secret Validation**: Uses `CLERK_WEBHOOK_SECRET` for signature verification
3. **TLS**: Kafka connection uses SSL certificates

### Message Key Format
```
{eventType}:{userId}
// Example: user.created:user_2abc123
```

## Restrictions

### Verification
- All requests must have valid Svix headers
- Invalid signatures are rejected with 400 status

### Environment Variables
```
CLERK_WEBHOOK_SECRET=whsec_...
KAFKA_SERVICE_URI=...
KAFKA_USERNAME=...
KAFKA_PASSWORD=...
KAFKA_CA_CERT=...
```

### Idempotency
- Kafka key includes event type and user ID
- Consumers should handle duplicate messages

## What Needs To Be Done

- [ ] Rate limiting
- [ ] Request logging
- [ ] Metrics collection
- [ ] Health check improvements
- [ ] Retry logic for Kafka failures
- [ ] Dead letter handling
- [ ] Unit tests

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry, Hono server and webhook handler |
| `package.json` | Dependencies and build config |
