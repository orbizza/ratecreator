# GCP Migration & Platform Consolidation — Deployment Guide

**Date**: March 2026 **Scope**: Kafka → Pub/Sub, Algolia → Elasticsearch, Cloud
Run deployment, Refresh Scheduler, Subprocessor Page

---

## Table of Contents

1. [What Changed (Summary)](#1-what-changed-summary)
2. [Prerequisites](#2-prerequisites)
3. [GCP Project Setup](#3-gcp-project-setup)
4. [Pub/Sub Setup (replaces Kafka)](#4-pubsub-setup-replaces-kafka)
5. [Elasticsearch Setup (replaces Algolia)](#5-elasticsearch-setup-replaces-algolia)
6. [Cloud Run Deployment](#6-cloud-run-deployment)
7. [Cloud Scheduler Setup](#7-cloud-scheduler-setup)
8. [Vercel Environment Updates](#8-vercel-environment-updates)
9. [Instagram API Setup](#9-instagram-api-setup)
10. [DNS & Routing](#10-dns--routing)
11. [Verification Checklist](#11-verification-checklist)
12. [Rollback Plan](#12-rollback-plan)
13. [Environment Variables Reference](#13-environment-variables-reference)

---

## 1. What Changed (Summary)

### Removed

| Component                                        | Replaced By                                       |
| ------------------------------------------------ | ------------------------------------------------- |
| DigitalOcean Kafka (`kafkajs`)                   | GCP Pub/Sub (`@google-cloud/pubsub`)              |
| Algolia (`algoliasearch`, `react-instantsearch`) | Elasticsearch (Elastic Cloud on GCP)              |
| Vercel YouTube cron job                          | GCP Cloud Scheduler → refresh-scheduler service   |
| `algolia-account-sync` consumer                  | `elastic-account-sync` consumer (already existed) |
| `review-algolia-update` consumer                 | `review-elastic-update` consumer (new)            |
| 13 separate consumer services                    | Single `apps/workers/` service with routes        |

### Added

| Component                                            | Purpose                                                                                         |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `packages/db/src/clients/pubsub-client.ts`           | Pub/Sub client library                                                                          |
| `apps/workers/`                                      | Unified worker service — single Cloud Run instance handling all 13 jobs via Pub/Sub push routes |
| `apps/web/app/api/search/categories/route.ts`        | Category search API (was client-side only)                                                      |
| `packages/hooks/src/useAccountSearch.ts`             | Client-side search hook (replaces react-instantsearch)                                          |
| `packages/hooks/src/useCategorySearch.ts`            | Client-side category search hook                                                                |
| `apps/web/app/(public)/legal/subprocessors/page.tsx` | Subprocessor legal page                                                                         |
| `deploy/cloud-run/`                                  | Cloud Run deployment scripts                                                                    |
| `.github/workflows/deploy-consumers.yml`             | CI/CD for consumer deployment                                                                   |

### Modified (all consumers + producers)

All 13 consumers and 3 producers switched from Kafka to Pub/Sub. The search API
route switched from Algolia to Elasticsearch. The command bar and category
search removed `react-instantsearch` and use custom hooks that hit server-side
API routes.

---

## Quick Start — Run Everything

All setup steps are available as executable scripts in `deploy/gcp-setup/`:

```bash
# Run all steps (auto-skips completed ones)
./deploy/gcp-setup/run-all.sh

# Or run individual steps
./deploy/gcp-setup/00-setup-project.sh
./deploy/gcp-setup/01-create-service-account.sh
./deploy/gcp-setup/02-create-artifact-registry.sh
./deploy/gcp-setup/03-create-pubsub.sh
./deploy/gcp-setup/04-store-secrets.sh          # Edit placeholders first!
./deploy/gcp-setup/05-deploy-workers.sh
./deploy/gcp-setup/06-configure-push-subscriptions.sh
./deploy/gcp-setup/07-create-cloud-scheduler.sh
./deploy/gcp-setup/08-verify.sh
./deploy/gcp-setup/09-create-storage-bucket.sh     # GCS buckets (content + profiles)
./deploy/gcp-setup/10-migrate-content-to-gcs.sh    # Copy DO Spaces → GCS (optional, dry run)
./deploy/gcp-setup/11-migrate-elasticsearch.sh     # Index 3M accounts + 1300 categories

# Utilities
./deploy/gcp-setup/encode-sa-key.sh               # base64 encode SA key for Vercel
./deploy/gcp-setup/setup-local-env.sh              # Generate .env.local
./deploy/gcp-setup/cleanup-env-pubsub.sh           # Remove old -dev/-prod suffixed topics

# Resume from a specific step
./deploy/gcp-setup/run-all.sh --from 5

# Re-run a single step
./deploy/gcp-setup/run-all.sh --step 3

# Force re-run even if already done
./deploy/gcp-setup/run-all.sh --force
```

After GCP setup, run the Elasticsearch migration:

```bash
yarn migrate-categories-elastic     # ~5 seconds
yarn migrate-accounts-elastic       # ~60-90 min for 3M accounts
yarn validate-elastic-migration     # verify
```

Then update Vercel env vars (Section 8).

---

## 2. Prerequisites

### Tools Required

```bash
# Google Cloud SDK
brew install google-cloud-sdk

# Verify
gcloud version
gcloud auth login
gcloud auth application-default login
```

### Accounts Required

- GCP project with billing enabled
- Elastic Cloud account (elastic.co)
- Existing: Vercel, DigitalOcean, Clerk, Resend, PostHog, Sentry accounts

---

## 3. GCP Project Setup

### 3.1 Select Project

```bash
# Project already exists. Activate the ratecreator gcloud config:
gcloud config configurations activate ratecreator

# Verify
gcloud config list
# account = shaswat@orbizza.com
# project = sinuous-aviary-410323
# region  = us-central1
```

| Detail       | Value                        |
| ------------ | ---------------------------- |
| Project Name | ratecreator                  |
| Project ID   | `sinuous-aviary-410323`      |
| Account      | `shaswat@orbizza.com`        |
| Organization | `orbizza.com` (150229589978) |
| Region       | `us-central1`                |

### 3.2 Enable Required APIs

```bash
gcloud services enable \
  run.googleapis.com \
  pubsub.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com \
  cloudscheduler.googleapis.com \
  aiplatform.googleapis.com \
  cloudbuild.googleapis.com
```

### 3.3 Create Service Account

```bash
# Create service account
gcloud iam service-accounts create rc-services \
  --display-name="Rate Creator Services"

SA_EMAIL="rc-services@sinuous-aviary-410323.iam.gserviceaccount.com"

# Grant required roles
gcloud projects add-iam-policy-binding sinuous-aviary-410323 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/pubsub.publisher"

gcloud projects add-iam-policy-binding sinuous-aviary-410323 \
  --member="serviceAccount:${SA_EMAIL}" \
  --role="roles/pubsub.subscriber"

gcloud projects add-iam-policy-binding sinuous-aviary-410323 --member="serviceAccount:${SA_EMAIL}" --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding sinuous-aviary-410323 --member="serviceAccount:${SA_EMAIL}" --role="roles/secretmanager.secretAccessor"

gcloud projects add-iam-policy-binding sinuous-aviary-410323 --member="serviceAccount:${SA_EMAIL}" --role="roles/run.invoker"

gcloud projects add-iam-policy-binding sinuous-aviary-410323 --member="serviceAccount:${SA_EMAIL}" --role="roles/artifactregistry.writer"

# Create and download key (for CI/CD and local dev)
gcloud iam service-accounts keys create gcp-service-account.json --iam-account="${SA_EMAIL}"
```

### 3.4 Create Artifact Registry Repository

```bash
gcloud artifacts repositories create ratecreator --repository-format=docker --location=us-central1 --description="Rate Creator container images"
```

---

## 4. Pub/Sub Setup (replaces Kafka)

### 4.1 Create Topics

```bash
TOPICS=(
  "clerk-user-events"
  "account-added"
  "account-data-fetched"
  "account-translated"
  "account-root-categorised"
  "account-categorised"
  "new-review-calculate"
  "new-review-elastic-update"
  "data-refresh-youtube"
  "data-refresh-instagram"
  "data-refresh-reddit"
  "data-refresh-tiktok"
  "dead-letter"
)

for topic in "${TOPICS[@]}"; do
  gcloud pubsub topics create "$topic" \
    --message-ordering \
    --project=sinuous-aviary-410323
  echo "Created topic: $topic"
done
```

### 4.2 Create Subscriptions

All subscriptions now push to the same Cloud Run `ratecreator-workers` service
at different routes. Push endpoint configuration is done after the service is
deployed (see [Section 6](#6-cloud-run-deployment)).

```bash
# Mapping: topic → subscription (all push to the single workers service)
declare -A SUBS=(
  ["clerk-user-events"]="clerk-user-events-sub"
  ["account-added"]="account-added-sub"
  ["account-data-fetched"]="account-data-fetched-sub"
  ["account-translated"]="account-translated-sub"
  ["account-root-categorised"]="account-root-categorised-sub"
  ["account-categorised"]="account-categorised-elastic-sub"
  ["new-review-calculate"]="new-review-calculate-sub"
  ["new-review-elastic-update"]="new-review-elastic-update-sub"
  ["data-refresh-youtube"]="data-refresh-youtube-sub"
  ["data-refresh-instagram"]="data-refresh-instagram-sub"
  ["data-refresh-reddit"]="data-refresh-reddit-sub"
  ["data-refresh-tiktok"]="data-refresh-tiktok-sub"
)

for topic in "${!SUBS[@]}"; do
  sub="${SUBS[$topic]}"
  gcloud pubsub subscriptions create "$sub" \
    --topic="$topic" \
    --ack-deadline=60 \
    --message-retention-duration=7d \
    --enable-message-ordering \
    --dead-letter-topic="dead-letter" \
    --max-delivery-attempts=5 \
    --project=sinuous-aviary-410323
  echo "Created subscription: $sub → $topic"
done
```

**Push route mapping** (configured after deploy):

| Subscription                      | Push Endpoint                      |
| --------------------------------- | ---------------------------------- |
| `clerk-user-events-sub`           | `POST /jobs/user-sync`             |
| `account-added-sub`               | `POST /jobs/data-fetch`            |
| `account-data-fetched-sub`        | `POST /jobs/translate`             |
| `account-translated-sub`          | `POST /jobs/categorise-root`       |
| `account-root-categorised-sub`    | `POST /jobs/categorise-sub`        |
| `account-categorised-elastic-sub` | `POST /jobs/elastic-account-sync`  |
| `new-review-calculate-sub`        | `POST /jobs/review-calculate`      |
| `new-review-elastic-update-sub`   | `POST /jobs/review-elastic-update` |
| `data-refresh-youtube-sub`        | `POST /jobs/youtube-refresh`       |
| `data-refresh-instagram-sub`      | `POST /jobs/instagram-refresh`     |
| `data-refresh-reddit-sub`         | `POST /jobs/reddit-refresh`        |
| `data-refresh-tiktok-sub`         | `POST /jobs/tiktok-refresh`        |

### 4.3 Topic → Subscription → Consumer Mapping

| Topic                       | Subscription                      | Consumer              |
| --------------------------- | --------------------------------- | --------------------- |
| `clerk-user-events`         | `clerk-user-events-sub`           | user-sync             |
| `account-added`             | `account-added-sub`               | data-fetch            |
| `account-data-fetched`      | `account-data-fetched-sub`        | translate             |
| `account-translated`        | `account-translated-sub`          | categorise-root       |
| `account-root-categorised`  | `account-root-categorised-sub`    | categorise-sub        |
| `account-categorised`       | `account-categorised-elastic-sub` | elastic-account-sync  |
| `new-review-calculate`      | `new-review-calculate-sub`        | review-calculate      |
| `new-review-elastic-update` | `new-review-elastic-update-sub`   | review-elastic-update |
| `data-refresh-youtube`      | `data-refresh-youtube-sub`        | youtube-refresh       |
| `data-refresh-instagram`    | `data-refresh-instagram-sub`      | instagram-refresh     |
| `data-refresh-reddit`       | `data-refresh-reddit-sub`         | reddit-refresh        |
| `data-refresh-tiktok`       | `data-refresh-tiktok-sub`         | tiktok-refresh        |

### 4.4 Local Development with Pub/Sub Emulator

```bash
# Install and start emulator
gcloud components install pubsub-emulator
gcloud beta emulators pubsub start --project=ratecreator-dev

# Set environment variable (in .env.local)
PUBSUB_EMULATOR_HOST=localhost:8085
GCP_PROJECT_ID=sinuous-aviary-410323
```

When `PUBSUB_EMULATOR_HOST` is set, the Pub/Sub client library automatically
connects to the emulator instead of production.

---

## 5. Elasticsearch Setup (replaces Algolia)

### 5.1 Create Elastic Cloud Deployment

1. Go to https://cloud.elastic.co
2. Create a new deployment:
   - **Name**: `sinuous-aviary-410323`
   - **Cloud provider**: Google Cloud
   - **Region**: `us-central1` (Iowa)
   - **Hardware profile**: General Purpose
   - **Size**: 4 GB RAM, 120 GB storage
   - **Availability zones**: 2
3. Save the **Cloud ID** and **credentials**

### 5.2 Create API Key

In Kibana (your Elastic Cloud deployment):

1. Go to **Stack Management** → **API Keys**
2. Create new API key:
   - **Name**: `sinuous-aviary-410323-rw`
   - **Role descriptors**:
     ```json
     {
       "ratecreator-rw": {
         "cluster": ["monitor"],
         "indices": [
           {
             "names": ["accounts", "categories"],
             "privileges": ["read", "write", "create_index", "manage"]
           }
         ]
       }
     }
     ```
3. Save the API key value

### 5.3 Migrate Data (3M accounts + 1,300 categories)

The migration scripts are in `packages/scripts/src/elasticsearch/`. They use
checkpoint-based resumption so you can restart if interrupted.

**Set env vars first:**

```bash
# In .env (root of repo)
ELASTIC_CLOUD_ID=sinuous-aviary-410323:dXMtY2VudHJhbDEu...
ELASTIC_API_KEY=<your-api-key>
ELASTIC_ACCOUNTS_INDEX=accounts
ELASTIC_CATEGORIES_INDEX=categories
DATABASE_URL_ONLINE=mongodb+srv://...
```

**Step 1: Migrate categories (fast — 1,300 docs, takes ~5 seconds)**

```bash
yarn migrate-categories-elastic
```

This creates the `categories` index with proper mappings and bulk-indexes all
1,300 categories with hierarchy paths.

**Step 2: Migrate accounts (3M docs — takes ~60-90 minutes)**

```bash
# All platforms at once
yarn migrate-accounts-elastic

# Or per platform (can run in parallel terminals):
yarn migrate-accounts-elastic -- --platform youtube
yarn migrate-accounts-elastic -- --platform twitter
yarn migrate-accounts-elastic -- --platform reddit
yarn migrate-accounts-elastic -- --platform instagram
yarn migrate-accounts-elastic -- --platform tiktok
```

Progress is displayed in real-time:

```
Processing batch of 5000 accounts...
  Processed: 50000 | Indexed: 49850 | Rate: 3200 acc/min | Errors: 0
```

If the script crashes, **just run it again** — it resumes from the checkpoint
file (`elastic_accounts_checkpoint.json`).

**Step 3: Validate migration**

```bash
yarn validate-elastic-migration
```

This checks:

- Cluster health (green/yellow/red)
- Document counts (ES vs MongoDB — should be ≥95%)
- Basic search works
- Text search with autocomplete
- Platform/country/language aggregations
- Range filters (followers ≥ 1M)

Expected output:

```
✓ Cluster health                          green
✓ Accounts index (accounts)               Expected: 3000000, Actual: 2998500
✓ Categories index (categories)            Expected: 1300, Actual: 1300
✓ Basic search (match_all)
✓ Text search with autocomplete
✓ Platform aggregation                     5 platforms: YOUTUBE, TWITTER, ...
✓ Country aggregation                      100+ countries
✓ Categories aggregation                   50+ category facets
✓ Platform filter (YOUTUBE)
✓ Range filter (followers >= 1M)
```

### 5.4 Sizing Recommendations (3M accounts)

| Setting            | Value                        | Rationale                                               |
| ------------------ | ---------------------------- | ------------------------------------------------------- |
| RAM                | 4 GB                         | ~6 GB data at ~2 KB/doc, need headroom for aggregations |
| Storage            | 120 GB                       | Data + replicas + room to grow                          |
| Shards             | 2 (accounts), 1 (categories) | Already configured in index mappings                    |
| Replicas           | 1                            | HA across 2 availability zones                          |
| Availability Zones | 2                            | Recommended for production                              |

### 5.5 Verify Elasticsearch

```bash
# Quick health check via the ES client
yarn workspace @ratecreator/scripts tsx -e "
  const { checkHealth } = require('@ratecreator/db/elasticsearch-client');
  checkHealth().then(console.log).catch(console.error);
"
```

---

## 6. Cloud Run Deployment

### 6.1 Store Secrets in Secret Manager

```bash
# Database
echo -n "mongodb+srv://..." | gcloud secrets create db-url --data-file=- --project=sinuous-aviary-410323

# Redis
echo -n "your-redis-host" | gcloud secrets create redis-host --data-file=- --project=sinuous-aviary-410323
echo -n "25061" | gcloud secrets create redis-port --data-file=- --project=sinuous-aviary-410323
echo -n "default" | gcloud secrets create redis-username --data-file=- --project=sinuous-aviary-410323
echo -n "your-redis-password" | gcloud secrets create redis-password --data-file=- --project=sinuous-aviary-410323

# GCP
echo -n "sinuous-aviary-410323" | gcloud secrets create gcp-project-id --data-file=- --project=sinuous-aviary-410323

# Elasticsearch
echo -n "your-cloud-id" | gcloud secrets create elastic-cloud-id --data-file=- --project=sinuous-aviary-410323
echo -n "your-api-key" | gcloud secrets create elastic-api-key --data-file=- --project=sinuous-aviary-410323

# Platform APIs
echo -n "AIza..." | gcloud secrets create youtube-api-key --data-file=- --project=sinuous-aviary-410323
echo -n "AAAA..." | gcloud secrets create twitter-bearer-token --data-file=- --project=sinuous-aviary-410323
echo -n "IGQV..." | gcloud secrets create instagram-access-token --data-file=- --project=sinuous-aviary-410323
echo -n "17841..." | gcloud secrets create instagram-business-account-id --data-file=- --project=sinuous-aviary-410323

# Clerk
echo -n "whsec_..." | gcloud secrets create clerk-webhook-secret --data-file=- --project=sinuous-aviary-410323
```

### 6.2 Deploy the Unified Workers Service

All 13 jobs run in a single `ratecreator-workers` Cloud Run service. All secrets
are provided in one `--set-secrets` flag.

```bash
# Build and deploy the workers service
cd apps/workers
yarn build
gcloud run deploy ratecreator-workers \
  --source . \
  --region us-central1 \
  --project sinuous-aviary-410323 \
  --memory 1Gi \
  --cpu 2 \
  --port 8080 \
  --service-account="rc-services@sinuous-aviary-410323.iam.gserviceaccount.com" \
  --set-secrets="DATABASE_URL_ONLINE=db-url:latest,REDIS_HOST=redis-host:latest,REDIS_PORT=redis-port:latest,REDIS_USERNAME=redis-username:latest,REDIS_PASSWORD=redis-password:latest,GCP_PROJECT_ID=gcp-project-id:latest,ELASTIC_CLOUD_ID=elastic-cloud-id:latest,ELASTIC_API_KEY=elastic-api-key:latest,YOUTUBE_API_KEY=youtube-api-key:latest,TWITTER_BEARER_TOKEN=twitter-bearer-token:latest,INSTAGRAM_ACCESS_TOKEN=instagram-access-token:latest,INSTAGRAM_BUSINESS_ACCOUNT_ID=instagram-business-account-id:latest,CLERK_WEBHOOK_SECRET=clerk-webhook-secret:latest"
```

### 6.3 Configure Pub/Sub Push Subscriptions

After deploying the workers service, configure each subscription to push to the
correct route:

```bash
WORKERS_URL=$(gcloud run services describe ratecreator-workers --region us-central1 --format='value(status.url)')

SA_EMAIL="rc-services@sinuous-aviary-410323.iam.gserviceaccount.com"

# clerk-user-events-sub → /jobs/user-sync
gcloud pubsub subscriptions modify-push-config clerk-user-events-sub \
  --push-endpoint="${WORKERS_URL}/jobs/user-sync" \
  --push-auth-service-account="${SA_EMAIL}"

# account-added-sub → /jobs/data-fetch
gcloud pubsub subscriptions modify-push-config account-added-sub \
  --push-endpoint="${WORKERS_URL}/jobs/data-fetch" \
  --push-auth-service-account="${SA_EMAIL}"

# account-data-fetched-sub → /jobs/translate
gcloud pubsub subscriptions modify-push-config account-data-fetched-sub \
  --push-endpoint="${WORKERS_URL}/jobs/translate" \
  --push-auth-service-account="${SA_EMAIL}"

# account-translated-sub → /jobs/categorise-root
gcloud pubsub subscriptions modify-push-config account-translated-sub \
  --push-endpoint="${WORKERS_URL}/jobs/categorise-root" \
  --push-auth-service-account="${SA_EMAIL}"

# account-root-categorised-sub → /jobs/categorise-sub
gcloud pubsub subscriptions modify-push-config account-root-categorised-sub \
  --push-endpoint="${WORKERS_URL}/jobs/categorise-sub" \
  --push-auth-service-account="${SA_EMAIL}"

# account-categorised-elastic-sub → /jobs/elastic-account-sync
gcloud pubsub subscriptions modify-push-config account-categorised-elastic-sub \
  --push-endpoint="${WORKERS_URL}/jobs/elastic-account-sync" \
  --push-auth-service-account="${SA_EMAIL}"

# new-review-calculate-sub → /jobs/review-calculate
gcloud pubsub subscriptions modify-push-config new-review-calculate-sub \
  --push-endpoint="${WORKERS_URL}/jobs/review-calculate" \
  --push-auth-service-account="${SA_EMAIL}"

# new-review-elastic-update-sub → /jobs/review-elastic-update
gcloud pubsub subscriptions modify-push-config new-review-elastic-update-sub \
  --push-endpoint="${WORKERS_URL}/jobs/review-elastic-update" \
  --push-auth-service-account="${SA_EMAIL}"

# data-refresh-youtube-sub → /jobs/youtube-refresh
gcloud pubsub subscriptions modify-push-config data-refresh-youtube-sub \
  --push-endpoint="${WORKERS_URL}/jobs/youtube-refresh" \
  --push-auth-service-account="${SA_EMAIL}"

# data-refresh-instagram-sub → /jobs/instagram-refresh
gcloud pubsub subscriptions modify-push-config data-refresh-instagram-sub \
  --push-endpoint="${WORKERS_URL}/jobs/instagram-refresh" \
  --push-auth-service-account="${SA_EMAIL}"

# data-refresh-reddit-sub → /jobs/reddit-refresh
gcloud pubsub subscriptions modify-push-config data-refresh-reddit-sub \
  --push-endpoint="${WORKERS_URL}/jobs/reddit-refresh" \
  --push-auth-service-account="${SA_EMAIL}"

# data-refresh-tiktok-sub → /jobs/tiktok-refresh
gcloud pubsub subscriptions modify-push-config data-refresh-tiktok-sub \
  --push-endpoint="${WORKERS_URL}/jobs/tiktok-refresh" \
  --push-auth-service-account="${SA_EMAIL}"
```

### 6.4 Workers Service Port & Health Check

- Workers service: port 8080 (Cloud Run default), health at `/health`
- All jobs at `/jobs/<name>`

### 6.5 CI/CD via GitHub Actions

The workflow at `.github/workflows/deploy-consumers.yml` triggers on
`apps/workers/**` changes and deploys the single `ratecreator-workers` service.

**Required GitHub Secrets:**

| Secret       | Value                                                  |
| ------------ | ------------------------------------------------------ |
| `GCP_SA_KEY` | Contents of `gcp-service-account.json` (the full JSON) |

Set it in GitHub → Settings → Secrets and variables → Actions.

---

## 7. Cloud Scheduler Setup

The `ratecreator-workers` service exposes
`POST /jobs/refresh-scheduler/trigger/:platform` endpoints. Cloud Scheduler hits
these on schedule.

```bash
# Get the workers service URL
WORKERS_URL=$(gcloud run services describe ratecreator-workers \
  --region us-central1 --format='value(status.url)')

# YouTube: every Sunday at 2 AM UTC
gcloud scheduler jobs create http youtube-refresh \
  --schedule="0 2 * * 0" \
  --uri="${WORKERS_URL}/jobs/refresh-scheduler/trigger/youtube" \
  --http-method=POST \
  --oidc-service-account-email="rc-services@sinuous-aviary-410323.iam.gserviceaccount.com" \
  --location=us-central1

# Instagram: every Monday at 3 AM UTC
gcloud scheduler jobs create http instagram-refresh \
  --schedule="0 3 * * 1" \
  --uri="${WORKERS_URL}/jobs/refresh-scheduler/trigger/instagram" \
  --http-method=POST \
  --oidc-service-account-email="rc-services@sinuous-aviary-410323.iam.gserviceaccount.com" \
  --location=us-central1

# Reddit: every Tuesday at 4 AM UTC
gcloud scheduler jobs create http reddit-refresh \
  --schedule="0 4 * * 2" \
  --uri="${WORKERS_URL}/jobs/refresh-scheduler/trigger/reddit" \
  --http-method=POST \
  --oidc-service-account-email="rc-services@sinuous-aviary-410323.iam.gserviceaccount.com" \
  --location=us-central1

# TikTok: every Wednesday at 5 AM UTC
gcloud scheduler jobs create http tiktok-refresh \
  --schedule="0 5 * * 3" \
  --uri="${WORKERS_URL}/jobs/refresh-scheduler/trigger/tiktok" \
  --http-method=POST \
  --oidc-service-account-email="rc-services@sinuous-aviary-410323.iam.gserviceaccount.com" \
  --location=us-central1
```

The refresh-scheduler also has internal `node-cron` schedules as a fallback in
case Cloud Scheduler is not configured.

### 7.1 Local Development

- `yarn dev` — runs web apps + worker service (worker needs `GCP_PROJECT_ID` in
  `.env`)
- `yarn dev:web` — runs web apps only (no GCP needed)
- `yarn dev:workers` — runs only the worker service
- Direct HTTP testing:
  ```bash
  curl -X POST http://localhost:8080/jobs/user-sync -d '{"id":"test"}'
  ```

---

## 8. Vercel Environment Updates

### 8.1 Add New Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables, add:

```
# Elasticsearch (replaces Algolia)
ELASTIC_CLOUD_ID=sinuous-aviary-410323:dXMtY2VudHJhbDEu...
ELASTIC_API_KEY=<your-api-key>
ELASTIC_ACCOUNTS_INDEX=accounts
ELASTIC_CATEGORIES_INDEX=categories

# GCP (for Pub/Sub in server actions)
GCP_PROJECT_ID=sinuous-aviary-410323
GCP_SERVICE_ACCOUNT_KEY_BASE64=<base64-encoded-service-account-json>
```

Generate the base64 value:

```bash
./deploy/gcp-setup/encode-sa-key.sh
# Copies to clipboard automatically on macOS
```

### 8.2 Remove Old Environment Variables

Remove from Vercel:

```
ALGOLIA_APP_ID
ALGOLIA_WRITE_API_KEY
ALGOLIA_SEARCH_API_KEY
NEXT_PUBLIC_ALGOLIA_APP_ID
NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY
KAFKA_SERVICE_URI
KAFKA_USERNAME
KAFKA_PASSWORD
KAFKA_HOST
KAFKA_PORT
KAFKA_CA_CERT
```

### 8.3 Verify Vercel Crons

The youtube-refresh cron was removed from `vercel.json`. Only
`newsletter-publish` remains:

```json
{
  "crons": [
    {
      "path": "/api/cron/newsletter-publish",
      "schedule": "*/5 * * * *"
    }
  ]
}
```

---

## 9. Instagram API Setup

### 9.1 Meta Developer Account

1. Go to https://developers.facebook.com
2. Create a new app (Type: **Business**)
3. Add the **Instagram Graph API** product

### 9.2 Get Business Account ID

```
# In Graph API Explorer (https://developers.facebook.com/tools/explorer)

# 1. Get your Facebook Pages
GET /me/accounts
→ Returns: { data: [{ id: "<page_id>", name: "..." }] }

# 2. Get Instagram Business Account linked to the page
GET /<page_id>?fields=instagram_business_account
→ Returns: { instagram_business_account: { id: "<ig_business_id>" } }
```

### 9.3 Generate Long-Lived Access Token

```
# 1. Get short-lived token from Graph API Explorer
#    Required permissions: instagram_basic, pages_show_list, business_management

# 2. Exchange for long-lived token (60 days)
GET /oauth/access_token?grant_type=fb_exchange_token&client_id={APP_ID}&client_secret={APP_SECRET}&fb_exchange_token={SHORT_TOKEN}
```

**Token refresh**: Tokens expire every 60 days. Set up a reminder or automated
refresh.

### 9.4 Test the API

```bash
curl "https://graph.facebook.com/v19.0/${BUSINESS_ACCOUNT_ID}?fields=business_discovery.username(natgeo){username,name,biography,followers_count,media_count,profile_picture_url}&access_token=${ACCESS_TOKEN}"
```

### 9.5 Environment Variables

```
INSTAGRAM_ACCESS_TOKEN=IGQV...
INSTAGRAM_BUSINESS_ACCOUNT_ID=17841...
```

---

## 10. DNS & Routing

### 10.1 Clerk Webhook URL

The `clerk-sync` webhook currently runs on its own port. For Cloud Run:

1. Deploy `clerk-sync` to Cloud Run (or keep on existing infra)
2. Update Clerk Dashboard → Webhooks → Endpoint URL to the Cloud Run URL:
   ```
   https://clerk-sync-xxxxx.run.app/webhook/clerk
   ```

### 10.2 Subprocessor Page

The new subprocessor page is at `/legal/subprocessors` and is automatically
deployed with the web app. The footer already links to it.

---

## 11. Verification Checklist

Run these checks after deployment:

### Pub/Sub Pipeline

```bash
# 1. Trigger a user event (create a test user in Clerk)
# → Check Cloud Run logs: gcloud run logs read ratecreator-workers --region us-central1

# 2. Add an account via the web app
# → Verify full pipeline in worker logs: data-fetch → translate → categorise-root → categorise-sub → elastic-account-sync

# 3. Create a review
# → Verify in worker logs: review-calculate → review-elastic-update
```

### Search

- [ ] Command bar: type a query → results appear in < 500ms
- [ ] Search page: filters work (platform, followers, rating, country)
- [ ] Search page: pagination works
- [ ] Search page: facet counts are correct
- [ ] Category search: returns grouped results
- [ ] Create review → ES rating updates within 5 seconds

### Refresh

- [ ] Manually trigger:
      `curl -X POST https://ratecreator-workers-xxx.run.app/jobs/refresh-scheduler/trigger/youtube`
- [ ] Check DataRefreshLog in MongoDB for new entries
- [ ] Verify `lastDataRefresh` timestamps update

### Legal

- [ ] `/legal/subprocessors` renders the subprocessor table
- [ ] Footer has "Subprocessors" link

### Build

```bash
yarn build    # All 7 tasks should pass
yarn test     # Run tests
```

---

## 12. Rollback Plan

### If Pub/Sub Fails

The Kafka client file has been deleted. To rollback:

1. `git revert` the migration commit
2. Redeploy all consumers
3. Restore `KAFKA_*` env vars

### If Elasticsearch Fails

The search API route now uses Elasticsearch directly (no feature flag). To
rollback:

1. Restore `algolia-client.ts` from git history
2. Revert `apps/web/app/api/search/accounts/route.ts`
3. Revert command-bar and search components
4. Restore Algolia env vars in Vercel

### Workers Rollback

```bash
# List revisions
gcloud run revisions list --service=ratecreator-workers --region=us-central1

# Route traffic to a previous revision
gcloud run services update-traffic ratecreator-workers \
  --to-revisions=<previous-revision>=100 \
  --region=us-central1
```

---

## 13. Environment Variables Reference

### Complete List — All New Env Vars

| Variable                         | Used By                                              | Description                                 |
| -------------------------------- | ---------------------------------------------------- | ------------------------------------------- |
| `GCP_PROJECT_ID`                 | All GCP services                                     | GCP project identifier                      |
| `GOOGLE_APPLICATION_CREDENTIALS` | All GCP services                                     | Path to service account JSON                |
| `GCP_LOCATION`                   | translate, categorise-root, categorise-sub           | Vertex AI region (`us-central1`)            |
| `ELASTIC_CLOUD_ID`               | Web app, elastic-account-sync, review-elastic-update | Elastic Cloud deployment ID                 |
| `ELASTIC_API_KEY`                | Web app, elastic-account-sync, review-elastic-update | Elastic Cloud API key                       |
| `ELASTIC_ACCOUNTS_INDEX`         | Web app, elastic consumers                           | Index name (default: `accounts`)            |
| `ELASTIC_CATEGORIES_INDEX`       | Web app                                              | Category index name (default: `categories`) |
| `INSTAGRAM_ACCESS_TOKEN`         | data-fetch, instagram-refresh                        | Instagram Graph API token                   |
| `INSTAGRAM_BUSINESS_ACCOUNT_ID`  | data-fetch, instagram-refresh                        | Instagram business account ID               |

### Removed Env Vars

| Variable                             | Reason                    |
| ------------------------------------ | ------------------------- |
| `ALGOLIA_APP_ID`                     | Replaced by Elasticsearch |
| `ALGOLIA_WRITE_API_KEY`              | Replaced by Elasticsearch |
| `ALGOLIA_SEARCH_API_KEY`             | Replaced by Elasticsearch |
| `NEXT_PUBLIC_ALGOLIA_APP_ID`         | Replaced by Elasticsearch |
| `NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY` | Replaced by Elasticsearch |
| `KAFKA_SERVICE_URI`                  | Replaced by GCP Pub/Sub   |
| `KAFKA_USERNAME`                     | Replaced by GCP Pub/Sub   |
| `KAFKA_PASSWORD`                     | Replaced by GCP Pub/Sub   |
| `KAFKA_HOST`                         | Replaced by GCP Pub/Sub   |
| `KAFKA_PORT`                         | Replaced by GCP Pub/Sub   |
| `KAFKA_CA_CERT`                      | Replaced by GCP Pub/Sub   |

### Vercel — apps/web (complete)

```env
# Database
DATABASE_URL_ONLINE=mongodb+srv://...

# Elasticsearch
ELASTIC_CLOUD_ID=sinuous-aviary-410323:dXMtY2VudHJhbDEu...
ELASTIC_API_KEY=<prod-key>
ELASTIC_ACCOUNTS_INDEX=accounts
ELASTIC_CATEGORIES_INDEX=categories

# GCP
GCP_PROJECT_ID=sinuous-aviary-410323
GCP_SERVICE_ACCOUNT_KEY_BASE64=<run ./deploy/gcp-setup/encode-sa-key.sh>

# Redis
REDIS_HOST=<do-redis-host>
REDIS_PORT=25061
REDIS_USERNAME=default
REDIS_PASSWORD=<password>

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...

# YouTube
YOUTUBE_API_KEY=<key>

# Email
RESEND_API_KEY=re_<prod>

# Cron
CRON_SECRET=<secret>

# Analytics
NEXT_PUBLIC_POSTHOG_KEY=phc_<key>
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com

# App
NEXT_PUBLIC_APP_ENV=production

# DO Spaces
DO_SPACES_KEY=<key>
DO_SPACES_SECRET=<secret>
DO_SPACES_REGION=nyc3
DO_SPACES_BUCKET=ratecreator
DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
NEXT_PUBLIC_DO_SPACES_KEY=<key>
NEXT_PUBLIC_DO_SPACES_REGION=nyc3
NEXT_PUBLIC_DO_SPACES_BUCKET=ratecreator
NEXT_PUBLIC_DO_SPACES_ENDPOINT=https://nyc3.digitaloceanspaces.com
```

### GCP Cloud Run — Workers Service (all secrets in one deployment)

```env
# All secrets are set on the single ratecreator-workers service:
DATABASE_URL_ONLINE=<secret: db-url>
GCP_PROJECT_ID=<secret: gcp-project-id>
REDIS_HOST=<secret: redis-host>
REDIS_PORT=<secret: redis-port>
REDIS_USERNAME=<secret: redis-username>
REDIS_PASSWORD=<secret: redis-password>
ELASTIC_CLOUD_ID=<secret: elastic-cloud-id>
ELASTIC_API_KEY=<secret: elastic-api-key>
ELASTIC_ACCOUNTS_INDEX=accounts
YOUTUBE_API_KEY=<secret: youtube-api-key>
TWITTER_BEARER_TOKEN=<secret: twitter-bearer-token>
INSTAGRAM_ACCESS_TOKEN=<secret: instagram-access-token>
INSTAGRAM_BUSINESS_ACCOUNT_ID=<secret: instagram-business-account-id>
CLERK_WEBHOOK_SECRET=<secret: clerk-webhook-secret>
GCP_LOCATION=us-central1
```

---

## Deployment Order (Recommended)

```
Step 00: Enable GCP APIs
Step 01: Create service account + IAM roles
Step 02: Create Artifact Registry
Step 03: Create Pub/Sub topics + subscriptions
Step 04: Store secrets in Secret Manager (reads from .env)
Step 05: Build + deploy workers to Cloud Run
Step 06: Configure Pub/Sub push subscriptions
Step 07: Create Cloud Scheduler jobs (refresh crons)
Step 08: Verify entire GCP setup
Step 09: Create GCS buckets (rc-content + rc-profiles)
Step 10: Migrate DO Spaces content to GCS (optional, dry run first)
Step 11: Migrate 3M accounts + 1300 categories to Elasticsearch

Then:
  - Update Vercel env vars (Section 8)
  - Set GCP_SA_KEY GitHub secret for CI/CD
  - Update Clerk webhook URL to Cloud Run

All steps via: ./deploy/gcp-setup/run-all.sh
```
