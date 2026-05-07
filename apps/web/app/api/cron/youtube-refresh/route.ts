import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@ratecreator/db/client";
import { getRedisClient } from "@ratecreator/db/redis-do";
import { isAuthorizedCronRequest } from "../../../../lib/cron-auth";

const prisma = getPrismaClient();
const redis = getRedisClient();

const RATE_LIMIT_KEY = "youtube_cron_rate_limit";
const RATE_LIMIT_WINDOW = 3600;
const RATE_LIMIT_MAX = 125;
const BATCH_SIZE = 50;
const CACHE_YOUTUBE_CREATOR = "accounts-youtube-";
const STALE_DAYS = 7;

async function checkRateLimit(): Promise<boolean> {
  const current = await redis.incr(RATE_LIMIT_KEY);
  if (current === 1) {
    await redis.expire(RATE_LIMIT_KEY, RATE_LIMIT_WINDOW);
  }
  return current <= RATE_LIMIT_MAX;
}

async function fetchYouTubeBatch(
  channelIds: string[],
  apiKey: string,
): Promise<Map<string, any>> {
  const results = new Map<string, any>();
  const ids = channelIds.join(",");

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${ids}&key=${apiKey}`,
  );

  if (!response.ok) {
    console.error(`[cron/youtube-refresh] API error: ${response.status}`);
    return results;
  }

  const data = await response.json();
  if (!data.items) return results;

  for (const channel of data.items) {
    results.set(channel.id, {
      snippet: channel.snippet,
      statistics: channel.statistics,
      brandingSettings: channel.brandingSettings,
    });
  }

  return results;
}

export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "YOUTUBE_API_KEY not configured" },
      { status: 500 },
    );
  }

  const staleDate = new Date();
  staleDate.setDate(staleDate.getDate() - STALE_DAYS);

  let processedCount = 0;
  let batchCount = 0;
  const maxBatches = 90; // ~4500 channels per run, stay under 300s timeout

  try {
    while (batchCount < maxBatches) {
      const canProceed = await checkRateLimit();
      if (!canProceed) {
        console.log(
          "[cron/youtube-refresh] Rate limit reached, stopping batch",
        );
        break;
      }

      // Fetch stale accounts in priority order (highest follower count first)
      const staleAccounts = await prisma.account.findMany({
        where: {
          platform: "YOUTUBE",
          OR: [
            { lastDataRefresh: null },
            { lastDataRefresh: { lt: staleDate } },
          ],
        },
        select: {
          id: true,
          accountId: true,
        },
        orderBy: {
          followerCount: "desc",
        },
        take: BATCH_SIZE,
        skip: 0,
      });

      if (staleAccounts.length === 0) {
        console.log("[cron/youtube-refresh] No more stale accounts to process");
        break;
      }

      const channelIds = staleAccounts.map((a) => a.accountId);
      const freshDataMap = await fetchYouTubeBatch(channelIds, apiKey);

      // Update each account with fresh data
      for (const account of staleAccounts) {
        const freshData = freshDataMap.get(account.accountId);
        if (!freshData) {
          // Mark as refreshed even if no data returned (channel may be deleted)
          await prisma.account.update({
            where: { id: account.id },
            data: {
              lastDataRefresh: new Date(),
              updatedAt: new Date(),
            },
          });
          continue;
        }

        const updateData: Record<string, any> = {
          ytData: freshData,
          lastDataRefresh: new Date(),
          updatedAt: new Date(),
        };

        const subCount = parseInt(freshData.statistics?.subscriberCount);
        if (!isNaN(subCount)) {
          updateData.followerCount = subCount;
        }
        if (freshData.snippet?.title) {
          updateData.name = freshData.snippet.title;
        }
        if (freshData.snippet?.description) {
          updateData.description = freshData.snippet.description;
        }
        if (
          freshData.snippet?.thumbnails?.high?.url ||
          freshData.snippet?.thumbnails?.default?.url
        ) {
          updateData.imageUrl =
            freshData.snippet.thumbnails.high?.url ||
            freshData.snippet.thumbnails.default?.url;
        }
        if (freshData.brandingSettings?.image?.bannerExternalUrl) {
          updateData.bannerUrl =
            freshData.brandingSettings.image.bannerExternalUrl;
        }
        if (freshData.snippet?.country) {
          updateData.country = freshData.snippet.country;
        }

        await prisma.account.update({
          where: { id: account.id },
          data: updateData,
        });

        // Invalidate Redis cache
        await redis.del(`${CACHE_YOUTUBE_CREATOR}${account.accountId}`);
        processedCount++;
      }

      batchCount++;
    }

    return NextResponse.json({
      success: true,
      processedCount,
      batchCount,
    });
  } catch (error) {
    console.error("[cron/youtube-refresh] Error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        processedCount,
        batchCount,
      },
      { status: 500 },
    );
  }
}
