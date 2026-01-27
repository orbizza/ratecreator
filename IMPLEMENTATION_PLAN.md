# Rate Creator - Implementation Plan

> **Last Updated:** January 2026
> **Status:** Active Development

This document outlines the remaining implementation work for the Rate Creator platform. Use this as a reference when continuing development.

---

## Table of Contents

1. [Current State Assessment](#current-state-assessment)
2. [Phase 1: OAuth Platform Verification](#phase-1-oauth-platform-verification)
3. [Phase 2: TikTok API Integration](#phase-2-tiktok-api-integration)
4. [Phase 3: Analytics Dashboard](#phase-3-analytics-dashboard)
5. [Phase 4: Comment Reply System](#phase-4-comment-reply-system)
6. [Phase 5: Infrastructure Improvements](#phase-5-infrastructure-improvements)
7. [Implementation Checklist](#implementation-checklist)
8. [Quick Reference](#quick-reference)

---

## Current State Assessment

### Completed Features

| Component                    | Status             | Location                                             |
| ---------------------------- | ------------------ | ---------------------------------------------------- |
| **Database Schema**          | ✅ Complete        | `packages/db/prisma/schema.prisma`                   |
| **13 Kafka Consumers**       | ✅ Complete        | `apps/consumers/`                                    |
| **Translation System**       | ✅ Complete        | `apps/consumers/translate/`                          |
| **Categorisation (3-level)** | ✅ Complete        | `apps/consumers/categorise-root/`, `categorise-sub/` |
| **Creator Portal MVP**       | ✅ Complete        | `apps/creatorops/`                                   |
| **Weekly Data Refresh**      | ✅ Mostly Complete | `apps/consumers/*-refresh/`                          |
| **Test Suite**               | ✅ Complete        | 1125 tests across 42 files                           |

### Database Models Available

All models are implemented in `packages/db/prisma/schema.prisma`:

- `User`, `Account`, `Review`, `Comment`, `Vote`
- `Category`, `CategoryMapping` (3-level hierarchy)
- `ClaimedAccount` (for creator verification)
- `Organization`, `OrganizationMember`, `OrganizationAccount`
- `UserLinkedAccount` (multi-account support)
- `DataRefreshLog` (refresh tracking)

### Consumer Services (all running)

| Consumer              | Port | Kafka Topic                 | Purpose                              |
| --------------------- | ---- | --------------------------- | ------------------------------------ |
| data-fetch            | 3040 | `account-added`             | Fetch platform data for new accounts |
| translate             | 3041 | `account-data-fetched`      | Language detection + translation     |
| categorise-root       | 3042 | `account-translated`        | Root category assignment             |
| categorise-sub        | 3043 | `account-root-categorised`  | Subcategory assignment               |
| algolia-account-sync  | 3044 | `account-categorised`       | Algolia indexing                     |
| elastic-account-sync  | 3045 | `account-categorised`       | Elasticsearch indexing               |
| youtube-refresh       | 3050 | `data-refresh-youtube`      | Weekly YouTube refresh               |
| tiktok-refresh        | 3051 | `data-refresh-tiktok`       | Weekly TikTok refresh (partial)      |
| reddit-refresh        | 3052 | `data-refresh-reddit`       | Weekly Reddit refresh                |
| instagram-refresh     | 3053 | `data-refresh-instagram`    | Weekly Instagram refresh             |
| review-calculate      | -    | `new-review-calculate`      | Rating calculation                   |
| review-algolia-update | -    | `new-review-algolia-update` | Review search sync                   |
| user-sync             | -    | `clerk-user-events`         | User data sync                       |

---

## Phase 1: OAuth Platform Verification

**Priority:** High
**Effort:** Medium
**Goal:** Enable creators to verify account ownership via OAuth

### Overview

Currently, the claim flow creates a PENDING claim. OAuth verification is needed to transition to VERIFIED status.

### Files to Create

```
apps/creatorops/
├── app/api/auth/
│   ├── youtube/
│   │   └── callback/route.ts      # YouTube OAuth callback
│   ├── twitter/
│   │   └── callback/route.ts      # Twitter/X OAuth callback
│   ├── instagram/
│   │   └── callback/route.ts      # Instagram OAuth callback
│   ├── reddit/
│   │   └── callback/route.ts      # Reddit OAuth callback
│   └── tiktok/
│       └── callback/route.ts      # TikTok OAuth callback
├── lib/oauth/
│   ├── youtube.ts                 # YouTube OAuth helpers
│   ├── twitter.ts                 # Twitter OAuth helpers
│   ├── instagram.ts               # Instagram OAuth helpers
│   ├── reddit.ts                  # Reddit OAuth helpers
│   └── tiktok.ts                  # TikTok OAuth helpers
└── components/accounts/
    └── oauth-verify-button.tsx    # Verification UI component
```

### Implementation Pattern (YouTube Example)

```typescript
// apps/creatorops/lib/oauth/youtube.ts

const YOUTUBE_OAUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const YOUTUBE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const SCOPES = ["https://www.googleapis.com/auth/youtube.readonly"];

export function getYouTubeAuthUrl(claimId: string): string {
  const params = new URLSearchParams({
    client_id: process.env.YOUTUBE_OAUTH_CLIENT_ID!,
    redirect_uri: `${process.env.NEXT_PUBLIC_CREATOROPS_URL}/api/auth/youtube/callback`,
    response_type: "code",
    scope: SCOPES.join(" "),
    state: claimId,
    access_type: "offline",
    prompt: "consent",
  });
  return `${YOUTUBE_OAUTH_URL}?${params}`;
}

export async function exchangeCodeForTokens(code: string) {
  const response = await fetch(YOUTUBE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: process.env.YOUTUBE_OAUTH_CLIENT_ID!,
      client_secret: process.env.YOUTUBE_OAUTH_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXT_PUBLIC_CREATOROPS_URL}/api/auth/youtube/callback`,
      grant_type: "authorization_code",
    }),
  });
  return response.json();
}

export async function getAuthenticatedChannelId(
  accessToken: string,
): Promise<string> {
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=id&mine=true",
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const data = await response.json();
  return data.items?.[0]?.id;
}

export async function verifyYouTubeOwnership(code: string, claimId: string) {
  // 1. Exchange code for tokens
  const tokens = await exchangeCodeForTokens(code);

  // 2. Get authenticated user's channel ID
  const channelId = await getAuthenticatedChannelId(tokens.access_token);

  // 3. Get claim and compare with account's accountId
  const claim = await prisma.claimedAccount.findUnique({
    where: { id: claimId },
    include: { account: true },
  });

  if (!claim || claim.account.accountId !== channelId) {
    return {
      success: false,
      error: "Channel ID does not match claimed account",
    };
  }

  // 4. Update claim status to VERIFIED
  await prisma.claimedAccount.update({
    where: { id: claimId },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
      verificationMethod: "oauth",
    },
  });

  // 5. Create UserLinkedAccount entry
  await prisma.userLinkedAccount.create({
    data: {
      userId: claim.userId,
      accountId: claim.accountId,
      platform: "youtube",
      isPrimary: true,
    },
  });

  return { success: true };
}
```

### Callback Route Pattern

```typescript
// apps/creatorops/app/api/auth/youtube/callback/route.ts

import { NextRequest, NextResponse } from "next/server";
import { verifyYouTubeOwnership } from "@/lib/oauth/youtube";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const claimId = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  if (error) {
    return NextResponse.redirect(
      new URL(`/accounts/claim?error=${error}`, request.url),
    );
  }

  if (!code || !claimId) {
    return NextResponse.redirect(
      new URL("/accounts/claim?error=missing_params", request.url),
    );
  }

  const result = await verifyYouTubeOwnership(code, claimId);

  if (result.success) {
    return NextResponse.redirect(
      new URL("/accounts?verified=true", request.url),
    );
  }

  return NextResponse.redirect(
    new URL(`/accounts/claim?error=${result.error}`, request.url),
  );
}
```

### Environment Variables Required

Add these to `.env`:

```env
# YouTube OAuth (Google Cloud Console)
YOUTUBE_OAUTH_CLIENT_ID=
YOUTUBE_OAUTH_CLIENT_SECRET=

# Twitter/X OAuth 2.0 (developer.twitter.com)
X_OAUTH_CLIENT_ID=
X_OAUTH_CLIENT_SECRET=

# Instagram OAuth (Meta Business)
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=

# Reddit OAuth (reddit.com/prefs/apps)
REDDIT_OAUTH_CLIENT_ID=
REDDIT_OAUTH_CLIENT_SECRET=

# TikTok OAuth (developers.tiktok.com)
TIKTOK_OAUTH_CLIENT_ID=
TIKTOK_OAUTH_CLIENT_SECRET=

# Creator Portal URL
NEXT_PUBLIC_CREATOROPS_URL=http://localhost:3003
```

### Platform-Specific Notes

| Platform  | OAuth Docs                                                                                | User ID Endpoint                     |
| --------- | ----------------------------------------------------------------------------------------- | ------------------------------------ |
| YouTube   | [Google OAuth](https://developers.google.com/youtube/v3/guides/auth/server-side-web-apps) | `GET /youtube/v3/channels?mine=true` |
| Twitter   | [Twitter OAuth 2.0](https://developer.twitter.com/en/docs/authentication/oauth-2-0)       | `GET /2/users/me`                    |
| Instagram | [Meta Graph API](https://developers.facebook.com/docs/instagram-api/getting-started)      | `GET /me?fields=id,username`         |
| Reddit    | [Reddit OAuth](https://github.com/reddit-archive/reddit/wiki/OAuth2)                      | `GET /api/v1/me`                     |
| TikTok    | [TikTok Login Kit](https://developers.tiktok.com/doc/login-kit-web/)                      | `GET /v2/user/info/`                 |

---

## Phase 2: TikTok API Integration

**Priority:** Medium
**Effort:** Medium
**Goal:** Complete the tiktok-refresh consumer with real API calls

### Current State

The consumer at `apps/consumers/tiktok-refresh/src/index.ts` exists but returns null placeholder data.

### Files to Modify

```
apps/consumers/tiktok-refresh/src/index.ts
packages/actions/src/review/metadata/tiktok.ts  # Create if not exists
```

### Implementation Options

**Option 1: TikTok Research API** (Preferred)

- Requires business verification
- Official API with rate limits
- Most reliable data

**Option 2: Scraping Fallback**

- Use similar pattern to Instagram
- Less reliable, may break
- Implement as backup

### Code Pattern

```typescript
// apps/consumers/tiktok-refresh/src/index.ts

async function fetchTikTokProfile(
  username: string,
): Promise<TikTokData | null> {
  try {
    // Option 1: Official API
    const response = await fetch(
      `https://open.tiktokapis.com/v2/user/info/?fields=...`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TIKTOK_ACCESS_TOKEN}`,
        },
      },
    );

    if (!response.ok) {
      // Option 2: Scraping fallback
      return await scrapeTikTokProfile(username);
    }

    const data = await response.json();
    return {
      username: data.user.username,
      displayName: data.user.display_name,
      followerCount: data.user.follower_count,
      followingCount: data.user.following_count,
      videoCount: data.user.video_count,
      bio: data.user.bio_description,
      profileImage: data.user.avatar_url,
      isVerified: data.user.is_verified,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("TikTok API error:", error);
    return null;
  }
}
```

---

## Phase 3: Analytics Dashboard

**Priority:** Medium
**Effort:** High
**Goal:** Provide creators with insights about their account performance

### Files to Create

```
apps/creatorops/
├── app/(dashboard)/accounts/[accountId]/analytics/
│   └── page.tsx                   # Analytics page
└── components/analytics/
    ├── stats-cards.tsx            # Summary stats
    ├── review-chart.tsx           # Reviews over time
    ├── rating-trend.tsx           # Rating history
    └── engagement-metrics.tsx     # Platform engagement
```

### Data to Display

1. **Summary Stats**
   - Total reviews
   - Average rating
   - Rating change (last 30 days)
   - Total votes on reviews

2. **Review Chart** (Line chart)
   - Reviews per week/month
   - Filterable by date range

3. **Rating Trend** (Area chart)
   - Rating over time
   - Bayesian vs raw rating

4. **Platform Metrics** (Platform-specific)
   - Follower growth (if tracked)
   - Engagement rate changes
   - View/like trends

### Implementation

```typescript
// apps/creatorops/app/(dashboard)/accounts/[accountId]/analytics/page.tsx

import { auth } from '@clerk/nextjs/server';
import { prisma } from '@ratecreator/db';
import { StatsCards } from '@/components/analytics/stats-cards';
import { ReviewChart } from '@/components/analytics/review-chart';

export default async function AnalyticsPage({
  params
}: {
  params: { accountId: string }
}) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  // Verify ownership
  const claim = await prisma.claimedAccount.findFirst({
    where: {
      accountId: params.accountId,
      user: { clerkId: userId },
      status: 'VERIFIED'
    }
  });

  if (!claim) {
    return <div>You don't have access to this account's analytics</div>;
  }

  // Fetch analytics data
  const [account, reviews, reviewsByMonth] = await Promise.all([
    prisma.account.findUnique({ where: { id: params.accountId } }),
    prisma.review.findMany({
      where: { accountId: params.accountId },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.review.groupBy({
      by: ['createdAt'],
      where: { accountId: params.accountId },
      _count: true
    })
  ]);

  return (
    <div className="space-y-6">
      <h1>Analytics for {account?.name}</h1>
      <StatsCards
        totalReviews={reviews.length}
        avgRating={account?.rating || 0}
        totalVotes={/* calculate */}
      />
      <ReviewChart data={reviewsByMonth} />
    </div>
  );
}
```

---

## Phase 4: Comment Reply System

**Priority:** Low
**Effort:** Medium
**Goal:** Allow creators to respond to comments on their reviews

### Files to Create

```
apps/creatorops/
├── app/(dashboard)/accounts/[accountId]/comments/
│   └── page.tsx                   # Comments list
├── app/api/comments/
│   ├── route.ts                   # GET comments for account
│   └── [commentId]/
│       └── reply/route.ts         # POST reply to comment
└── components/comments/
    ├── comment-list.tsx           # List with filters
    └── reply-form.tsx             # Reply composer

packages/actions/src/creator/
├── comments.ts                    # Get comments actions
└── reply.ts                       # Reply actions
```

### Implementation

```typescript
// packages/actions/src/creator/comments.ts
"use server";

import { prisma } from "@ratecreator/db";

export async function getCommentsForAccount(
  accountId: string,
  options: {
    page?: number;
    limit?: number;
    filter?: "all" | "unanswered" | "answered";
  } = {},
) {
  const { page = 1, limit = 20, filter = "all" } = options;

  const where: any = {
    review: { accountId },
    isDeleted: false,
  };

  if (filter === "unanswered") {
    where.replies = { none: {} };
  } else if (filter === "answered") {
    where.replies = { some: {} };
  }

  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where,
      include: {
        user: { select: { firstName: true, lastName: true, imageUrl: true } },
        replies: { take: 1 },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.comment.count({ where }),
  ]);

  return { comments, total, page, totalPages: Math.ceil(total / limit) };
}

export async function replyToComment(
  commentId: string,
  reply: string,
  userId: string,
) {
  return prisma.comment.create({
    data: {
      content: reply,
      parentId: commentId,
      userId,
      review: {
        connect: {
          id: (await prisma.comment.findUnique({ where: { id: commentId } }))!
            .reviewId,
        },
      },
    },
  });
}
```

---

## Phase 5: Infrastructure Improvements

**Priority:** Low
**Effort:** Medium

### 5.1 Dead Letter Queues

Add DLQ handling to all 13 consumers:

```typescript
// Shared pattern for all consumers

const DLQ_TOPIC = `${TOPIC_NAME}-dlq`;

async function handleMessageError(
  message: KafkaMessage,
  error: Error,
  producer: Producer,
) {
  const retryCount = parseInt(message.headers?.retryCount?.toString() || "0");

  if (retryCount < 3) {
    // Retry with exponential backoff
    await new Promise((resolve) =>
      setTimeout(resolve, Math.pow(2, retryCount) * 1000),
    );
    // Re-queue to original topic
    await producer.send({
      topic: TOPIC_NAME,
      messages: [
        {
          key: message.key,
          value: message.value,
          headers: { retryCount: (retryCount + 1).toString() },
        },
      ],
    });
  } else {
    // Send to DLQ after max retries
    await producer.send({
      topic: DLQ_TOPIC,
      messages: [
        {
          key: message.key,
          value: JSON.stringify({
            originalMessage: message.value?.toString(),
            error: error.message,
            stack: error.stack,
            timestamp: new Date().toISOString(),
            retryCount,
          }),
        },
      ],
    });
  }
}
```

### 5.2 Prometheus Metrics

Add to each consumer:

```typescript
import { Registry, Counter, Histogram } from "prom-client";

const register = new Registry();

const messagesProcessed = new Counter({
  name: "consumer_messages_processed_total",
  help: "Total messages processed",
  labelNames: ["status"],
  registers: [register],
});

const processingDuration = new Histogram({
  name: "consumer_processing_duration_seconds",
  help: "Message processing duration",
  registers: [register],
});

// Add endpoint
app.get("/metrics", async (c) => {
  return c.text(await register.metrics());
});

// Use in message handler
await consumer.run({
  eachMessage: async ({ message }) => {
    const timer = processingDuration.startTimer();
    try {
      // Process message
      messagesProcessed.inc({ status: "success" });
    } catch (error) {
      messagesProcessed.inc({ status: "error" });
      throw error;
    } finally {
      timer();
    }
  },
});
```

---

## Implementation Checklist

### Phase 1: OAuth Verification

- [ ] Set up OAuth credentials for all platforms
- [ ] Create `apps/creatorops/lib/oauth/youtube.ts`
- [ ] Create `apps/creatorops/lib/oauth/twitter.ts`
- [ ] Create `apps/creatorops/lib/oauth/instagram.ts`
- [ ] Create `apps/creatorops/lib/oauth/reddit.ts`
- [ ] Create `apps/creatorops/lib/oauth/tiktok.ts`
- [ ] Create YouTube callback route
- [ ] Create Twitter callback route
- [ ] Create Instagram callback route
- [ ] Create Reddit callback route
- [ ] Create TikTok callback route
- [ ] Create `oauth-verify-button.tsx` component
- [ ] Update verify page to use OAuth buttons
- [ ] Test all verification flows

### Phase 2: TikTok API

- [ ] Research TikTok API access requirements
- [ ] Apply for TikTok Research API (if needed)
- [ ] Implement `fetchTikTokProfile()` in tiktok-refresh
- [ ] Test with real TikTok accounts
- [ ] Add scraping fallback

### Phase 3: Analytics Dashboard

- [ ] Create analytics page layout
- [ ] Build `stats-cards.tsx` component
- [ ] Build `review-chart.tsx` with Recharts
- [ ] Build `rating-trend.tsx` component
- [ ] Add date range filtering
- [ ] Test with accounts that have reviews

### Phase 4: Comment Reply System

- [ ] Create comments list page
- [ ] Build `comment-list.tsx` component
- [ ] Build `reply-form.tsx` component
- [ ] Create GET comments API route
- [ ] Create POST reply API route
- [ ] Create server actions
- [ ] Test reply functionality

### Phase 5: Infrastructure

- [ ] Add DLQ handling to all consumers
- [ ] Create DLQ topics in Kafka
- [ ] Add Prometheus metrics to consumers
- [ ] Set up Grafana dashboard
- [ ] Create alerting rules

---

## Quick Reference

### Development Commands

```bash
# Start all apps
yarn dev

# Start specific app
yarn workspace @ratecreator/creatorops dev  # Port 3003
yarn workspace @ratecreator/web dev          # Port 3000

# Start consumers
yarn workspace @ratecreator/data-fetch dev
yarn workspace @ratecreator/translate dev
yarn workspace @ratecreator/categorise-root dev
yarn workspace @ratecreator/categorise-sub dev

# Run tests
yarn test

# Build all
yarn build

# Generate Prisma client
yarn prisma-generate
```

### Key Directories

```
apps/creatorops/          # Creator Portal (this plan's focus)
apps/web/                 # Main review platform
apps/consumers/           # Kafka consumers
packages/db/              # Prisma schema & clients
packages/actions/         # Server actions
packages/ui/              # Shared UI components
```

### Useful Resources

- [Clerk Docs](https://clerk.com/docs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Kafka.js Docs](https://kafka.js.org/)
- [Prisma Docs](https://www.prisma.io/docs)
- [Vertex AI / Gemini](https://cloud.google.com/vertex-ai/docs)

---

## Notes

- All consumers use Hono.js framework with health checks
- Translation uses Gemini 2.5 Flash via Vertex AI
- Root categorization uses Gemini 2.5 Pro via Vertex AI
- Subcategorization uses Gemini 2.5 Flash via Vertex AI
- Rate limiting implemented with Redis counters
- All database operations use soft deletes
