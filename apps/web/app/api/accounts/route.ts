import { NextRequest, NextResponse } from "next/server";
import { getRedisClient } from "@ratecreator/db/redis-do";
import { getPrismaClient } from "@ratecreator/db/client";
import { CreatorData } from "@ratecreator/types/review";

const CACHE_YOUTUBE_CREATOR = "accounts-youtube-";
const prisma = getPrismaClient();

export async function GET(request: NextRequest) {
  const redis = getRedisClient();

  try {
    const platform = request.nextUrl.searchParams.get("platform");
    const accountId = request.nextUrl.searchParams.get("accountId") || "";

    if (!platform) {
      return NextResponse.json(
        { error: "Platform is required" },
        { status: 400 },
      );
    }
    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 },
      );
    }
    switch (platform) {
      case "youtube":
        return await handleYoutubeAccount(redis, accountId);
      case "twitter":
        return await handleTwitterAccount(redis, accountId);
      case "tiktok":
        return await handleTiktokAccount(redis, accountId);
      default:
        return NextResponse.json(
          { error: "Invalid platform" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 },
    );
  }
}

async function handleYoutubeAccount(
  redis: ReturnType<typeof getRedisClient>,
  accountId: string,
) {
  try {
    // Check cache first
    const cachedData = await redis.get(`${CACHE_YOUTUBE_CREATOR}${accountId}`);
    if (cachedData) {
      return NextResponse.json(JSON.parse(cachedData));
    }

    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId,
        platform: "YOUTUBE",
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
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
        ytData: (account.ytData as any) ?? {},
        tiktokData: (account.tiktokData as any) ?? {},
        xData: (account.xData as any) ?? {},
        redditData: (account.redditData as any) ?? {},
      },
      categories: categorySlugs,
    };

    // Cache the response for 1 hour
    await redis.set(
      `${CACHE_YOUTUBE_CREATOR}${accountId}`,
      JSON.stringify(responseData),
    );

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching YouTube account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account data" },
      { status: 500 },
    );
  }
}

async function handleTwitterAccount(
  redis: ReturnType<typeof getRedisClient>,
  accountId: string,
) {
  try {
    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId,
        platform: "TWITTER",
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
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
        ytData: (account.ytData as any) ?? {},
        tiktokData: (account.tiktokData as any) ?? {},
        xData: (account.xData as any) ?? {},
        redditData: (account.redditData as any) ?? {},
      },
      categories: categorySlugs,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching Twitter account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account data" },
      { status: 500 },
    );
  }
}

async function handleTiktokAccount(
  redis: ReturnType<typeof getRedisClient>,
  accountId: string,
) {
  try {
    const account = await prisma.account.findFirst({
      where: {
        accountId: accountId,
        platform: "TIKTOK",
      },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
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
        ytData: (account.ytData as any) ?? {},
        tiktokData: (account.tiktokData as any) ?? {},
        xData: (account.xData as any) ?? {},
        redditData: (account.redditData as any) ?? {},
      },
      categories: categorySlugs,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("Error fetching Tiktok account:", error);
    return NextResponse.json(
      { error: "Failed to fetch account tiktok data" },
      { status: 500 },
    );
  }
}
