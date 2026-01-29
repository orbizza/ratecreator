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
  c.json({ status: "healthy", service: "youtube-refresh" }),
);

let consumer: ReturnType<typeof getKafkaConsumer>;

// Rate limiting: 10,000 units/day for YouTube API
// Cost per channels.list call: ~3 units
// Safe limit: ~3,000 calls/day = ~125 calls/hour
const RATE_LIMIT_KEY = "youtube_api_rate_limit";
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const RATE_LIMIT_MAX = 125; // Max calls per hour

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

async function fetchYouTubeChannelData(channelId: string): Promise<any | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY not configured");
    return null;
  }

  // Check rate limit
  const canProceed = await checkRateLimit();
  if (!canProceed) {
    console.warn("YouTube API rate limit reached, skipping refresh");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`,
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.error("YouTube API rate limited (429)");
        // Decrement counter since this didn't count
        await redis.decr(RATE_LIMIT_KEY);
      }
      console.error(`YouTube API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      return null;
    }

    const channel = data.items[0];
    return {
      name: channel.snippet.title,
      description: channel.snippet.description,
      followers: parseInt(channel.statistics.subscriberCount) || 0,
      profileImage:
        channel.snippet.thumbnails?.high?.url ||
        channel.snippet.thumbnails?.default?.url,
      bannerImage: channel.brandingSettings?.image?.bannerExternalUrl,
      country: channel.snippet.country,
      keywords: channel.brandingSettings?.channel?.keywords || "",
      customUrl: channel.snippet.customUrl,
      viewCount: parseInt(channel.statistics.viewCount) || 0,
      videoCount: parseInt(channel.statistics.videoCount) || 0,
      hiddenSubscriberCount: channel.statistics.hiddenSubscriberCount || false,
    };
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
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

  if (platform.toUpperCase() !== "YOUTUBE") {
    console.error(`Invalid platform for youtube-refresh: ${platform}`);
    return;
  }

  console.log(`Processing YouTube refresh for account ${accountId}`);

  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    // Get account to retrieve channel ID
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
      platform: "YOUTUBE",
      status: "IN_PROGRESS",
      startedAt: new Date(),
    });

    // Fetch fresh data from YouTube
    const freshData = await fetchYouTubeChannelData(account.accountId);

    if (!freshData) {
      console.error(
        `Failed to fetch YouTube data for channel ${account.accountId}`,
      );

      await db.collection("DataRefreshLog").updateOne(
        { _id: refreshLog.insertedId },
        {
          $set: {
            status: "FAILED",
            completedAt: new Date(),
            error: "Failed to fetch data from YouTube API",
          },
        },
      );
      return;
    }

    // Update account with new data
    const updateData: any = {
      ytData: freshData,
      lastDataRefresh: new Date(),
      updatedAt: new Date(),
    };

    // Update follower count if changed
    if (freshData.followers !== account.followerCount) {
      updateData.followerCount = freshData.followers;
    }

    // Update other fields if they've changed
    if (freshData.name && freshData.name !== account.name) {
      updateData.name = freshData.name;
    }
    if (
      freshData.description &&
      freshData.description !== account.description
    ) {
      updateData.description = freshData.description;
    }
    if (freshData.profileImage && freshData.profileImage !== account.imageUrl) {
      updateData.imageUrl = freshData.profileImage;
    }
    if (freshData.bannerImage && freshData.bannerImage !== account.bannerUrl) {
      updateData.bannerUrl = freshData.bannerImage;
    }
    if (freshData.country && freshData.country !== account.country) {
      updateData.country = freshData.country;
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
          dataSnapshot: { before: account.ytData, after: freshData },
        },
      },
    );

    // Update Redis cache if exists
    const cacheKey = `accounts-youtube-${account.accountId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const existingData = JSON.parse(cachedData);
      const updatedCacheData = {
        ...existingData,
        account: {
          ...existingData.account,
          ...updateData,
          ytData: freshData,
        },
      };
      await redis.set(cacheKey, JSON.stringify(updatedCacheData));
    }

    console.log(`Successfully refreshed YouTube data for account ${accountId}`);
  } catch (error) {
    console.error(
      `Error refreshing YouTube data for account ${accountId}:`,
      error,
    );
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("youtube-refresh-group");

    consumer.on("consumer.connect", () => {
      console.log("YouTube-refresh consumer connected successfully");
    });

    consumer.on("consumer.disconnect", () => {
      console.log("YouTube-refresh consumer disconnected");
    });

    consumer.on("consumer.crash", (error) => {
      console.error("YouTube-refresh consumer crashed:", error);
    });

    await consumer.connect();

    // Subscribe to data-refresh-youtube topic
    const topicName = "data-refresh-youtube";
    await createTopicIfNotExists(topicName);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    console.log(
      `YouTube-refresh consumer started and subscribed to ${topicName}`,
    );

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received message:", message?.value?.toString());
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start youtube-refresh consumer:", error);
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
  console.log("YouTube-refresh consumer connections closed");
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
const port = parseInt(process.env.PORT || "3050");
serve({ fetch: app.fetch, port });
console.log(`Health check server running on port ${port}`);

// Start the consumer
console.log("Starting youtube-refresh consumer service...");
startConsumer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
