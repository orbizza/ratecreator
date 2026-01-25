# Review Calculate Consumer - Project Memory

## What This Consumer Does

The `review-calculate` consumer is a Kafka consumer that processes review events and calculates creator ratings. When a new review is submitted, this service:

1. Consumes the review event from Kafka
2. Fetches all reviews for the creator
3. Calculates ratings using multiple algorithms
4. Updates the creator's rating in MongoDB
5. Caches results in Redis
6. Triggers search index update

## Architecture

- **Framework**: Hono.js
- **Message Queue**: Kafka
- **Package**: `@ratecreator/review-calculate`
- **Build**: esbuild

### Rating Algorithms

1. **Simple Average**: Sum of stars / count of reviews
2. **Bayesian Average**: Weighted rating with confidence
   ```
   bayesian = (v/(v+m)) * R + (m/(v+m)) * C
   where:
   - v = number of votes (reviews)
   - m = minimum votes required (tunable)
   - R = average rating for this creator
   - C = mean rating across all creators
   ```

## What Has Been Done

- Kafka consumer setup with proper error handling
- Simple average calculation
- Bayesian average calculation
- Redis caching of ratings
- MongoDB update of creator rating fields
- Health check endpoint

## Restrictions

### Message Format
Expected Kafka message structure:
```typescript
{
  eventType: "review.created" | "review.updated" | "review.deleted",
  reviewId: string,
  accountId: string,
  stars: number,
  timestamp: string
}
```

### Dependencies
- Requires Kafka connection (TLS with certificates)
- Requires Redis connection
- Requires MongoDB connection

### Processing
- Messages are processed sequentially per partition
- Failed messages are logged but not retried (dead letter queue pending)

## What Needs To Be Done

- [ ] Dead letter queue for failed messages
- [ ] Retry logic with exponential backoff
- [ ] Batch processing for efficiency
- [ ] Rating decay over time (older reviews less weight)
- [ ] Fraud detection (review bombing prevention)
- [ ] Metrics and monitoring
- [ ] Unit tests

## Key Files

| File | Purpose |
|------|---------|
| `src/index.ts` | Main entry, Kafka consumer setup |
| `package.json` | Dependencies and build config |
