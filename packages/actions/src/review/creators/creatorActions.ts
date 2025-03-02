"use server";

import axios from "axios";

import { getRedisClient } from "@ratecreator/db/redis-do";
import { getPrismaClient } from "@ratecreator/db/client";
import { CreatorData } from "@ratecreator/types/review";

const CACHE_YOUTUBE_CREATOR = "accounts-youtube-";
const CACHE_TWITTER_CREATOR = "accounts-twitter-";
const CACHE_TIKTOK_CREATOR = "accounts-tiktok-";
const CACHE_REDDIT_CREATOR = "accounts-reddit-";

const prisma = getPrismaClient();
const redis = getRedisClient();

interface GetCreatorDataProps {
  accountId: string;
  platform: string;
}

export async function getCreatorData({
  accountId,
  platform,
}: GetCreatorDataProps): Promise<CreatorData> {
  try {
    if (!platform) {
      throw new Error("Platform is required");
    }
    if (!accountId) {
      throw new Error("Account ID is required");
    }
    switch (platform) {
      case "youtube":
        return await handleYoutubeAccount(redis, accountId);
      case "twitter":
        return await handleTwitterAccount(redis, accountId);
      case "tiktok":
        return await handleTiktokAccount(redis, accountId);
      case "reddit":
        return await handleRedditAccount(redis, accountId);
      default:
        throw new Error("Invalid platform");
    }
    // const response = await axios.get(
    //   `${process.env.NEXT_PUBLIC_RATECREATOR_API_URL}/api/accounts?accountId=${accountId}&platform=${platform}`
    // );
    // return response.data;
  } catch (error) {
    console.error("Failed to fetch creator data:", error);
    throw new Error("Failed to fetch creator data");
  }
}
async function handleYoutubeAccount(
  redis: ReturnType<typeof getRedisClient>,
  accountId: string,
) {
  try {
    // Check cache first
    // await redis.del(`${CACHE_YOUTUBE_CREATOR}${accountId}`);
    const cachedData = await redis.get(`${CACHE_YOUTUBE_CREATOR}${accountId}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId,
        platform: "YOUTUBE",
      },
    });

    if (!account) {
      return { error: "Account not found", status: 404 };
    }

    // Get category mappings for this account
    const categoryMappings = await prisma.categoryMapping.findMany({
      where: { accountId: account.id },
      include: {
        category: {
          select: { slug: true },
        },
      },
    });

    const categorySlugs = categoryMappings.map(
      (mapping) => mapping.category.slug,
    );

    // Format response to match CreatorData type
    const responseData: CreatorData = {
      account: {
        id: account.id,
        platform: account.platform,
        accountId: account.accountId,
        handle: account.handle ?? "",
        name: account.name ?? "",
        name_en: account.name_en ?? "",
        description: account.description ?? "",
        description_en: account.description_en ?? "",
        keywords: account.keywords ?? "",
        keywords_en: account.keywords_en ?? "",
        followerCount: account.followerCount ?? 0,
        imageUrl: account.imageUrl ?? "",
        country: account.country ?? null,
        language_code: account.language_code ?? "",
        rating: account.rating ?? 0,
        reviewCount: account.reviewCount ?? 0,
        bannerURL: account.bannerUrl ?? "",
        ytData: (account.ytData as any) ?? {},
      },
      categories: categorySlugs,
    };

    // Cache the response for 1 hour
    await redis.set(
      `${CACHE_YOUTUBE_CREATOR}${accountId}`,
      JSON.stringify(responseData),
      "EX",
      3600, // 1 hour TTL
    );

    return responseData;
  } catch (error) {
    console.error("Error fetching YouTube account:", error);
    return { error: "Failed to fetch account data", status: 500 };
  }
}

async function handleTwitterAccount(
  redis: ReturnType<typeof getRedisClient>,
  accountId: string,
) {
  try {
    // Check cache first
    const cachedData = await redis.get(`${CACHE_TWITTER_CREATOR}${accountId}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId,
        platform: "TWITTER",
      },
    });

    if (!account) {
      return { error: "Account not found", status: 404 };
    }

    const categoryMappings = await prisma.categoryMapping.findMany({
      where: { accountId: account.id },
      include: {
        category: {
          select: { slug: true },
        },
      },
    });

    const categorySlugs = categoryMappings.map(
      (mapping) => mapping.category.slug,
    );

    const responseData: CreatorData = {
      account: {
        id: account.id,
        platform: account.platform,
        accountId: account.accountId,
        handle: account.handle ?? "",
        name: account.name ?? "",
        name_en: account.name_en ?? "",
        description: account.description ?? "",
        description_en: account.description_en ?? "",
        keywords: account.keywords ?? "",
        keywords_en: account.keywords_en ?? "",
        followerCount: account.followerCount ?? 0,
        imageUrl: account.imageUrl ?? "",
        country: account.country ?? null,
        language_code: account.language_code ?? "",
        rating: account.rating ?? 0,
        reviewCount: account.reviewCount ?? 0,
        xData: (account.xData as any) ?? {},
      },
      categories: categorySlugs,
    };

    // Cache the response for 1 hour
    await redis.set(
      `${CACHE_TWITTER_CREATOR}${accountId}`,
      JSON.stringify(responseData),
      "EX",
      3600, // 1 hour TTL
    );

    return responseData;
  } catch (error) {
    console.error("Error fetching Twitter account:", error);
    return { error: "Failed to fetch account data", status: 500 };
  }
}

