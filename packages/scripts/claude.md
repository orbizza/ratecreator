# Scripts Package - Project Memory

## What This Package Does

The `scripts` package contains database seeding, data import, and utility scripts:

- Algolia index seeding
- Elasticsearch migration and seeding
- Account data import (YouTube, Twitter)
- Redis cache management
- Data migration utilities

## Architecture

- **Package**: `@ratecreator/scripts`
- **Runtime**: Node.js with tsx

### Available Commands

```bash
# Algolia Seeding
yarn seed-category                    # Seed categories to Algolia
yarn seed-account-youtube             # Seed YouTube accounts
yarn seed-account-youtube-batch       # Batch seed YouTube accounts
yarn seed-account-twitter-batch       # Batch seed Twitter accounts
yarn update-account-youtube           # Update YouTube account data

# Elasticsearch Migration
yarn migrate-accounts-elastic         # Migrate all accounts from MongoDB to Elasticsearch
yarn migrate-accounts-elastic:youtube # Migrate YouTube accounts only
yarn migrate-accounts-elastic:twitter # Migrate Twitter/X accounts only
yarn migrate-accounts-elastic:tiktok  # Migrate TikTok accounts only
yarn migrate-accounts-elastic:reddit  # Migrate Reddit accounts only
yarn migrate-accounts-elastic:instagram # Migrate Instagram accounts only
yarn migrate-categories-elastic       # Migrate categories from MongoDB to Elasticsearch
yarn migrate-from-algolia             # Migrate accounts from Algolia to Elasticsearch
yarn migrate-from-algolia:accounts    # Migrate accounts index from Algolia
yarn migrate-from-algolia:categories  # Migrate categories index from Algolia
yarn validate-elastic-migration       # Validate migration was successful

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
├── elasticsearch/
│   ├── migrate-accounts-batch.ts       # Batch migrate accounts from MongoDB
│   ├── migrate-categories.ts           # Migrate categories from MongoDB
│   ├── migrate-from-algolia.ts         # Export Algolia → Import Elasticsearch
│   └── validate-migration.ts           # Validation and comparison script
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

### Elasticsearch Migration

- Batch migration from MongoDB to Elasticsearch
- Platform-specific migration (YouTube, Twitter, TikTok, Reddit, Instagram)
- Category migration with hierarchy preservation
- Algolia to Elasticsearch data transfer
- Migration validation and comparison script
- Checkpoint-based resumable migrations
- Error tracking and reporting

### Redis Utilities

- Cache flush script
- Key pattern deletion

## Restrictions

### Environment Variables

```env
# Algolia
ALGOLIA_APP_ID=...
ALGOLIA_WRITE_API_KEY=...

# Elasticsearch (Elastic Cloud)
ELASTIC_CLOUD_ID=...
ELASTIC_API_KEY=...
ELASTIC_ACCOUNTS_INDEX=accounts
ELASTIC_CATEGORIES_INDEX=categories

# Database
DATABASE_URL_ONLINE=...

# Redis
REDIS_HOST=...
REDIS_PASSWORD=...
```

### Data Sources

- MongoDB for primary account data
- Algolia for existing indexed data (optional)
- YouTube API for account data
- Twitter API for account data

### Execution

- Run scripts locally or in CI/CD
- Use proper environment configuration
- Monitor for rate limits
- Check checkpoint files for resumable migrations

## Migration Features

### Checkpoint System

All batch migration scripts use checkpoints for resumability:

```json
{
  "lastProcessedId": "507f1f77bcf86cd799439011",
  "totalProcessed": 150000,
  "totalIndexed": 149850,
  "errors": [...],
  "startedAt": "2024-01-15T10:00:00Z",
  "lastUpdatedAt": "2024-01-15T12:30:00Z"
}
```

To resume a failed migration, simply run the command again.

### Batch Processing

- **MongoDB Query Batch**: 5,000 accounts per query
- **Elasticsearch Bulk**: 500 documents per bulk request
- Automatic index creation with proper mappings
- Category caching for performance

## What Needs To Be Done

- [x] Elasticsearch migration scripts
- [x] Migration validation script
- [ ] Data validation scripts
- [ ] Database backup/restore scripts
- [ ] Index rebuild scripts
- [ ] Cleanup scripts (orphaned data)
- [ ] Statistics/reporting scripts
- [ ] Scheduled job support

## Key Files

| File                                          | Purpose                         |
| --------------------------------------------- | ------------------------------- |
| `src/algolia/seed-categories.ts`              | Category seeding to Algolia     |
| `src/algolia/seed-youtube-accounts-batch.ts`  | YouTube batch import to Algolia |
| `src/algolia/seed-twitter-accounts-batch.ts`  | Twitter batch import to Algolia |
| `src/elasticsearch/migrate-accounts-batch.ts` | Batch migrate to Elasticsearch  |
| `src/elasticsearch/migrate-categories.ts`     | Categories to Elasticsearch     |
| `src/elasticsearch/migrate-from-algolia.ts`   | Algolia → Elasticsearch         |
| `src/elasticsearch/validate-migration.ts`     | Validate migration success      |
| `src/redis/flushRedisCache.ts`                | Cache flush                     |
