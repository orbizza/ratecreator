# Rate Creator Consumers

Kafka message consumers for asynchronous event processing.

## Available Consumers

| Consumer | Topic | Purpose |
|----------|-------|---------|
| `review-calculate` | Review events | Calculate creator ratings |
| `review-algolia-update` | Review events | Sync to Algolia search |
| `user-sync` | `clerk-user-events` | Sync Clerk users to MongoDB |

## Architecture

```
Apps → Kafka Topics → Consumers → Database/Services
```

All consumers use:
- **Framework**: Hono.js
- **Message Queue**: Kafka (Digital Ocean)
- **Build**: esbuild

## Running Consumers

```bash
# Build all consumers
yarn build

# Run individual consumer
cd review-calculate && yarn start
cd review-algolia-update && yarn start
cd user-sync && yarn start
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

Consumer-specific variables:

| Consumer | Additional Variables |
|----------|---------------------|
| `review-calculate` | `REDIS_HOST`, `REDIS_PASSWORD` |
| `review-algolia-update` | `ALGOLIA_APP_ID`, `ALGOLIA_WRITE_API_KEY` |

## Health Checks

All consumers expose:
```
GET /health
```

## Development

Each consumer follows the same structure:
```
consumer-name/
├── src/
│   └── index.ts      # Main entry point
├── package.json
└── tsconfig.json
```
