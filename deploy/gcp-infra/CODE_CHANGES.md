# Code Changes Required for GCP Migration

After the infrastructure is set up, these code changes are needed to connect to the new services.

---

## 1. Redis Client: Remove TLS

**File:** `packages/db/src/clients/redis-do.ts`

**Problem:** The current client hard-codes `tls: {}`, which enables TLS. Valkey on the GCE VM doesn't have TLS configured — it relies on password auth + firewall for security.

**Change:**

```diff
 redisClient = new Redis({
   host,
   port,
   username: process.env.REDIS_USERNAME || "",
   password: process.env.REDIS_PASSWORD || "",
-  tls: {},
+  ...(process.env.REDIS_TLS === "true" ? { tls: {} } : {}),
 });
```

This makes TLS opt-in via `REDIS_TLS=true` env var. Set it for DigitalOcean (which requires TLS), leave it unset for GCE Valkey.

**Vercel env vars:**

- For GCE: `REDIS_TLS` not set (no TLS)
- For DO (during migration overlap): `REDIS_TLS=true`

---

## 2. Elasticsearch Client: Support No-Auth Mode

**File:** `packages/db/src/clients/elasticsearch-client.ts`

**Problem:** The current client requires either `ELASTIC_URL + ELASTIC_API_KEY` or `ELASTIC_CLOUD_ID + ELASTIC_API_KEY`. OpenSearch with security disabled doesn't need any auth.

**Change in `getElasticsearchClient()`:**

```diff
 export function getElasticsearchClient(): Client {
   if (!elasticClient) {
     const url = process.env.ELASTIC_URL;
     const cloudId = process.env.ELASTIC_CLOUD_ID;
     const apiKey = process.env.ELASTIC_API_KEY;

-    if (url && apiKey) {
-      // Serverless: direct endpoint URL
-      elasticClient = new Client({
-        node: url,
-        auth: { apiKey },
-      });
-    } else if (cloudId && apiKey) {
+    if (url && !apiKey) {
+      // Self-hosted (OpenSearch): no auth needed
+      elasticClient = new Client({
+        node: url,
+      });
+    } else if (url && apiKey) {
+      // Serverless: direct endpoint URL with API key
+      elasticClient = new Client({
+        node: url,
+        auth: { apiKey },
+      });
+    } else if (cloudId && apiKey) {
       // Hosted: Cloud ID based
       elasticClient = new Client({
         cloud: { id: cloudId },
         auth: { apiKey },
       });
     } else {
       throw new Error(
-        "Elasticsearch credentials not configured. Set ELASTIC_URL + ELASTIC_API_KEY (serverless) or ELASTIC_CLOUD_ID + ELASTIC_API_KEY (hosted)",
+        "Elasticsearch credentials not configured. Set ELASTIC_URL (self-hosted), ELASTIC_URL + ELASTIC_API_KEY (serverless), or ELASTIC_CLOUD_ID + ELASTIC_API_KEY (hosted)",
       );
     }
   }

   return elasticClient;
 }
```

**Vercel env vars:**

- For GCE OpenSearch: `ELASTIC_URL=http://<STATIC_IP>:9200` (no API key)
- For Elastic Cloud (during migration): keep `ELASTIC_CLOUD_ID` + `ELASTIC_API_KEY`

### OpenSearch API Compatibility Note

The `@elastic/elasticsearch` client works with OpenSearch 2.x because OpenSearch
forked from Elasticsearch 7.10 and maintains backward compatibility. If you encounter
issues, you can switch to `@opensearch-project/opensearch` which is API-identical:

```bash
yarn add @opensearch-project/opensearch
```

```typescript
import { Client } from "@opensearch-project/opensearch";
// Same API as @elastic/elasticsearch
```

---

## 3. OpenSearch Index Creation

The existing `createIndices()` function and `ACCOUNTS_INDEX_SETTINGS` should work
as-is with OpenSearch 2.x. The analyzer types (edge_ngram, ngram, keyword) and
mapping types (text, keyword, long, float, boolean, date) are all supported.

**One caveat:** The `body` parameter in search/index calls may need to be unwrapped
in newer versions of the client. If you see deprecation warnings, change:

```diff
- await client.search({ index: ACCOUNTS_INDEX, body: { query: ... } });
+ await client.search({ index: ACCOUNTS_INDEX, query: ..., aggs: ..., sort: ... });
```

---

## 4. Environment Variable Summary

### Current (DigitalOcean)

```env
REDIS_HOST=<do-redis-host>
REDIS_PORT=25061
REDIS_USERNAME=default
REDIS_PASSWORD=<do-redis-password>
# (implicit TLS via tls: {})

ELASTIC_CLOUD_ID=<elastic-cloud-id>
ELASTIC_API_KEY=<elastic-api-key>

DATABASE_URL_ONLINE=mongodb+srv://doadmin:<password>@<do-mongo-host>/ratecreator?tls=true&authSource=admin&replicaSet=...
```

### New (GCP)

```env
REDIS_HOST=<gce-static-ip>
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=<valkey-password>
# No REDIS_TLS — plain TCP

ELASTIC_URL=http://<gce-static-ip>:9200
# No ELASTIC_API_KEY — security disabled

DATABASE_URL_ONLINE=mongodb://ratecreator:<password>@<gce-static-ip>:27017/ratecreator?authSource=admin
# OR Firestore MongoDB-compat URI
```

---

## Migration Sequence for Zero Downtime

1. Deploy code changes (Redis TLS toggle, ES no-auth mode) to Vercel
2. Keep DO env vars — verify app still works
3. Set up GCE infrastructure (run deploy scripts)
4. Migrate data (MongoDB, reindex OpenSearch)
5. Switch Vercel env vars to GCE endpoints
6. Monitor for 1-2 weeks
7. Decommission DigitalOcean
