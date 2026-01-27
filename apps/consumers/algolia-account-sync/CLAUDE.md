# Algolia Account Sync Consumer - Project Memory

## What This Consumer Does

The `algolia-account-sync` consumer is a Kafka consumer that syncs account data with categories to the Algolia search index. After categorisation is complete:

1. Consumes the `account-categorised` event from Kafka
2. Fetches full account data from MongoDB
3. Retrieves category mappings and names
4. Indexes the complete record to Algolia
5. Updates `lastIndexedAt` in MongoDB

## Architecture

- **Framework**: Hono.js (for health checks)
- **Message Queue**: Kafka
- **Search**: Algolia
- **Package**: `@ratecreator/algolia-account-sync`
- **Build**: esbuild
- **Port**: 3044

### Event Flow

```
account-categorised → algolia-account-sync consumer → Algolia Index
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

## Algolia Record Structure

```typescript
{
  objectID: string;          // Platform account ID (for Algolia lookup)
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
  categories: string[];      // Category slugs for filtering
  categoryNames: string[];   // Category names for display
  isSeeded: boolean;
  lastIndexedAt: string;
}
```

## Indexing Logic

1. Fetch account from MongoDB by ID
2. Fetch CategoryMappings for the account
3. Fetch Category records for names and slugs
4. Build Algolia record with all data
5. Save to Algolia with retry logic
6. Update lastIndexedAt in MongoDB

## Retry Strategy

- 3 retry attempts
- Exponential backoff: 1s, 2s, 4s
- Logs failures but doesn't block consumer

## Environment Variables

```env
ALGOLIA_APP_ID=your-app-id
ALGOLIA_WRITE_API_KEY=your-write-api-key
ALGOLIA_ACCOUNT_INDEX=accounts
```

## What Has Been Done

- Kafka consumer setup
- Algolia client initialization
- Full record building with categories
- Retry logic with exponential backoff
- lastIndexedAt tracking
- Health check endpoint
- Graceful shutdown handling

## What Needs To Be Done

- [ ] Batch indexing for efficiency
- [ ] Partial updates when appropriate
- [ ] Dead letter queue
- [ ] Index settings management
- [ ] Replica indices handling
- [ ] Metrics and monitoring
- [ ] Unit tests

## Key Files

| File           | Purpose                        |
| -------------- | ------------------------------ |
| `src/index.ts` | Main entry, consumer and index |
| `package.json` | Dependencies and build config  |
