# Rate Creator — Production Deployment Guide

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         Vercel (Frontend)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────────────┐    │
│  │  apps/web     │  │ apps/content │  │ apps/creatorops    │    │
│  │  Main site    │  │  CMS admin   │  │  Creator portal    │    │
│  │  :3000        │  │  :3002       │  │  :3003             │    │
│  └──────┬───────┘  └──────┬───────┘  └────────┬───────────┘    │
└─────────┼─────────────────┼───────────────────┼────────────────┘
          │                 │                   │
┌─────────▼─────────────────▼───────────────────▼────────────────┐
│                    GCP Cloud Run (Backend)                      │
│  ┌──────────────────────────────────────────────┐              │
│  │  apps/workers (unified Hono service, :8080)   │              │
│  │  ├── /jobs/user-sync                          │              │
│  │  ├── /jobs/review-calculate                   │              │
│  │  ├── /jobs/review-elastic-update              │              │
│  │  ├── /jobs/youtube-refresh                    │              │
│  │  ├── /jobs/instagram-refresh                  │              │
│  │  ├── /jobs/reddit-refresh                     │              │
│  │  ├── /jobs/tiktok-refresh                     │              │
│  │  ├── /jobs/refresh-scheduler                  │              │
│  │  ├── /jobs/elastic-account-sync               │              │
│  │  ├── /jobs/translate                          │              │
│  │  ├── /jobs/categorise-root                    │              │
│  │  ├── /jobs/categorise-sub                     │              │
│  │  ├── /jobs/data-fetch                         │              │
│  │  └── /webhook/clerk (Svix-verified)           │              │
│  └──────┬───────────────────────────────────────┘              │
└─────────┼──────────────────────────────────────────────────────┘
          │
┌─────────▼──────────────────────────────────────────────────────┐
│                    Shared Infrastructure                        │
│  MongoDB (DO)  ·  Redis (DO)  ·  Elasticsearch (GCP)           │
│  GCP Pub/Sub   ·  GCP Storage ·  Vertex AI (Gemini)            │
│  Clerk (SaaS)  ·  PostHog     ·  Sentry  ·  Resend             │
└────────────────────────────────────────────────────────────────┘
```

> **Note:** MongoDB, Redis, and Elasticsearch are shared between dev and prod.
> Same connection strings, same data. Dev writes affect prod reads.

---

## 1. Prerequisites

### Accounts

| Service       | Purpose                                                        |
| ------------- | -------------------------------------------------------------- |
| Vercel        | Frontend hosting (3 apps)                                      |
| GCP           | Cloud Run, Pub/Sub, Storage, Vertex AI, Cloud Build            |
| DigitalOcean  | Managed MongoDB, Managed Redis, Spaces (S3-compatible storage) |
| Elastic Cloud | Elasticsearch (via GCP Marketplace)                            |
| Clerk         | Authentication + Google One Tap                                |
| PostHog       | Product analytics                                              |
| Sentry        | Error tracking                                                 |
| Resend        | Transactional & newsletter email                               |

### CLI Tools

```bash
npm install -g vercel
curl https://sdk.cloud.google.com | bash   # gcloud CLI
# Verify: node >= 18, yarn 1.22.22
```

### GCP Project Setup

```bash
gcloud config set project sinuous-aviary-410323

gcloud services enable \
  run.googleapis.com \
  cloudbuild.googleapis.com \
  pubsub.googleapis.com \
  secretmanager.googleapis.com \
  aiplatform.googleapis.com \
  storage.googleapis.com

# Service account (if not created)
gcloud iam service-accounts create rc-services \
  --display-name="Rate Creator Services"

SA=rc-services@sinuous-aviary-410323.iam.gserviceaccount.com

for ROLE in roles/pubsub.publisher roles/pubsub.subscriber \
            roles/storage.objectAdmin roles/aiplatform.user \
            roles/secretmanager.secretAccessor roles/run.invoker; do
  gcloud projects add-iam-policy-binding sinuous-aviary-410323 \
    --member="serviceAccount:$SA" --role="$ROLE"
