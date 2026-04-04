/**
 * Migrate Accounts from MongoDB to Elasticsearch
 *
 * Uses raw MongoDB cursor (not Prisma) for fast batch processing of 2.4M+ accounts.
 * Checkpoint-based resumption — safe to re-run if interrupted.
 *
 * Usage:
 *   yarn migrate-accounts-elastic
 *   yarn migrate-accounts-elastic -- --platform youtube
 */

import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { Client, type ClientOptions } from "@opensearch-project/opensearch";
import { MongoClient, ObjectId } from "mongodb";

// Load env BEFORE any db client usage
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

// Direct MongoDB connection (bypasses the eager-init mongo-client wrapper)
let mongoClient: MongoClient | null = null;

async function getMongoClient(): Promise<MongoClient> {
  if (!mongoClient) {
    const uri = process.env.DATABASE_URL_ONLINE;
    if (!uri) throw new Error("DATABASE_URL_ONLINE not set in .env");
    mongoClient = new MongoClient(uri);
    await mongoClient.connect();
  }
  return mongoClient;
}

const BATCH_SIZE = 5000;
const ELASTIC_BATCH_SIZE = 500;
const CHECKPOINT_FILE = "elastic_accounts_checkpoint.json";
const ELASTIC_INDEX = process.env.ELASTIC_ACCOUNTS_INDEX || "accounts";

// ── ES Client ───────────────────────────────────────────────

let elasticClient: Client | null = null;

function getElasticsearchClient(): Client {
  if (!elasticClient) {
    const url = process.env.ELASTIC_URL;
    const username = process.env.ELASTIC_USERNAME;
    const password = process.env.ELASTIC_PASSWORD;

    if (!url) throw new Error("ELASTIC_URL not configured");
    const opts: ClientOptions = {
      node: url,
      ssl: { rejectUnauthorized: false },
      ...(username && password ? { auth: { username, password } } : {}),
    };
    elasticClient = new Client(opts);
  }
  return elasticClient;
}

// ── Checkpoint ──────────────────────────────────────────────

interface Checkpoint {
  lastProcessedId: string | null;
  totalProcessed: number;
  totalIndexed: number;
  errors: Array<{ id: string; error: string }>;
  startedAt: string;
  lastUpdatedAt: string;
  platform: string | null;
}

function loadCheckpoint(platform?: string): Checkpoint {
  const file = platform
    ? `elastic_${platform.toLowerCase()}_accounts_checkpoint.json`
    : CHECKPOINT_FILE;

  try {
    if (fs.existsSync(file)) {
      return JSON.parse(fs.readFileSync(file, "utf8"));
    }
  } catch {}

  return {
    lastProcessedId: null,
    totalProcessed: 0,
    totalIndexed: 0,
    errors: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    platform: platform || null,
  };
}

function saveCheckpoint(checkpoint: Checkpoint) {
  const file = checkpoint.platform
    ? `elastic_${checkpoint.platform.toLowerCase()}_accounts_checkpoint.json`
    : CHECKPOINT_FILE;

  checkpoint.lastUpdatedAt = new Date().toISOString();
  fs.writeFileSync(file, JSON.stringify(checkpoint, null, 2));
}

// ── Category Cache ──────────────────────────────────────────

const categoryIdToSlug = new Map<string, string>();
const accountToCategories = new Map<string, string[]>();

async function preloadCaches(db: any) {
  // 1. Load all category slugs
  console.log("Preloading category slugs...");
  const categories = await db
    .collection("Category")
    .find({})
    .project({ _id: 1, slug: 1 })
    .toArray();

  for (const cat of categories) {
    categoryIdToSlug.set(cat._id.toString(), cat.slug);
  }
  console.log(`  ${categoryIdToSlug.size} categories cached`);

  // 2. Load ALL category mappings into memory (accountId → slugs)
  console.log("Preloading category mappings...");
  const cursor = db
    .collection("CategoryMapping")
    .find({})
    .project({ accountId: 1, categoryId: 1 })
    .batchSize(50000);

  let mappingCount = 0;
  for await (const mapping of cursor) {
    if (!mapping.accountId || !mapping.categoryId) {
      mappingCount++;
      continue;
    }
    const accId = mapping.accountId.toString();
    const slug = categoryIdToSlug.get(mapping.categoryId.toString());
    if (slug) {
      const existing = accountToCategories.get(accId);
      if (existing) {
        existing.push(slug);
      } else {
        accountToCategories.set(accId, [slug]);
      }
    }
    mappingCount++;
    if (mappingCount % 500000 === 0) {
      console.log(`  ...${mappingCount} mappings loaded`);
    }
  }
  console.log(
    `  ${mappingCount} mappings cached for ${accountToCategories.size} accounts`,
  );
}

function getCategorySlugs(accountId: string): string[] {
  return accountToCategories.get(accountId) || [];
}

// ── Build Document ──────────────────────────────────────────

