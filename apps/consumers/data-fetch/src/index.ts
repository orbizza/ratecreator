import {
  getKafkaConsumer,
  getKafkaProducer,
  createTopicIfNotExists,
  disconnectProducer,
} from "@ratecreator/db/kafka-client";
import { getPrismaClient } from "@ratecreator/db/client";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";
import { Hono } from "hono";
import { serve } from "@hono/node-server";

const app = new Hono();
const prisma = getPrismaClient();

// Health check endpoint
app.get("/health", (c) => c.json({ status: "healthy", service: "data-fetch" }));

let consumer: ReturnType<typeof getKafkaConsumer>;

interface AccountAddedEvent {
  accountId: string;
  platform: string;
  platformAccountId: string;
}

interface PlatformData {
  name?: string;
  description?: string;
  followers?: number;
  profileImage?: string;
  bannerImage?: string;
  country?: string;
  keywords?: string;
  [key: string]: any;
}

// Platform-specific data fetching functions
async function fetchYouTubeChannelData(
  channelId: string,
): Promise<PlatformData | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("YOUTUBE_API_KEY not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${channelId}&key=${apiKey}`,
    );

    if (!response.ok) {
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
    };
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return null;
  }
}

async function fetchRedditProfile(
  username: string,
): Promise<PlatformData | null> {
  try {
    const response = await fetch(
      `https://www.reddit.com/user/${username}/about.json`,
      {
        headers: {
          "User-Agent": "RateCreator/1.0",
        },
      },
    );

    if (!response.ok) {
      console.error(`Reddit API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const user = data.data;

    return {
      name: user.name,
      description: user.subreddit?.public_description || "",
      followers: user.subreddit?.subscribers || 0,
      profileImage: user.icon_img?.split("?")[0] || user.snoovatar_img,
      bannerImage: user.subreddit?.banner_img?.split("?")[0],
      totalKarma: user.total_karma,
      linkKarma: user.link_karma,
      commentKarma: user.comment_karma,
      isVerified: user.verified,
      createdUtc: user.created_utc,
    };
  } catch (error) {
    console.error("Error fetching Reddit data:", error);
    return null;
  }
}

async function fetchTikTokProfile(
  username: string,
): Promise<PlatformData | null> {
  // TikTok API requires official API access
  // For now, return null - would need to implement with official TikTok API
  console.log(`TikTok data fetch for ${username} - API integration pending`);
  return null;
}

async function fetchTwitterProfile(
  username: string,
): Promise<PlatformData | null> {
  // Twitter/X API requires bearer token
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    console.error("TWITTER_BEARER_TOKEN not configured");
    return null;
  }

  try {
    const response = await fetch(
      `https://api.twitter.com/2/users/by/username/${username}?user.fields=description,profile_image_url,public_metrics,verified`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
    );

    if (!response.ok) {
      console.error(`Twitter API error: ${response.status}`);
      return null;
    }

    const data = await response.json();
    if (!data.data) {
      return null;
    }

    const user = data.data;
    return {
      name: user.name,
      description: user.description,
      followers: user.public_metrics?.followers_count || 0,
      profileImage: user.profile_image_url?.replace("_normal", "_400x400"),
      following: user.public_metrics?.following_count || 0,
      tweetCount: user.public_metrics?.tweet_count || 0,
      isVerified: user.verified,
    };
  } catch (error) {
    console.error("Error fetching Twitter data:", error);
    return null;
  }
}

async function fetchInstagramProfile(
  username: string,
): Promise<PlatformData | null> {
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

async function fetchPlatformData(
  platform: string,
  platformAccountId: string,
): Promise<PlatformData | null> {
  switch (platform.toUpperCase()) {
    case "YOUTUBE":
      return fetchYouTubeChannelData(platformAccountId);
    case "REDDIT":
      return fetchRedditProfile(platformAccountId);
    case "TIKTOK":
      return fetchTikTokProfile(platformAccountId);
    case "TWITTER":
      return fetchTwitterProfile(platformAccountId);
    case "INSTAGRAM":
      return fetchInstagramProfile(platformAccountId);
    default:
      console.error(`Unsupported platform: ${platform}`);
      return null;
  }
}

async function processMessage(message: any) {
  if (!message.value) {
    console.error("Invalid message: value is null");
    return;
  }

  const payload: AccountAddedEvent = JSON.parse(message.value.toString());
  const { accountId, platform, platformAccountId } = payload;

  console.log(
    `Processing data fetch for account ${accountId} on platform ${platform}`,
  );

  try {
    // Create refresh log entry
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    const refreshLog = await db.collection("DataRefreshLog").insertOne({
      accountId: new ObjectId(accountId),
      platform: platform.toUpperCase(),
      status: "IN_PROGRESS",
      startedAt: new Date(),
    });

    // Fetch platform data
    const platformData = await fetchPlatformData(platform, platformAccountId);

    if (!platformData) {
      console.error(`Failed to fetch data for account ${accountId}`);

      // Update refresh log as failed
      await db.collection("DataRefreshLog").updateOne(
        { _id: refreshLog.insertedId },
        {
          $set: {
            status: "FAILED",
            completedAt: new Date(),
            error: "Failed to fetch platform data",
          },
        },
      );
      return;
    }

    // Determine which data field to update based on platform
    const dataFieldMap: Record<string, string> = {
      YOUTUBE: "ytData",
      REDDIT: "redditData",
      TWITTER: "xData",
      TIKTOK: "tiktokData",
      INSTAGRAM: "instagramData",
      TWITCH: "twitchData",
    };

    const dataField = dataFieldMap[platform.toUpperCase()];

    // Update account with fetched data
    const updateData: Record<string, any> = {
      name: platformData.name,
      description: platformData.description,
      followerCount: platformData.followers,
      imageUrl: platformData.profileImage,
      bannerUrl: platformData.bannerImage,
      country: platformData.country,
      keywords: platformData.keywords,
      lastDataRefresh: new Date(),
      updatedAt: new Date(),
    };

    if (dataField) {
      updateData[dataField] = platformData;
    }

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    await db
      .collection("Account")
      .updateOne(
        { _id: new ObjectId(accountId) },
        { $set: updateData },
        { maxTimeMS: 10000 },
      );

    console.log(`Updated account ${accountId} with platform data`);

    // Update refresh log as completed
    await db.collection("DataRefreshLog").updateOne(
      { _id: refreshLog.insertedId },
      {
        $set: {
          status: "COMPLETED",
          completedAt: new Date(),
          dataSnapshot: { before: null, after: platformData },
        },
      },
    );

    // Produce next event for translation
    const producer = await getKafkaProducer();
    const topicName = "account-data-fetched";
    await createTopicIfNotExists(topicName);

    await producer.send({
      topic: topicName,
      messages: [
        {
          key: accountId,
          value: JSON.stringify({
            accountId,
            platform: platform.toUpperCase(),
            name: platformData.name,
            description: platformData.description,
            keywords: platformData.keywords,
          }),
        },
      ],
    });

    console.log(`Sent account-data-fetched event for account ${accountId}`);
  } catch (error) {
    console.error(
      `Error processing data fetch for account ${accountId}:`,
      error,
    );
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("data-fetch-group");

    consumer.on("consumer.connect", () => {
      console.log("Data-fetch consumer connected successfully");
    });

    consumer.on("consumer.disconnect", () => {
      console.log("Data-fetch consumer disconnected");
    });

    consumer.on("consumer.crash", (error) => {
      console.error("Data-fetch consumer crashed:", error);
    });

    await consumer.connect();

    // Subscribe to account-added topic
    const topicName = "account-added";
    await createTopicIfNotExists(topicName);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    console.log(`Data-fetch consumer started and subscribed to ${topicName}`);

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received message:", message?.value?.toString());
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start data-fetch consumer:", error);
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
  console.log("Data-fetch consumer connections closed");
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
const port = parseInt(process.env.PORT || "3040");
serve({ fetch: app.fetch, port });
console.log(`Health check server running on port ${port}`);

// Start the consumer
console.log("Starting data-fetch consumer service...");
startConsumer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