done
```

---

## 2. Deploy apps/web (Main Platform)

**Platform:** Vercel · **Domain:** ratecreator.com

### Vercel Setup

```bash
cd apps/web && vercel link
```

### Build Settings

| Setting         | Value                           |
| --------------- | ------------------------------- |
| Framework       | Next.js                         |
| Root Directory  | `apps/web`                      |
| Build Command   | `cd ../.. && yarn vercel-build` |
| Install Command | `yarn install`                  |
| Node.js Version | 18.x                            |

### Environment Variables

```bash
# Auth (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# Database (shared dev/prod)
DATABASE_URL_ONLINE=mongodb+srv://...

# Redis (shared dev/prod)
REDIS_HOST=...
REDIS_PORT=25061
REDIS_USERNAME=default
REDIS_PASSWORD=...

# Elasticsearch (shared dev/prod)
ELASTIC_URL=https://...
ELASTIC_API_KEY=...
ELASTIC_ACCOUNTS_INDEX=accounts
ELASTIC_CATEGORIES_INDEX=categories

# GCP (for Pub/Sub publishing on review creation)
GCP_PROJECT_ID=sinuous-aviary-410323

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_...
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# Sentry
NEXT_PUBLIC_SENTRY_DSN=https://...
SENTRY_AUTH_TOKEN=sntrys_...

# Storage (DigitalOcean Spaces)
NEXT_PUBLIC_DO_SPACES_KEY=...
NEXT_PUBLIC_DO_SPACES_SECRET=...
NEXT_PUBLIC_DO_SPACES_REGION=nyc3
NEXT_PUBLIC_DO_SPACES_BUCKET=ratecreator
NEXT_PUBLIC_DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com

# Email
RESEND_API_KEY=re_...

# YouTube API (for on-demand refresh)
YOUTUBE_API_KEY=AIza...

# Search tuning (all optional — defaults work)
# SEARCH_ENABLE_FUZZY=true
# SEARCH_ENABLE_INFIX=true
# SEARCH_ENABLE_POPULARITY_BOOST=true
```

### Deployment Trigger

Vercel Git Integration — auto-deploys on push to `main`.

---

## 3. Deploy apps/content (CMS)

**Platform:** Vercel · **Domain:** content.ratecreator.com

### Build Settings

| Setting        | Value                                                   |
| -------------- | ------------------------------------------------------- |
| Root Directory | `apps/content`                                          |
| Build Command  | `cd ../.. && turbo build --filter=@ratecreator/content` |

### Environment Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
DATABASE_URL_ONLINE=mongodb+srv://...
REDIS_HOST=...
REDIS_PORT=25061
REDIS_USERNAME=default
REDIS_PASSWORD=...
DO_SPACES_KEY=...
DO_SPACES_SECRET=...
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=ratecreator
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

---

## 4. Deploy apps/creatorops (Creator Portal)

**Platform:** Vercel · **Domain:** creator.ratecreator.com

### Build Settings

| Setting        | Value                           |
| -------------- | ------------------------------- |
| Root Directory | `apps/creatorops`               |
| Build Command  | `cd ../.. && yarn vercel-build` |

### Environment Variables

```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
DATABASE_URL_ONLINE=mongodb+srv://...
REDIS_HOST=...
REDIS_PORT=25061
REDIS_USERNAME=default
REDIS_PASSWORD=...
```

---

## 5. Deploy apps/workers (Unified Backend Service)

**Platform:** GCP Cloud Run · **Region:** us-central1

The workers service handles ALL background jobs including Clerk webhooks.

### Build & Deploy via Cloud Build Trigger

Set up a **GCP Cloud Build trigger** (replaces GitHub Actions):

```bash
# Create trigger that auto-deploys on push to main
gcloud builds triggers create github \
  --repo-name=ratecreator \
  --repo-owner=orbizza \
  --branch-pattern="^main$" \
  --build-config=apps/workers/cloudbuild.yaml \
  --included-files="apps/workers/**,packages/db/**,packages/actions/**,packages/types/**" \
  --name="deploy-workers" \
  --region=us-central1 \
  --service-account="projects/sinuous-aviary-410323/serviceAccounts/rc-services@sinuous-aviary-410323.iam.gserviceaccount.com"
```

### Manual Deploy

```bash
gcloud builds submit \
  --config=apps/workers/cloudbuild.yaml \
  --project=sinuous-aviary-410323
