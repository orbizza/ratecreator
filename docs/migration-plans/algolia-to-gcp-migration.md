# Migration Plan: Algolia to GCP Native Search

## Executive Summary

This document outlines the migration strategy from Algolia to a GCP native search solution for the Rate Creator platform. After analyzing the current implementation and GCP offerings, we recommend **Vertex AI Search** as the primary solution with **Elasticsearch on GKE** as an alternative.

---

## Current Algolia Implementation

### Usage Overview

| Component       | Details                                              |
| --------------- | ---------------------------------------------------- |
| Primary Index   | `accounts` - Creator profiles (~100K+ records)       |
| Secondary Index | `categories` - Hierarchical category taxonomy        |
| Search Features | Full-text, faceted filtering, range queries, sorting |
| Update Pattern  | Event-driven via Kafka consumers                     |
| Query Volume    | Real-time search + batch imports                     |

### Key Features Used

1. **Full-Text Search**: name, handle, description, keywords, categories
2. **Faceted Filtering**: platform, country, language_code, categories, madeForKids
3. **Range Filters**: followerCount, rating, reviewCount, videoCount
4. **Sorting**: Multiple sort indices (followerCount, rating, reviewCount)
5. **Real-time Updates**: Partial updates for ratings, full sync for new accounts
6. **InstantSearch**: React components for command bar search

---

## GCP Native Alternatives Analysis

### Option 1: Vertex AI Search (Recommended)

**Overview**: Google's enterprise search service with AI-powered relevance and semantic understanding.

**Pros**:

- Native GCP integration
- Built-in faceted search and filtering
- Automatic relevance tuning with ML
- Schema-flexible (JSON documents)
- Supports real-time indexing
- Enterprise SLA (99.9%)

**Cons**:

- Higher cost than Algolia for small-scale
- Learning curve for configuration
- Less mature UI widget ecosystem

**Pricing**:

- $2.50 per 1000 documents indexed/month
- $1.50 per 1000 search queries
- Data storage: Standard GCS pricing

### Option 2: Elasticsearch on GKE

**Overview**: Self-managed Elasticsearch cluster on Google Kubernetes Engine.

**Pros**:

- Full control over configuration
- Mature ecosystem and tooling
- One-time migration from Algolia
- Cost-effective at scale
- Rich query DSL

**Cons**:

- Operational overhead (upgrades, scaling, monitoring)
- Requires Kubernetes expertise
- No managed SLA

**Pricing**:

- GKE cluster costs (~$100-500/month depending on size)
- Persistent disk storage

### Option 3: Elastic Cloud on GCP

**Overview**: Managed Elasticsearch service deployed on GCP infrastructure.

**Pros**:

- Managed service, no ops burden
- Full Elasticsearch features
- GCP VPC integration
- Kibana included

**Cons**:

- Third-party vendor (Elastic)
- Higher cost than self-managed
- Data egress charges

---

## Recommendation: Vertex AI Search

Vertex AI Search is recommended because:

1. **Native GCP Integration**: Aligns with existing GCP infrastructure (Vertex AI for translation/categorization)
2. **Automatic ML Ranking**: Improves search relevance without manual tuning
3. **Managed Service**: No operational overhead
4. **Schema Flexibility**: JSON documents match current Algolia structure
5. **Faceted Search**: Native support for filters and facets

---

## Migration Architecture

### New Search Flow

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Web App       │────▶│  Search API      │────▶│  Vertex AI      │
│   (React)       │     │  (Next.js API)   │     │  Search         │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                                                         │
                                                         ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Data Store (GCS)                             │
│   - accounts.ndjson                                              │
│   - categories.ndjson                                            │
└─────────────────────────────────────────────────────────────────┘
         ▲
         │
┌─────────────────┐
│  Kafka Consumer │
│  (Index Sync)   │
└─────────────────┘
```

### Vertex AI Search Components

1. **Data Store**: GCS bucket with NDJSON documents
2. **Search Engine**: Vertex AI Search app with schema
3. **Search API**: Cloud Function or API Gateway endpoint
4. **Sync Consumer**: Kafka consumer for real-time updates

---

## Implementation Plan

### Phase 1: Setup & Schema Design (Week 1-2)

#### 1.1 Create GCP Resources

```bash
# Enable APIs
gcloud services enable discoveryengine.googleapis.com
gcloud services enable storage.googleapis.com

# Create GCS bucket for data
gsutil mb -l us-central1 gs://ratecreator-search-data

# Create service account
gcloud iam service-accounts create vertex-search-sa \
    --display-name="Vertex AI Search Service Account"
