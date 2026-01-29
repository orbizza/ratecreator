# Instagram Refresh Consumer - Project Memory

## What This Consumer Does

The `instagram-refresh` consumer is a Kafka consumer that refreshes Instagram profile data on a weekly basis. When scheduled:

1. Consumes the `data-refresh-instagram` event from Kafka
2. Fetches fresh data from Instagram Graph API (or scrapes public data as fallback)
3. Updates the account with new data
4. Updates Redis cache if exists
5. Creates DataRefreshLog entry for tracking

## Architecture

- **Framework**: Hono.js (for health checks)
- **Message Queue**: Kafka
- **API**: Instagram Graph API / Web scraping
- **Package**: `@ratecreator/instagram-refresh`
- **Build**: esbuild
- **Port**: 3053

### Event Flow

```
Cron Scheduler → data-refresh-instagram → instagram-refresh consumer → MongoDB + Redis
```

### Input Topic

- **Topic**: `data-refresh-instagram`
- **Message Format**:
  ```typescript
  {
    accountId: string;
    platform: string;
    scheduledAt: string;
  }
  ```

## Rate Limiting

Instagram API has stricter rate limits:

- Business Discovery API depends on app tier
- Safe limit: ~200 calls/hour
- Uses Redis counter with 1-hour window
- Falls back to web scraping if API unavailable

## Data Updated

- `instagramData` - Full profile data
- `followerCount` - Follower count
- `name` - Profile name
- `description` - Biography
- `imageUrl` - Profile picture
- `lastDataRefresh` - Timestamp

## Environment Variables

```env
INSTAGRAM_ACCESS_TOKEN=your-access-token
INSTAGRAM_BUSINESS_ACCOUNT_ID=your-business-account-id
REDIS_URL=redis://...
```

## Data Fetching Strategy

1. **Primary**: Instagram Graph API via Business Discovery
   - Requires app access token and business account ID
   - More reliable but requires Meta app approval

2. **Fallback**: Web scraping
   - Parses public profile page meta tags
   - Extracts follower counts from description
   - Less reliable but works without API access

## What Has Been Done

- Kafka consumer setup
- Instagram Graph API integration
- Web scraping fallback
- Rate limiting with Redis
- DataRefreshLog tracking
- Redis cache updates
- Health check endpoint
- Graceful shutdown handling

## What Needs To Be Done

- [ ] Instagram media fetching
- [ ] Instagram insights integration
- [ ] Better error handling for API errors
- [ ] Exponential backoff on rate limits
- [ ] Dead letter queue
- [ ] Metrics and monitoring
- [ ] Unit tests

## Key Files

| File           | Purpose                        |
| -------------- | ------------------------------ |
| `src/index.ts` | Main entry, consumer and fetch |
| `package.json` | Dependencies and build config  |