```

### Cloud Run Configuration

```bash
gcloud run deploy ratecreator-workers \
  --image=gcr.io/sinuous-aviary-410323/ratecreator-workers \
  --region=us-central1 \
  --service-account=rc-services@sinuous-aviary-410323.iam.gserviceaccount.com \
  --memory=1Gi --cpu=2 \
  --min-instances=1 --max-instances=5 \
  --timeout=600 --concurrency=80 \
  --port=8080
```

### Environment Variables (Cloud Run)

```bash
# Direct env vars
gcloud run services update ratecreator-workers --region=us-central1 \
  --set-env-vars="NODE_ENV=production,GCP_LOCATION=us-central1,ELASTIC_ACCOUNTS_INDEX=accounts,ELASTIC_CATEGORIES_INDEX=categories,GCS_CONTENT_BUCKET=rc-content,GCS_PROFILES_BUCKET=rc-profiles,GCS_BANNERS_BUCKET=rc-banners,STORAGE_PROVIDER=do"

# Secrets (from Secret Manager)
gcloud run services update ratecreator-workers --region=us-central1 \
  --set-secrets="DATABASE_URL_ONLINE=DATABASE_URL_ONLINE:latest,REDIS_HOST=REDIS_HOST:latest,REDIS_PORT=REDIS_PORT:latest,REDIS_USERNAME=REDIS_USERNAME:latest,REDIS_PASSWORD=REDIS_PASSWORD:latest,GCP_PROJECT_ID=GCP_PROJECT_ID:latest,ELASTIC_URL=ELASTIC_URL:latest,ELASTIC_API_KEY=ELASTIC_API_KEY:latest,YOUTUBE_API_KEY=YOUTUBE_API_KEY:latest,TWITTER_BEARER_TOKEN=TWITTER_BEARER_TOKEN:latest,INSTAGRAM_ACCESS_TOKEN=INSTAGRAM_ACCESS_TOKEN:latest,INSTAGRAM_BUSINESS_ACCOUNT_ID=INSTAGRAM_BUSINESS_ACCOUNT_ID:latest,CLERK_WEBHOOK_SECRET=CLERK_WEBHOOK_SECRET:latest"
```

### Health Check

```bash
curl $(gcloud run services describe ratecreator-workers --region=us-central1 --format='value(status.url)')/health
```

---

## 6. GCP Pub/Sub Setup

### Create Topics

```bash
for TOPIC in clerk-user-events new-review-calculate new-review-elastic-update \
  data-refresh-youtube data-refresh-instagram data-refresh-reddit data-refresh-tiktok \
  new-account-data-fetch new-account-translate new-account-categorise-root \
  new-account-categorise-sub new-account-elastic-sync; do
  gcloud pubsub topics create $TOPIC 2>/dev/null || echo "Topic $TOPIC already exists"
done
```

### Create Push Subscriptions

Push subscriptions POST to Cloud Run routes when messages arrive:

```bash
WORKERS_URL=$(gcloud run services describe ratecreator-workers --region=us-central1 --format='value(status.url)')
SA=rc-services@sinuous-aviary-410323.iam.gserviceaccount.com

# Map topics to worker routes
declare -A TOPIC_ROUTES=(
  [clerk-user-events]=/jobs/user-sync
  [new-review-calculate]=/jobs/review-calculate
  [new-review-elastic-update]=/jobs/review-elastic-update
  [data-refresh-youtube]=/jobs/youtube-refresh
  [data-refresh-instagram]=/jobs/instagram-refresh
  [data-refresh-reddit]=/jobs/reddit-refresh
  [data-refresh-tiktok]=/jobs/tiktok-refresh
  [new-account-data-fetch]=/jobs/data-fetch
  [new-account-translate]=/jobs/translate
  [new-account-categorise-root]=/jobs/categorise-root
  [new-account-categorise-sub]=/jobs/categorise-sub
  [new-account-elastic-sync]=/jobs/elastic-account-sync
)

for TOPIC in "${!TOPIC_ROUTES[@]}"; do
  ROUTE="${TOPIC_ROUTES[$TOPIC]}"
  gcloud pubsub subscriptions create "${TOPIC}-push" \
    --topic="$TOPIC" \
    --push-endpoint="${WORKERS_URL}${ROUTE}" \
    --ack-deadline=600 \
    --push-auth-service-account="$SA" \
    2>/dev/null || echo "Subscription ${TOPIC}-push already exists"