```

#### 1.2 Define Search Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "properties": {
    "id": { "type": "string", "retrievable": true, "searchable": false },
    "platform": {
      "type": "string",
      "retrievable": true,
      "searchable": true,
      "indexable": true
    },
    "accountId": { "type": "string", "retrievable": true, "searchable": true },
    "handle": { "type": "string", "retrievable": true, "searchable": true },
    "name": { "type": "string", "retrievable": true, "searchable": true },
    "name_en": { "type": "string", "retrievable": true, "searchable": true },
    "description": {
      "type": "string",
      "retrievable": true,
      "searchable": true
    },
    "description_en": {
      "type": "string",
      "retrievable": true,
      "searchable": true
    },
    "keywords": { "type": "string", "retrievable": true, "searchable": true },
    "keywords_en": {
      "type": "string",
      "retrievable": true,
      "searchable": true
    },
    "imageUrl": { "type": "string", "retrievable": true, "searchable": false },
    "bannerUrl": { "type": "string", "retrievable": true, "searchable": false },
    "followerCount": {
      "type": "number",
      "retrievable": true,
      "searchable": false,
      "indexable": true
    },
    "country": {
      "type": "string",
      "retrievable": true,
      "searchable": true,
      "indexable": true
    },
    "language_code": {
      "type": "string",
      "retrievable": true,
      "searchable": true,
      "indexable": true
    },
    "rating": {
      "type": "number",
      "retrievable": true,
      "searchable": false,
      "indexable": true
    },
    "reviewCount": {
      "type": "number",
      "retrievable": true,
      "searchable": false,
      "indexable": true
    },
    "madeForKids": {
      "type": "boolean",
      "retrievable": true,
      "searchable": false,
      "indexable": true
    },
    "videoCount": {
      "type": "number",
      "retrievable": true,
      "searchable": false,
      "indexable": true
    },
    "viewCount": {
      "type": "number",
      "retrievable": true,
      "searchable": false,
      "indexable": true
    },
    "categories": {
      "type": "array",
      "items": { "type": "string" },
      "retrievable": true,
      "searchable": true,
      "indexable": true
    },
    "categoryNames": {
      "type": "array",
      "items": { "type": "string" },
      "retrievable": true,
      "searchable": true
    },
    "createdDate": {
      "type": "string",
      "retrievable": true,
      "searchable": false
    },
    "isSeeded": { "type": "boolean", "retrievable": true, "searchable": false },
    "lastIndexedAt": {
      "type": "string",
      "retrievable": true,
      "searchable": false
    }
  }
}
```

### Phase 2: Data Migration (Week 2-3)

#### 2.1 Export from Algolia

```typescript
// packages/scripts/src/migration/export-algolia-to-gcs.ts
import { getSearchClient } from "@ratecreator/db/algolia-client";
import { Storage } from "@google-cloud/storage";

async function exportAlgoliaToGCS() {
  const client = getSearchClient();
  const index = client.initIndex("accounts");
  const storage = new Storage();
  const bucket = storage.bucket("ratecreator-search-data");

  let allRecords: any[] = [];

  await index.browseObjects({
    batch: (hits) => {
      allRecords = allRecords.concat(hits);
    },
  });

  // Convert to NDJSON
  const ndjson = allRecords.map((r) => JSON.stringify(r)).join("\n");

  await bucket.file("accounts.ndjson").save(ndjson);
  console.log(`Exported ${allRecords.length} records to GCS`);
}
```

#### 2.2 Import to Vertex AI Search

```typescript
// packages/scripts/src/migration/import-to-vertex.ts
import { DiscoveryEngineServiceClient } from "@google-cloud/discoveryengine";

async function importToVertexAI() {
  const client = new DiscoveryEngineServiceClient();

  const [operation] = await client.importDocuments({
    parent: `projects/${PROJECT_ID}/locations/global/collections/default_collection/dataStores/${DATA_STORE_ID}/branches/default_branch`,
    bigquerySource: {
      projectId: PROJECT_ID,
      datasetId: "search_data",
      tableId: "accounts",
    },
    reconciliationMode: "FULL",
  });

  await operation.promise();
  console.log("Import completed");
}
```

### Phase 3: Search Client Implementation (Week 3-4)

#### 3.1 Create Vertex AI Search Client

