# Review Calculate Consumer

Kafka consumer that processes review events and calculates creator ratings.

## Overview

When a new review is submitted, this service:
1. Consumes the review event from Kafka
2. Fetches all reviews for the creator
3. Calculates ratings using multiple algorithms
4. Updates the creator's rating in MongoDB
5. Caches results in Redis

## Architecture

- **Framework**: Hono.js
- **Message Queue**: Kafka
- **Package**: `@ratecreator/review-calculate`
- **Build**: esbuild

## Rating Algorithms

### Simple Average
```
rating = sum(stars) / count(reviews)
```

### Bayesian Average
```
bayesian = (v/(v+m)) * R + (m/(v+m)) * C
```
Where:
- `v` = number of votes (reviews)
- `m` = minimum votes required (tunable)
- `R` = average rating for this creator
- `C` = mean rating across all creators

## Functions

| Function | Description |
|----------|-------------|
| `calculateSimpleAverage(reviews)` | Compute arithmetic mean of ratings |
| `calculateBayesianAverage(reviews, globalMean, minVotes)` | Compute weighted rating with confidence |
| `updateCreatorRating(accountId, rating)` | Update rating in database |
| `cacheRating(accountId, rating)` | Cache rating in Redis |

## Message Format

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

## Environment Variables

```env
KAFKA_SERVICE_URI=
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_CA_CERT=
DATABASE_URL_ONLINE=
REDIS_HOST=
REDIS_PASSWORD=
```

## Development

```bash
# Build
yarn build

# Run locally
yarn start
```