function buildDocument(account: any, categorySlugs: string[]) {
  const pd =
    account.ytData ||
    account.xData ||
    account.tiktokData ||
    account.redditData ||
    account.instagramData;

  return {
    objectID: account.accountId,
    platform: account.platform,
    handle: account.handle || "",
    name: account.name_en || account.name || "",
    description: account.description_en || account.description || "",
    keywords: account.keywords_en || account.keywords || "",
    followerCount: account.followerCount || 0,
    imageUrl: account.imageUrl || "",
    country: account.country || "",
    language_code: account.language_code || "",
    rating: account.rating || 0,
    reviewCount: account.reviewCount || 0,
    madeForKids: pd?.status?.madeForKids ?? false,
    videoCount:
      Number(pd?.statistics?.videoCount ?? 0) ||
      Number(account.xData?.public_metrics?.tweet_count ?? 0) ||
      Number(account.tiktokData?.videos ?? 0),
    bannerUrl:
      account.bannerUrl ?? pd?.brandingSettings?.image?.bannerExternalUrl ?? "",
    categories: categorySlugs,
    categoryNames: categorySlugs.map((slug) => slug.replace(/-/g, " ")),
    createdDate: pd?.snippet?.publishedAt ?? null,
  };
}

// ── Bulk Index ──────────────────────────────────────────────

async function bulkIndex(
  client: Client,
  docs: any[],
): Promise<{ success: number; failed: number }> {
  if (docs.length === 0) return { success: 0, failed: 0 };

  const ops = docs.flatMap((doc) => [
    { index: { _index: ELASTIC_INDEX, _id: doc.objectID } },
    doc,
  ]);

  const res = await client.bulk({ body: ops, refresh: false });

  if (res.body.errors) {
    let success = 0,
      failed = 0;
    res.body.items.forEach((item: Record<string, { error?: unknown }>) => {
      if (item.index?.error) failed++;
      else success++;
    });
    return { success, failed };
  }

  return { success: docs.length, failed: 0 };
}

// ── Create Index ────────────────────────────────────────────

async function createIndexIfNotExists(client: Client) {
  const existsResp = await client.indices.exists({ index: ELASTIC_INDEX });
  if (existsResp.body) {
    console.log(`Index ${ELASTIC_INDEX} already exists`);
    return;
  }

  console.log(`Creating index: ${ELASTIC_INDEX}`);
  await client.indices.create({
    index: ELASTIC_INDEX,
    body: {
      settings: {
        analysis: {
          analyzer: {
            autocomplete: {
              type: "custom",
              tokenizer: "standard",
              filter: ["lowercase", "autocomplete_filter"],
            },
            autocomplete_search: {
              type: "custom",
              tokenizer: "standard",
              filter: ["lowercase"],
            },
            infix: {
              type: "custom",
              tokenizer: "standard",
              filter: ["lowercase", "infix_filter"],
            },
            exact_lowercase: {
              type: "custom",
              tokenizer: "keyword",
              filter: ["lowercase", "trim"],
            },
          },
          filter: {
            autocomplete_filter: {
              type: "edge_ngram",
              min_gram: 2,
              max_gram: 20,
            },
            infix_filter: {
              type: "ngram",
              min_gram: 4,
              max_gram: 5,
            },
          },
        },
      },
      mappings: {
        properties: {
          objectID: { type: "keyword" },
          platform: { type: "keyword" },
          accountId: { type: "keyword" },
          handle: {
            type: "text",
            analyzer: "autocomplete",
            search_analyzer: "autocomplete_search",
            fields: {
              keyword: { type: "keyword" },
              exact: { type: "text", analyzer: "exact_lowercase" },
              infix: {
                type: "text",
                analyzer: "infix",
                search_analyzer: "autocomplete_search",
              },
            },
          },
          name: {
            type: "text",
            analyzer: "autocomplete",
            search_analyzer: "autocomplete_search",
            fields: {
              keyword: { type: "keyword" },
              exact: { type: "text", analyzer: "exact_lowercase" },
              infix: {
                type: "text",
                analyzer: "infix",
                search_analyzer: "autocomplete_search",
              },
            },
          },
          description: { type: "text" },
          keywords: { type: "text" },
          imageUrl: { type: "keyword", index: false },
          bannerUrl: { type: "keyword", index: false },
          followerCount: { type: "long" },
          country: { type: "keyword" },
          language_code: { type: "keyword" },
          rating: { type: "float" },
          reviewCount: { type: "integer" },
          madeForKids: { type: "boolean" },
          claimed: { type: "boolean" },
          videoCount: { type: "integer" },
          viewCount: { type: "long" },
          categories: { type: "keyword" },
          categoryNames: { type: "text" },
          createdDate: { type: "date" },
          isSeeded: { type: "boolean" },
          lastIndexedAt: { type: "date" },
        },
      },
    },
  });
  console.log(`Index ${ELASTIC_INDEX} created`);
}