```typescript
// packages/db/src/clients/vertex-search-client.ts
import { SearchServiceClient } from "@google-cloud/discoveryengine";

const PROJECT_ID = process.env.GCP_PROJECT_ID;
const LOCATION = "global";
const DATA_STORE_ID = process.env.VERTEX_SEARCH_DATA_STORE_ID;
const SERVING_CONFIG = "default_config";

let searchClient: SearchServiceClient | null = null;

export function getVertexSearchClient() {
  if (!searchClient) {
    searchClient = new SearchServiceClient();
  }
  return searchClient;
}

export interface VertexSearchParams {
  query?: string;
  page?: number;
  limit?: number;
  filters?: {
    platform?: string[];
    followers?: { min: number; max: number };
    rating?: { min: number; max: number };
    country?: string[];
    language?: string[];
    categories?: string[];
    madeForKids?: boolean;
  };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export async function searchAccounts(params: VertexSearchParams) {
  const client = getVertexSearchClient();

  const servingConfig = `projects/${PROJECT_ID}/locations/${LOCATION}/collections/default_collection/dataStores/${DATA_STORE_ID}/servingConfigs/${SERVING_CONFIG}`;

  // Build filter expression
  const filterParts: string[] = [];

  if (params.filters?.platform?.length) {
    filterParts.push(`platform: ANY("${params.filters.platform.join('","')}")`);
  }

  if (params.filters?.followers) {
    filterParts.push(`followerCount >= ${params.filters.followers.min}`);
    filterParts.push(`followerCount <= ${params.filters.followers.max}`);
  }

  if (params.filters?.rating) {
    filterParts.push(`rating >= ${params.filters.rating.min}`);
    filterParts.push(`rating <= ${params.filters.rating.max}`);
  }

  if (params.filters?.country?.length) {
    filterParts.push(`country: ANY("${params.filters.country.join('","')}")`);
  }

  if (params.filters?.categories?.length) {
    filterParts.push(
      `categories: ANY("${params.filters.categories.join('","')}")`,
    );
  }

  const filterExpression = filterParts.join(" AND ");

  // Build order by
  let orderBy = "";
  if (params.sortBy) {
    orderBy = `${params.sortBy} ${params.sortOrder === "asc" ? "ASC" : "DESC"}`;
  }

  const [response] = await client.search({
    servingConfig,
    query: params.query || "*",
    filter: filterExpression || undefined,
    orderBy: orderBy || undefined,
    pageSize: params.limit || 20,
    offset: ((params.page || 1) - 1) * (params.limit || 20),
    facetSpecs: [
      { facetKey: { key: "platform" } },
      { facetKey: { key: "categories" } },
      { facetKey: { key: "country" } },
      { facetKey: { key: "language_code" } },
    ],
  });

  // Transform response to match existing format
  return {
    hits: response.results?.map((r) => r.document?.structData) || [],
    nbHits: response.totalSize || 0,
    page: params.page || 1,
    nbPages: Math.ceil((response.totalSize || 0) / (params.limit || 20)),
    hitsPerPage: params.limit || 20,
    facets: transformFacets(response.facets || []),
  };
}

function transformFacets(facets: any[]) {
  const result: Record<string, Record<string, number>> = {};

  for (const facet of facets) {
    const key = facet.key;
    result[key] = {};

    for (const value of facet.values || []) {
      result[key][value.value] = value.count;
    }
  }

  return result;
}
```

#### 3.2 Update API Route

```typescript
// apps/web/app/api/search/accounts/route.ts
import { searchAccounts } from "@ratecreator/db/vertex-search-client";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;

  const params = {
    query: searchParams.get("query") || undefined,
    page: parseInt(searchParams.get("page") || "1"),
    limit: parseInt(searchParams.get("limit") || "20"),
    filters: {
      platform: searchParams.getAll("platform"),
      country: searchParams.getAll("country"),
      categories: searchParams.getAll("categories"),
      // ... other filters
    },
    sortBy: searchParams.get("sortBy") || undefined,
    sortOrder: (searchParams.get("sortOrder") as "asc" | "desc") || undefined,
  };

  const results = await searchAccounts(params);
  return NextResponse.json(results);
}
```

### Phase 4: Real-time Sync Consumer (Week 4-5)

#### 4.1 Update Kafka Consumer

```typescript
// apps/consumers/vertex-search-sync/src/index.ts
import { DiscoveryEngineServiceClient } from "@google-cloud/discoveryengine";
import {
  getKafkaConsumer,
  createTopicIfNotExists,
} from "@ratecreator/db/kafka-client";

const client = new DiscoveryEngineServiceClient();
const PARENT = `projects/${PROJECT_ID}/locations/global/collections/default_collection/dataStores/${DATA_STORE_ID}/branches/default_branch`;

async function indexDocument(document: any) {
  await client.createDocument({
    parent: PARENT,
    documentId: document.objectID,
    document: {
      id: document.objectID,
      structData: document,
    },
  });
}

async function updateDocument(documentId: string, updates: any) {
  await client.updateDocument({
    document: {
      name: `${PARENT}/documents/${documentId}`,
      structData: updates,
    },
    allowMissing: false,
  });
}

async function deleteDocument(documentId: string) {
  await client.deleteDocument({
    name: `${PARENT}/documents/${documentId}`,
  });
}

// Consumer setup similar to existing algolia-account-sync
```

### Phase 5: Testing & Validation (Week 5-6)

#### 5.1 Search Parity Tests

