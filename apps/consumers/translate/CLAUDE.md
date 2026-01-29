# Translate Consumer - Project Memory

## What This Consumer Does

The `translate` consumer is a Kafka consumer that detects language and translates non-English content to English using Google's Vertex AI Gemini 2.5 Flash model. When account data is fetched:

1. Consumes the `account-data-fetched` event from Kafka
2. Detects the language of the content
3. If not English, translates to English using Gemini 2.5 Flash
4. Updates the account with translated fields (\*\_en)
5. Produces `account-translated` event for the categorisation pipeline

## Architecture

- **Framework**: Hono.js (for health checks)
- **Message Queue**: Kafka
- **AI Model**: Gemini 2.5 Flash via Vertex AI
- **Package**: `@ratecreator/translate`
- **Build**: esbuild
- **Port**: 3041

### Event Flow

```
account-data-fetched → translate consumer → account-translated
```

### Input Topic

- **Topic**: `account-data-fetched`
- **Message Format**:
  ```typescript
  {
    accountId: string;
    platform: string;
    name?: string;
    description?: string;
    keywords?: string;
  }
  ```

### Output Topic

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

## Translation Logic

1. **Quick English Detection**: Uses common English word frequency
2. **If English**: Skip translation, return original text
3. **If Non-English**: Call Gemini 2.5 Flash for detection + translation
4. **On Failure**: Mark `isTranslationFailed = true`

## Environment Variables

```env
GCP_PROJECT_ID=your-project-id
GCP_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
```

## Authentication

Uses Google Cloud service account authentication:

- Set `GOOGLE_APPLICATION_CREDENTIALS` environment variable
- Or use workload identity on GKE

## What Has Been Done

- Kafka consumer setup
- Vertex AI Gemini integration
- Language detection heuristics
- Translation to English
- Error handling with fallback
- Health check endpoint
- Graceful shutdown handling

## What Needs To Be Done

- [ ] Batch processing for efficiency
- [ ] Rate limiting for Vertex AI
- [ ] Better language detection
- [ ] Translation quality validation
- [ ] Dead letter queue
- [ ] Metrics and monitoring
- [ ] Unit tests

## Key Files

| File           | Purpose                            |
| -------------- | ---------------------------------- |
| `src/index.ts` | Main entry, consumer and translate |
| `package.json` | Dependencies and build config      |
