"use server";

import axios from "axios";

import {
  PopularCategory,
  PopularCategoryWithAccounts,
  Account,
} from "@ratecreator/types/review";
import { getPrismaClient } from "@ratecreator/db/client";
import getRedisClient from "@ratecreator/db/redis-do";
import getMongoClient from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";
import { formatValue } from "@ratecreator/db/utils";
const CACHE_POPULAR_CATEGORIES = "category-popular";
const CACHE_POPULAR_CATEGORY_ACCOUNTS = "category-popular-accounts";
const CACHE_CATEGORY_ACCOUNTS_PREFIX = "category-accounts:";

const redis = getRedisClient();
const prisma = getPrismaClient();

export async function getMostPopularCategories(): Promise<PopularCategory[]> {
  try {
    // const response = await axios.get(
    //   `${process.env.NEXT_PUBLIC_RATECREATOR_API_URL}/api/categories?type=popular-categories`
    // );
    // return response.data;
    const cachedCategories = await redis.get(CACHE_POPULAR_CATEGORIES);
    if (cachedCategories) {
      // console.log("Returning cached popular categories");
      return JSON.parse(cachedCategories);
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
      JSON.stringify(popularCategories)
    );
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
    // Try to get cached full response first
    const cachedFullResponse = await redis.get(CACHE_POPULAR_CATEGORY_ACCOUNTS);
    if (cachedFullResponse) {
      return JSON.parse(cachedFullResponse);
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
              (mapping) => new ObjectId(mapping.accountId)
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
                reviewCount: formatValue(account.reviewCount || 0),
                imageUrl: account.imageUrl || "",
              })),
            };

            // Cache individual category data with TTL
            await redis.set(
              categoryCacheKey,
              JSON.stringify(categoryWithAccounts)
            );

            return categoryWithAccounts;
          })()
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
      JSON.stringify(accountsByCategory)
    );

    return accountsByCategory;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}
