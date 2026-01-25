# Scripts Package - Project Memory

## What This Package Does

The `scripts` package contains database seeding, data import, and utility scripts:

- Algolia index seeding
- Account data import (YouTube, Twitter)
- Redis cache management
- Data migration utilities

## Architecture

- **Package**: `@ratecreator/scripts`
- **Runtime**: Node.js with tsx

### Available Commands

```bash
# Seeding
yarn seed-category                    # Seed categories to Algolia
yarn seed-account-youtube             # Seed YouTube accounts
yarn seed-account-youtube-batch       # Batch seed YouTube accounts
yarn seed-account-twitter-batch       # Batch seed Twitter accounts
yarn update-account-youtube           # Update YouTube account data

# Cache
yarn flush-redis-cache                # Clear Redis cache
```

### Directory Structure

```
src/
├── algolia/
│   ├── seed-categories.ts
│   ├── seed-youtube-accounts.ts
│   ├── seed-youtube-accounts-batch.ts
│   ├── seed-twitter-accounts-batch.ts
│   └── update-youtube-accounts.ts
└── redis/
    └── flushRedisCache.ts
```

## What Has Been Done

### Algolia Seeding

- Category seeding with hierarchy
- YouTube account import
- Batch import for large datasets
- Twitter account import
- Account data updates

### Redis Utilities

- Cache flush script
- Key pattern deletion

## Restrictions

### Environment Variables

```
ALGOLIA_APP_ID=...
ALGOLIA_WRITE_API_KEY=...
DATABASE_URL_ONLINE=...
REDIS_HOST=...
REDIS_PASSWORD=...
```

### Data Sources

- YouTube API for account data
- Twitter API for account data
- Manual CSV imports supported

### Execution

- Run scripts locally or in CI/CD
- Use proper environment configuration
- Monitor for rate limits

## What Needs To Be Done

- [ ] Data validation scripts
- [ ] Database backup/restore scripts
- [ ] Index rebuild scripts
- [ ] Data migration utilities
- [ ] Cleanup scripts (orphaned data)
- [ ] Statistics/reporting scripts
- [ ] Scheduled job support

## Key Files

| File                                         | Purpose              |
| -------------------------------------------- | -------------------- |
| `src/algolia/seed-categories.ts`             | Category seeding     |
| `src/algolia/seed-youtube-accounts.ts`       | YouTube import       |
| `src/algolia/seed-twitter-accounts-batch.ts` | Twitter batch import |
| `src/redis/flushRedisCache.ts`               | Cache flush          |
