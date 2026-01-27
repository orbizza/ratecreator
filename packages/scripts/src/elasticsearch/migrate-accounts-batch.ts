/**
 * Migrate Accounts from MongoDB to Elasticsearch
 *
 * This script migrates all account data from MongoDB to Elasticsearch (Elastic Cloud on GCP).
 * It uses checkpoint-based resumption for reliability with large datasets.
 *
 * Usage:
 *   yarn migrate-accounts-elastic
 *
 * Environment Variables Required:
 *   - DATABASE_URL_ONLINE: MongoDB connection string
 *   - ELASTIC_CLOUD_ID: Elastic Cloud deployment ID
 *   - ELASTIC_API_KEY: Elastic Cloud API key
 *   - ELASTIC_ACCOUNTS_INDEX: Index name (default: 'accounts')
 */

import { getPrismaClient } from "@ratecreator/db/client";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { Client } from "@elastic/elasticsearch";
import { ObjectId, Db } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load the main .env file
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

// Configuration
const BATCH_SIZE = 5000; // Accounts per database query
const ELASTIC_BATCH_SIZE = 500; // Documents per Elasticsearch bulk request
const CHECKPOINT_FILE = "elastic_accounts_checkpoint.json";
const ELASTIC_INDEX = process.env.ELASTIC_ACCOUNTS_INDEX || "accounts";

// Elasticsearch client singleton
let elasticClient: Client | null = null;

function getElasticsearchClient(): Client {
  if (!elasticClient) {
    const cloudId = process.env.ELASTIC_CLOUD_ID;
    const apiKey = process.env.ELASTIC_API_KEY;
    const username = process.env.ELASTIC_USERNAME;
    const password = process.env.ELASTIC_PASSWORD;

    if (cloudId && apiKey) {
      elasticClient = new Client({
        cloud: { id: cloudId },
        auth: { apiKey },
      });
    } else if (cloudId && username && password) {
      elasticClient = new Client({
        cloud: { id: cloudId },
        auth: { username, password },
      });
    } else {
      throw new Error(
        "Elasticsearch credentials not configured. Set ELASTIC_CLOUD_ID and ELASTIC_API_KEY",
      );
    }
  }
  return elasticClient;
}

interface Checkpoint {
  lastProcessedId: string | null;
  totalProcessed: number;
  totalIndexed: number;
  errors: Array<{ id: string; error: string }>;
  startedAt: string;
  lastUpdatedAt: string;
  platform: string | null;
}

interface CategoryMapping {
  _id: ObjectId;
  categoryId: ObjectId;
}

interface Category {
  _id: ObjectId;
  slug: string;
  name: string;
}

interface PlatformData {
  snippet?: {
    publishedAt?: string;
  };
  status?: {
    madeForKids?: boolean;
  };
  statistics?: {
    videoCount?: number;
    viewCount?: string;
  };
  brandingSettings?: {
    image?: {
      bannerExternalUrl?: string;
    };
  };
}

// Cache for category data
const categoryCache = new Map<string, { slug: string; name: string }>();

const loadCheckpoint = (platform?: string): Checkpoint => {
  const checkpointFile = platform
    ? `elastic_${platform.toLowerCase()}_accounts_checkpoint.json`
    : CHECKPOINT_FILE;

  try {
    if (fs.existsSync(checkpointFile)) {
      return JSON.parse(fs.readFileSync(checkpointFile, "utf8"));
    }
  } catch (error) {
    console.error("Error loading checkpoint:", error);
  }
  return {
    lastProcessedId: null,
    totalProcessed: 0,
    totalIndexed: 0,
    errors: [],
    startedAt: new Date().toISOString(),
    lastUpdatedAt: new Date().toISOString(),
    platform: platform || null,
  };
};

const saveCheckpoint = (checkpoint: Checkpoint) => {
  const checkpointFile = checkpoint.platform
    ? `elastic_${checkpoint.platform.toLowerCase()}_accounts_checkpoint.json`
    : CHECKPOINT_FILE;

  try {
    checkpoint.lastUpdatedAt = new Date().toISOString();
    fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    console.error("Error saving checkpoint:", error);
  }
};