```typescript
// packages/scripts/src/migration/validate-search-parity.ts
import { getSearchAccounts as algoliaSearch } from "@ratecreator/db/algolia-client";
import { searchAccounts as vertexSearch } from "@ratecreator/db/vertex-search-client";

async function validateSearchParity() {
  const testQueries = [
    { query: "gaming", filters: { platform: ["YOUTUBE"] } },
    { query: "tech", filters: { followers: { min: 100000, max: 1000000 } } },
    { query: "", filters: { categories: ["entertainment"] } },
  ];

  for (const params of testQueries) {
    const algoliaResults = await algoliaSearch(params);
    const vertexResults = await vertexSearch(params);

    console.log(`Query: ${JSON.stringify(params)}`);
    console.log(`Algolia: ${algoliaResults.nbHits} results`);
    console.log(`Vertex: ${vertexResults.nbHits} results`);

    // Compare top 10 results
    const algoliaIds = algoliaResults.hits
      .slice(0, 10)
      .map((h: any) => h.objectID);
    const vertexIds = vertexResults.hits.slice(0, 10).map((h: any) => h.id);

    const overlap = algoliaIds.filter((id: string) => vertexIds.includes(id));
    console.log(`Overlap: ${overlap.length}/10`);
    console.log("---");
  }
}
```

### Phase 6: Cutover & Cleanup (Week 6-7)

#### 6.1 Feature Flag Rollout

```typescript
// packages/features/src/search-provider.ts
export function useSearchProvider() {
  const useVertexSearch = process.env.USE_VERTEX_SEARCH === "true";

  if (useVertexSearch) {
    return {
      search: vertexSearch,
      client: "vertex",
    };
  }

  return {
    search: algoliaSearch,
    client: "algolia",
  };
}
```

#### 6.2 Gradual Rollout

1. **Week 6**: Enable Vertex Search for 10% of traffic (canary)
2. **Week 6.5**: Increase to 50% if no issues
3. **Week 7**: Full cutover to Vertex Search
4. **Week 8**: Decommission Algolia integration

---

## Cost Comparison

### Current Algolia Costs (Estimated)

| Item                            | Cost            |
| ------------------------------- | --------------- |
| Search operations (~500K/month) | ~$250/month     |
| Records (~100K)                 | ~$50/month      |
| **Total**                       | **~$300/month** |

### Projected Vertex AI Search Costs

| Item                         | Cost              |
| ---------------------------- | ----------------- |
| Documents indexed (100K)     | $250/month        |
| Search queries (~500K/month) | $750/month        |
| GCS storage                  | ~$5/month         |
| **Total**                    | **~$1,005/month** |

### Alternative: Elasticsearch on GKE

| Item                                 | Cost            |
| ------------------------------------ | --------------- |
| GKE cluster (3 nodes, e2-standard-2) | ~$200/month     |
| Persistent disks (100GB SSD)         | ~$20/month      |
| **Total**                            | **~$220/month** |

**Recommendation**: If cost is a primary concern, Elasticsearch on GKE is more economical. However, Vertex AI Search provides better managed experience and ML capabilities.

---

## Risk Mitigation

| Risk                             | Mitigation                                   |
| -------------------------------- | -------------------------------------------- |
| Search result quality difference | Run A/B tests comparing relevance            |
| Real-time sync latency           | Monitor indexing lag, implement retry        |
| Feature parity gaps              | Document all Algolia features, map to Vertex |
| Cost overrun                     | Set up billing alerts, monitor usage         |
| Rollback needed                  | Keep Algolia active during transition        |

---

## Dependencies

### New GCP Packages

```json
{
  "@google-cloud/discoveryengine": "^1.0.0",
  "@google-cloud/storage": "^7.0.0"
}
```

### Environment Variables

```env
# Vertex AI Search
GCP_PROJECT_ID=ratecreator-prod
VERTEX_SEARCH_DATA_STORE_ID=accounts-search
VERTEX_SEARCH_SERVING_CONFIG=default_config

# Feature Flag
USE_VERTEX_SEARCH=false
```

---

## Success Metrics

1. **Search latency**: P95 < 200ms (match Algolia baseline)
2. **Search relevance**: Click-through rate within 5% of Algolia
3. **Index freshness**: Real-time updates < 30 seconds
4. **System availability**: 99.9% uptime
5. **Cost**: Stay within 150% of Algolia cost or justify with features

---

## Timeline Summary

| Week | Phase     | Deliverables                         |
| ---- | --------- | ------------------------------------ |
| 1-2  | Setup     | GCP resources, schema definition     |
| 2-3  | Migration | Data export, import, validation      |
| 3-4  | Client    | Search client, API routes            |
| 4-5  | Sync      | Kafka consumer, real-time updates    |
| 5-6  | Testing   | Parity tests, performance benchmarks |
| 6-7  | Cutover   | Feature flag rollout, cleanup        |

**Total Duration**: 7 weeks
