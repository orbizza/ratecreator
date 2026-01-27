# Database Package - Project Memory

## What This Package Does

The `db` package provides database access and client management for Rate Creator:

- Prisma ORM for MongoDB
- Redis client for caching
- Kafka client for messaging
- Algolia client for search (legacy, being migrated)
- Elasticsearch client for search (Elastic Cloud on GCP)
- MongoDB native client for direct queries

## Architecture

- **Package**: `@ratecreator/db`
- **ORM**: Prisma 5.13.0
- **Database**: MongoDB

### Exports

```typescript
import { prisma } from "@ratecreator/db/client";
import { redis } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { algoliaClient } from "@ratecreator/db/algolia-client";
import {
  getElasticsearchClient,
  searchAccounts,
  indexAccount,
  bulkIndexAccounts,
  updateAccount,
  deleteAccount,
  createIndices,
  checkHealth,
} from "@ratecreator/db/elasticsearch-client";
import { kafka } from "@ratecreator/db/kafka-client";
```

## What Has Been Done

### Prisma Schema Models

| Model                | Purpose                           |
| -------------------- | --------------------------------- |
| `User`               | Platform users (from Clerk)       |
| `Account`            | Creator profiles across platforms |
| `Review`             | Star ratings and written reviews  |
| `Comment`            | Threaded discussions              |
| `Vote`               | Review upvotes/downvotes          |
| `CommentVote`        | Comment upvotes/downvotes         |
| `Category`           | Hierarchical categorization       |
| `CategoryMapping`    | Account-to-category links         |
| `SaveToMyList`       | User favorites                    |
| `Newsletter`         | Newsletter definitions            |
| `NewsletterAudience` | Newsletter subscribers            |
| `YouTubeVideo`       | Cached video data                 |

### Enums

- `Platform`: YouTube, Twitter, Instagram, Reddit, TikTok, Twitch
- `UserRole`: USER (default)
- `ReviewStatus`: PUBLISHED, DRAFT, DELETED
- `CommentStatus`: PUBLISHED, DELETED
- `VerificationStatus`: IN_PROGRESS, VERIFIED, REJECTED
- `VoteType`: UPVOTE, DOWNVOTE

### Clients

- **Prisma Client**: ORM with type-safe queries
- **Redis Client**: ioredis for Digital Ocean Redis
- **Kafka Client**: kafkajs with TLS support
- **Algolia Client**: Search and indexing (legacy)
- **Elasticsearch Client**: Elastic Cloud on GCP (replacing Algolia)
- **MongoDB Client**: Direct connection wrapper

## Restrictions

### Prisma Patterns

```typescript
// Always use soft deletes
await prisma.user.update({
  where: { id },
  data: { isDeleted: true, deletedAt: new Date() },
});

// Never use deleteMany with hard delete
// await prisma.user.deleteMany() // WRONG
```

### Environment Variables

```
DATABASE_URL_ONLINE=mongodb+srv://...
REDIS_HOST=...
REDIS_PORT=...
REDIS_USERNAME=...
REDIS_PASSWORD=...
KAFKA_SERVICE_URI=...
ALGOLIA_APP_ID=...
ALGOLIA_WRITE_API_KEY=...
# Elasticsearch (Elastic Cloud on GCP)
ELASTIC_CLOUD_ID=...
ELASTIC_API_KEY=...
ELASTIC_ACCOUNTS_INDEX=accounts
ELASTIC_CATEGORIES_INDEX=categories
```

### Connection Management

- Prisma client is singleton (reused across requests)
- Redis connections are pooled
- Kafka uses persistent connections
- Always handle connection errors

## What Needs To Be Done

- [ ] Connection retry logic
- [ ] Query optimization
- [ ] Database migrations documentation
- [ ] Index optimization audit
- [ ] Read replica support
- [ ] Connection pooling tuning
- [ ] Unit tests for utilities

## Key Files

| File                                  | Purpose                              |
| ------------------------------------- | ------------------------------------ |
| `prisma/schema.prisma`                | Database schema                      |
| `src/clients/index.ts`                | Prisma client export                 |
| `src/clients/redis-do.ts`             | Redis client                         |
| `src/clients/kafka-client.ts`         | Kafka producer/consumer              |
| `src/clients/algolia-client.ts`       | Algolia client (legacy)              |
| `src/clients/elasticsearch-client.ts` | Elasticsearch client (Elastic Cloud) |
| `src/clients/mongo-client-wrapper.ts` | MongoDB native client                |
