# Review Algolia Update Consumer

Kafka consumer that synchronizes review data to Algolia search indices.

## Overview

When review events occur, this service:
1. Consumes review events from Kafka
2. Fetches updated creator data from MongoDB
3. Updates the Algolia search index
4. Maintains search data freshness

## Architecture

- **Framework**: Hono.js
- **Message Queue**: Kafka
- **Search**: Algolia
- **Package**: `@ratecreator/review-algolia-update`
- **Build**: esbuild

## Functions

| Function | Description |
|----------|-------------|
| `updateAlgoliaIndex(accountId)` | Update creator record in Algolia |
| `getCreatorData(accountId)` | Fetch creator data from MongoDB |
| `partialUpdate(objectId, data)` | Perform partial update on Algolia record |

## Index Updates

Updates the following Algolia fields on review events:
- `reviewCount`: Total number of reviews
- `rating`: Average rating
- `lastReviewDate`: Timestamp of most recent review

## Message Format

Expected Kafka message structure:
```typescript
{
  eventType: "review.created" | "review.updated" | "review.deleted",
  accountId: string,
  timestamp: string
}
```

## Environment Variables

```env
KAFKA_SERVICE_URI=
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_CA_CERT=
ALGOLIA_APP_ID=
ALGOLIA_WRITE_API_KEY=
DATABASE_URL_ONLINE=
```

## Development

```bash
# Build
yarn build

# Run locally
yarn start
```
