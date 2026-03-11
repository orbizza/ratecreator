"use server";

import { getRedisClient } from "@ratecreator/db/redis-do";
import { getPrismaClient } from "@ratecreator/db/client";

const prisma = getPrismaClient();
const redis = getRedisClient();

const RATE_LIMIT_KEY = "youtube_api_rate_limit";
const RATE_LIMIT_WINDOW = 3600; // 1 hour in seconds
const RATE_LIMIT_MAX = 125; // Max calls per hour
const CACHE_YOUTUBE_CREATOR = "accounts-youtube-";

async function checkRateLimit(): Promise<boolean> {
  const current = await redis.incr(RATE_LIMIT_KEY);
  if (current === 1) {
    await redis.expire(RATE_LIMIT_KEY, RATE_LIMIT_WINDOW);
  }
  return current <= RATE_LIMIT_MAX;
}

/**
 * Refreshes YouTube channel data from the YouTube Data API v3.
 * Rate-limited to 125 calls/hour via Redis.
 */
export async function refreshYoutubeData(accountId: string): Promise<void> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    console.error("[youtube-refresh] YOUTUBE_API_KEY not configured");
    return;
  }

  const canProceed = await checkRateLimit();
  if (!canProceed) {
    console.warn("[youtube-refresh] Rate limit reached, skipping refresh");
    return;
  }

  try {
    // accountId here is the YouTube channel ID (e.g., UC...)
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${accountId}&key=${apiKey}`,
    );

    if (!response.ok) {
      if (response.status === 429) {
        await redis.decr(RATE_LIMIT_KEY);
      }
      console.error(
        `[youtube-refresh] YouTube API error: ${response.status} for ${accountId}`,
      );
      return;
    }

    const data = await response.json();
    if (!data.items || data.items.length === 0) {
      console.warn(
        `[youtube-refresh] No data returned for channel ${accountId}`,
      );
      return;
    }

    const channel = data.items[0];
    const freshData = {
      snippet: channel.snippet,
      statistics: channel.statistics,
      brandingSettings: channel.brandingSettings,
    };

    const updateData: Record<string, any> = {
      ytData: freshData,
      lastDataRefresh: new Date(),
      updatedAt: new Date(),
    };

    const newFollowerCount =
      parseInt(channel.statistics.subscriberCount) || undefined;
    if (newFollowerCount !== undefined) {
      updateData.followerCount = newFollowerCount;
    }

    if (channel.snippet.title) {
      updateData.name = channel.snippet.title;
    }
    if (channel.snippet.description) {
      updateData.description = channel.snippet.description;
    }
    if (
      channel.snippet.thumbnails?.high?.url ||
      channel.snippet.thumbnails?.default?.url
    ) {
      updateData.imageUrl =
        channel.snippet.thumbnails.high?.url ||
        channel.snippet.thumbnails.default?.url;
    }
    if (channel.brandingSettings?.image?.bannerExternalUrl) {
      updateData.bannerUrl = channel.brandingSettings.image.bannerExternalUrl;
    }
    if (channel.snippet.country) {
      updateData.country = channel.snippet.country;
    }
    if (channel.brandingSettings?.channel?.keywords) {
      updateData.keywords = channel.brandingSettings.channel.keywords;
    }

    await prisma.account.updateMany({
      where: {
        accountId: accountId,
        platform: "YOUTUBE",
      },
      data: updateData,
    });

    // Invalidate Redis cache
    await redis.del(`${CACHE_YOUTUBE_CREATOR}${accountId}`);

    console.log(
      `[youtube-refresh] Successfully refreshed data for ${accountId}`,
    );
  } catch (error) {
    console.error(
      `[youtube-refresh] Error refreshing data for ${accountId}:`,
      error,
    );
  }
}
