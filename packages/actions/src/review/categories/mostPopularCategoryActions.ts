"use server";

import {
  PopularCategory,
  PopularCategoryWithAccounts,
  Account,
  Category,
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

const POPULAR_FALLBACK_LIMIT = 12;

async function fetchPopularFallback(): Promise<PopularCategory[]> {
  // Fallback when no Category.popular === true rows exist:
  // pick top categories by mapped account count so the homepage is never empty.
  const client = await getMongoClient();
  const database = client.db("ratecreator");
  const mappingCollection = database.collection("CategoryMapping");

  const topCategoryIds = await mappingCollection
    .aggregate([
      { $group: { _id: "$categoryId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: POPULAR_FALLBACK_LIMIT },
    ])
    .toArray();

  if (topCategoryIds.length === 0) return [];

  const ids = topCategoryIds.map((row) => String(row._id));
  const categories = await prisma.category.findMany({
    where: { id: { in: ids } },
    select: { id: true, name: true, slug: true },
  });

  // Preserve the count-desc order from the aggregation.
  const order = new Map(ids.map((id, idx) => [id, idx]));
  return categories.sort(
    (a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0),
  );
}

export async function getMostPopularCategories(): Promise<PopularCategory[]> {
  try {
    // Check local cache first
    const local = getLocal<PopularCategory[]>(CACHE_POPULAR_CATEGORIES);
    if (local && local.length > 0) return local;

    const cachedCategories = await redis.get(CACHE_POPULAR_CATEGORIES);
    if (cachedCategories) {
      const parsed = JSON.parse(cachedCategories) as PopularCategory[];
      // Don't trust empty cached results — they're probably stale negatives
      // from before any Category.popular was set true.
      if (parsed.length > 0) {
        setLocal(CACHE_POPULAR_CATEGORIES, parsed);
        return parsed;
      }
    }

    let popularCategories = await prisma.category.findMany({
      where: { popular: true },
      select: {
        id: true,
        name: true,
        slug: true,
      },
    });

    if (popularCategories.length === 0) {
      console.warn(
        "[mostPopularCategories] No Category rows with popular=true; using account-count fallback",
      );
      popularCategories = await fetchPopularFallback();
    }

    if (popularCategories.length === 0) {
      // Don't poison the cache with an empty array — let the next caller retry.
      return [];
    }

    // Cache with TTL so a transient empty DB doesn't stick forever.
    await redis.setex(
      CACHE_POPULAR_CATEGORIES,
      REDIS_TTL.POPULAR_CATEGORY_ACCOUNTS,
      JSON.stringify(popularCategories),
    );
    setLocal(CACHE_POPULAR_CATEGORIES, popularCategories);

    return popularCategories;
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    throw new Error("Failed to fetch categories");
  }
}

function hasAtLeastOneAccount(rows: PopularCategoryWithAccounts[]): boolean {
  return rows.some((r) => Array.isArray(r.accounts) && r.accounts.length > 0);
}

export async function getMostPopularCategoryWithData(): Promise<
  PopularCategoryWithAccounts[]
> {
  const client = await getMongoClient();

  try {
    // Check local cache first. CRITICAL: must reject empty / no-account
    // results — `[]` is truthy and would pin the empty render for 60s on
    // any warm function instance (the bug that kept reproducing in preview).
    const local = getLocal<PopularCategoryWithAccounts[]>(
      CACHE_POPULAR_CATEGORY_ACCOUNTS,
    );
    if (local && hasAtLeastOneAccount(local)) return local;

    // Same defense for Redis: an old deploy may have written an empty (or
    // all-categories-with-empty-accounts) snapshot for 7 days; ignore it.
    const cachedFullResponse = await redis.get(CACHE_POPULAR_CATEGORY_ACCOUNTS);
    if (cachedFullResponse) {
      const parsed = JSON.parse(
        cachedFullResponse,
      ) as PopularCategoryWithAccounts[];
      if (hasAtLeastOneAccount(parsed)) {
        setLocal(CACHE_POPULAR_CATEGORY_ACCOUNTS, parsed);
        return parsed;
      }
      // Poisoned snapshot — drop it so the next caller doesn't hit it again.
      await redis.del(CACHE_POPULAR_CATEGORY_ACCOUNTS);
      console.warn(
        "[mostPopularCategories] Discarded empty cached snapshot from Redis",
      );
    }

    const popularCategoriesResponse = await getMostPopularCategories();
    const popularCategories: PopularCategory[] = popularCategoriesResponse;
    console.log(
      `[mostPopularCategories] Resolved ${popularCategories.length} categories to populate`,
    );

    const database = client.db("ratecreator");
    const categoryMappingCollection = database.collection("CategoryMapping");
    const accountCollection = database.collection<Account>("Account");

    const accountsByCategory = [];
    const pipeline = [];

    // Process each category, potentially in parallel
    for (const category of popularCategories) {
      try {
        const categoryCacheKey = `${CACHE_CATEGORY_ACCOUNTS_PREFIX}${category.id}`;

        // Try local cache for individual category. Reject empty-account
        // entries the same way as the aggregate cache check above.
        const localCat =
          getLocal<PopularCategoryWithAccounts>(categoryCacheKey);
        if (
          localCat &&
          Array.isArray(localCat.accounts) &&
          localCat.accounts.length > 0
        ) {
          accountsByCategory.push(localCat);
          continue;
        }

        // Try to get cached category data from Redis
        const cachedCategoryAccounts = await redis.get(categoryCacheKey);
        if (cachedCategoryAccounts) {
          const parsed = JSON.parse(
            cachedCategoryAccounts,
          ) as PopularCategoryWithAccounts;
          if (Array.isArray(parsed.accounts) && parsed.accounts.length > 0) {
            setLocal(categoryCacheKey, parsed);
            accountsByCategory.push(parsed);
            continue;
          }
          // Drop the poisoned per-category key so the next call re-queries.
          await redis.del(categoryCacheKey);
        }

        // If not cached, prepare fetch operation
        pipeline.push(
          (async () => {
            const categoryObjectId = new ObjectId(category.id);

            // Two-step: get account IDs from mappings, then fetch top accounts
            // Much faster than $lookup on 400K+ mappings
            const mappings = await categoryMappingCollection
              .find({ categoryId: categoryObjectId })
              .project({ accountId: 1, _id: 0 })
              .limit(5000)
              .toArray();

            const accountIds = mappings.map(
              (m) => new ObjectId(String(m.accountId)),
            );

            const accounts =
              accountIds.length > 0
                ? await accountCollection
                    .find({ _id: { $in: accountIds } })
                    .sort({ followerCount: -1 })
                    .limit(20)
                    .toArray()
                : [];

            if (accounts.length === 0) {
              // Don't cache empty-account results — caching for 7d would pin
              // the empty UI even if the category later gets accounts.
              console.warn(
                `[mostPopularCategories] Category ${category.slug} (${category.id}) has 0 mapped accounts`,
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

    // Only cache when AT LEAST ONE category has at least one account.
    // Caching the wrapper when every category is empty would pin the broken
    // render for 7 days (the bug we keep hitting in preview).
    if (hasAtLeastOneAccount(accountsByCategory)) {
      await redis.setex(
        CACHE_POPULAR_CATEGORY_ACCOUNTS,
        REDIS_TTL.POPULAR_CATEGORY_ACCOUNTS,
        JSON.stringify(accountsByCategory),
      );
      setLocal(CACHE_POPULAR_CATEGORY_ACCOUNTS, accountsByCategory);
      console.log(
        `[mostPopularCategories] Cached aggregate (${accountsByCategory.length} categories, first has ${accountsByCategory[0]?.accounts.length ?? 0} accounts)`,
      );
    } else {
      console.warn(
        "[mostPopularCategories] Refusing to cache aggregate — no category has any accounts",
      );
    }

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

    // Two-step: get account IDs, then fetch top accounts
    const mappings = await categoryMappingCollection
      .find({ categoryId: categoryObjectId })
      .project({ accountId: 1, _id: 0 })
      .limit(5000)
      .toArray();

    const accountIds = mappings.map((m) => new ObjectId(String(m.accountId)));

    const accounts =
      accountIds.length > 0
        ? await accountCollection
            .find({ _id: { $in: accountIds } })
            .sort({ followerCount: -1 })
            .limit(20)
            .toArray()
        : [];

    if (accounts.length === 0) {
      const emptyCategory: PopularCategoryWithAccounts = {
        category: {
          id: category.id,
          name: category.name,
          slug: category.slug,
        } as Pick<PopularCategory, "id" | "name" | "slug"> as Category,
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