const getCategoryData = async (
  categoryMappingIds: string[],
  db: Db,
): Promise<{ slugs: string[]; names: string[] }> => {
  if (categoryMappingIds.length === 0) {
    return { slugs: [], names: [] };
  }

  const uncachedIds = categoryMappingIds.filter((id) => !categoryCache.has(id));

  if (uncachedIds.length > 0) {
    try {
      // Fetch category mappings
      const categoryMappings = await db
        .collection<CategoryMapping>("CategoryMapping")
        .find({ _id: { $in: uncachedIds.map((id) => new ObjectId(id)) } })
        .toArray();

      const categoryIds = categoryMappings.map((mapping) => mapping.categoryId);

      // Fetch categories
      const categories = await db
        .collection<Category>("Category")
        .find({ _id: { $in: categoryIds } })
        .project({ slug: 1, name: 1, _id: 1 })
        .toArray();

      // Update cache
      categoryMappings.forEach((mapping) => {
        const category = categories.find(
          (c) => c._id.toString() === mapping.categoryId.toString(),
        );
        const mappingId = mapping._id.toString();
        if (category) {
          categoryCache.set(mappingId, {
            slug: category.slug,
            name: category.name,
          });
        }
      });
    } catch (error) {
      console.error("Error fetching category data:", error);
    }
  }

  const slugs: string[] = [];
  const names: string[] = [];

  categoryMappingIds.forEach((id) => {
    const cached = categoryCache.get(id);
    if (cached) {
      slugs.push(cached.slug);
      names.push(cached.name);
    }
  });

  return { slugs, names };
};

const buildElasticDocument = (
  account: any,
  categorySlugs: string[],
  categoryNames: string[],
) => {
  const platformData = (account.ytData ||
    account.xData ||
    account.tiktokData ||
    account.redditData ||
    account.instagramData) as PlatformData | null;

  return {
    objectID: account.accountId,
    platform: account.platform,
    accountId: account.accountId,
    handle: account.handle || "",
    name: account.name || "",
    name_en: account.name_en || "",
    description: account.description || "",
    description_en: account.description_en || "",
    keywords: account.keywords || "",
    keywords_en: account.keywords_en || "",
    imageUrl: account.imageUrl || "",
    bannerUrl:
      account.bannerUrl ||
      platformData?.brandingSettings?.image?.bannerExternalUrl ||
      "",
    followerCount: account.followerCount || 0,
    country: account.country || "",
    language_code: account.language_code || "",
    rating: account.rating || 0,
    reviewCount: account.reviewCount || 0,
    madeForKids: platformData?.status?.madeForKids ?? false,
    claimed: account.claimed ?? false,
    videoCount: Number(platformData?.statistics?.videoCount ?? 0),
    viewCount: Number(platformData?.statistics?.viewCount ?? 0),
    categories: categorySlugs,
    categoryNames: categoryNames,
    createdDate:
      platformData?.snippet?.publishedAt ||
      account.createdAt?.toISOString() ||
      null,
    isSeeded: account.isSeeded || false,
    lastIndexedAt: new Date().toISOString(),
  };
};

