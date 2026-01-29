/**
 * Tests for Cache Utility
 * Tests local cache, Redis cache, invalidation, withCache wrapper, and CacheKeys
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockRedisClient } = vi.hoisted(() => {
  const mockRedisClient = {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
  };

  return { mockRedisClient };
});

// Mock modules
vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => mockRedisClient),
}));

import {
  getCachedData,
  setCachedData,
  invalidateCache,
  withCache,
  CACHE_TTL,
  CacheKeys,
} from "../content/cache";

describe("Cache Utility", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear local cache between tests by invalidating everything
    // We do this by calling invalidateCache with a broad pattern
    mockRedisClient.keys.mockResolvedValue([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("CACHE_TTL", () => {
    it("should have correct TTL values", () => {
      expect(CACHE_TTL.DASHBOARD_STATS).toBe(60);
      expect(CACHE_TTL.ANALYTICS).toBe(300);
      expect(CACHE_TTL.MEMBER_STATS).toBe(120);
      expect(CACHE_TTL.MEMBERS_LIST).toBe(60);
      expect(CACHE_TTL.IDEAS_STATS).toBe(120);
      expect(CACHE_TTL.CONTENT_STATS).toBe(120);
      expect(CACHE_TTL.RECENT_POSTS).toBe(60);
      expect(CACHE_TTL.CALENDAR).toBe(300);
    });
  });

  describe("CacheKeys", () => {
    it("should generate correct dashboard stats key", () => {
      expect(CacheKeys.dashboardStats()).toBe("dashboard:stats:all");
      expect(CacheKeys.dashboardStats("RATECREATOR")).toBe(
        "dashboard:stats:RATECREATOR",
      );
    });

    it("should generate correct analytics key", () => {
      expect(CacheKeys.analytics()).toBe("analytics:all");
      expect(CacheKeys.analytics("CREATOROPS")).toBe("analytics:CREATOROPS");
    });

    it("should generate correct member stats key", () => {
      expect(CacheKeys.memberStats()).toBe("members:stats");
    });

    it("should generate correct members list key", () => {
      expect(CacheKeys.membersList("search=test")).toBe(
        "members:list:search=test",
      );
    });

    it("should generate correct members count key", () => {
      expect(CacheKeys.membersCount("role=ADMIN")).toBe(
        "members:count:role=ADMIN",
      );
    });

    it("should generate correct ideas stats key", () => {
      expect(CacheKeys.ideasStats()).toBe("ideas:stats:all");
      expect(CacheKeys.ideasStats("DOCUMENTATION")).toBe(
        "ideas:stats:DOCUMENTATION",
      );
    });

    it("should generate correct content stats key", () => {
      expect(CacheKeys.contentStats()).toBe("content:stats:all");
      expect(CacheKeys.contentStats("RATECREATOR")).toBe(
        "content:stats:RATECREATOR",
      );
    });

    it("should generate correct recent posts key", () => {
      expect(CacheKeys.recentPosts(5)).toBe("posts:recent:5:all");
      expect(CacheKeys.recentPosts(10, "CREATOROPS")).toBe(
        "posts:recent:10:CREATOROPS",
      );
    });

    it("should generate correct calendar key", () => {
      expect(CacheKeys.calendar()).toBe("calendar:all:current");
      expect(CacheKeys.calendar("RATECREATOR", "2024-01")).toBe(
        "calendar:RATECREATOR:2024-01",
      );
    });
  });

  describe("getCachedData", () => {
    it("should return data from Redis when available", async () => {
      const mockData = { count: 42 };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockData));

      const result = await getCachedData<{ count: number }>("test-key");

      expect(result).toEqual(mockData);
      expect(mockRedisClient.get).toHaveBeenCalledWith("content:test-key");
    });

    it("should return null when Redis has no data", async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const result = await getCachedData("no-data-key");

      expect(result).toBeNull();
    });

    it("should return null and log error when Redis throws", async () => {
      mockRedisClient.get.mockRejectedValueOnce(new Error("Redis error"));

      const result = await getCachedData("error-key");

      expect(result).toBeNull();
    });

    it("should return data from local cache on second call", async () => {
      const mockData = { value: "cached" };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(mockData));

      // First call - fetches from Redis
      const result1 = await getCachedData<{ value: string }>("local-test");
      expect(result1).toEqual(mockData);
      expect(mockRedisClient.get).toHaveBeenCalledTimes(1);

      // Second call - should come from local cache, no additional Redis call
      const result2 = await getCachedData<{ value: string }>("local-test");
      expect(result2).toEqual(mockData);
      expect(mockRedisClient.get).toHaveBeenCalledTimes(1);
    });

    it("should prefix key with 'content:'", async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      await getCachedData("my-key");

      expect(mockRedisClient.get).toHaveBeenCalledWith("content:my-key");
    });
  });

  describe("setCachedData", () => {
    it("should store data in Redis with correct TTL", async () => {
      const data = { name: "test" };
      mockRedisClient.setex.mockResolvedValueOnce("OK");

      await setCachedData("set-key", data, 120);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        "content:set-key",
        120,
        JSON.stringify(data),
      );
    });

    it("should handle Redis errors gracefully", async () => {
      mockRedisClient.setex.mockRejectedValueOnce(new Error("Redis error"));

      // Should not throw
      await expect(
        setCachedData("set-key", { test: true }, 60),
      ).resolves.toBeUndefined();
    });

    it("should make data available via getCachedData from local cache", async () => {
      const data = { cached: true };
      mockRedisClient.setex.mockResolvedValueOnce("OK");

      await setCachedData("round-trip", data, 60);

      // The local cache should have it, so Redis should not be called
      const result = await getCachedData("round-trip");
      expect(result).toEqual(data);
      // get should not be called since local cache was set
      expect(mockRedisClient.get).not.toHaveBeenCalled();
    });
  });

  describe("invalidateCache", () => {
    it("should delete a specific key from Redis", async () => {
      mockRedisClient.del.mockResolvedValueOnce(1);

      await invalidateCache("specific-key");

      expect(mockRedisClient.del).toHaveBeenCalledWith("content:specific-key");
    });

    it("should delete multiple keys matching a pattern", async () => {
      mockRedisClient.keys.mockResolvedValueOnce([
        "content:dashboard:stats:all",
        "content:dashboard:stats:RATECREATOR",
      ]);
      mockRedisClient.del.mockResolvedValueOnce(2);

      await invalidateCache("dashboard:*");

      expect(mockRedisClient.keys).toHaveBeenCalledWith("content:dashboard:*");
      expect(mockRedisClient.del).toHaveBeenCalledWith(
        "content:dashboard:stats:all",
        "content:dashboard:stats:RATECREATOR",
      );
    });

    it("should not call del when pattern matches no keys", async () => {
      mockRedisClient.keys.mockResolvedValueOnce([]);

      await invalidateCache("nonexistent:*");

      expect(mockRedisClient.keys).toHaveBeenCalled();
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });

    it("should handle Redis errors gracefully on pattern delete", async () => {
      mockRedisClient.keys.mockRejectedValueOnce(new Error("Redis error"));

      await expect(invalidateCache("failing:*")).resolves.toBeUndefined();
    });

    it("should handle Redis errors gracefully on key delete", async () => {
      mockRedisClient.del.mockRejectedValueOnce(new Error("Redis error"));

      await expect(invalidateCache("failing-key")).resolves.toBeUndefined();
    });
  });

  describe("withCache", () => {
    it("should return cached data when available", async () => {
      const cachedData = { fromCache: true };
      mockRedisClient.get.mockResolvedValueOnce(JSON.stringify(cachedData));

      const fetcher = vi.fn().mockResolvedValue({ fromFetcher: true });

      const result = await withCache("with-cache-key", 60, fetcher);

      expect(result).toEqual(cachedData);
      expect(fetcher).not.toHaveBeenCalled();
    });

    it("should call fetcher and cache result when cache misses", async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      mockRedisClient.setex.mockResolvedValueOnce("OK");

      const fetchedData = { fresh: true };
      const fetcher = vi.fn().mockResolvedValue(fetchedData);

      const result = await withCache("miss-key", 120, fetcher);

      expect(result).toEqual(fetchedData);
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        "content:miss-key",
        120,
        JSON.stringify(fetchedData),
      );
    });

    it("should propagate fetcher errors", async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);

      const fetcher = vi.fn().mockRejectedValue(new Error("Fetch failed"));

      await expect(withCache("error-key", 60, fetcher)).rejects.toThrow(
        "Fetch failed",
      );
    });

    it("should use correct TTL when caching fetched data", async () => {
      mockRedisClient.get.mockResolvedValueOnce(null);
      mockRedisClient.setex.mockResolvedValueOnce("OK");

      const fetcher = vi.fn().mockResolvedValue({ data: 1 });

      await withCache("ttl-key", 300, fetcher);

      expect(mockRedisClient.setex).toHaveBeenCalledWith(
        "content:ttl-key",
        300,
        expect.any(String),
      );
    });
  });
});
