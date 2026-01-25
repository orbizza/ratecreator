# @ratecreator/db

Database package for Rate Creator. Contains Prisma ORM, Redis, Kafka, Algolia, and MongoDB clients.

## Installation

```bash
yarn add @ratecreator/db
```

## Usage

```typescript
import { prisma } from "@ratecreator/db/client";
import { redis } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { algoliaClient } from "@ratecreator/db/algolia-client";
import { kafka, getProducer, getConsumer } from "@ratecreator/db/kafka-client";
```

## Clients

### Prisma Client (`@ratecreator/db/client`)

| Export              | Description                             |
| ------------------- | --------------------------------------- |
| `prisma`            | Singleton Prisma ORM client for MongoDB |
| `getPrismaClient()` | Get Prisma client instance              |

### Redis Client (`@ratecreator/db/redis-do`)

| Export             | Description                      |
| ------------------ | -------------------------------- |
| `redis`            | Singleton Redis client (ioredis) |
| `getRedisClient()` | Get Redis client instance        |

### Kafka Client (`@ratecreator/db/kafka-client`)

| Export                 | Description                        |
| ---------------------- | ---------------------------------- |
| `kafka`                | Kafka instance with TLS support    |
| `getKafkaClient()`     | Get Kafka client                   |
| `getProducer()`        | Get Kafka producer for publishing  |
| `getConsumer(groupId)` | Get Kafka consumer for subscribing |

### Algolia Client (`@ratecreator/db/algolia-client`)

| Export                           | Description               |
| -------------------------------- | ------------------------- |
| `algoliaClient`                  | Algolia search client     |
| `getSearchClient()`              | Read-only search client   |
| `getWriteClient()`               | Write client for indexing |
| `searchAccounts(query, filters)` | Search creator accounts   |

### MongoDB Client (`@ratecreator/db/mongo-client`)

| Export             | Description               |
| ------------------ | ------------------------- |
| `getMongoClient()` | Direct MongoDB connection |

## Utilities (`@ratecreator/db/utils`)

| Utility                  | Description                          |
| ------------------------ | ------------------------------------ |
| `formatValue(number)`    | Format numbers with B, M, K suffixes |
| `toSlug(text)`           | Convert text to URL-friendly slug    |
| `fromSlug(slug)`         | Convert slug back to readable text   |
| `getCreatorData(id)`     | Fetch creator from cache or database |
| `cacheCreatorData(data)` | Store creator data in IndexedDB      |
| `clearCreatorCache()`    | Clear expired cache entries          |

## Prisma Models

| Model                | Description                       |
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

## Enums

| Enum                 | Values                                              |
| -------------------- | --------------------------------------------------- |
| `Platform`           | YouTube, Twitter, Instagram, Reddit, TikTok, Twitch |
| `UserRole`           | USER                                                |
| `ReviewStatus`       | PUBLISHED, DRAFT, DELETED                           |
| `CommentStatus`      | PUBLISHED, DELETED                                  |
| `VerificationStatus` | IN_PROGRESS, VERIFIED, REJECTED                     |
| `VoteType`           | UPVOTE, DOWNVOTE                                    |

## Environment Variables

```env
DATABASE_URL_ONLINE=mongodb+srv://...
REDIS_HOST=
REDIS_PORT=
REDIS_USERNAME=
REDIS_PASSWORD=
KAFKA_SERVICE_URI=
KAFKA_USERNAME=
KAFKA_PASSWORD=
KAFKA_CA_CERT=
ALGOLIA_APP_ID=
ALGOLIA_WRITE_API_KEY=
ALGOLIA_SEARCH_API_KEY=
```

## Commands

```bash
# Generate Prisma client
yarn prisma-generate

# View database
yarn prisma studio

# Push schema changes
yarn prisma db push
```
