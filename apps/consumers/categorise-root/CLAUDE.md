# Categorise Root Consumer - Project Memory

## What This Consumer Does

The `categorise-root` consumer is a Kafka consumer that assigns root-level categories to accounts using Gemini 2.5 Pro via Vertex AI. When account translation is complete:

1. Consumes the `account-translated` event from Kafka
2. Fetches available root categories from cache/database
3. Uses Gemini 2.5 Pro to determine appropriate categories
4. Creates CategoryMapping entries in MongoDB
5. Produces `account-root-categorised` event for subcategory assignment

## Architecture

- **Framework**: Hono.js (for health checks)
- **Message Queue**: Kafka
- **AI Model**: Gemini 2.5 Pro via Vertex AI
- **Cache**: Redis for category lookups
- **Package**: `@ratecreator/categorise-root`
- **Build**: esbuild
- **Port**: 3042

### Event Flow

```
account-translated → categorise-root consumer → account-root-categorised
```

### Input Topic

- **Topic**: `account-translated`
- **Message Format**:
  ```typescript
  {
    accountId: string;
    platform: string;
    name_en: string;
    description_en: string;
    keywords_en: string;
    language_code: string;
  }
  ```

### Output Topic

- **Topic**: `account-root-categorised`
- **Message Format**:
  ```typescript
  {
    accountId: string;
    platform: string;
    name_en: string;
    description_en: string;
    keywords_en: string;
    rootCategorySlugs: string[];
    rootCategoryIds: string[];
  }
  ```

## Categorisation Logic

1. Fetch root categories (depth=0) from cache or database
2. Send account info + category list to Gemini 2.5 Pro
3. AI selects 1-3 most relevant categories
4. Create CategoryMapping for each selected category
5. Mark account as `isSeeded = true`

## Caching Strategy

- Root categories cached in Redis for 24 hours
- Individual category slugs cached for fast lookup
- Cache key: `root_categories`, `category:{slug}`

## Environment Variables

```env
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
REDIS_URL=redis://...
```

## What Has Been Done

- Kafka consumer setup
- Vertex AI Gemini 2.5 Pro integration
- Redis caching for categories
- CategoryMapping creation
- Error handling with fallback
- Health check endpoint
- Graceful shutdown handling

## What Needs To Be Done

- [ ] Batch processing (70 accounts per API call)
- [ ] Rate limiting for Vertex AI
- [ ] Category confidence scoring
- [ ] Manual review queue for low-confidence
- [ ] Dead letter queue
- [ ] Metrics and monitoring
- [ ] Unit tests

## Key Files

| File           | Purpose                             |
| -------------- | ----------------------------------- |
| `src/index.ts` | Main entry, consumer and categorise |
| `package.json` | Dependencies and build config       |
