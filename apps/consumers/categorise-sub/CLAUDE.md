# Categorise Sub Consumer - Project Memory

## What This Consumer Does

The `categorise-sub` consumer is a Kafka consumer that assigns subcategories (depth 1 and 2) to accounts using Gemini 2.5 Flash via Vertex AI. After root categories are assigned:

1. Consumes the `account-root-categorised` event from Kafka
2. Fetches available subcategories for assigned root categories
3. Uses Gemini 2.5 Flash to determine appropriate subcategories
4. Creates CategoryMapping entries in MongoDB
5. Produces `account-categorised` event for Algolia sync

## Architecture

- **Framework**: Hono.js (for health checks)
- **Message Queue**: Kafka
- **AI Model**: Gemini 2.5 Flash via Vertex AI
- **Cache**: Redis for category lookups
- **Package**: `@ratecreator/categorise-sub`
- **Build**: esbuild
- **Port**: 3043

### Event Flow

```
account-root-categorised → categorise-sub consumer → account-categorised
```

### Input Topic

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

### Output Topic

- **Topic**: `account-categorised`
- **Message Format**:
  ```typescript
  {
    accountId: string;
    platform: string;
    categoryIds: string[];  // All category IDs (root + sub + sub-sub)
  }
  ```

## Category Hierarchy

```
Root (depth 0)
├── Subcategory (depth 1)
│   └── Sub-subcategory (depth 2)
```

## Categorisation Logic

1. Fetch subcategories for assigned root categories
2. Include both depth 1 and depth 2 categories
3. Send account info + subcategory list to Gemini 2.5 Flash
4. AI selects 2-5 most relevant subcategories
5. Create CategoryMapping for each selected category
6. Prefer depth 2 (more specific) when applicable

## Caching Strategy

- Subcategories cached per root category for 24 hours
- Individual category slugs cached for fast lookup
- Cache key: `subcategories:{rootId}`, `category:{slug}`

## Environment Variables

```env
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
REDIS_URL=redis://...
```

## What Has Been Done

- Kafka consumer setup
- Vertex AI Gemini 2.5 Flash integration
- Redis caching for subcategories
- CategoryMapping creation
- Depth 1 and depth 2 handling
- Error handling with fallback
- Health check endpoint
- Graceful shutdown handling

## What Needs To Be Done

- [ ] Batch processing optimization
- [ ] Rate limiting for Vertex AI
- [ ] Confidence scoring
- [ ] Manual review queue
- [ ] Dead letter queue
- [ ] Metrics and monitoring
- [ ] Unit tests

## Key Files

| File           | Purpose                             |
| -------------- | ----------------------------------- |
| `src/index.ts` | Main entry, consumer and categorise |
| `package.json` | Dependencies and build config       |
