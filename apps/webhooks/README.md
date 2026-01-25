# Rate Creator Webhooks

Webhook receivers that accept external events and publish to Kafka.

## Available Webhooks

| Webhook | Port | Source | Topic |
|---------|------|--------|-------|
| `clerk-sync` | 3010 | Clerk Auth | `clerk-user-events` |

## Architecture

```
External Service → Webhook → Svix Verification → Kafka
```

All webhooks use:
- **Framework**: Hono.js
- **Verification**: Svix
- **Output**: Kafka
- **Build**: esbuild

## Running Webhooks

```bash
# Build
cd clerk-sync && yarn build

# Run
cd clerk-sync && yarn start
```

## Endpoints

### clerk-sync

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/webhook/clerk` | POST | Receive Clerk events |
| `/health` | GET | Health check |

## Environment Variables

```env
# Kafka
KAFKA_SERVICE_URI=
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_CA_CERT=

# Webhook secrets
CLERK_WEBHOOK_SECRET=whsec_...
```

## Security

1. **Signature Verification**: All webhooks verify signatures using Svix
2. **TLS**: Kafka connections use SSL certificates
3. **Reject Invalid**: Invalid signatures return 400 status

## Development

Each webhook follows the same structure:
```
webhook-name/
├── src/
│   └── index.ts      # Main entry point
├── package.json
└── tsconfig.json
```
