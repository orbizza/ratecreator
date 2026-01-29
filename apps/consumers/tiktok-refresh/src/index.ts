import {
  getKafkaConsumer,
  createTopicIfNotExists,
  disconnectProducer,
} from "@ratecreator/db/kafka-client";
import { getPrismaClient } from "@ratecreator/db/client";
import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();
const prisma = getPrismaClient();
const redis = getRedisClient();

// Health check endpoint
app.get("/health", (c) =>
  c.json({ status: "healthy", service: "tiktok-refresh" }),
);

let consumer: ReturnType<typeof getKafkaConsumer>;

// Rate limiting: TikTok API has strict limits (~1000 req/day)
// Safe limit: ~40 calls/hour
const RATE_LIMIT_KEY = "tiktok_api_rate_limit";
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const RATE_LIMIT_MAX = 40; // Max calls per hour

interface DataRefreshEvent {
  accountId: string;
  platform: string;
  scheduledAt: string;
}

async function checkRateLimit(): Promise<boolean> {
  const current = await redis.incr(RATE_LIMIT_KEY);

  if (current === 1) {
    await redis.expire(RATE_LIMIT_KEY, RATE_LIMIT_WINDOW);
  }

  return current <= RATE_LIMIT_MAX;
}

async function fetchTikTokProfile(username: string): Promise<any | null> {
  // TikTok API requires official API access with client credentials
  // This is a placeholder implementation
  const clientKey = process.env.TIKTOK_CLIENT_KEY;
  const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

  if (!clientKey || !clientSecret) {
    console.log("TikTok API credentials not configured - using placeholder");
    // Return null to indicate API not configured
    // In production, this would fetch from TikTok's official API
    return null;
  }

  // Check rate limit
  const canProceed = await checkRateLimit();
  if (!canProceed) {
    console.warn("TikTok API rate limit reached, skipping refresh");
    return null;
  }

  try {
    // TikTok Research API endpoint (requires business account)
    // This is a simplified example - actual implementation would use
    // TikTok's official Research API or Marketing API
    console.log(
      `TikTok API fetch for ${username} - full implementation pending`,
    );

    // Placeholder return
    return null;
  } catch (error) {
    console.error("Error fetching TikTok data:", error);
    return null;
  }
}

async function processMessage(message: any) {
  if (!message.value) {
    console.error("Invalid message: value is null");
    return;
  }

  const payload: DataRefreshEvent = JSON.parse(message.value.toString());
  const { accountId, platform } = payload;

  if (platform.toUpperCase() !== "TIKTOK") {
    console.error(`Invalid platform for tiktok-refresh: ${platform}`);
    return;
  }

  console.log(`Processing TikTok refresh for account ${accountId}`);

  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    // Get account to retrieve username
    const account = await db
      .collection("Account")
      .findOne({ _id: new ObjectId(accountId) });

    if (!account) {
      console.error(`Account ${accountId} not found`);
      return;
    }

    // Create refresh log
    const refreshLog = await db.collection("DataRefreshLog").insertOne({
      accountId: new ObjectId(accountId),
      platform: "TIKTOK",
      status: "IN_PROGRESS",
      startedAt: new Date(),
    });

    // Fetch fresh data from TikTok
    const freshData = await fetchTikTokProfile(
      account.handle || account.accountId,
    );

    if (!freshData) {
      console.log(
        `TikTok API not configured or failed for ${account.accountId}`,
      );

      await db.collection("DataRefreshLog").updateOne(
        { _id: refreshLog.insertedId },
        {
          $set: {
            status: "FAILED",
            completedAt: new Date(),
            error: "TikTok API not configured or fetch failed",
          },
        },
      );
      return;
    }

    // Update account with new data
    const updateData: any = {
      tiktokData: freshData,
      lastDataRefresh: new Date(),
      updatedAt: new Date(),
    };

    if (freshData.followers !== undefined) {
      updateData.followerCount = freshData.followers;
    }
    if (freshData.name) {
      updateData.name = freshData.name;
    }
    if (freshData.description) {
      updateData.description = freshData.description;
    }
    if (freshData.profileImage) {
      updateData.imageUrl = freshData.profileImage;
    }

    await db
      .collection("Account")
      .updateOne(
        { _id: new ObjectId(accountId) },
        { $set: updateData },
        { maxTimeMS: 10000 },
      );

    // Update refresh log as completed
    await db.collection("DataRefreshLog").updateOne(
      { _id: refreshLog.insertedId },
      {
        $set: {
          status: "COMPLETED",
          completedAt: new Date(),
          dataSnapshot: { before: account.tiktokData, after: freshData },
        },
      },
    );

    // Update Redis cache if exists
    const cacheKey = `accounts-tiktok-${account.accountId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const existingData = JSON.parse(cachedData);
      const updatedCacheData = {
        ...existingData,
        account: {
          ...existingData.account,
          ...updateData,
          tiktokData: freshData,
        },
      };
      await redis.set(cacheKey, JSON.stringify(updatedCacheData));
    }

    console.log(`Successfully refreshed TikTok data for account ${accountId}`);
  } catch (error) {
    console.error(
      `Error refreshing TikTok data for account ${accountId}:`,
      error,
    );
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("tiktok-refresh-group");

    consumer.on("consumer.connect", () => {
      console.log("TikTok-refresh consumer connected successfully");
    });

    consumer.on("consumer.disconnect", () => {
      console.log("TikTok-refresh consumer disconnected");
    });

    consumer.on("consumer.crash", (error) => {
      console.error("TikTok-refresh consumer crashed:", error);
    });

    await consumer.connect();

    // Subscribe to data-refresh-tiktok topic
    const topicName = "data-refresh-tiktok";
    await createTopicIfNotExists(topicName);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    console.log(
      `TikTok-refresh consumer started and subscribed to ${topicName}`,
    );

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received message:", message?.value?.toString());
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start tiktok-refresh consumer:", error);
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
  console.log("TikTok-refresh consumer connections closed");
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
const port = parseInt(process.env.PORT || "3051");
serve({ fetch: app.fetch, port });
console.log(`Health check server running on port ${port}`);

// Start the consumer
console.log("Starting tiktok-refresh consumer service...");
startConsumer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
