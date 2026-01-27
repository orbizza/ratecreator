# Migration Plan: Algolia to Elastic Cloud on GCP

## Executive Summary

This document outlines the migration strategy from Algolia to **Elastic Cloud on GCP** (managed Elasticsearch) for the Rate Creator platform. Elastic Cloud provides a fully managed Elasticsearch service deployed on Google Cloud infrastructure with enterprise features, Kibana dashboards, and seamless GCP integration.

---

## Why Elastic Cloud on GCP?

| Factor                      | Elastic Cloud  | Vertex AI Search | Self-managed ES |
| --------------------------- | -------------- | ---------------- | --------------- |
| Cost (100K docs)            | ~$95/month     | ~$1,000/month    | ~$220/month     |
| Operational Overhead        | None (managed) | None             | High            |
| Feature Parity with Algolia | Full           | Partial          | Full            |
| GCP Integration             | Native VPC     | Native           | Manual          |
| Kibana/Analytics            | Included       | Limited          | Self-setup      |
| Learning Curve              | Moderate       | Steep            | Moderate        |

**Recommendation**: Elastic Cloud offers the best balance of cost, features, and operational simplicity.

---

## Current Algolia Implementation Summary

### Indices

- `accounts` - Creator profiles (~100K+ records)
- `categories` - Hierarchical category taxonomy

### Features Used

- Full-text search (name, handle, description, keywords)
- Faceted filtering (platform, country, language, categories)
- Range filters (followerCount, rating, reviewCount)
- Multiple sort orders
- Real-time indexing via Kafka

---

## Elastic Cloud Architecture

### Deployment Topology

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────────┐
│   Web App       │────▶│  Search API      │────▶│  Elastic Cloud      │
│   (Next.js)     │     │  (Next.js API)   │     │  (GCP Region)       │
└─────────────────┘     └──────────────────┘     └─────────────────────┘
                                                          │
                                                          ├── Elasticsearch
                                                          ├── Kibana
                                                          └── APM (optional)
         ▲
         │
┌─────────────────┐
│  Kafka Consumer │
│  (elastic-sync) │
└─────────────────┘
```

### GCP Integration

- Deploy in same GCP region as other services (us-central1)
- Private Link for secure VPC connectivity
- GCS snapshots for backups

---

## Implementation Plan

### Phase 1: Elastic Cloud Setup (Week 1)

#### 1.1 Create Elastic Cloud Deployment

```bash
# Via Elastic Cloud Console or API
# Recommended configuration:
# - Cloud Provider: GCP
# - Region: us-central1
# - Version: 8.x (latest)
# - Size: 4GB RAM (scalable)
# - Availability: 2 zones
```

**Deployment Settings:**

- **Name**: `ratecreator-search`
- **Cloud Provider**: Google Cloud
- **Region**: us-central1 (Iowa)
- **Hardware Profile**: General Purpose
- **Size**: 4GB RAM, 120GB storage
- **High Availability**: 2 availability zones

#### 1.2 Environment Configuration

```env
# Elastic Cloud credentials
ELASTIC_CLOUD_ID=ratecreator-search:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvJGFiY2RlZjEyMzQ1Njc4OTAkYWJjZGVmMTIzNDU2Nzg5MA==
ELASTIC_API_KEY=your-api-key-here
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your-password