done
```

---

## 7. Clerk Webhook Configuration

The workers service handles Clerk webhooks directly (no separate app needed).

### Get the Workers URL

```bash
gcloud run services describe ratecreator-workers --region=us-central1 --format='value(status.url)'
# Returns: https://ratecreator-workers-xxxxx-uc.a.run.app
```

The Clerk webhook URL is: `<WORKERS_URL>/webhook/clerk`

### Setup in Clerk Dashboard

1. Go to **Clerk Dashboard** → **Webhooks**
2. Add endpoint: `https://ratecreator-workers-xxxxx-uc.a.run.app/webhook/clerk` (use your actual Workers URL from above)
3. Select events: `user.created`, `user.updated`, `user.deleted`
4. Copy the **Signing Secret** from Clerk (starts with `whsec_`)
5. Add it to GCP Secret Manager:
   ```bash
   echo -n "whsec_..." | gcloud secrets create CLERK_WEBHOOK_SECRET --data-file=-
   ```
6. Verify it's linked to Cloud Run (already done in Section 5 env vars)

### Flow

```
Clerk event (user signup/update/delete)
  → POST /webhook/clerk (Svix signature verified)
  → Publishes to Pub/Sub topic: clerk-user-events
  → Push subscription → /jobs/user-sync
  → Upserts/updates/soft-deletes user in MongoDB
```

---

## 8. Data Flow: Review → Elasticsearch Sync

When a user creates a review, the data flows through multiple stages automatically:

```
User submits review
  │
  ├─ 1. createReview() server action
  │     ├─ Creates review in MongoDB (Prisma)
  │     ├─ Publishes to Pub/Sub: "new-review-calculate"
  │     ├─ Invalidates Redis cache: DEL accounts-{platform}-{accountId}
  │     └─ revalidatePath(/profile/{platform}/{accountId})
  │
  ├─ 2. /jobs/review-calculate (worker)
  │     ├─ Aggregates all published reviews for account (MongoDB aggregation)
  │     ├─ Calculates new average rating + review count
  │     ├─ Updates account in MongoDB (rating, reviewCount)
  │     ├─ Updates Redis cache in-place (if cached)
  │     └─ Publishes to Pub/Sub: "new-review-elastic-update"
  │
  └─ 3. /jobs/review-elastic-update (worker)
        └─ Updates Elasticsearch document: { rating, reviewCount }
            with retry logic (3 attempts, exponential backoff)
```

**Result:** After a review is submitted, MongoDB, Redis, and Elasticsearch all reflect the updated rating within seconds.

---

## 9. Data Flow: Platform Auto-Refresh

### Scheduled Refreshes (Cron in Workers)

The workers service runs cron jobs for each platform:

| Platform  | Schedule           | Stale Threshold  | Rate Limit     |
| --------- | ------------------ | ---------------- | -------------- |
| YouTube   | Sunday 2 AM UTC    | 7 days (ToS req) | 125 calls/hour |
| Instagram | Monday 3 AM UTC    | 14 days          | 200 calls/hour |
| Reddit    | Tuesday 4 AM UTC   | 14 days          | 100 calls/hour |
| TikTok    | Wednesday 5 AM UTC | 14 days          | 100 calls/hour |

### Refresh Flow

```
Cron fires triggerRefresh("YOUTUBE")
  │
  ├─ 1. refresh-scheduler processor
  │     ├─ Checks Redis anti-double key (skip if ran within 1 hour)
  │     ├─ Queries MongoDB for stale accounts (lastDataRefresh > 7 days ago)
  │     ├─ Batches accounts (50 per batch, max 90 batches = 4,500 accounts)
  │     └─ Publishes each to Pub/Sub: "data-refresh-youtube"
  │
  └─ 2. /jobs/youtube-refresh (per account)
        ├─ Checks rate limit (Redis counter: 125/hour)
        ├─ Calls YouTube Data API v3 (channel stats, snippet, branding)
        ├─ Updates MongoDB (followerCount, name, description, imageUrl, etc.)
        ├─ Sets lastDataRefresh = now
        └─ Invalidates Redis cache: DEL accounts-youtube-{accountId}
```

### On-Demand Refresh

Users can trigger a refresh from the creator profile page:

- `youtubeRefresh.ts` checks if `lastDataRefresh > 7 days`
- If stale, calls YouTube API directly and updates DB + clears cache
- Rate limited to 125 calls/hour via Redis counter

