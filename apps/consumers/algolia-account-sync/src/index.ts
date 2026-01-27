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
import { algoliasearch } from "algoliasearch";

const app = new Hono();
const prisma = getPrismaClient();

// Health check endpoint
app.get("/health", (c) =>
  c.json({ status: "healthy", service: "algolia-account-sync" }),
);

// Initialize Algolia client
const algoliaClient = algoliasearch(
  process.env.ALGOLIA_APP_ID || "",
  process.env.ALGOLIA_WRITE_API_KEY || "",
);

const ALGOLIA_INDEX = process.env.ALGOLIA_ACCOUNT_INDEX || "accounts";

let consumer: ReturnType<typeof getKafkaConsumer>;

interface AccountCategorisedEvent {
  accountId: string;
  platform: string;
  categoryIds: string[];
}

interface AlgoliaAccountRecord {
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
  categories: string[];
  categoryNames: string[];
  isSeeded: boolean;
  lastIndexedAt: string;
}

async function getAccountForIndexing(
  accountId: string,
): Promise<AlgoliaAccountRecord | null> {
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

  const categoryIds = categoryMappings.map((cm) => cm.categoryId.toString());

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
    categories: categorySlugs,
    categoryNames: categoryNames,
    isSeeded: account.isSeeded || false,
    lastIndexedAt: new Date().toISOString(),
  };
}

async function indexToAlgolia(record: AlgoliaAccountRecord): Promise<boolean> {
  const maxRetries = 3;
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      await algoliaClient.saveObject({
        indexName: ALGOLIA_INDEX,
        body: record,
      });

      console.log(`Indexed account ${record.accountId} to Algolia`);
      return true;
    } catch (error: any) {
      retryCount++;
      console.error(
        `Failed to index to Algolia (attempt ${retryCount}/${maxRetries}):`,
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
  const { accountId, platform } = payload;

  console.log(`Processing Algolia sync for account ${accountId}`);

  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    // Get full account data for indexing
    const record = await getAccountForIndexing(accountId);

    if (!record) {
      console.error(`Account ${accountId} not found for indexing`);
      return;
    }

    // Index to Algolia
    const success = await indexToAlgolia(record);

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
        `Successfully synced account ${accountId} to Algolia with ${record.categories.length} categories`,
      );
    } else {
      console.error(
        `Failed to sync account ${accountId} to Algolia after retries`,
      );
    }
  } catch (error) {
    console.error(
      `Error processing Algolia sync for account ${accountId}:`,
      error,
    );
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("algolia-account-sync-group");

    consumer.on("consumer.connect", () => {
      console.log("Algolia-account-sync consumer connected successfully");
    });

    consumer.on("consumer.disconnect", () => {
      console.log("Algolia-account-sync consumer disconnected");
    });

    consumer.on("consumer.crash", (error) => {
      console.error("Algolia-account-sync consumer crashed:", error);
    });

    await consumer.connect();

    // Subscribe to account-categorised topic
    const topicName = "account-categorised";
    await createTopicIfNotExists(topicName);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    console.log(
      `Algolia-account-sync consumer started and subscribed to ${topicName}`,
    );

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received message:", message?.value?.toString());
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start algolia-account-sync consumer:", error);
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
  console.log("Algolia-account-sync consumer connections closed");
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
const port = parseInt(process.env.PORT || "3044");
serve({ fetch: app.fetch, port });
console.log(`Health check server running on port ${port}`);

// Start the consumer
console.log("Starting algolia-account-sync consumer service...");
startConsumer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
