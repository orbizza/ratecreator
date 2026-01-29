// Cache utility for content app - NOT a server action file
// This file provides caching helpers that can be used by server actions

import { getRedisClient } from "@ratecreator/db/redis-do";

// Cache TTLs in seconds
const CACHE_TTL = {
  DASHBOARD_STATS: 60, // 1 minute - frequently updated
  ANALYTICS: 300, // 5 minutes - aggregate data
  MEMBER_STATS: 120, // 2 minutes
  MEMBERS_LIST: 60, // 1 minute - can change often
  IDEAS_STATS: 120, // 2 minutes
  CONTENT_STATS: 120, // 2 minutes
  RECENT_POSTS: 60, // 1 minute
  CALENDAR: 300, // 5 minutes
} as const;

// Cache key prefixes for content app
const CACHE_PREFIX = "content:" as const;

// In-memory cache for local caching (reduces Redis calls)
const localCache = new Map<string, { data: unknown; expiry: number }>();

function getLocalCache<T>(key: string): T | null {
  const entry = localCache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiry) {
    localCache.delete(key);
    return null;
  }
  return entry.data as T;
}

function setLocalCache<T>(key: string, data: T, ttlSeconds: number): void {
  localCache.set(key, {
    data,
    expiry: Date.now() + ttlSeconds * 1000,
  });
}

function deleteLocalCache(pattern: string): void {
  localCache.forEach((_, key) => {
    if (key.startsWith(pattern)) {
      localCache.delete(key);
    }
  });
}

/**
 * Get data from cache (local first, then Redis)
 */
export async function getCachedData<T>(key: string): Promise<T | null> {
  const fullKey = `${CACHE_PREFIX}${key}`;

  // Check local cache first
  const localData = getLocalCache<T>(fullKey);
  if (localData !== null) {
    return localData;
  }

  // Check Redis
  try {
    const redis = getRedisClient();
    const data = await redis.get(fullKey);
    if (data) {
      const parsed = JSON.parse(data) as T;
      // Store in local cache with shorter TTL (30 seconds)
      setLocalCache(fullKey, parsed, 30);
      return parsed;
    }
  } catch (error) {
    console.error(`[CACHE] REDIS ERROR on GET | ${fullKey}:`, error);
  }

  return null;
}

/**
 * Set data in cache (both local and Redis)
 */
export async function setCachedData<T>(
  key: string,
  data: T,
  ttlSeconds: number,
): Promise<void> {
  const fullKey = `${CACHE_PREFIX}${key}`;

  // Set local cache
  const localTtl = Math.min(ttlSeconds, 30);
  setLocalCache(fullKey, data, localTtl); // Local cache max 30s

  // Set Redis cache
  try {
    const redis = getRedisClient();
    await redis.setex(fullKey, ttlSeconds, JSON.stringify(data));
  } catch (error) {
    console.error(`[CACHE] REDIS ERROR on SET | ${fullKey}:`, error);
  }
}

/**
 * Invalidate cache by key or pattern
 */
export async function invalidateCache(keyOrPattern: string): Promise<void> {
  const fullPattern = `${CACHE_PREFIX}${keyOrPattern}`;

  // Clear local cache
  deleteLocalCache(fullPattern);

  // Clear Redis cache
  try {
    const redis = getRedisClient();
    if (keyOrPattern.includes("*")) {
      // Pattern delete
      const keys = await redis.keys(fullPattern);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } else {
      await redis.del(fullPattern);
    }
  } catch (error) {
    console.error(`[CACHE] REDIS ERROR on INVALIDATE | ${fullPattern}:`, error);
  }
}

/**
 * Cache wrapper for async functions
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>,
): Promise<T> {
  // Try to get from cache
  const cached = await getCachedData<T>(key);
  if (cached !== null) {
    return cached;
  }

  // Fetch fresh data
  const data = await fetcher();

  // Store in cache
  await setCachedData(key, data, ttlSeconds);

  return data;
}

// Export TTLs for use in other files
export { CACHE_TTL };

// Cache key generators
export const CacheKeys = {
  dashboardStats: (platform?: string) => `dashboard:stats:${platform || "all"}`,
  analytics: (platform?: string) => `analytics:${platform || "all"}`,
  memberStats: () => `members:stats`,
  membersList: (filters: string) => `members:list:${filters}`,
  membersCount: (filters: string) => `members:count:${filters}`,
  ideasStats: (platform?: string) => `ideas:stats:${platform || "all"}`,
  contentStats: (platform?: string) => `content:stats:${platform || "all"}`,
  recentPosts: (limit: number, platform?: string) =>
    `posts:recent:${limit}:${platform || "all"}`,
  calendar: (platform?: string, month?: string) =>
    `calendar:${platform || "all"}:${month || "current"}`,
} as const;
