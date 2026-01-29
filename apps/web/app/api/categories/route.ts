import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getPrismaClient } from "@ratecreator/db/client";

import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";

import { Account, Category, PopularCategory } from "@ratecreator/types/review";

export const dynamic = "force-dynamic";

const CACHE_ROOT_CATEGORIES = "category-root";
const CACHE_ALL_CATEGORIES = "category-all";
const CACHE_POPULAR_CATEGORIES = "category-popular";
const CACHE_POPULAR_CATEGORY_ACCOUNTS = "category-popular-accounts";
const CACHE_CATEGORY_ACCOUNTS_PREFIX = "category-accounts:";
const CACHE_TTL = 24 * 60 * 60; // 24 hours in seconds

const prisma = getPrismaClient();

export async function GET(request: NextRequest) {
  const redis = getRedisClient();
  // await redis.flushall();
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type");

    switch (type) {
      case "all":
        return await handleAllCategories(redis);
      case "root":
        return await handleRootCategories(redis);
      case "popular-categories":
        return await handlePopularCategories(redis);
      case "popular-cat-data":
        return await fetchAccountsForPopularCategories(redis);
      default:
        return NextResponse.json(
          { error: "Invalid category type" },
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

async function handleAllCategories(redis: ReturnType<typeof getRedisClient>) {
  // await redis.del(CACHE_ALL_CATEGORIES);
  const cachedCategories = await redis.get(CACHE_ALL_CATEGORIES);
  if (cachedCategories) {
    console.log("Returning cached all categories");
    return NextResponse.json(JSON.parse(cachedCategories));
  }

  const allCategories = await prisma.category.findMany({
    orderBy: { depth: "asc" },
  });

  await redis.set(CACHE_ALL_CATEGORIES, JSON.stringify(allCategories));
  console.log("All Categories cached in Redis");

  return NextResponse.json(allCategories);
}

async function handleRootCategories(redis: ReturnType<typeof getRedisClient>) {
  // await redis.del(CACHE_ROOT_CATEGORIES);
  const cachedCategories = await redis.get(CACHE_ROOT_CATEGORIES);
  if (cachedCategories) {
    console.log("Returning cached root categories");
    return NextResponse.json(JSON.parse(cachedCategories));
  }

  const allCategories = await prisma.category.findMany({
    orderBy: { depth: "asc" },
  });

  const categoryMap: { [key: string]: Category } = {};
  allCategories.forEach((category) => {
    categoryMap[category.id] = { ...category, subcategories: [] };
  });

  const rootCategories: Category[] = [];
  allCategories.forEach((category) => {
    if (category.parentId) {
      const parentCategory = categoryMap[category.parentId];
      if (parentCategory) {
        parentCategory.subcategories?.push(categoryMap[category.id]);
      }
    } else {
      rootCategories.push(categoryMap[category.id]);
    }
  });

  await redis.set(CACHE_ALL_CATEGORIES, JSON.stringify(allCategories));
  console.log("All Categories cached in Redis");
  await redis.set(CACHE_ROOT_CATEGORIES, JSON.stringify(rootCategories));
  console.log("Root Categories cached in Redis");

  return NextResponse.json(rootCategories);
}

async function handlePopularCategories(
  redis: ReturnType<typeof getRedisClient>,
) {
  // await redis.del(CACHE_POPULAR_CATEGORIES);
  const cachedCategories = await redis.get(CACHE_POPULAR_CATEGORIES);
  if (cachedCategories) {
    // console.log("Returning cached popular categories");
    return NextResponse.json(JSON.parse(cachedCategories));
  }

  const popularCategories = await prisma.category.findMany({
    where: { popular: true },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
  // console.log(popularCategories);
  // console.log("Returning popular categories");

  await redis.set(CACHE_POPULAR_CATEGORIES, JSON.stringify(popularCategories));
  console.log("Popular Categories cached in Redis");

  return NextResponse.json(popularCategories);
}

async function fetchAccountsForPopularCategories(
  redis: ReturnType<typeof getRedisClient>,
) {
  const client = await getMongoClient();

  try {
    // Try to get cached full response first
    const cachedFullResponse = await redis.get(CACHE_POPULAR_CATEGORY_ACCOUNTS);
    if (cachedFullResponse) {
      return NextResponse.json(JSON.parse(cachedFullResponse));
    }

    const popularCategoriesResponse = await handlePopularCategories(redis);
    const popularCategories: PopularCategory[] =
      await popularCategoriesResponse.json();

    const database = client.db("ratecreator");
    const categoryMappingCollection = database.collection("CategoryMapping");
    const accountCollection = database.collection<Account>("Account");

    const accountsByCategory = [];
    const pipeline = [];

    // Process each category, potentially in parallel
    for (const category of popularCategories) {
      try {
        const categoryCacheKey = `${CACHE_CATEGORY_ACCOUNTS_PREFIX}${category.id}`;

        // Try to get cached category data
        const cachedCategoryAccounts = await redis.get(categoryCacheKey);
        if (cachedCategoryAccounts) {
          accountsByCategory.push(JSON.parse(cachedCategoryAccounts));
          continue;
        }

        // If not cached, prepare fetch operation
        pipeline.push(
          (async () => {
            const categoryObjectId = new ObjectId(category.id);
            const categoryMappings = await categoryMappingCollection
              .find({ categoryId: categoryObjectId })
              .toArray();

            if (categoryMappings.length === 0) {
              const emptyCategory = {
                category: {
                  id: category.id,
                  name: category.name,
                  slug: category.slug,
                },
                accounts: [],
              };
              await redis.set(categoryCacheKey, JSON.stringify(emptyCategory));
              return emptyCategory;
            }

            const accountObjectIds = categoryMappings.map(
              (mapping) => new ObjectId(mapping.accountId),
            );

            const accounts = await accountCollection
              .find({
                _id: { $in: accountObjectIds },
              })
              .sort({ followerCount: -1 })
              .limit(20)
              .toArray();

            const categoryWithAccounts = {
              category: {
                id: category.id,
                name: category.name,
                slug: category.slug,
              },
              accounts: accounts.map((account) => ({
                id: account._id.toString(),
                name: account.name || "",
                handle: account.handle || "",
                platform: account.platform,
                accountId: account.accountId,
                followerCount: account.followerCount || 0,
                rating: account.rating || 0,
                reviewCount: account.reviewCount || 0,
                imageUrl: account.imageUrl || "",
              })),
            };

            // Cache individual category data with TTL
            await redis.set(
              categoryCacheKey,
              JSON.stringify(categoryWithAccounts),
            );

            return categoryWithAccounts;
          })(),
        );
      } catch (error) {
        console.error(`Error processing category ${category.id}:`, error);
        // Add empty category result on error
        accountsByCategory.push({
          category: {
            id: category.id,
            name: category.name,
            slug: category.slug,
          },
          accounts: [],
        });
      }
    }

    // Execute all pending category fetches in parallel
    const results = await Promise.all(pipeline);
    accountsByCategory.push(...results);

    // Cache the full response with TTL
    await redis.set(
      CACHE_POPULAR_CATEGORY_ACCOUNTS,
      JSON.stringify(accountsByCategory),
    );

    return NextResponse.json(accountsByCategory);
  } catch (error) {
    console.error("Error in fetchAccountsForPopularCategories:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
