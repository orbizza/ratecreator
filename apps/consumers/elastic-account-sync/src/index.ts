import {
  getKafkaConsumer,
  createTopicIfNotExists,
  disconnectProducer,
} from "@ratecreator/db/kafka-client";
import { getPrismaClient } from "@ratecreator/db/client";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { Client } from "@elastic/elasticsearch";

const app = new Hono();
const prisma = getPrismaClient();

// Health check endpoint
app.get("/health", (c) =>
  c.json({ status: "healthy", service: "elastic-account-sync" }),
);

// Initialize Elasticsearch client
let elasticClient: Client | null = null;

function getElasticsearchClient(): Client {
  if (!elasticClient) {
    const cloudId = process.env.ELASTIC_CLOUD_ID;
    const apiKey = process.env.ELASTIC_API_KEY;
    const username = process.env.ELASTIC_USERNAME;
    const password = process.env.ELASTIC_PASSWORD;

    if (cloudId && apiKey) {
      // API Key authentication (recommended)
      elasticClient = new Client({
        cloud: { id: cloudId },
        auth: { apiKey },
      });
    } else if (cloudId && username && password) {
      // Basic authentication
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

const ELASTIC_INDEX = process.env.ELASTIC_ACCOUNTS_INDEX || "accounts";

let consumer: ReturnType<typeof getKafkaConsumer>;

interface AccountCategorisedEvent {
  accountId: string;
  platform: string;
  categoryIds: string[];
}

interface ElasticAccountRecord {
  objectID: string;
  platform: string;
  accountId: string;
  handle?: string;
  name?: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  keywords?: string;
  keywords_en?: string;
  imageUrl?: string;
  bannerUrl?: string;
  followerCount?: number;
  country?: string;
  language_code?: string;
  rating?: number;
  reviewCount?: number;
  madeForKids?: boolean;
  claimed?: boolean;
  videoCount?: number;
  viewCount?: number;
  categories: string[];
  categoryNames: string[];
  createdDate?: string;
  isSeeded: boolean;
  lastIndexedAt: string;
}

async function getAccountForIndexing(
  accountId: string,
): Promise<ElasticAccountRecord | null> {
  const mongoClient = await getMongoClient();
  const db = mongoClient.db("ratecreator");

  const account = await db
    .collection("Account")
    .findOne({ _id: new ObjectId(accountId) });

  if (!account) {
    return null;
  }

  // Get category mappings
  const categoryMappings = await db
    .collection("CategoryMapping")
    .find({ accountId: new ObjectId(accountId) })
    .toArray();

  // Get category names
  const categories = await db
    .collection("Category")
    .find({ _id: { $in: categoryMappings.map((cm) => cm.categoryId) } })
    .toArray();

  const categoryNames = categories.map((c) => c.name);
  const categorySlugs = categories.map((c) => c.slug);

  return {
    objectID: account.accountId,
    platform: account.platform,
    accountId: account.accountId,
    handle: account.handle,
    name: account.name,
    name_en: account.name_en,
    description: account.description,
    description_en: account.description_en,
    keywords: account.keywords,
    keywords_en: account.keywords_en,
    imageUrl: account.imageUrl,
    bannerUrl: account.bannerUrl,
    followerCount: account.followerCount,
    country: account.country,
    language_code: account.language_code,
    rating: account.rating,
    reviewCount: account.reviewCount,
    madeForKids: account.madeForKids,
    claimed: account.claimed,
    videoCount: account.videoCount,
    viewCount: account.viewCount,
    categories: categorySlugs,
    categoryNames: categoryNames,
    createdDate: account.createdAt?.toISOString(),
    isSeeded: account.isSeeded || false,
    lastIndexedAt: new Date().toISOString(),
  };
}

async function indexToElasticsearch(
  record: ElasticAccountRecord,
): Promise<boolean> {
  const maxRetries = 3;
  let retryCount = 0;
  const client = getElasticsearchClient();

  while (retryCount < maxRetries) {
    try {
      await client.index({
        index: ELASTIC_INDEX,
        id: record.objectID,
        body: record,
        refresh: true,
      });

      console.log(`Indexed account ${record.accountId} to Elasticsearch`);
      return true;
    } catch (error: any) {
      retryCount++;
      console.error(
        `Failed to index to Elasticsearch (attempt ${retryCount}/${maxRetries}):`,
        error.message,
      );

      if (retryCount === maxRetries) {
        return false;
      }

      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)),
      );
    }
  }

  return false;
}