const createIndexIfNotExists = async (client: Client) => {
  try {
    const indexExists = await client.indices.exists({ index: ELASTIC_INDEX });

    if (!indexExists) {
      console.log(`Creating index: ${ELASTIC_INDEX}`);
      await client.indices.create({
        index: ELASTIC_INDEX,
        body: {
          settings: {
            number_of_shards: 2,
            number_of_replicas: 1,
            "index.mapping.total_fields.limit": 2000,
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
              },
              filter: {
                autocomplete_filter: {
                  type: "edge_ngram",
                  min_gram: 1,
                  max_gram: 20,
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
                fields: { keyword: { type: "keyword" } },
              },
              name: {
                type: "text",
                analyzer: "autocomplete",
                search_analyzer: "autocomplete_search",
                fields: { keyword: { type: "keyword" } },
              },
              name_en: {
                type: "text",
                analyzer: "autocomplete",
                search_analyzer: "autocomplete_search",
              },
              description: { type: "text" },
              description_en: { type: "text" },
              keywords: { type: "text" },
              keywords_en: { type: "text" },
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
      console.log(`Index ${ELASTIC_INDEX} created successfully`);
    } else {
      console.log(`Index ${ELASTIC_INDEX} already exists`);
    }
  } catch (error) {
    console.error("Error creating index:", error);
    throw error;
  }
};

const bulkIndexToElasticsearch = async (
  client: Client,
  documents: any[],
): Promise<{ success: number; failed: number; errors: string[] }> => {
  if (documents.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }

  const operations = documents.flatMap((doc) => [
    { index: { _index: ELASTIC_INDEX, _id: doc.objectID } },
    doc,
  ]);

  try {
    const response = await client.bulk({ body: operations, refresh: false });

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    if (response.errors) {
      response.items.forEach((item, idx) => {
        if (item.index?.error) {
          failed++;
          errors.push(
            `${documents[idx].accountId}: ${item.index.error.reason}`,
          );
        } else {
          success++;
        }
      });
    } else {
      success = documents.length;
    }

    return { success, failed, errors };
  } catch (error: any) {
    console.error("Bulk indexing error:", error.message);
    return { success: 0, failed: documents.length, errors: [error.message] };
  }
};

const migrateAccounts = async (platform?: string) => {
  console.log("=".repeat(60));
  console.log("Elasticsearch Account Migration");
  console.log("=".repeat(60));
  console.log(`Platform: ${platform || "ALL"}`);
  console.log(`Batch Size: ${BATCH_SIZE}`);
  console.log(`Elastic Batch Size: ${ELASTIC_BATCH_SIZE}`);
  console.log(`Index: ${ELASTIC_INDEX}`);
  console.log("=".repeat(60));

  const prisma = getPrismaClient();
  const mongoClient = await getMongoClient();
  const db = mongoClient.db("ratecreator");
  const elasticClient = getElasticsearchClient();

  // Create index if not exists
  await createIndexIfNotExists(elasticClient);

  const checkpoint = loadCheckpoint(platform);
  console.log(`\nResuming from checkpoint:`);
  console.log(`  - Total Processed: ${checkpoint.totalProcessed}`);
  console.log(`  - Total Indexed: ${checkpoint.totalIndexed}`);
  console.log(`  - Errors: ${checkpoint.errors.length}`);
  console.log(`  - Last ID: ${checkpoint.lastProcessedId || "START"}`);
  console.log("");

  try {
    let processedCount = 0;
    let indexedCount = 0;
    const startTime = Date.now();

    while (true) {
      // Build query
      const whereClause: any = {
        isSuspended: false,
        isDeleted: false,
      };

      if (platform) {
        whereClause.platform = platform.toUpperCase();
      }

      if (checkpoint.lastProcessedId) {
        whereClause.id = { gt: checkpoint.lastProcessedId };
      }

      // Fetch batch from database
      const accounts = await prisma.account.findMany({
        where: whereClause,
        orderBy: { id: "asc" },
        take: BATCH_SIZE,
        include: { categories: true },
      });

      if (accounts.length === 0) {
        console.log("\nNo more accounts to process.");
        break;
      }

      console.log(`\nProcessing batch of ${accounts.length} accounts...`);

      // Build documents for Elasticsearch
      const elasticDocuments: any[] = [];

      for (const account of accounts) {
        try {
          const categoryMappingIds = account.categories.map((c) => c.id);
          const { slugs, names } = await getCategoryData(
            categoryMappingIds,
            db,
          );

          const doc = buildElasticDocument(account, slugs, names);
          elasticDocuments.push(doc);

          checkpoint.lastProcessedId = account.id;
          checkpoint.totalProcessed++;

          // Bulk index when batch is full
          if (elasticDocuments.length >= ELASTIC_BATCH_SIZE) {
            const result = await bulkIndexToElasticsearch(
              elasticClient,
              elasticDocuments,
            );
            indexedCount += result.success;
            checkpoint.totalIndexed += result.success;

            if (result.errors.length > 0) {
              result.errors.forEach((err) => {
                checkpoint.errors.push({ id: "bulk", error: err });
              });
            }

            elasticDocuments.length = 0; // Clear array
          }
        } catch (error: any) {
          console.error(
            `Error processing account ${account.accountId}:`,
            error.message,
          );
          checkpoint.errors.push({
            id: account.id,
            error: error.message,
          });
        }
      }

      // Index remaining documents
      if (elasticDocuments.length > 0) {
        const result = await bulkIndexToElasticsearch(
          elasticClient,
          elasticDocuments,
        );
        indexedCount += result.success;
        checkpoint.totalIndexed += result.success;
      }

      processedCount += accounts.length;

      // Calculate and display progress
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      const rate = processedCount / elapsedMinutes;

      console.log(
        `  Processed: ${processedCount} | Indexed: ${indexedCount} | Rate: ${rate.toFixed(0)} acc/min | Errors: ${checkpoint.errors.length}`,
      );

      // Save checkpoint
      saveCheckpoint(checkpoint);

      // Update lastIndexedAt in MongoDB
      await db.collection("Account").updateMany(
        {
          _id: {
            $in: accounts.map((a) => new ObjectId(a.id)),
          },
        },
        { $set: { lastIndexedAt: new Date() } },
      );
    }

    // Final refresh to make documents searchable
    console.log("\nRefreshing index...");
    await elasticClient.indices.refresh({ index: ELASTIC_INDEX });

    // Final summary
    const totalTime = (Date.now() - startTime) / 1000;
    console.log("\n" + "=".repeat(60));
    console.log("MIGRATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`Total Processed: ${checkpoint.totalProcessed}`);
    console.log(`Total Indexed: ${checkpoint.totalIndexed}`);
    console.log(`Total Errors: ${checkpoint.errors.length}`);
    console.log(`Total Time: ${(totalTime / 60).toFixed(2)} minutes`);
    console.log(
      `Average Rate: ${(checkpoint.totalProcessed / (totalTime / 60)).toFixed(0)} accounts/minute`,
    );

    if (checkpoint.errors.length > 0) {
      console.log(`\nErrors saved to checkpoint file`);
    }
  } catch (error) {
    console.error("\nFatal error:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
let platform: string | undefined;

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--platform" && args[i + 1]) {
    platform = args[i + 1];
  }
}

// Run migration
migrateAccounts(platform);
