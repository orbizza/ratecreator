import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";

const redis = getRedisClient();

// Rate limiting: Reddit API allows 60 req/minute
// Safe limit: 50 calls/minute = 3000 calls/hour
const RATE_LIMIT_KEY = "reddit_api_rate_limit";
const RATE_LIMIT_WINDOW = 60; // 1 minute in seconds
const RATE_LIMIT_MAX = 50; // Max calls per minute

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

  if (current > RATE_LIMIT_MAX) {
    // Wait until next window
    const ttl = await redis.ttl(RATE_LIMIT_KEY);
    if (ttl > 0) {
      console.log(`Rate limited, waiting ${ttl}s before retry`);
      await new Promise((resolve) => setTimeout(resolve, (ttl + 1) * 1000));
      return checkRateLimit();
    }
  }

  return current <= RATE_LIMIT_MAX;
}

async function fetchRedditProfile(username: string): Promise<any | null> {
  // Check rate limit
  const canProceed = await checkRateLimit();
  if (!canProceed) {
    console.warn("Reddit API rate limit reached, skipping refresh");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.reddit.com/user/${username}/about.json`,
      {
        headers: {
          "User-Agent": "RateCreator/1.0 (contact@ratecreator.com)",
        },
      },
    );

    if (!response.ok) {
      if (response.status === 429) {
        console.error("Reddit API rate limited (429)");
        await redis.decr(RATE_LIMIT_KEY);

        // Get Retry-After header if present
        const retryAfter = response.headers.get("Retry-After");
        if (retryAfter) {
          const waitTime = parseInt(retryAfter) * 1000;
          console.log(`Waiting ${retryAfter}s as per Retry-After header`);
          await new Promise((resolve) => setTimeout(resolve, waitTime));
          return fetchRedditProfile(username);
        }
      }
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
      awardeeKarma: user.awardee_karma,
      awarderKarma: user.awarder_karma,
      isVerified: user.verified,
      hasVerifiedEmail: user.has_verified_email,
      isMod: user.is_mod,
      isGold: user.is_gold,
      createdUtc: user.created_utc,
    };
  } catch (error) {
    console.error("Error fetching Reddit data:", error);
    return null;
  }
}

export async function processRedditRefresh(
  data: Record<string, unknown>,
  attributes: Record<string, string>,
): Promise<void> {
  const payload = data as unknown as DataRefreshEvent;
  const { accountId, platform } = payload;

  if (platform.toUpperCase() !== "REDDIT") {
    console.error(`Invalid platform for reddit-refresh: ${platform}`);
    return;
  }

  console.log(`Processing Reddit refresh for account ${accountId}`);

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
      platform: "REDDIT",
      status: "IN_PROGRESS",
      startedAt: new Date(),
    });

    // Fetch fresh data from Reddit
    const freshData = await fetchRedditProfile(
      account.handle || account.accountId,
    );

    if (!freshData) {
      console.error(
        `Failed to fetch Reddit data for user ${account.accountId}`,
      );

      await db.collection("DataRefreshLog").updateOne(
        { _id: refreshLog.insertedId },
        {
          $set: {
            status: "FAILED",
            completedAt: new Date(),
            error: "Failed to fetch data from Reddit API",
          },
        },
      );
      return;
    }

    // Update account with new data
    const updateData: any = {
      redditData: freshData,
      lastDataRefresh: new Date(),
      updatedAt: new Date(),
    };

    if (freshData.followers !== account.followerCount) {
      updateData.followerCount = freshData.followers;
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
          dataSnapshot: { before: account.redditData, after: freshData },
        },
      },
    );

    // Update Redis cache if exists
    const cacheKey = `accounts-reddit-${account.accountId}`;
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      const existingData = JSON.parse(cachedData);
      const updatedCacheData = {
        ...existingData,
        account: {
          ...existingData.account,
          ...updateData,
          redditData: freshData,
        },
      };
      await redis.set(cacheKey, JSON.stringify(updatedCacheData));
    }

    console.log(`Successfully refreshed Reddit data for account ${accountId}`);
  } catch (error) {
    console.error(
      `Error refreshing Reddit data for account ${accountId}:`,
      error,
    );
  }
}
