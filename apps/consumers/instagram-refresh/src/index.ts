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
  c.json({ status: "healthy", service: "instagram-refresh" }),
);

let consumer: ReturnType<typeof getKafkaConsumer>;

// Rate limiting for Instagram API
// Business Discovery API has limits based on your app's rate limits
// Safe limit: ~200 calls/hour
const RATE_LIMIT_KEY = "instagram_api_rate_limit";
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const RATE_LIMIT_MAX = 200; // Max calls per hour

interface DataRefreshEvent {
  accountId: string;
  platform: string;
  scheduledAt: string;
}

interface InstagramData {
  name?: string;
  description?: string;
  followers?: number;
  profileImage?: string;
  following?: number;
  mediaCount?: number;
  isVerified?: boolean;
  isBusinessAccount?: boolean;
  externalUrl?: string;
}

async function checkRateLimit(): Promise<boolean> {
  const current = await redis.incr(RATE_LIMIT_KEY);

  if (current === 1) {
    await redis.expire(RATE_LIMIT_KEY, RATE_LIMIT_WINDOW);
  }

  return current <= RATE_LIMIT_MAX;
}

function parseInstagramCount(countStr: string): number {
  if (!countStr) return 0;

  const cleaned = countStr.replace(/,/g, "").trim();
  const multipliers: Record<string, number> = {
    K: 1000,
    M: 1000000,
    B: 1000000000,
  };

  const match = cleaned.match(/^([\d.]+)([KMB])?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const suffix = match[2]?.toUpperCase();
    return suffix ? Math.round(num * multipliers[suffix]) : Math.round(num);
  }

  return parseInt(cleaned) || 0;
}

