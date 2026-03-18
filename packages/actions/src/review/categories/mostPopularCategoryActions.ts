"use server";

import {
  PopularCategory,
  PopularCategoryWithAccounts,
  Account,
} from "@ratecreator/types/review";
import { getPrismaClient } from "@ratecreator/db/client";
import getRedisClient from "@ratecreator/db/redis-do";
import getMongoClient from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";
const CACHE_POPULAR_CATEGORIES = "category-popular";
const CACHE_POPULAR_CATEGORY_ACCOUNTS = "category-popular-accounts";
const CACHE_CATEGORY_ACCOUNTS_PREFIX = "category-accounts:";

// Redis TTLs in seconds
const REDIS_TTL = {
  POPULAR_CATEGORIES: 0, // No expiry — flush manually when categories change
  POPULAR_CATEGORY_ACCOUNTS: 7 * 24 * 3600, // 7 days unless revalidated
  INDIVIDUAL_CATEGORY: 7 * 24 * 3600, // 7 days
};

// In-memory local cache — reduces Redis round-trips for repeated calls
const localCache = new Map<string, { data: unknown; expiry: number }>();
const LOCAL_CACHE_TTL = 60 * 1000; // 60 seconds

function getLocal<T>(key: string): T | null {
  const entry = localCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    localCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setLocal<T>(key: string, data: T): void {
  localCache.set(key, { data, expiry: Date.now() + LOCAL_CACHE_TTL });
}

const redis = getRedisClient();
const prisma = getPrismaClient();

export async function getMostPopularCategories(): Promise<PopularCategory[]> {
  try {
    // Check local cache first
    const local = getLocal<PopularCategory[]>(CACHE_POPULAR_CATEGORIES);
    if (local) return local;

    const cachedCategories = await redis.get(CACHE_POPULAR_CATEGORIES);
    if (cachedCategories) {
      const parsed = JSON.parse(cachedCategories);
      setLocal(CACHE_POPULAR_CATEGORIES, parsed);
      return parsed;
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

    await redis.set(
      CACHE_POPULAR_CATEGORIES,
      JSON.stringify(popularCategories),
    );
    setLocal(CACHE_POPULAR_CATEGORIES, popularCategories);
    console.log("Popular Categories cached in Redis");

    return popularCategories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

export async function getMostPopularCategoryWithData(): Promise<
  PopularCategoryWithAccounts[]
> {
  const client = await getMongoClient();

  try {
    // Check local cache first
    const local = getLocal<PopularCategoryWithAccounts[]>(
      CACHE_POPULAR_CATEGORY_ACCOUNTS,
    );
    if (local) return local;

    // Try to get cached full response from Redis
    const cachedFullResponse = await redis.get(CACHE_POPULAR_CATEGORY_ACCOUNTS);
    if (cachedFullResponse) {
      const parsed = JSON.parse(cachedFullResponse);
      setLocal(CACHE_POPULAR_CATEGORY_ACCOUNTS, parsed);
      return parsed;
    }

    const popularCategoriesResponse = await getMostPopularCategories();
    const popularCategories: PopularCategory[] = popularCategoriesResponse;

    const database = client.db("ratecreator");
    const categoryMappingCollection = database.collection("CategoryMapping");
    const accountCollection = database.collection<Account>("Account");

    const accountsByCategory = [];
    const pipeline = [];

    // Process each category, potentially in parallel
    for (const category of popularCategories) {
      try {
        const categoryCacheKey = `${CACHE_CATEGORY_ACCOUNTS_PREFIX}${category.id}`;

        // Try local cache for individual category
        const localCat =
          getLocal<PopularCategoryWithAccounts>(categoryCacheKey);
        if (localCat) {
          accountsByCategory.push(localCat);
          continue;
        }

        // Try to get cached category data from Redis
        const cachedCategoryAccounts = await redis.get(categoryCacheKey);
        if (cachedCategoryAccounts) {
          const parsed = JSON.parse(cachedCategoryAccounts);
          setLocal(categoryCacheKey, parsed);
          accountsByCategory.push(parsed);
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
              await redis.setex(
                categoryCacheKey,
                REDIS_TTL.INDIVIDUAL_CATEGORY,
                JSON.stringify(emptyCategory),
              );
              setLocal(categoryCacheKey, emptyCategory);
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
                rating: parseFloat((account.rating || 0).toFixed(2)),
                reviewCount: account.reviewCount || 0,
                imageUrl: account.imageUrl || "",
              })),
            };

            // Cache individual category data with TTL
            await redis.setex(
              categoryCacheKey,
              REDIS_TTL.INDIVIDUAL_CATEGORY,
              JSON.stringify(categoryWithAccounts),
            );
            setLocal(categoryCacheKey, categoryWithAccounts);

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
    await redis.setex(
      CACHE_POPULAR_CATEGORY_ACCOUNTS,
      REDIS_TTL.POPULAR_CATEGORY_ACCOUNTS,
      JSON.stringify(accountsByCategory),
    );
    setLocal(CACHE_POPULAR_CATEGORY_ACCOUNTS, accountsByCategory);

    return accountsByCategory;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

export async function getSingleCategoryWithAccounts(
  categoryId: string,
): Promise<PopularCategoryWithAccounts | null> {
  const client = await getMongoClient();

  try {
    const categoryCacheKey = `${CACHE_CATEGORY_ACCOUNTS_PREFIX}${categoryId}`;

    // Check local cache first
    const local = getLocal<PopularCategoryWithAccounts>(categoryCacheKey);
    if (local) return local;

    // Try to get cached category data from Redis
    const cachedCategoryAccounts = await redis.get(categoryCacheKey);

    if (cachedCategoryAccounts) {
      const parsed = JSON.parse(cachedCategoryAccounts);
      setLocal(categoryCacheKey, parsed);
      return parsed;
    }

    // If not in cache, fetch the category data
    const database = client.db("ratecreator");
    const categoryMappingCollection = database.collection("CategoryMapping");
    const accountCollection = database.collection<Account>("Account");

    // First get the category details
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (!category) {
      return null;
    }

    const categoryObjectId = new ObjectId(categoryId);
    const categoryMappings = await categoryMappingCollection
      .find({ categoryId: categoryObjectId })
      .toArray();

    if (categoryMappings.length === 0) {
      const emptyCategory: PopularCategoryWithAccounts = {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        } as any, // Type assertion to satisfy the PopularCategory interface
        accounts: [],
      };

      // Cache with TTL
      await redis.setex(
        categoryCacheKey,
        REDIS_TTL.INDIVIDUAL_CATEGORY,
        JSON.stringify(emptyCategory),
      );
      setLocal(categoryCacheKey, emptyCategory);

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

    const categoryWithAccounts: PopularCategoryWithAccounts = {
      category: {
        id: category.id,
        name: category.name,
        slug: category.slug,
      } as any, // Type assertion to satisfy the PopularCategory interface
      accounts: accounts.map((account) => ({
        id: account._id.toString(),
        name: account.name || "",
        handle: account.handle || "",
        platform: account.platform,
        accountId: account.accountId,
        followerCount: account.followerCount || 0,
        rating: parseFloat((account.rating || 0).toFixed(2)),
        reviewCount: account.reviewCount || 0,
        imageUrl: account.imageUrl || "",
      })),
    };

    // Cache with TTL
    await redis.setex(
      categoryCacheKey,
      REDIS_TTL.INDIVIDUAL_CATEGORY,
      JSON.stringify(categoryWithAccounts),
    );
    setLocal(categoryCacheKey, categoryWithAccounts);

    return categoryWithAccounts;
  } catch (error) {
    console.error(`Failed to fetch category ${categoryId}:`, error);
    throw new Error(`Failed to fetch category ${categoryId}`);
  }
}
