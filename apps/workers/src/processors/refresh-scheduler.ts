import { publishMessage } from "@ratecreator/db/pubsub-client";
import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";

// Platform configurations
export const PLATFORMS = {
  YOUTUBE: {
    topic: "data-refresh-youtube",
    staleThresholdDays: 7, // YouTube ToS requirement
    batchSize: 50,
    maxBatches: 90,
    rateLimitKey: "refresh_scheduler_youtube",
    rateLimitMax: 125, // matches YouTube API quota
  },
  INSTAGRAM: {
    topic: "data-refresh-instagram",
    staleThresholdDays: 14,
    batchSize: 50,
    maxBatches: 50,
    rateLimitKey: "refresh_scheduler_instagram",
    rateLimitMax: 200,
  },
  REDDIT: {
    topic: "data-refresh-reddit",
    staleThresholdDays: 14,
    batchSize: 100,
    maxBatches: 50,
    rateLimitKey: "refresh_scheduler_reddit",
    rateLimitMax: 3000,
  },
  TIKTOK: {
    topic: "data-refresh-tiktok",
    staleThresholdDays: 14,
    batchSize: 50,
    maxBatches: 20,
    rateLimitKey: "refresh_scheduler_tiktok",
    rateLimitMax: 40,
  },
} as const;

export type PlatformKey = keyof typeof PLATFORMS;

// Track last run to avoid double-scheduling on restart
async function getLastRunTime(platform: string): Promise<Date | null> {
  const redis = getRedisClient();
  const key = `refresh_scheduler_last_run:${platform}`;
  const value = await redis.get(key);
  return value ? new Date(value) : null;
}

async function setLastRunTime(platform: string): Promise<void> {
  const redis = getRedisClient();
  const key = `refresh_scheduler_last_run:${platform}`;
  await redis.set(key, new Date().toISOString());
  // Expire after 7 days
  await redis.expire(key, 7 * 24 * 60 * 60);
}

export async function triggerRefresh(
  platform: PlatformKey,
): Promise<{ scheduled: number; skipped: number }> {
  const config = PLATFORMS[platform];
  const mongoClient = await getMongoClient();
  const db = mongoClient.db("ratecreator");

  // Check if we already ran recently (within 1 hour)
  const lastRun = await getLastRunTime(platform);
  if (lastRun && Date.now() - lastRun.getTime() < 60 * 60 * 1000) {
    console.log(
      `${platform} refresh already ran at ${lastRun.toISOString()}, skipping`,
    );
    return { scheduled: 0, skipped: 0 };
  }

  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - config.staleThresholdDays);

  let totalScheduled = 0;
  let totalSkipped = 0;

  for (let batch = 0; batch < config.maxBatches; batch++) {
    // Find stale accounts
    const staleAccounts = await db
      .collection("Account")
      .find({
        platform: platform,
        isDeleted: { $ne: true },
        $or: [
          { lastDataRefresh: { $lt: staleDate } },
          { lastDataRefresh: null },
          { lastDataRefresh: { $exists: false } },
        ],
      })
      .sort({ lastDataRefresh: 1 }) // Oldest first
      .skip(batch * config.batchSize)
      .limit(config.batchSize)
      .toArray();

    if (staleAccounts.length === 0) {
      console.log(
        `No more stale ${platform} accounts to refresh (batch ${batch})`,
      );
      break;
    }

    // Publish refresh messages
    for (const account of staleAccounts) {
      try {
        await publishMessage(config.topic, {
          accountId: account._id.toString(),
          platform: platform,
          scheduledAt: new Date().toISOString(),
        });
        totalScheduled++;
      } catch (error) {
        console.error(
          `Failed to schedule refresh for account ${account._id}:`,
          error,
        );
        totalSkipped++;
      }
    }

    console.log(
      `${platform} batch ${batch + 1}: scheduled ${staleAccounts.length} accounts`,
    );
  }

  await setLastRunTime(platform);
  console.log(
    `${platform} refresh complete: ${totalScheduled} scheduled, ${totalSkipped} skipped`,
  );

  return { scheduled: totalScheduled, skipped: totalSkipped };
}