---

## 10. Cache Architecture

### Cache Layers (fastest to slowest)

```
Client in-memory (5 min) → Server local Map (60s) → Redis → MongoDB/API
```

### Redis Cache Keys & TTLs

| Key Pattern                             | TTL      | Set By                           | Invalidated By               |
| --------------------------------------- | -------- | -------------------------------- | ---------------------------- |
| `category-popular`                      | 7 days   | mostPopularCategoryActions       | Manual flush                 |
| `category-popular-accounts`             | 1 hour   | mostPopularCategoryActions       | Manual flush                 |
| `category-accounts:{id}`                | 1 hour   | mostPopularCategoryActions       | Manual flush                 |
| `category-root`                         | 7 days   | categoryActions / categories API | Manual flush                 |
| `category-all`                          | 7 days   | categoryActions / categories API | Manual flush                 |
| `accounts-youtube-{id}`                 | 1 hour   | accounts API / creatorActions    | createReview, youtubeRefresh |
| `accounts-twitter-{id}`                 | 1 hour   | accounts API / creatorActions    | createReview                 |
| `accounts-tiktok-{id}`                  | 1 hour   | accounts API / creatorActions    | createReview                 |
| `accounts-reddit-{id}`                  | 1 hour   | accounts API / creatorActions    | createReview                 |
| `youtube_api_rate_limit`                | 1 hour   | youtubeRefresh                   | Auto-expires                 |
| `refresh_scheduler_last_run:{platform}` | 7 days   | refresh-scheduler                | Auto-expires                 |
| `platform-stats`                        | 24 hours | platformStatsActions             | Auto-expires                 |

### When Caches Are Invalidated

| Event                      | Caches Cleared                     |
| -------------------------- | ---------------------------------- |
| Review created             | `accounts-{platform}-{accountId}`  |
| Review rating calculated   | Redis updated in-place (if cached) |
| YouTube data refreshed     | `accounts-youtube-{accountId}`     |
| Deploy with schema changes | Run `yarn flush-redis-cache`       |

---

## 11. Elasticsearch Setup

### First-Time Index Creation

```bash
# Migrate all accounts from MongoDB (~30 min for 3M docs)
yarn workspace @ratecreator/scripts migrate-accounts-elastic

# Migrate categories
yarn workspace @ratecreator/scripts migrate-categories-elastic

# Validate
yarn workspace @ratecreator/scripts validate-elastic-migration
```

### Reindex After Schema Changes

```bash
# Zero-downtime reindex (creates accounts_v2, swaps alias)
yarn workspace @ratecreator/scripts reindex-accounts-v2

# Verify
yarn workspace @ratecreator/scripts validate-elastic-migration
```

### How ES Stays in Sync

| Event                  | Sync Mechanism                                                      |
| ---------------------- | ------------------------------------------------------------------- |
| Review created         | Pub/Sub → review-calculate → review-elastic-update worker           |
| Account data refreshed | Worker updates MongoDB; ES updated via elastic-account-sync         |
| New account added      | data-fetch → translate → categorise → elastic-account-sync pipeline |
| Account deleted        | Manual or via admin action                                          |

---

## 12. Shared Dev/Prod Infrastructure

> **Important:** The following services are shared. Dev and prod use the same instances.

| Service       | Connection                        | Notes                                     |
| ------------- | --------------------------------- | ----------------------------------------- |
| MongoDB (DO)  | `DATABASE_URL_ONLINE`             | Same database, same collections           |
| Redis (DO)    | `REDIS_HOST:REDIS_PORT`           | Same cache — dev writes affect prod reads |
| Elasticsearch | `ELASTIC_URL` + `ELASTIC_API_KEY` | Same index (`accounts`)                   |
| GCP Pub/Sub   | `GCP_PROJECT_ID`                  | Same topics and subscriptions             |

### Implications

- Running `yarn dev:workers` locally connects to production Pub/Sub and processes real messages
- To avoid this, omit `GCP_PROJECT_ID` from local `.env` → Pub/Sub publishing silently skips
- Redis cache operations in dev affect production reads
- Use `yarn dev:web` (no workers, no GCP) for safe local development

---

## 13. Domain & DNS