// ── Main ────────────────────────────────────────────────────

async function migrateAccounts(platform?: string) {
  console.log("=".repeat(60));
  console.log("Elasticsearch Account Migration (raw MongoDB)");
  console.log("=".repeat(60));
  console.log(`Platform: ${platform || "ALL"}`);
  console.log(`Index: ${ELASTIC_INDEX}`);
  console.log("=".repeat(60));

  const mongoClient = await getMongoClient();
  const db = mongoClient.db("ratecreator");
  const esClient = getElasticsearchClient();

  await createIndexIfNotExists(esClient);
  // Skip category preload for speed — categories will be empty initially
  // Run backfill later: yarn migrate-accounts-elastic -- --backfill-categories
  const skipCategories = !args.includes("--backfill-categories");
  if (!skipCategories) {
    await preloadCaches(db);
  } else {
    console.log(
      "Skipping category preload (run with --backfill-categories later)",
    );
  }

  const checkpoint = loadCheckpoint(platform);
  console.log(
    `\nCheckpoint: ${checkpoint.totalProcessed} processed, ${checkpoint.totalIndexed} indexed`,
  );

  // Build MongoDB query
  const query: any = { isSuspended: false };
  if (platform) query.platform = platform.toUpperCase();
  if (checkpoint.lastProcessedId) {
    query._id = { $gt: new ObjectId(checkpoint.lastProcessedId) };
  }

  // Count total
  const totalCount = await db.collection("Account").countDocuments(query);
  console.log(`Accounts to process: ${totalCount}\n`);

  if (totalCount === 0) {
    console.log("No accounts to process.");
    process.exit(0);
  }

  const startTime = Date.now();
  let processedCount = 0;
  let indexedCount = 0;
  let elasticDocs: any[] = [];

  // Use MongoDB cursor for memory-efficient batch processing
  const cursor = db
    .collection("Account")
    .find(query)
    .sort({ _id: 1 })
    .batchSize(BATCH_SIZE)
    .project({
      _id: 1,
      accountId: 1,
      platform: 1,
      handle: 1,
      name: 1,
      name_en: 1,
      description: 1,
      description_en: 1,
      keywords: 1,
      keywords_en: 1,
      followerCount: 1,
      imageUrl: 1,
      bannerUrl: 1,
      country: 1,
      language_code: 1,
      rating: 1,
      reviewCount: 1,
      ytData: 1,
      xData: 1,
      tiktokData: 1,
      redditData: 1,
      instagramData: 1,
    });

  for await (const account of cursor) {
    const accountId = account._id.toString();
    const slugs = getCategorySlugs(accountId);
    const doc = buildDocument(account, slugs);
    elasticDocs.push(doc);

    checkpoint.lastProcessedId = accountId;
    checkpoint.totalProcessed++;
    processedCount++;

    // Bulk index when batch full
    if (elasticDocs.length >= ELASTIC_BATCH_SIZE) {
      const result = await bulkIndex(esClient, elasticDocs);
      indexedCount += result.success;
      checkpoint.totalIndexed += result.success;
      elasticDocs = [];

      // Progress every 5000
      if (processedCount % BATCH_SIZE === 0) {
        const elapsedMin = (Date.now() - startTime) / 60000;
        const rate = processedCount / elapsedMin;
        const remaining = (totalCount - processedCount) / rate;
        console.log(
          `  Processed: ${processedCount}/${totalCount} | Indexed: ${indexedCount} | ${rate.toFixed(0)} acc/min | ETA: ${remaining.toFixed(1)} min`,
        );
        saveCheckpoint(checkpoint);
      }
    }
  }

  // Flush remaining
  if (elasticDocs.length > 0) {
    const result = await bulkIndex(esClient, elasticDocs);
    indexedCount += result.success;
    checkpoint.totalIndexed += result.success;
  }

  saveCheckpoint(checkpoint);

  // Refresh index
  console.log("\nRefreshing index...");
  await esClient.indices.refresh({ index: ELASTIC_INDEX });

  const totalTime = (Date.now() - startTime) / 1000;
  console.log("\n" + "=".repeat(60));
  console.log("MIGRATION COMPLETE");
  console.log("=".repeat(60));
  console.log(`Total Processed: ${checkpoint.totalProcessed}`);
  console.log(`Total Indexed: ${checkpoint.totalIndexed}`);
  console.log(`Total Errors: ${checkpoint.errors.length}`);
  console.log(`Total Time: ${(totalTime / 60).toFixed(2)} minutes`);
  console.log(
    `Average Rate: ${(processedCount / (totalTime / 60)).toFixed(0)} accounts/minute`,
  );

  process.exit(0);
}

// Parse args
const args = process.argv.slice(2);
let platform: string | undefined;
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--platform" && args[i + 1]) platform = args[i + 1];
}

migrateAccounts(platform).catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
