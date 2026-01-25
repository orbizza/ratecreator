# @ratecreator/scripts

Database seeding, data import, and utility scripts for Rate Creator.

## Available Commands

| Command | Description |
|---------|-------------|
| `yarn seed-category` | Seed categories to Algolia |
| `yarn seed-account-youtube` | Seed YouTube accounts |
| `yarn seed-account-youtube-batch` | Batch seed YouTube accounts |
| `yarn seed-account-twitter-batch` | Batch seed Twitter accounts |
| `yarn update-account-youtube` | Update YouTube account data |
| `yarn flush-redis-cache` | Clear Redis cache |

## Scripts

### Algolia Seeding (`src/algolia/`)

| Script | Description |
|--------|-------------|
| `seed-categories.ts` | Seed category hierarchy to Algolia |
| `seed-youtube-accounts.ts` | Import YouTube creator accounts |
| `seed-youtube-accounts-batch.ts` | Batch import with concurrency limiting |
| `seed-twitter-accounts-batch.ts` | Batch import Twitter accounts |
| `update-youtube-accounts.ts` | Update existing YouTube account data |

### Redis Utilities (`src/redis/`)

| Script | Description |
|--------|-------------|
| `flushRedisCache.ts` | Clear all Redis cache (FLUSHALL) |

## Functions

### Category Seeding
| Function | Description |
|----------|-------------|
| `seedCategories()` | Main entry to seed all categories |
| `buildCategoryHierarchy(categories)` | Build parent-child relationships |
| `mapCategoryToAlgolia(category)` | Transform to Algolia format |

### Account Seeding
| Function | Description |
|----------|-------------|
| `seedYouTubeAccounts(channels)` | Seed YouTube channels to Algolia |
| `batchSeed(accounts, concurrency)` | Batch process with rate limiting |
| `updateAccountData(accountId)` | Refresh account data from API |

### Cache Management
| Function | Description |
|----------|-------------|
| `flushRedisCache()` | Clear all Redis keys |
| `flushPattern(pattern)` | Clear keys matching pattern |

## Environment Variables

```env
ALGOLIA_APP_ID=
ALGOLIA_WRITE_API_KEY=
DATABASE_URL_ONLINE=
REDIS_HOST=
REDIS_PASSWORD=
YOUTUBE_API_KEY=
TWITTER_BEARER_TOKEN=
```

## Usage

```bash
# Run a specific script
yarn seed-category

# Run with environment
NODE_ENV=production yarn seed-account-youtube-batch
```