| Domain                    | App             | DNS                          |
| ------------------------- | --------------- | ---------------------------- |
| `ratecreator.com`         | apps/web        | CNAME → cname.vercel-dns.com |
| `content.ratecreator.com` | apps/content    | CNAME → cname.vercel-dns.com |
| `creator.ratecreator.com` | apps/creatorops | CNAME → cname.vercel-dns.com |
| `status.ratecreator.com`  | Status page     | Per provider                 |

---

## 14. Deployment Triggers

| App             | Platform      | Trigger                                                                                                                 |
| --------------- | ------------- | ----------------------------------------------------------------------------------------------------------------------- |
| apps/web        | Vercel        | Git push to `main` (Vercel Git Integration)                                                                             |
| apps/content    | Vercel        | Git push to `main` (Vercel Git Integration)                                                                             |
| apps/creatorops | Vercel        | Git push to `main` (Vercel Git Integration)                                                                             |
| apps/workers    | GCP Cloud Run | Cloud Build trigger on push to `main` (watches `apps/workers/`, `packages/db/`, `packages/actions/`, `packages/types/`) |

No GitHub Actions. All CI/CD is handled by Vercel Git Integration and GCP Cloud Build triggers.

---

## 15. Placeholder Apps (Not Deployed)

| App                         | Status                                                       |
| --------------------------- | ------------------------------------------------------------ |
| `apps/api/`                 | Empty — future REST API (currently using Next.js API routes) |
| `apps/services/`            | Empty — future specialized microservices                     |
| `apps/consumers/`           | Deprecated — replaced by `apps/workers/`                     |
| `apps/webhooks/clerk-sync/` | Consolidated into `apps/workers` (`/webhook/clerk` route)    |

---

## 16. Post-Deploy Checklist

### Vercel Apps

```
[ ] ratecreator.com — loads, search works, auth works
[ ] content.ratecreator.com — loads, admin can create/publish posts
[ ] creator.ratecreator.com — loads, creator sign-in works
```

### GCP Services

```
[ ] Workers health: curl <WORKERS_URL>/health → {"status":"ok"}
[ ] Pub/Sub subscriptions active (no dead letters)
[ ] Clerk webhook delivers events (check Clerk dashboard)
[ ] Cloud Build trigger fires on push to main
```

### Data & Search

```
[ ] ES cluster health green/yellow
[ ] Search: "ai skills" < 500 results (AND semantics)
[ ] Search: "mr beast" shows MrBeast first
[ ] Sort toggle works (relevance vs explicit sort)
```

### Cache & Sync

```
[ ] Review creation invalidates Redis cache
[ ] Review → rating recalculation → ES update flows end-to-end
[ ] YouTube cron fires Sunday 2 AM UTC (check worker logs)
[ ] Redis keys have TTLs (PTTL accounts-youtube-* returns positive number)
```

### Auth & Integrations

```
[ ] Google One Tap enabled in Clerk Dashboard
[ ] Clerk webhook endpoint configured and delivering
[ ] PostHog receiving events
[ ] Sentry receiving errors
```

---

## GCP Quick Lookups

```bash
# List all Cloud Run services (find actual service names)
gcloud run services list --region=us-central1

# Get the URL for workers
gcloud run services describe ratecreator-workers --region=us-central1 --format='value(status.url)'

# List all Pub/Sub topics
gcloud pubsub topics list

# List all Pub/Sub subscriptions
gcloud pubsub subscriptions list

# Check which project is active
gcloud config get-value project

# List all secrets in Secret Manager
gcloud secrets list

# View Cloud Build triggers
gcloud builds triggers list --region=us-central1

# View recent Cloud Build logs
gcloud builds list --limit=5
```

---

## Quick Reference

```bash
# Local development
yarn dev              # All apps + workers
yarn dev:web          # Web apps only (safe, no GCP)
yarn dev:workers      # Workers only (connects to prod Pub/Sub!)

# Build
yarn build
yarn prisma-generate  # After schema changes

# Elasticsearch
yarn workspace @ratecreator/scripts migrate-accounts-elastic
yarn workspace @ratecreator/scripts reindex-accounts-v2
yarn workspace @ratecreator/scripts validate-elastic-migration

# Cache
yarn flush-redis-cache

# Deploy workers manually
gcloud builds submit --config=apps/workers/cloudbuild.yaml --project=sinuous-aviary-410323
```