async function fetchInstagramData(
  username: string,
): Promise<InstagramData | null> {
  // Check rate limit
  const canProceed = await checkRateLimit();
  if (!canProceed) {
    console.warn("Instagram API rate limit reached, skipping refresh");
    return null;
  }

  const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;
  const businessAccountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

  // Try Graph API first if credentials available
  if (accessToken && businessAccountId) {
    try {
      const response = await fetch(
        `https://graph.facebook.com/v19.0/${businessAccountId}?fields=business_discovery.username(${username}){username,name,biography,profile_picture_url,followers_count,follows_count,media_count,website}&access_token=${accessToken}`,
      );

      if (response.ok) {
        const data = await response.json();
        const profile = data.business_discovery;

        if (profile) {
          return {
            name: profile.name || profile.username,
            description: profile.biography || "",
            followers: profile.followers_count || 0,
            profileImage: profile.profile_picture_url,
            following: profile.follows_count || 0,
            mediaCount: profile.media_count || 0,
            externalUrl: profile.website,
            isBusinessAccount: true,
            isVerified: false,
          };
        }
      } else if (response.status === 429) {
        console.error("Instagram API rate limited (429)");
        await redis.decr(RATE_LIMIT_KEY);
        return null;
      }
    } catch (error) {
      console.error("Error fetching Instagram data via Graph API:", error);
    }
  }

  // Fallback to scraping public data
  try {
    const response = await fetch(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });

    if (!response.ok) {
      console.error(`Instagram scrape error: ${response.status}`);
      return null;
    }

    const html = await response.text();

    // Extract from meta tags
    const ogTitleMatch = html.match(
      /<meta property="og:title" content="([^"]+)"/,
    );
    const ogDescMatch = html.match(
      /<meta property="og:description" content="([^"]+)"/,
    );
    const ogImageMatch = html.match(
      /<meta property="og:image" content="([^"]+)"/,
    );

    const title = ogTitleMatch ? ogTitleMatch[1] : "";
    const description = ogDescMatch ? ogDescMatch[1] : "";
    const image = ogImageMatch ? ogImageMatch[1] : "";

    // Parse followers from description (format: "X Followers, X Following, X Posts")
    const statsMatch = description.match(
      /([\d,.]+[KMB]?)\s*Followers.*?([\d,.]+[KMB]?)\s*Following.*?([\d,.]+[KMB]?)\s*Posts/i,
    );

    let followersCount = 0;
    let followingCount = 0;
    let mediaCount = 0;

    if (statsMatch) {
      followersCount = parseInstagramCount(statsMatch[1]);
      followingCount = parseInstagramCount(statsMatch[2]);
      mediaCount = parseInstagramCount(statsMatch[3]);
    }

    // Extract name from title (format: "Name (@username)")
    const nameMatch = title.match(/^(.+?)\s*\(@/);
    const fullName = nameMatch ? nameMatch[1].trim() : username;

    // Check for verified badge
    const isVerified =
      html.includes('"is_verified":true') || html.includes("verified_badge");

    // Extract biography from description
    const parts = description.split(" - ");
    const biography = parts.length > 1 ? parts.slice(1).join(" - ").trim() : "";

    return {
      name: fullName,
      description: biography,
      followers: followersCount,
      profileImage: image,
      following: followingCount,
      mediaCount,
      isVerified,
      isBusinessAccount: false,
    };
  } catch (error) {
    console.error("Error scraping Instagram data:", error);
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

  if (platform.toUpperCase() !== "INSTAGRAM") {
    console.error(`Invalid platform for instagram-refresh: ${platform}`);
    return;
  }

  console.log(`Processing Instagram refresh for account ${accountId}`);

  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    // Get account to retrieve username/handle
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
      platform: "INSTAGRAM",
      status: "IN_PROGRESS",
      startedAt: new Date(),
    });

    // Fetch fresh data from Instagram
    const username = account.handle || account.accountId;
    const freshData = await fetchInstagramData(username);

    if (!freshData) {
      console.error(`Failed to fetch Instagram data for user ${username}`);

      await db.collection("DataRefreshLog").updateOne(
        { _id: refreshLog.insertedId },
        {
          $set: {
            status: "FAILED",
            completedAt: new Date(),
            error: "Failed to fetch data from Instagram",
          },
        },
      );
      return;
    }

    // Update account with new data
    const updateData: any = {
      instagramData: freshData,
      lastDataRefresh: new Date(),
      updatedAt: new Date(),
    };

    // Update follower count if changed
    if (
      freshData.followers !== undefined &&
      freshData.followers !== account.followerCount
    ) {
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
          dataSnapshot: { before: account.instagramData, after: freshData },
        },
      },
    );

    // Update Redis cache if exists
    const cacheKey = `accounts-instagram-${account.accountId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const existingData = JSON.parse(cachedData);
      const updatedCacheData = {
        ...existingData,
        account: {
          ...existingData.account,
          ...updateData,
          instagramData: freshData,
        },
      };
      await redis.set(cacheKey, JSON.stringify(updatedCacheData));
    }

    console.log(
      `Successfully refreshed Instagram data for account ${accountId}`,
    );
  } catch (error) {
    console.error(
      `Error refreshing Instagram data for account ${accountId}:`,
      error,
    );
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("instagram-refresh-group");

    consumer.on("consumer.connect", () => {
      console.log("Instagram-refresh consumer connected successfully");
    });

    consumer.on("consumer.disconnect", () => {
      console.log("Instagram-refresh consumer disconnected");
    });

    consumer.on("consumer.crash", (error) => {
      console.error("Instagram-refresh consumer crashed:", error);
    });

    await consumer.connect();

    // Subscribe to data-refresh-instagram topic
    const topicName = "data-refresh-instagram";
    await createTopicIfNotExists(topicName);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    console.log(
      `Instagram-refresh consumer started and subscribed to ${topicName}`,
    );

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received message:", message?.value?.toString());
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start instagram-refresh consumer:", error);
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
  console.log("Instagram-refresh consumer connections closed");
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
const port = parseInt(process.env.PORT || "3053");
serve({ fetch: app.fetch, port });
console.log(`Health check server running on port ${port}`);

// Start the consumer
console.log("Starting instagram-refresh consumer service...");
startConsumer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
