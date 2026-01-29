# Elastic Account Sync Consumer - Project Memory

## What This Consumer Does

The `elastic-account-sync` consumer is a Kafka consumer that syncs account data with categories to Elasticsearch (Elastic Cloud on GCP). This is a drop-in replacement for the Algolia sync consumer, providing the same functionality with Elasticsearch.

After categorisation is complete:

1. Consumes the `account-categorised` event from Kafka
2. Fetches full account data from MongoDB
3. Retrieves category mappings and names
4. Indexes the complete record to Elasticsearch
5. Updates `lastIndexedAt` in MongoDB

## Architecture

- **Framework**: Hono.js (for health checks)
- **Message Queue**: Kafka
- **Search**: Elasticsearch (Elastic Cloud on GCP)
- **Package**: `@ratecreator/elastic-account-sync`
- **Build**: esbuild
- **Port**: 3045

### Event Flow

```
account-categorised → elastic-account-sync consumer → Elasticsearch Index
```

### Input Topic

- **Topic**: `account-categorised`
- **Message Format**:
  ```typescript
  {
    accountId: string;
    platform: string;
    categoryIds: string[];
  }
  ```

## Elasticsearch Record Structure

```typescript
{
  objectID: string;          // Platform account ID (document ID)
  platform: string;
  accountId: string;
  handle?: string;
  name?: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  keywords?: string;
  keywords_en?: string;
  imageUrl?: string;
  bannerUrl?: string;
  followerCount?: number;
  country?: string;
  language_code?: string;
  rating?: number;
  reviewCount?: number;
  madeForKids?: boolean;
  claimed?: boolean;
  videoCount?: number;
  viewCount?: number;
  categories: string[];      // Category slugs for filtering
  categoryNames: string[];   // Category names for display
  createdDate?: string;
  isSeeded: boolean;
  lastIndexedAt: string;
}
```

## Index Mapping

The consumer creates the index with the following features:

- **Autocomplete analyzer**: Edge n-gram for instant search on name/handle
- **Keyword fields**: Platform, country, language_code, categories for faceted filtering
- **Numeric fields**: followerCount (long), rating (float), reviewCount (integer)
- **Boolean fields**: madeForKids, claimed, isSeeded

## Indexing Logic

1. Create index with mappings if not exists
2. Fetch account from MongoDB by ID
3. Fetch CategoryMappings for the account
4. Fetch Category records for names and slugs
5. Build Elasticsearch record with all data
6. Index to Elasticsearch with retry logic
7. Update lastIndexedAt in MongoDB

## Retry Strategy

- 3 retry attempts
- Exponential backoff: 1s, 2s, 4s
- Logs failures but doesn't block consumer

## Environment Variables

```env
# Elastic Cloud credentials
ELASTIC_CLOUD_ID=ratecreator-search:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvJGFiY2RlZjEyMzQ1Njc4OTAkYWJjZGVmMTIzNDU2Nzg5MA==
ELASTIC_API_KEY=your-api-key-here

# Or username/password auth
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your-password

# Index name
ELASTIC_ACCOUNTS_INDEX=accounts
```

## Comparison with Algolia Consumer

| Feature        | Algolia             | Elasticsearch       |
| -------------- | ------------------- | ------------------- |
| Port           | 3044                | 3045                |
| Topic          | account-categorised | account-categorised |
| Index creation | Manual/console      | Auto on startup     |
| Cost           | ~$300/month         | ~$95/month          |
| Facets         | Built-in            | Aggregations        |

## What Has Been Done

- Kafka consumer setup
- Elasticsearch client initialization
- Auto index creation with mappings
- Full record building with categories
- Retry logic with exponential backoff
- lastIndexedAt tracking
- Health check endpoint
- Graceful shutdown handling

## What Needs To Be Done

- [ ] Bulk indexing for efficiency (batch multiple accounts)
- [ ] Partial updates for rating/review count changes
- [ ] Dead letter queue for failed indexing
- [ ] Feature flag for dual-write (Algolia + Elasticsearch)
- [ ] Migration script to backfill existing accounts
- [ ] Index alias management for zero-downtime reindexing
- [ ] Metrics and monitoring
- [ ] Unit tests

## Key Files

| File           | Purpose                        |
| -------------- | ------------------------------ |
| `src/index.ts` | Main entry, consumer and index |
| `package.json` | Dependencies and build config  |

## Migration Notes

During migration from Algolia:

1. Run both consumers in parallel (dual-write)
2. Use feature flag `USE_ELASTICSEARCH=true` in web app to switch reads
3. Monitor search quality metrics
4. After 2 weeks, decommission Algolia consumer
