# Elastic Cloud on GCP - Setup Guide

This guide walks you through setting up Elastic Cloud on Google Cloud Platform for the Rate Creator platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Create Elastic Cloud Account](#create-elastic-cloud-account)
3. [Create Deployment](#create-deployment)
4. [Configure Authentication](#configure-authentication)
5. [Set Up Indices](#set-up-indices)
6. [Environment Configuration](#environment-configuration)
7. [Run Migration](#run-migration)
8. [Verify Setup](#verify-setup)
9. [Kibana Dashboard Setup](#kibana-dashboard-setup)
10. [Production Checklist](#production-checklist)

---

## Prerequisites

- Google Cloud Platform account
- Access to the Rate Creator repository
- Node.js 18+ installed locally
- MongoDB database with existing account data

---

## 1. Create Elastic Cloud Account

### Step 1.1: Sign Up

1. Go to [https://cloud.elastic.co](https://cloud.elastic.co)
2. Click "Start free trial" or "Sign up"
3. Sign up using:
   - Google account (recommended for GCP integration)
   - Email and password
4. Verify your email address

### Step 1.2: Choose GCP as Cloud Provider

During signup, select **Google Cloud** as your preferred cloud provider. This ensures:

- Lower latency to your GCP infrastructure
- Easier VPC peering setup (if needed)
- Consolidated billing (optional)

---

## 2. Create Deployment

### Step 2.1: Create New Deployment

1. From the Elastic Cloud console, click **"Create deployment"**
2. Enter deployment details:

| Setting            | Recommended Value                        |
| ------------------ | ---------------------------------------- |
| **Name**           | `ratecreator-search`                     |
| **Cloud Provider** | Google Cloud                             |
| **Region**         | `us-central1` (or match your GCP region) |
| **Version**        | Latest 8.x (e.g., 8.12.0)                |

### Step 2.2: Configure Hardware

For initial setup (100K-500K documents):

| Component            | Configuration               |
| -------------------- | --------------------------- |
| **Elasticsearch**    |                             |
| - Size               | 4 GB RAM                    |
| - Storage            | 120 GB                      |
| - Availability zones | 2 zones (High Availability) |
| **Kibana**           |                             |
| - Size               | 1 GB RAM                    |
| **Machine Learning** | Disabled (not needed)       |
| **APM**              | Disabled (optional)         |

**Estimated Cost:** ~$95-120/month

### Step 2.3: Create Deployment

1. Click **"Create deployment"**
2. **IMPORTANT:** Save the credentials shown:
   - **Cloud ID** (looks like: `ratecreator-search:dXMtY2VudHJhbDE...`)
   - **Username** (usually `elastic`)
   - **Password** (auto-generated)
3. Wait for deployment to complete (5-10 minutes)

---

## 3. Configure Authentication

### Step 3.1: Create API Key (Recommended)

Using API keys is more secure than username/password.

1. Go to your deployment in Elastic Cloud
2. Click **"Management"** → **"Security"** → **"API keys"**
3. Click **"Create API key"**
4. Configure:
   - **Name:** `ratecreator-production`
   - **Expiration:** Never (or set rotation policy)
   - **Role descriptors:** Leave empty for full access, or restrict:

```json
{
  "ratecreator_writer": {
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

5. Click **"Create API key"**
6. **Copy the API key immediately** - it won't be shown again!

### Step 3.2: Get Cloud ID

1. Go to your deployment overview
2. Click **"Manage"** on the Elasticsearch section
3. Find **"Cloud ID"** in the details panel
4. Click to copy the full Cloud ID

---

## 4. Set Up Indices

### Option A: Automatic (Via Migration Script)

The migration scripts will automatically create indices with proper mappings.

```bash
# This will create the accounts index with proper mappings
yarn workspace @ratecreator/scripts migrate-accounts-elastic

# This will create the categories index with proper mappings
yarn workspace @ratecreator/scripts migrate-categories-elastic
```

### Option B: Manual (Via Kibana Dev Tools)

1. Open Kibana (click **"Open Kibana"** in Elastic Cloud console)
2. Go to **Dev Tools** (hamburger menu → Management → Dev Tools)
3. Create accounts index:

```json
PUT /accounts
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
        "fields": { "keyword": { "type": "keyword" } }
      },
      "name": {
        "type": "text",
        "analyzer": "autocomplete",
        "search_analyzer": "autocomplete_search",
        "fields": { "keyword": { "type": "keyword" } }
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
      "claimed": { "type": "boolean" },
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

4. Create categories index:

```json
PUT /categories
{
  "settings": {
    "number_of_shards": 1,
    "number_of_replicas": 1
  },
  "mappings": {
    "properties": {
      "objectID": { "type": "keyword" },
      "name": { "type": "text", "fields": { "keyword": { "type": "keyword" } } },
      "slug": { "type": "keyword" },
      "shortDescription": { "type": "text" },
      "longDescription": { "type": "text" },
      "keywords": { "type": "text" },
      "parentId": { "type": "keyword" },
      "parentCategory": { "type": "text" },
      "parentSlug": { "type": "keyword" },
      "depth": { "type": "integer" },
      "popular": { "type": "boolean" },
      "path": { "type": "keyword" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" }
    }
  }
}
```

---

## 5. Environment Configuration

### Step 5.1: Update .env File

Add the following to your `.env` file:

```env
# Elasticsearch - Elastic Cloud on GCP
ELASTIC_CLOUD_ID=ratecreator-search:dXMtY2VudHJhbDEuZ2NwLmNsb3VkLmVzLmlvJGFiY2RlZjEyMzQ1Njc4OTAkYWJjZGVmMTIzNDU2Nzg5MA==
ELASTIC_API_KEY=your-api-key-here

# Optional: If using username/password instead of API key
# ELASTIC_USERNAME=elastic
# ELASTIC_PASSWORD=your-password

# Index names
ELASTIC_ACCOUNTS_INDEX=accounts
ELASTIC_CATEGORIES_INDEX=categories

# Feature flag for switching from Algolia to Elasticsearch
USE_ELASTICSEARCH=false
```

### Step 5.2: Environment-Specific Configuration

For different environments, use prefixed variables or separate .env files:

```env
# Production
ELASTIC_CLOUD_ID=ratecreator-prod:...
ELASTIC_API_KEY=prod-api-key

# Staging
# ELASTIC_CLOUD_ID=ratecreator-staging:...
# ELASTIC_API_KEY=staging-api-key
```

---

## 6. Run Migration

### Step 6.1: Install Dependencies

```bash
# From project root
yarn install
```

### Step 6.2: Choose Migration Strategy

#### Option A: Migrate from MongoDB (Recommended)

This pulls fresh data from your MongoDB database:

```bash
# Migrate all accounts (all platforms)
yarn workspace @ratecreator/scripts migrate-accounts-elastic

# Or migrate by platform for better control
yarn workspace @ratecreator/scripts migrate-accounts-elastic:youtube
yarn workspace @ratecreator/scripts migrate-accounts-elastic:twitter
yarn workspace @ratecreator/scripts migrate-accounts-elastic:tiktok
yarn workspace @ratecreator/scripts migrate-accounts-elastic:reddit
yarn workspace @ratecreator/scripts migrate-accounts-elastic:instagram

# Migrate categories
yarn workspace @ratecreator/scripts migrate-categories-elastic
```

#### Option B: Migrate from Algolia

If you want to copy existing Algolia data exactly:

```bash
# Migrate accounts from Algolia
yarn workspace @ratecreator/scripts migrate-from-algolia:accounts

# Migrate categories from Algolia
yarn workspace @ratecreator/scripts migrate-from-algolia:categories
```

### Step 6.3: Monitor Migration Progress

The scripts save checkpoints to JSON files in the scripts directory:

- `elastic_accounts_checkpoint.json`
- `elastic_youtube_accounts_checkpoint.json` (if using platform-specific)
- etc.

To resume a failed migration, just run the same command again - it will continue from the last checkpoint.

---

## 7. Verify Setup

### Step 7.1: Run Validation Script

```bash
yarn workspace @ratecreator/scripts validate-elastic-migration
```

This will check:

- Cluster health
- Document counts (compared to MongoDB)
- Search functionality
- Aggregations (facets)
- Filter queries

### Step 7.2: Manual Verification via Kibana

1. Open Kibana
2. Go to **Dev Tools**
3. Run test queries:

```json
# Check document count
GET /accounts/_count

# Test search
GET /accounts/_search
{
  "query": {
    "multi_match": {
      "query": "tech",
      "fields": ["name^3", "handle^2", "description"]
    }
  },
  "size": 5
}

# Test aggregations (facets)
GET /accounts/_search
{
  "size": 0,
  "aggs": {
    "platforms": { "terms": { "field": "platform" } },
    "countries": { "terms": { "field": "country", "size": 20 } },
    "categories": { "terms": { "field": "categories", "size": 50 } }
  }
}
```

---

## 8. Kibana Dashboard Setup

### Step 8.1: Create Index Pattern

1. Open Kibana
2. Go to **Stack Management** → **Index Patterns**
3. Click **"Create index pattern"**
4. Enter `accounts` as the pattern
5. Select `lastIndexedAt` as the time field
6. Repeat for `categories` (use `updatedAt`)

### Step 8.2: Create Visualizations

Create useful visualizations in **Dashboard** → **Create**:

1. **Platform Distribution** (Pie chart)
   - Aggregation: Terms on `platform`

2. **Accounts by Country** (Map or bar chart)
   - Aggregation: Terms on `country`

3. **Follower Distribution** (Histogram)
   - Aggregation: Histogram on `followerCount`

4. **Index Health** (Metric)
   - Count of documents
   - Last indexed date

---

## 9. Production Checklist

### Security

- [ ] API key created with minimal required permissions
- [ ] API key stored securely (not in git)
- [ ] Rotate API keys regularly (quarterly)
- [ ] Enable audit logging in Elastic Cloud

### Performance

- [ ] Shard count appropriate for data size (2 shards for <1M docs)
- [ ] Replica count set for HA (1 replica minimum)
- [ ] Consider index aliases for zero-downtime reindexing

### Monitoring

- [ ] Set up Elastic Cloud monitoring alerts
- [ ] Configure Slack/email notifications for:
  - Cluster health changes
  - High CPU/memory usage
  - Slow queries

### Backup

- [ ] Enable snapshot lifecycle management (SLM)
- [ ] Configure GCS bucket for backups
- [ ] Test backup restoration process

### Scaling Considerations

| Document Count | Recommended RAM | Shards |
| -------------- | --------------- | ------ |
| < 100K         | 2 GB            | 1      |
| 100K - 500K    | 4 GB            | 2      |
| 500K - 2M      | 8 GB            | 3      |
| 2M - 10M       | 16 GB           | 5      |
| > 10M          | 32+ GB          | 10+    |

---

## Troubleshooting

### Common Issues

#### "Connection refused" or timeout errors

1. Check that `ELASTIC_CLOUD_ID` is correct
2. Verify API key hasn't expired
3. Check if deployment is running in Elastic Cloud console

#### "index_not_found_exception"

Run the migration script which will create the index:

```bash
yarn workspace @ratecreator/scripts migrate-accounts-elastic
```

#### Slow search queries

1. Check cluster health in Kibana
2. Verify index has proper mappings
3. Consider adding more shards or RAM

#### Migration checkpoint errors

Delete the checkpoint file and restart:

```bash
rm elastic_accounts_checkpoint.json
yarn workspace @ratecreator/scripts migrate-accounts-elastic
```

---

## Next Steps

1. **Enable Feature Flag**: Once migration is complete and verified, set `USE_ELASTICSEARCH=true` in your web app to switch reads from Algolia to Elasticsearch.

2. **Deploy Kafka Consumer**: Deploy the `elastic-account-sync` consumer to keep Elasticsearch in sync with new/updated accounts.

3. **Dual-Write Period**: Run both Algolia and Elasticsearch consumers for 2 weeks to ensure parity.

4. **Decommission Algolia**: After successful validation, disable the Algolia consumer and cancel your Algolia subscription.

---

## Support Resources

- [Elastic Cloud Documentation](https://www.elastic.co/guide/en/cloud/current/index.html)
- [Elasticsearch Reference](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Kibana Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [Elastic Cloud Support](https://cloud.elastic.co/support)