# Index names
ELASTIC_ACCOUNTS_INDEX=accounts
ELASTIC_CATEGORIES_INDEX=categories
```

### Phase 2: Index Setup (Week 1-2)

#### 2.1 Create Index Mappings

**Accounts Index Mapping:**

```json
{
  "settings": {
    "number_of_shards": 2,
    "number_of_replicas": 1,
    "analysis": {
      "analyzer": {
        "autocomplete": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase", "autocomplete_filter"]
        },
        "autocomplete_search": {
          "type": "custom",
          "tokenizer": "standard",
          "filter": ["lowercase"]
        }
      },
      "filter": {
        "autocomplete_filter": {
          "type": "edge_ngram",
          "min_gram": 1,
          "max_gram": 20
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "objectID": { "type": "keyword" },
      "platform": { "type": "keyword" },
      "accountId": { "type": "keyword" },
      "handle": {
        "type": "text",
        "analyzer": "autocomplete",
        "search_analyzer": "autocomplete_search",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "name": {
        "type": "text",
        "analyzer": "autocomplete",
        "search_analyzer": "autocomplete_search",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "name_en": {
        "type": "text",
        "analyzer": "autocomplete",
        "search_analyzer": "autocomplete_search"
      },
      "description": { "type": "text" },
      "description_en": { "type": "text" },
      "keywords": { "type": "text" },
      "keywords_en": { "type": "text" },
      "imageUrl": { "type": "keyword", "index": false },
      "bannerUrl": { "type": "keyword", "index": false },
      "followerCount": { "type": "long" },
      "country": { "type": "keyword" },
      "language_code": { "type": "keyword" },
      "rating": { "type": "float" },
      "reviewCount": { "type": "integer" },
      "madeForKids": { "type": "boolean" },
      "videoCount": { "type": "integer" },
      "viewCount": { "type": "long" },
      "categories": { "type": "keyword" },
      "categoryNames": { "type": "text" },
      "createdDate": { "type": "date" },
      "isSeeded": { "type": "boolean" },
      "lastIndexedAt": { "type": "date" }
    }
  }
}
```

### Phase 3: Elasticsearch Client (Week 2)

#### 3.1 Install Dependencies

```bash
yarn workspace @ratecreator/db add @elastic/elasticsearch
```

#### 3.2 Create Client Module

See: `packages/db/src/clients/elasticsearch-client.ts` (created below)

### Phase 4: Kafka Consumer (Week 2-3)

Create new consumer: `apps/consumers/elastic-account-sync/`

### Phase 5: Data Migration (Week 3)

#### 5.1 Setup Elastic Cloud

Follow the detailed setup guide: [`docs/setup/elastic-cloud-setup.md`](../setup/elastic-cloud-setup.md)

#### 5.2 Migration Scripts

Available migration commands:

```bash
# Option A: Migrate from MongoDB (Recommended)
yarn workspace @ratecreator/scripts migrate-accounts-elastic        # All platforms
yarn workspace @ratecreator/scripts migrate-accounts-elastic:youtube # YouTube only
yarn workspace @ratecreator/scripts migrate-accounts-elastic:twitter # Twitter/X only
yarn workspace @ratecreator/scripts migrate-accounts-elastic:tiktok  # TikTok only
yarn workspace @ratecreator/scripts migrate-accounts-elastic:reddit  # Reddit only
yarn workspace @ratecreator/scripts migrate-accounts-elastic:instagram # Instagram only
yarn workspace @ratecreator/scripts migrate-categories-elastic       # Categories

# Option B: Migrate from Algolia (preserves existing Algolia data exactly)
yarn workspace @ratecreator/scripts migrate-from-algolia:accounts
yarn workspace @ratecreator/scripts migrate-from-algolia:categories

# Validate migration
yarn workspace @ratecreator/scripts validate-elastic-migration
```

#### 5.3 Migration Features

- **Checkpoint-based resumption**: If migration fails, run the command again to resume
- **Batch processing**: Processes 5,000 accounts at a time with 500 docs per bulk request
- **Error tracking**: Failed records logged in checkpoint file for review
- **Platform-specific**: Can migrate each platform independently for better control

### Phase 6: Testing & Validation (Week 4)

- Search parity tests
- Performance benchmarks
- Facet accuracy validation

### Phase 7: Cutover (Week 5)

- Feature flag rollout
- Monitor metrics
- Decommission Algolia

---

## Cost Comparison

### Elastic Cloud Pricing (GCP)

| Tier          | RAM  | Storage | Price/month |
| ------------- | ---- | ------- | ----------- |
| Standard 4GB  | 4GB  | 120GB   | ~$95        |
| Standard 8GB  | 8GB  | 240GB   | ~$190       |
| Standard 16GB | 16GB | 480GB   | ~$380       |

**Recommended**: Start with 4GB, scale as needed.

### vs Algolia

| Service           | Monthly Cost    |
| ----------------- | --------------- |
| Algolia (current) | ~$300           |
| Elastic Cloud 4GB | ~$95            |
| **Savings**       | **~$205/month** |

---

## Environment Variables

```env
# Elastic Cloud
ELASTIC_CLOUD_ID=your-cloud-id
ELASTIC_API_KEY=your-api-key

# Or username/password auth
ELASTIC_USERNAME=elastic
ELASTIC_PASSWORD=your-password

# Index configuration
ELASTIC_ACCOUNTS_INDEX=accounts
ELASTIC_CATEGORIES_INDEX=categories

# Feature flag
USE_ELASTICSEARCH=false
```

---

## Rollback Plan

1. Keep Algolia active during migration (dual-write)
2. Feature flag for instant rollback
3. Monitor search quality metrics
4. 2-week parallel operation before decommission

---

## Success Metrics

| Metric             | Target              |
| ------------------ | ------------------- |
| Search latency P95 | < 100ms             |
| Index freshness    | < 10 seconds        |
| Search relevance   | >= Algolia baseline |
| Cost reduction     | > 60%               |
| Uptime             | 99.9%               |

---

## Timeline

| Week | Phase     | Deliverables                             |
| ---- | --------- | ---------------------------------------- |
| 1    | Setup     | Elastic Cloud deployment, index mappings |
| 2    | Client    | Elasticsearch client, API routes         |
| 2-3  | Sync      | Kafka consumer, dual-write               |
| 3    | Migration | Data export/import, validation           |
| 4    | Testing   | Parity tests, performance benchmarks     |
| 5    | Cutover   | Feature flag rollout, monitoring         |

**Total Duration**: 5 weeks
