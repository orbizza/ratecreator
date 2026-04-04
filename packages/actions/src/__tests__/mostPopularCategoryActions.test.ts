/**
 * Tests for mostPopularCategoryActions
 * Tests multi-layer caching (local Map -> Redis -> database)
 * for getMostPopularCategories, getMostPopularCategoryWithData,
 * and getSingleCategoryWithAccounts.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — created before any module-level code runs
// ---------------------------------------------------------------------------
const {
  mockRedisGet,
  mockRedisSet,
  mockRedisSetex,
  mockCategoryFindMany,
  mockCategoryFindUnique,
  mockMongoFind,
  mockMongoToArray,
  mockMongoSort,
  mockMongoLimit,
  mockRedisClient,
  mockPrismaInstance,
  mockMongoCollection,
  mockMongoDb,
  mockMongoClient,
} = vi.hoisted(() => {
  const mockRedisGet = vi.fn();
  const mockRedisSet = vi.fn();
  const mockRedisSetex = vi.fn();
  const mockCategoryFindMany = vi.fn();
  const mockCategoryFindUnique = vi.fn();
  const mockMongoToArray = vi.fn();
  const mockMongoLimit = vi.fn();
  const mockMongoSort = vi.fn();
  const mockMongoFind = vi.fn();
  const mockMongoAggregate = vi.fn();

  // Build the fluent chain: find() -> sort() -> limit() -> toArray()
  mockMongoLimit.mockReturnValue({ toArray: mockMongoToArray });
  mockMongoSort.mockReturnValue({ limit: mockMongoLimit });
  // By default find() returns a chain with toArray (for CategoryMapping)
  mockMongoFind.mockReturnValue({ toArray: mockMongoToArray });
  // aggregate() returns { toArray }
  mockMongoAggregate.mockReturnValue({ toArray: mockMongoToArray });

  const mockMongoCollection = vi.fn();
  const mockMongoDb = vi.fn(() => ({ collection: mockMongoCollection }));
  const mockMongoClient = { db: mockMongoDb };

  const mockRedisClient = {
    get: mockRedisGet,
    set: mockRedisSet,
    setex: mockRedisSetex,
  };

  const mockPrismaInstance = {
    category: {
      findMany: mockCategoryFindMany,
      findUnique: mockCategoryFindUnique,
    },
  };

  return {
    mockRedisGet,
    mockRedisSet,
    mockRedisSetex,
    mockCategoryFindMany,
    mockCategoryFindUnique,
    mockMongoFind,
    mockMongoToArray,
    mockMongoSort,
    mockMongoLimit,
    mockMongoAggregate,
    mockRedisClient,
    mockPrismaInstance,
    mockMongoCollection,
    mockMongoDb,
    mockMongoClient,
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrismaInstance),
}));

vi.mock("@ratecreator/db/redis-do", () => ({
  default: vi.fn(() => mockRedisClient),
  getRedisClient: vi.fn(() => mockRedisClient),
}));

vi.mock("@ratecreator/db/mongo-client", () => ({
  default: vi.fn(async () => mockMongoClient),
  getMongoClient: vi.fn(async () => mockMongoClient),
}));

vi.mock("mongodb", () => {
  class ObjectId {
    _id: string;
    constructor(id: string) {
      this._id = id;
    }
    toString() {
      return this._id;
    }
    // Allow comparison in $in queries
    toHexString() {
      return this._id;
    }
  }
  return { ObjectId };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const SEVEN_DAYS = 7 * 24 * 3600;

const sampleCategories = [
  { id: "cat-1", name: "Gaming", slug: "gaming" },
  { id: "cat-2", name: "Technology", slug: "technology" },
];

const sampleAccounts = [
  {
    _id: { toString: () => "acc-1", _id: "acc-1" },
    name: "Creator One",
    handle: "creator1",
    platform: "YOUTUBE",
    accountId: "UC001",
    followerCount: 500000,
    rating: 4.567,
    reviewCount: 42,
    imageUrl: "https://example.com/1.jpg",
  },
  {
    _id: { toString: () => "acc-2", _id: "acc-2" },
    name: "Creator Two",
    handle: "creator2",
    platform: "TWITTER",
    accountId: "TW002",
    followerCount: 200000,
    rating: 3.2,
    reviewCount: 10,
    imageUrl: "https://example.com/2.jpg",
  },
];

const sampleCategoryMappings = [
  { categoryId: "cat-1", accountId: "acc-1" },
  { categoryId: "cat-1", accountId: "acc-2" },
];

/**
 * Because the source module keeps a module-level `localCache` Map, we need
 * to reset modules between tests to get a fresh cache. This helper does
 * a dynamic import of a freshly loaded module.
 */