async function handleTiktokAccount(
  redis: ReturnType<typeof getRedisClient>,
  accountId: string,
) {
  try {
    // Check cache first
    const cachedData = await redis.get(`${CACHE_TIKTOK_CREATOR}${accountId}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId,
        platform: "TIKTOK",
      },
    });

    if (!account) {
      return { error: "Account not found", status: 404 };
    }

    const categoryMappings = await prisma.categoryMapping.findMany({
      where: { accountId: account.id },
      include: {
        category: {
          select: { slug: true },
        },
      },
    });

    const categorySlugs = categoryMappings.map(
      (mapping) => mapping.category.slug,
    );

    const responseData: CreatorData = {
      account: {
        id: account.id,
        platform: account.platform,
        accountId: account.accountId,
        handle: account.handle ?? "",
        name: account.name ?? "",
        name_en: account.name_en ?? "",
        description: account.description ?? "",
        description_en: account.description_en ?? "",
        keywords: account.keywords ?? "",
        keywords_en: account.keywords_en ?? "",
        followerCount: account.followerCount ?? 0,
        imageUrl: account.imageUrl ?? "",
        country: account.country ?? null,
        language_code: account.language_code ?? "",
        rating: account.rating ?? 0,
        reviewCount: account.reviewCount ?? 0,
        tiktokData: (account.tiktokData as any) ?? {},
      },
      categories: categorySlugs,
    };

    // Cache the response for 1 hour
    await redis.set(
      `${CACHE_TIKTOK_CREATOR}${accountId}`,
      JSON.stringify(responseData),
      "EX",
      3600, // 1 hour TTL
    );

    return responseData;
  } catch (error) {
    console.error("Error fetching Tiktok account:", error);
    return { error: "Failed to fetch account tiktok data", status: 500 };
  }
}

async function handleRedditAccount(
  redis: ReturnType<typeof getRedisClient>,
  accountId: string,
) {
  try {
    // Check cache first
    const cachedData = await redis.get(`${CACHE_REDDIT_CREATOR}${accountId}`);
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId,
        platform: "REDDIT",
      },
    });

    if (!account) {
      return { error: "Account not found" };
    }

    const categoryMappings = await prisma.categoryMapping.findMany({
      where: { accountId: account.id },
      include: {
        category: {
          select: { slug: true },
        },
      },
    });

    const categorySlugs = categoryMappings.map(
      (mapping) => mapping.category.slug,
    );

    const responseData: CreatorData = {
      account: {
        id: account.id,
        platform: account.platform,
        accountId: account.accountId,
        handle: account.handle ?? "",
        name: account.name ?? "",
        name_en: account.name_en ?? "",
        description: account.description ?? "",
        description_en: account.description_en ?? "",
        keywords: account.keywords ?? "",
        keywords_en: account.keywords_en ?? "",
        followerCount: account.followerCount ?? 0,
        imageUrl: account.imageUrl ?? "",
        country: account.country ?? null,
        language_code: account.language_code ?? "",
        rating: account.rating ?? 0,
        reviewCount: account.reviewCount ?? 0,
        redditData: (account.redditData as any) ?? {},
      },
      categories: categorySlugs,
    };

    // Cache the response for 1 hour
    await redis.set(
      `${CACHE_REDDIT_CREATOR}${accountId}`,
      JSON.stringify(responseData),
      "EX",
      3600, // 1 hour TTL
    );

    return responseData;
  } catch (error) {
    console.error("Error fetching Reddit account:", error);
    return { error: "Failed to fetch account reddit data", status: 500 };
  }
}
