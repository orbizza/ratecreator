# Data Fetch Consumer - Project Memory

## What This Consumer Does

The `data-fetch` consumer is a Kafka consumer that fetches platform data when new accounts are added to the system. When an account is added:

1. Consumes the `account-added` event from Kafka
2. Fetches profile data from the respective platform API
3. Updates the account record in MongoDB
4. Creates a DataRefreshLog entry for tracking
5. Produces `account-data-fetched` event for the translation pipeline

## Architecture

- **Framework**: Hono.js (for health checks)
- **Message Queue**: Kafka
- **Package**: `@ratecreator/data-fetch`
- **Build**: esbuild
- **Port**: 3040

### Event Flow

```
account-added → data-fetch consumer → account-data-fetched
```

### Input Topic

- **Topic**: `account-added`
- **Message Format**:
  ```typescript
  {
    accountId: string; // MongoDB ObjectId
    platform: string; // YOUTUBE, TWITTER, REDDIT, etc.
    platformAccountId: string; // Platform-specific ID/username
  }
  ```

### Output Topic

- **Topic**: `account-data-fetched`
- **Message Format**:
  ```typescript
  {
    accountId: string;
    platform: string;
    name: string;
    description: string;
    keywords: string;
  }
  ```

## Supported Platforms

| Platform  | API              | Status      |
| --------- | ---------------- | ----------- |
| YouTube   | YouTube Data API | Implemented |
| Reddit    | Reddit API       | Implemented |
| Twitter/X | Twitter API v2   | Implemented |
| TikTok    | TikTok API       | Pending     |
| Instagram | Instagram Graph  | Implemented |
| Twitch    | Twitch API       | Pending     |

## Environment Variables

```env
YOUTUBE_API_KEY=
TWITTER_BEARER_TOKEN=
TIKTOK_API_KEY=
INSTAGRAM_ACCESS_TOKEN=
TWITCH_CLIENT_ID=
TWITCH_CLIENT_SECRET=
```

## What Has Been Done

- Kafka consumer setup
- YouTube channel data fetching
- Reddit profile data fetching
- Twitter profile data fetching
- DataRefreshLog tracking
- Health check endpoint
- Graceful shutdown handling

## What Needs To Be Done

- [ ] TikTok API integration
- [x] Instagram Graph API integration
- [ ] Twitch API integration
- [ ] Rate limiting per platform
- [ ] Retry logic for failed API calls
- [ ] Dead letter queue
- [ ] Metrics and monitoring
- [ ] Unit tests

## Key Files

| File           | Purpose                        |
| -------------- | ------------------------------ |
| `src/index.ts` | Main entry, consumer and fetch |
| `package.json` | Dependencies and build config  |