async function loadModule() {
  const mod = await import("../review/categories/mostPopularCategoryActions");
  return mod;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("mostPopularCategoryActions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset modules so we get a fresh localCache Map for each test
    vi.resetModules();

    // Reset the fluent mongo chain defaults
    mockMongoFind.mockReturnValue({ toArray: mockMongoToArray });
    mockMongoSort.mockReturnValue({ limit: mockMongoLimit });
    mockMongoLimit.mockReturnValue({ toArray: mockMongoToArray });
  });

  // =========================================================================
  // getMostPopularCategories
  // =========================================================================
  describe("getMostPopularCategories", () => {
    it("should return from local cache if available", async () => {
      // First call: cache miss — goes to Redis (miss) then Prisma
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindMany.mockResolvedValue(sampleCategories);
      mockRedisSet.mockResolvedValue("OK");

      const mod1 = await loadModule();
      const result1 = await mod1.getMostPopularCategories();
      expect(result1).toEqual(sampleCategories);

      // Second call within same module — should hit local cache
      // Clear the mocks to verify no external calls are made
      vi.clearAllMocks();
      const result2 = await mod1.getMostPopularCategories();
      expect(result2).toEqual(sampleCategories);
      expect(mockRedisGet).not.toHaveBeenCalled();
      expect(mockCategoryFindMany).not.toHaveBeenCalled();
    });

    it("should return from Redis if available (and populate local cache)", async () => {
      mockRedisGet.mockResolvedValue(JSON.stringify(sampleCategories));

      const mod = await loadModule();
      const result = await mod.getMostPopularCategories();

      expect(result).toEqual(sampleCategories);
      expect(mockRedisGet).toHaveBeenCalledWith("category-popular");
      expect(mockCategoryFindMany).not.toHaveBeenCalled();

      // Second call should come from local cache
      vi.clearAllMocks();
      const result2 = await mod.getMostPopularCategories();
      expect(result2).toEqual(sampleCategories);
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it("should fetch from Prisma when no cache exists", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindMany.mockResolvedValue(sampleCategories);
      mockRedisSet.mockResolvedValue("OK");

      const mod = await loadModule();
      const result = await mod.getMostPopularCategories();

      expect(result).toEqual(sampleCategories);
      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { popular: true },
        select: { id: true, name: true, slug: true },
      });
    });

    it("should cache in Redis with no TTL (redis.set, not setex)", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindMany.mockResolvedValue(sampleCategories);
      mockRedisSet.mockResolvedValue("OK");

      const mod = await loadModule();
      await mod.getMostPopularCategories();

      // Should use set (no TTL), not setex
      expect(mockRedisSet).toHaveBeenCalledWith(
        "category-popular",
        JSON.stringify(sampleCategories),
      );
      expect(mockRedisSetex).not.toHaveBeenCalled();
    });

    it("should populate local cache after fetching from Prisma", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindMany.mockResolvedValue(sampleCategories);
      mockRedisSet.mockResolvedValue("OK");

      const mod = await loadModule();
      await mod.getMostPopularCategories();

      // Verify local cache is populated by making another call
      vi.clearAllMocks();
      const result = await mod.getMostPopularCategories();
      expect(result).toEqual(sampleCategories);
      expect(mockRedisGet).not.toHaveBeenCalled();
      expect(mockCategoryFindMany).not.toHaveBeenCalled();
    });

    it("should throw an error on database failure", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindMany.mockRejectedValue(new Error("DB down"));

      const mod = await loadModule();
      await expect(mod.getMostPopularCategories()).rejects.toThrow(
        "Failed to fetch categories",
      );
    });
  });

  // =========================================================================
  // getMostPopularCategoryWithData
  // =========================================================================
  describe("getMostPopularCategoryWithData", () => {
    /**
     * Helper: sets up the mongo collection mock so that:
     *  - CategoryMapping.find().project().limit().toArray() returns mappings
     *  - Account.find().sort().limit().toArray() returns accounts
     */
    function setupMongoMocks(
      categoryMappings: unknown[] = sampleCategoryMappings,
      accounts: unknown[] = sampleAccounts,
    ) {
      mockMongoCollection.mockImplementation((name: string) => {
        if (name === "CategoryMapping") {
          return {
            find: vi.fn().mockReturnValue({
              project: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  toArray: vi.fn().mockResolvedValue(categoryMappings),
                }),
              }),
            }),
          };
        }
        if (name === "Account") {
          return {
            find: vi.fn().mockReturnValue({
              sort: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  toArray: vi.fn().mockResolvedValue(accounts),
                }),
              }),
            }),
          };
        }
        return {
          find: vi
            .fn()
            .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
        };
      });
    }

    it("should return from local cache if available", async () => {
      const cachedData = [
        {
          category: { id: "cat-1", name: "Gaming", slug: "gaming" },
          accounts: [],
        },
      ];

      // First call: Redis has the full response
      mockRedisGet.mockResolvedValue(JSON.stringify(cachedData));

      const mod = await loadModule();
      const result1 = await mod.getMostPopularCategoryWithData();
      expect(result1).toEqual(cachedData);

      // Second call should use local cache
      vi.clearAllMocks();
      const result2 = await mod.getMostPopularCategoryWithData();
      expect(result2).toEqual(cachedData);
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it("should return from Redis if available", async () => {
      const cachedData = [
        {
          category: { id: "cat-1", name: "Gaming", slug: "gaming" },
          accounts: [
            {
              id: "acc-1",
              name: "Creator One",
              handle: "creator1",
              platform: "YOUTUBE",
              accountId: "UC001",
              followerCount: 500000,
              rating: 4.57,
              reviewCount: 42,
              imageUrl: "https://example.com/1.jpg",
            },
          ],
        },
      ];

      mockRedisGet.mockResolvedValue(JSON.stringify(cachedData));

      const mod = await loadModule();
      const result = await mod.getMostPopularCategoryWithData();

      expect(result).toEqual(cachedData);
      expect(mockRedisGet).toHaveBeenCalledWith("category-popular-accounts");
      // Should not have tried to fetch categories or account data
      expect(mockCategoryFindMany).not.toHaveBeenCalled();
    });

    it("should fetch accounts for each popular category", async () => {
      // First redis.get for full response: miss
      // Then getMostPopularCategories: redis.get for popular: miss → Prisma
      // Then per-category redis.get: miss → MongoDB
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindMany.mockResolvedValue([sampleCategories[0]!]);
      mockRedisSet.mockResolvedValue("OK");
      mockRedisSetex.mockResolvedValue("OK");

      setupMongoMocks();

      const mod = await loadModule();
      const result = await mod.getMostPopularCategoryWithData();

      expect(result).toHaveLength(1);
      expect(result[0].category).toEqual({
        id: "cat-1",
        name: "Gaming",
        slug: "gaming",
      });
      expect(result[0].accounts).toHaveLength(2);
      expect(result[0].accounts[0].id).toBe("acc-1");
      expect(result[0].accounts[0].followerCount).toBe(500000);
      // Rating should be rounded to 2 decimal places
      expect(result[0].accounts[0].rating).toBe(4.57);
    });

    it("should cache full response with 7-day TTL (setex)", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindMany.mockResolvedValue([sampleCategories[0]!]);
      mockRedisSet.mockResolvedValue("OK");
      mockRedisSetex.mockResolvedValue("OK");

      setupMongoMocks();

      const mod = await loadModule();
      await mod.getMostPopularCategoryWithData();

      // The full response should be cached with setex and 7-day TTL
      expect(mockRedisSetex).toHaveBeenCalledWith(
        "category-popular-accounts",
        SEVEN_DAYS,
        expect.any(String),
      );

      // Individual category should also be cached with setex
      expect(mockRedisSetex).toHaveBeenCalledWith(
        "category-accounts:cat-1",
        SEVEN_DAYS,
        expect.any(String),
      );
    });

    it("should handle empty category mappings", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindMany.mockResolvedValue([sampleCategories[0]!]);
      mockRedisSet.mockResolvedValue("OK");
      mockRedisSetex.mockResolvedValue("OK");

      // CategoryMapping returns empty array
      setupMongoMocks([], []);

      const mod = await loadModule();
      const result = await mod.getMostPopularCategoryWithData();

      expect(result).toHaveLength(1);
      expect(result[0].accounts).toEqual([]);
      // Should still cache the empty result
      expect(mockRedisSetex).toHaveBeenCalledWith(
        "category-accounts:cat-1",
        SEVEN_DAYS,
        expect.any(String),
      );
    });

    it("should process categories in parallel via Promise.all", async () => {
      // Two categories, both uncached
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindMany.mockResolvedValue(sampleCategories);
      mockRedisSet.mockResolvedValue("OK");
      mockRedisSetex.mockResolvedValue("OK");

      setupMongoMocks();

      const mod = await loadModule();
      const result = await mod.getMostPopularCategoryWithData();

      // Both categories should be processed
      expect(result).toHaveLength(2);

      // Both individual categories should be cached
      expect(mockRedisSetex).toHaveBeenCalledWith(
        "category-accounts:cat-1",
        SEVEN_DAYS,
        expect.any(String),
      );
      expect(mockRedisSetex).toHaveBeenCalledWith(
        "category-accounts:cat-2",
        SEVEN_DAYS,
        expect.any(String),
      );
    });

    it("should call getMostPopularCategories internally", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindMany.mockResolvedValue(sampleCategories);
      mockRedisSet.mockResolvedValue("OK");
      mockRedisSetex.mockResolvedValue("OK");

      setupMongoMocks();

      const mod = await loadModule();
      await mod.getMostPopularCategoryWithData();

      // getMostPopularCategories fetches with { popular: true }
      expect(mockCategoryFindMany).toHaveBeenCalledWith({
        where: { popular: true },
        select: { id: true, name: true, slug: true },
      });
    });
  });

  // =========================================================================
  // getSingleCategoryWithAccounts
  // =========================================================================
  describe("getSingleCategoryWithAccounts", () => {
    function setupMongoMocksForSingle(
      categoryMappings: unknown[] = sampleCategoryMappings,
      accounts: unknown[] = sampleAccounts,
    ) {
      mockMongoCollection.mockImplementation((name: string) => {
        if (name === "CategoryMapping") {
          return {
            find: vi.fn().mockReturnValue({
              project: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  toArray: vi.fn().mockResolvedValue(categoryMappings),
                }),
              }),
            }),
          };
        }
        if (name === "Account") {
          return {
            find: vi.fn().mockReturnValue({
              sort: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  toArray: vi.fn().mockResolvedValue(accounts),
                }),
              }),
            }),
          };
        }
        return {
          find: vi
            .fn()
            .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
        };
      });
    }

    it("should return from local cache", async () => {
      const cachedData = {
        category: { id: "cat-1", name: "Gaming", slug: "gaming" },
        accounts: [],
      };

      // Populate local cache via Redis hit
      mockRedisGet.mockResolvedValue(JSON.stringify(cachedData));

      const mod = await loadModule();
      const result1 = await mod.getSingleCategoryWithAccounts("cat-1");
      expect(result1).toEqual(cachedData);

      // Second call should use local cache
      vi.clearAllMocks();
      const result2 = await mod.getSingleCategoryWithAccounts("cat-1");
      expect(result2).toEqual(cachedData);
      expect(mockRedisGet).not.toHaveBeenCalled();
    });

    it("should return from Redis", async () => {
      const cachedData = {
        category: { id: "cat-1", name: "Gaming", slug: "gaming" },
        accounts: [
          {
            id: "acc-1",
            name: "Creator One",
            handle: "creator1",
            platform: "YOUTUBE",
            accountId: "UC001",
            followerCount: 500000,
            rating: 4.57,
            reviewCount: 42,
            imageUrl: "https://example.com/1.jpg",
          },
        ],
      };

      mockRedisGet.mockResolvedValue(JSON.stringify(cachedData));

      const mod = await loadModule();
      const result = await mod.getSingleCategoryWithAccounts("cat-1");

      expect(result).toEqual(cachedData);
      expect(mockRedisGet).toHaveBeenCalledWith("category-accounts:cat-1");
      expect(mockCategoryFindUnique).not.toHaveBeenCalled();
    });

    it("should fetch from MongoDB when cache miss", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindUnique.mockResolvedValue({
        id: "cat-1",
        name: "Gaming",
        slug: "gaming",
      });
      mockRedisSetex.mockResolvedValue("OK");

      setupMongoMocksForSingle();

      const mod = await loadModule();
      const result = await mod.getSingleCategoryWithAccounts("cat-1");

      expect(mockCategoryFindUnique).toHaveBeenCalledWith({
        where: { id: "cat-1" },
        select: { id: true, name: true, slug: true },
      });
      expect(result).not.toBeNull();
      expect(result!.category).toEqual({
        id: "cat-1",
        name: "Gaming",
        slug: "gaming",
      });
      expect(result!.accounts).toHaveLength(2);
      expect(result!.accounts[0].id).toBe("acc-1");
    });

    it("should cache with 7-day TTL", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindUnique.mockResolvedValue({
        id: "cat-1",
        name: "Gaming",
        slug: "gaming",
      });
      mockRedisSetex.mockResolvedValue("OK");

      setupMongoMocksForSingle();

      const mod = await loadModule();
      await mod.getSingleCategoryWithAccounts("cat-1");

      expect(mockRedisSetex).toHaveBeenCalledWith(
        "category-accounts:cat-1",
        SEVEN_DAYS,
        expect.any(String),
      );
    });

    it("should return null for non-existent category", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindUnique.mockResolvedValue(null);

      const mod = await loadModule();
      const result = await mod.getSingleCategoryWithAccounts("non-existent");

      expect(result).toBeNull();
      expect(mockRedisSetex).not.toHaveBeenCalled();
    });

    it("should handle empty category mappings and still cache", async () => {
      mockRedisGet.mockResolvedValue(null);
      mockCategoryFindUnique.mockResolvedValue({
        id: "cat-1",
        name: "Gaming",
        slug: "gaming",
      });
      mockRedisSetex.mockResolvedValue("OK");

      setupMongoMocksForSingle([], []);

      const mod = await loadModule();
      const result = await mod.getSingleCategoryWithAccounts("cat-1");

      expect(result).not.toBeNull();
      expect(result!.accounts).toEqual([]);
      expect(mockRedisSetex).toHaveBeenCalledWith(
        "category-accounts:cat-1",
        SEVEN_DAYS,
        expect.any(String),
      );
    });

    it("should throw an error on failure", async () => {
      mockRedisGet.mockRejectedValue(new Error("Redis down"));

      const mod = await loadModule();
      await expect(mod.getSingleCategoryWithAccounts("cat-1")).rejects.toThrow(
        "Failed to fetch category cat-1",
      );
    });
  });
});
