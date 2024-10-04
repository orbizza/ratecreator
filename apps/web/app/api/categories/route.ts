import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

import { getPrismaClient } from "@ratecreator/db/client";

import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";

import { Account, Category, PopularCategory } from "@ratecreator/types/review";

const CACHE_ROOT_CATEGORIES = "categories";
const CACHE_ALL_CATEGORIES = "all-categories";
const CACHE_POPULAR_CATEGORIES = "popular-categories";
const CACHE_POPULAR_CATEGORY_ACCOUNTS = "popular-categories-with-accounts";

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
    console.log("Returning cached popular categories");
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
    // await redis.del(CACHE_POPULAR_CATEGORY_ACCOUNTS);
    const cachedCategories = await redis.get(CACHE_POPULAR_CATEGORY_ACCOUNTS);
    if (cachedCategories) {
      console.log("Returning cached popular categories");
      return NextResponse.json(JSON.parse(cachedCategories));
    }
    const popularCategoriesResponse = await handlePopularCategories(redis);
    const popularCategories: PopularCategory[] =
      await popularCategoriesResponse.json();
    console.log("Popular Categories Received");

    const database = client.db("ratecreator");
    const categoryMappingCollection = database.collection("CategoryMapping");
    const accountCollection = database.collection<Account>("Account");

    const accountsByCategory = await Promise.all(
      popularCategories.map(async (category) => {
        try {
          const categoryMappings = await categoryMappingCollection
            .find({ categoryId: category.id })

            .toArray();

          const accountIds: ObjectId[] = categoryMappings.map(
            (mapping) => new ObjectId(mapping.accountId),
          );

          const accounts = await accountCollection
            .find({ _id: { $in: accountIds } })
            .sort({ followerCount: -1 })
            .limit(20)
            .toArray();

          return {
            category: {
              id: category.id,
              name: category.name,
              slug: category.slug,
            },
            accounts: accounts.map((account: Account) => ({
              id: account.id,
              name: account.name,
              handle: account.handle,
              platform: account.platform,
              accountId: account.accountId,
              followerCount: account.followerCount,
              rating: account.rating,
              reviewCount: account.reviewCount,
              imageUrl: account.imageUrl,
            })),
          };
        } catch (error) {
          console.error(
            `Error fetching accounts for category ${category.id}:`,
            error,
          );
          return {
            category: {
              id: category.id,
              name: category.name,
              slug: category.slug,
            },
            accounts: [],
          };
        }
      }),
    );
    await redis.set(
      CACHE_POPULAR_CATEGORY_ACCOUNTS,
      JSON.stringify(accountsByCategory),
    );
    console.log("Account and Categories cached in Redis");

    return NextResponse.json(accountsByCategory);
  } catch (error) {
    console.error("Error in fetchAccountsForPopularCategories:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 },
    );
  }
}
