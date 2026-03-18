# Rate Creator

Discover, review, and rate content creators across YouTube, X, TikTok, Reddit, and Instagram. 3M+ creator profiles indexed with community-driven ratings and reviews.

**[ratecreator.com](https://ratecreator.com)** | **[creator.ratecreator.com](https://creator.ratecreator.com)**

## Architecture

Turborepo monorepo with 4 deployable apps and 10 shared packages.

```
apps/
  web/           → Main platform (Next.js, Vercel)
  content/       → CMS for blog/newsletter (Next.js, Vercel)
  creatorops/    → Creator portal (Next.js, Vercel)
  workers/       → Background jobs (Hono, GCP Cloud Run)

packages/
  ui/            → Shared React components (Radix, Tailwind)
  db/            → Prisma ORM, Redis, Elasticsearch, Pub/Sub clients
  actions/       → Next.js server actions
  store/         → Recoil state management
  types/         → Shared TypeScript types
  hooks/         → Custom React hooks
  auth/          → Clerk authentication
  scripts/       → Migration and seeding scripts
  config-*/      → Shared ESLint, TypeScript, Tailwind configs
```

## Tech Stack

| Layer      | Technology                                  |
| ---------- | ------------------------------------------- |
| Frontend   | Next.js 14, React 18, TailwindCSS, Radix UI |
| State      | Recoil                                      |
| Editor     | BlockNote                                   |
| Backend    | Hono.js (workers), Next.js API routes       |
| Database   | MongoDB (Prisma ORM)                        |
| Cache      | Redis (DigitalOcean)                        |
| Search     | Elasticsearch (Elastic Cloud)               |
| Messaging  | GCP Pub/Sub                                 |
| Auth       | Clerk                                       |
| Email      | Resend                                      |
| Analytics  | PostHog                                     |
| Monitoring | Sentry                                      |
| AI         | Google Vertex AI (Gemini)                   |
| Storage    | DigitalOcean Spaces, Google Cloud Storage   |
| Hosting    | Vercel (apps), GCP Cloud Run (workers)      |

## Getting Started

### Prerequisites

- Node.js >= 18
- Yarn 1.22.22
- MongoDB, Redis, Elasticsearch access
- Clerk account
- GCP project (for Pub/Sub, Vertex AI)

### Setup

```bash
# Install dependencies
yarn install

# Set up environment
cp env.example .env
# Fill in required values

# Generate Prisma client
yarn prisma-generate

# Start all apps in development
yarn dev

# Or start only web apps (no GCP required)
yarn dev:web
```

### Key Commands

| Command                  | Description                         |
| ------------------------ | ----------------------------------- |
| `yarn dev`               | Start all apps + workers            |
| `yarn dev:web`           | Start web apps only (no GCP needed) |
| `yarn dev:workers`       | Start workers only                  |
| `yarn build`             | Build all packages and apps         |
| `yarn test`              | Run Vitest test suite               |
| `yarn lint`              | Lint all code                       |
| `yarn prisma-generate`   | Generate Prisma client              |
| `yarn flush-redis-cache` | Clear Redis cache                   |

### Elasticsearch Scripts

```bash
# Migrate accounts from MongoDB to Elasticsearch
yarn workspace @ratecreator/scripts migrate-accounts-elastic

# Migrate categories
yarn workspace @ratecreator/scripts migrate-categories-elastic

# Zero-downtime reindex (after schema changes)
yarn workspace @ratecreator/scripts reindex-accounts-v2

# Validate migration
yarn workspace @ratecreator/scripts validate-elastic-migration
```

## Data Flow

### Review Pipeline

```
User submits review
  → MongoDB (Prisma) + Pub/Sub publish
  → review-calculate worker (rating aggregation)
  → review-elastic-update worker (search index sync)
  → Redis cache invalidation
```

### Creator Data Refresh

```
Weekly cron (per platform)
  → refresh-scheduler (finds stale accounts)
  → Pub/Sub → platform-specific worker
  → Platform API fetch → MongoDB update
  → Redis cache invalidation
```

### User Lifecycle

```
Clerk webhook → /webhook/clerk (Svix verified)
  → Pub/Sub → user-sync worker
  → MongoDB upsert/update/soft-delete
```

## Workers

Single unified Hono service handling all background jobs:

| Route                         | Purpose                          |
| ----------------------------- | -------------------------------- |
| `/jobs/user-sync`             | Clerk user lifecycle events      |
| `/jobs/review-calculate`      | Bayesian rating calculation      |
| `/jobs/review-elastic-update` | Search index sync on review      |
| `/jobs/youtube-refresh`       | YouTube channel data refresh     |
| `/jobs/instagram-refresh`     | Instagram profile refresh        |
| `/jobs/reddit-refresh`        | Reddit community refresh         |
| `/jobs/tiktok-refresh`        | TikTok profile refresh           |
| `/jobs/refresh-scheduler`     | Schedule stale account refreshes |
| `/jobs/data-fetch`            | Fetch new account data           |
| `/jobs/translate`             | AI translation (Gemini)          |
| `/jobs/categorise-root`       | Root category classification     |
| `/jobs/categorise-sub`        | Sub-category classification      |
| `/jobs/elastic-account-sync`  | Full account index to ES         |
| `/webhook/clerk`              | Clerk webhook receiver           |

**Cron schedules:** YouTube (Sun 2AM), Instagram (Mon 3AM), Reddit (Tue 4AM), TikTok (Wed 5AM) — all UTC.

## Deployment

See [PRODUCTION.md](./PRODUCTION.md) for complete deployment guide including:

- Vercel setup for 3 frontend apps
- GCP Cloud Run setup for workers
- Pub/Sub topics and push subscriptions
- Secret Manager configuration
- IAM permissions
- Deploy scripts (`deploy/gcp-setup/run-all.sh`)

### Quick Deploy

```bash
# Frontend (auto-deploys via Vercel Git Integration on push to main)
git push origin main

# Workers (via Cloud Build trigger, or manual)
gcloud builds submit --config=apps/workers/cloudbuild.yaml --project=sinuous-aviary-410323
```

## YouTube API Compliance

Rate Creator uses YouTube API Services and complies with YouTube ToS:

- **Data freshness**: YouTube data refreshed at least every 7 days (Policy E.4)
- **Content attribution**: YouTube data labeled with "Data from YouTube" badge (Policy E.4h + F.2b)
- **Branding**: Official YouTube SVG icon with `#FF0000` red (Policy F.2a)
- **Legal pages**: `/legal/terms` references YouTube ToS, `/legal/privacy` references Google Privacy Policy (Policy A)

## Project Status

### Active

- Multi-platform creator profiles (YouTube, X, TikTok, Reddit)
- Review system with ratings, comments, voting
- Elasticsearch-powered search with AND semantics
- Blog, newsletter, glossary content
- Weekly platform data refresh

### In Progress

- Instagram creator profiles
- Creator portal (claim and manage profiles)

### Planned

- Admin dashboard
- Notification system
- Moderation tools
- A/B testing framework

## License

Copyright 2024-2026 Orbizza, Inc. All rights reserved.

## Contact

[ratecreator.com/contact](https://ratecreator.com/contact)
