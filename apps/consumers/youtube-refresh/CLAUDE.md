# YouTube Refresh Consumer - Project Memory

## What This Consumer Does

The `youtube-refresh` consumer is a Kafka consumer that refreshes YouTube channel data on a weekly basis. When scheduled:

1. Consumes the `data-refresh-youtube` event from Kafka
2. Fetches fresh data from YouTube Data API
3. Updates the account with new data
4. Updates Redis cache if exists
5. Creates DataRefreshLog entry for tracking

## Architecture

- **Framework**: Hono.js (for health checks)
- **Message Queue**: Kafka
- **API**: YouTube Data API v3
- **Package**: `@ratecreator/youtube-refresh`
- **Build**: esbuild
- **Port**: 3050

### Event Flow

```
Cron Scheduler → data-refresh-youtube → youtube-refresh consumer → MongoDB + Redis
```

### Input Topic

- **Topic**: `data-refresh-youtube`
- **Message Format**:
  ```typescript
  {
    accountId: string;
    platform: string;
    scheduledAt: string;
  }
  ```

## Rate Limiting

YouTube Data API has a quota of 10,000 units/day:

- channels.list call costs ~3 units
- Safe limit: ~3,000 calls/day = 125 calls/hour
- Uses Redis counter with 1-hour window
- Skips refresh if rate limit reached

## Data Updated

- `ytData` - Full YouTube API response
- `followerCount` - Subscriber count
- `name` - Channel title
- `description` - Channel description
- `imageUrl` - Profile picture
- `bannerUrl` - Banner image
- `country` - Channel country
- `lastDataRefresh` - Timestamp

## Environment Variables

```env
YOUTUBE_API_KEY=your-api-key
REDIS_URL=redis://...
```

## What Has Been Done

- Kafka consumer setup
- YouTube Data API integration
- Rate limiting with Redis
- DataRefreshLog tracking
- Redis cache updates
- Health check endpoint
- Graceful shutdown handling

## What Needs To Be Done

- [ ] Batch processing for efficiency
- [ ] Better error handling for specific API errors
- [ ] Exponential backoff on rate limits
- [ ] Dead letter queue
- [ ] Metrics and monitoring
- [ ] Unit tests

## Key Files

| File           | Purpose                        |
| -------------- | ------------------------------ |
| `src/index.ts` | Main entry, consumer and fetch |
| `package.json` | Dependencies and build config  |