async function processMessage(message: any) {
  if (!message.value) {
    console.error("Invalid message: value is null");
    return;
  }

  const payload: AccountCategorisedEvent = JSON.parse(message.value.toString());
  const { accountId } = payload;

  console.log(`Processing Elasticsearch sync for account ${accountId}`);

  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    // Get full account data for indexing
    const record = await getAccountForIndexing(accountId);

    if (!record) {
      console.error(`Account ${accountId} not found for indexing`);
      return;
    }

    // Index to Elasticsearch
    const success = await indexToElasticsearch(record);

    if (success) {
      // Update lastIndexedAt in MongoDB
      await db.collection("Account").updateOne(
        { _id: new ObjectId(accountId) },
        {
          $set: {
            lastIndexedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );

      console.log(
        `Successfully synced account ${accountId} to Elasticsearch with ${record.categories.length} categories`,
      );
    } else {
      console.error(
        `Failed to sync account ${accountId} to Elasticsearch after retries`,
      );
    }
  } catch (error) {
    console.error(
      `Error processing Elasticsearch sync for account ${accountId}:`,
      error,
    );
  }
}

async function createIndexIfNotExists() {
  const client = getElasticsearchClient();

  try {
    const indexExists = await client.indices.exists({ index: ELASTIC_INDEX });

    if (!indexExists) {
      await client.indices.create({
        index: ELASTIC_INDEX,
        body: {
          settings: {
            number_of_shards: 2,
            number_of_replicas: 1,
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
      console.log(`Created Elasticsearch index: ${ELASTIC_INDEX}`);
    } else {
      console.log(`Elasticsearch index ${ELASTIC_INDEX} already exists`);
    }
  } catch (error) {
    console.error("Error creating Elasticsearch index:", error);
    throw error;
  }
}

async function startConsumer() {
  try {
    // Create index if not exists
    await createIndexIfNotExists();

    consumer = getKafkaConsumer("elastic-account-sync-group");

    consumer.on("consumer.connect", () => {
      console.log("Elastic-account-sync consumer connected successfully");
    });

    consumer.on("consumer.disconnect", () => {
      console.log("Elastic-account-sync consumer disconnected");
    });

    consumer.on("consumer.crash", (error) => {
      console.error("Elastic-account-sync consumer crashed:", error);
    });

    await consumer.connect();

    // Subscribe to account-categorised topic (same as Algolia consumer)
    const topicName = "account-categorised";
    await createTopicIfNotExists(topicName);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    console.log(
      `Elastic-account-sync consumer started and subscribed to ${topicName}`,
    );

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received message:", message?.value?.toString());
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start elastic-account-sync consumer:", error);
    setTimeout(() => {
      console.log("Attempting to reconnect...");
      startConsumer().catch(console.error);
    }, 5000);
  }
}

async function stopConsumer() {
  if (consumer) {
    await consumer.disconnect();
  }
  await prisma.$disconnect();
  await disconnectProducer();
  console.log("Elastic-account-sync consumer connections closed");
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received. Shutting down...");
  await stopConsumer();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received. Shutting down...");
  await stopConsumer();
  process.exit(0);
});

// Start the HTTP server for health checks
const port = parseInt(process.env.PORT || "3045");
serve({ fetch: app.fetch, port });
console.log(`Health check server running on port ${port}`);

// Start the consumer
console.log("Starting elastic-account-sync consumer service...");
startConsumer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
