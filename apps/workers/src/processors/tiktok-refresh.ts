import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";

const redis = getRedisClient();

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

export async function processTiktokRefresh(
  data: Record<string, unknown>,
  attributes: Record<string, string>,
): Promise<void> {
  const payload = data as unknown as DataRefreshEvent;
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

    // Update Elasticsearch
    try {
      const { updateAccount } =
        await import("@ratecreator/db/elasticsearch-client");
      const esUpdate: Record<string, unknown> = {};
      if (updateData.followerCount !== undefined)
        esUpdate.followerCount = updateData.followerCount;
      if (updateData.name) esUpdate.name = updateData.name;
      if (updateData.description) esUpdate.description = updateData.description;
      if (updateData.imageUrl) esUpdate.imageUrl = updateData.imageUrl;
      if (freshData.videos !== undefined)
        esUpdate.videoCount = Number(freshData.videos);

      if (Object.keys(esUpdate).length > 0) {
        await updateAccount(account.accountId, esUpdate);
        console.log(`Updated Elasticsearch for account ${accountId}`);
      }
    } catch (esError) {
      console.error(
        `Elasticsearch update failed for ${accountId} (non-fatal):`,
        esError,
      );
    }

    console.log(`Successfully refreshed TikTok data for account ${accountId}`);
  } catch (error) {
    console.error(
      `Error refreshing TikTok data for account ${accountId}:`,
      error,
    );
  }
}
