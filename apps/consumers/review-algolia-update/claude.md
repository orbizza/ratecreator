# Review Algolia Update Consumer - Project Memory

## What This Consumer Does

The `review-algolia-update` consumer synchronizes review data to Algolia search indices. When review events occur, this service:

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

### Index Updates

Updates the following Algolia fields on review events:

- `reviewCount`: Total number of reviews
- `rating`: Average rating
- `lastReviewDate`: Timestamp of most recent review

## What Has Been Done

- Kafka consumer setup
- Algolia client integration
- Partial updates to search records
- Health check endpoint

## Restrictions

### Message Format

Expected Kafka message structure:

```typescript
{
  eventType: "review.created" | "review.updated" | "review.deleted",
  accountId: string,
  timestamp: string
}
```

### Dependencies

- Requires Kafka connection
- Requires Algolia credentials (write API key)

### Rate Limits

- Algolia has rate limits per plan
- Batch updates where possible

## What Needs To Be Done

- [ ] Batch processing for multiple updates
- [ ] Retry logic for failed Algolia updates
- [ ] Index rebuild capability
- [ ] Metrics and monitoring
- [ ] Dead letter queue
- [ ] Unit tests

## Key Files

| File           | Purpose                                       |
| -------------- | --------------------------------------------- |
| `src/index.ts` | Main entry, Kafka consumer and Algolia update |
| `package.json` | Dependencies and build config                 |
