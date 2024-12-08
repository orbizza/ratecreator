import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";

import { CreatorData } from "@ratecreator/types/review";

const CACHE_YOUTUBE_CREATOR = "accounts-youtube-";

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

async function getCategorySlugs(
  categoryMappingIds: string[],
): Promise<string[]> {
  try {
    const mongo_client = await getMongoClient();
    const db = mongo_client.db("ratecreator");

    const categoryMappings = await db
      .collection("CategoryMapping")
      .find({ _id: { $in: categoryMappingIds.map((id) => new ObjectId(id)) } })
      .toArray();

    if (categoryMappings.length === 0) {
      return [];
    }

    const categoryIds = categoryMappings.map((mapping) => mapping.categoryId);

    const categories = await db
      .collection("Category")
      .find({ _id: { $in: categoryIds.map((id) => new ObjectId(id)) } })
      .project({ slug: 1 })
      .toArray();

    return categories.map((category) => category.slug);
  } catch (error) {
    console.error("Error fetching category slugs:", error);
    return [];
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

    const mongo_client = await getMongoClient();
    const db = mongo_client.db("ratecreator");

    const account = await db.collection("Account").findOne({
      accountId: accountId,
      platform: "YOUTUBE",
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Get category slugs
    const categorySlugs = await getCategorySlugs(account.categories || []);

    // Format response to match CreatorData type
    const responseData: CreatorData = {
      account: {
        id: account._id.toString(),
        platform: account.platform,
        accountId: account.accountId,
        handle: account.handle,
        name_en: account.name_en,
        description_en: account.description_en,
        keywords_en: account.keywords_en,
        followerCount: account.followerCount,
        imageUrl: account.imageUrl,
        country: account.country,
        language_code: account.language_code,
        rating: account.rating,
        reviewCount: account.reviewCount,
        ytData: {
          snippet: {
            publishedAt: account.ytData?.snippet?.publishedAt,
            thumbnails: account.ytData?.snippet?.thumbnails,
          },
          statistics: {
            viewCount: account.ytData?.statistics?.viewCount,
            videoCount: account.ytData?.statistics?.videoCount,
          },
          status: {
            madeForKids: account.ytData?.status?.madeForKids ?? false,
          },
          brandingSettings: {
            image: {
              bannerExternalUrl:
                account.ytData?.brandingSettings?.image?.bannerExternalUrl,
            },
          },
        },
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
