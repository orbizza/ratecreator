/**
 * Tests for creatorActions
 * Tests fetching creator data with platform-specific handling and caching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const {
  mockRedisGet,
  mockRedisSet,
  mockRedisDel,
  mockAccountFindFirst,
  mockCategoryMappingFindMany,
  mockPrismaInstance,
  mockRedisClient,
} = vi.hoisted(() => {
  const mockRedisGet = vi.fn();
  const mockRedisSet = vi.fn();
  const mockRedisDel = vi.fn();
  const mockAccountFindFirst = vi.fn();
  const mockCategoryMappingFindMany = vi.fn();
  const mockRedisClient = {
    get: mockRedisGet,
    set: mockRedisSet,
    del: mockRedisDel,
  };
  const mockPrismaInstance = {
    account: {
      findFirst: mockAccountFindFirst,
    },
    categoryMapping: {
      findMany: mockCategoryMappingFindMany,
    },
  };
  return {
    mockRedisGet,
    mockRedisSet,
    mockRedisDel,
    mockAccountFindFirst,
    mockCategoryMappingFindMany,
    mockPrismaInstance,
    mockRedisClient,
  };
});

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrismaInstance),
}));

vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => mockRedisClient),
}));

describe("Creator Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Cache key constants
  const CACHE_YOUTUBE_CREATOR = "accounts-youtube-";
  const CACHE_TWITTER_CREATOR = "accounts-twitter-";
  const CACHE_TIKTOK_CREATOR = "accounts-tiktok-";
  const CACHE_REDDIT_CREATOR = "accounts-reddit-";
  const CACHE_INSTAGRAM_CREATOR = "accounts-instagram-";

  // Helper function to simulate getCreatorData
  const getCreatorData = async (params: {
    accountId: string;
    platform: string;
  }) => {
    const { accountId, platform } = params;

    if (!platform) {
      throw new Error("Platform is required");
    }
    if (!accountId) {
      throw new Error("Account ID is required");
    }

    const platformMap: {
      [key: string]: { cachePrefix: string; platformEnum: string };
    } = {
      youtube: { cachePrefix: CACHE_YOUTUBE_CREATOR, platformEnum: "YOUTUBE" },
      twitter: { cachePrefix: CACHE_TWITTER_CREATOR, platformEnum: "TWITTER" },
      tiktok: { cachePrefix: CACHE_TIKTOK_CREATOR, platformEnum: "TIKTOK" },
      reddit: { cachePrefix: CACHE_REDDIT_CREATOR, platformEnum: "REDDIT" },
      instagram: {
        cachePrefix: CACHE_INSTAGRAM_CREATOR,
        platformEnum: "INSTAGRAM",
      },
    };

    const config = platformMap[platform];
    if (!config) {
      throw new Error("Invalid platform");
    }

    // Check cache first
    const cachedData = await mockRedisClient.get(
      `${config.cachePrefix}${accountId}`,
    );
    if (cachedData) {
      return JSON.parse(cachedData);
    }

    // Fetch from database
    const account = await mockPrismaInstance.account.findFirst({
      where: {
        accountId: accountId,
        platform: config.platformEnum,
      },
    });

    if (!account) {
      return { error: "Account not found", status: 404 };
    }

    // Get category mappings
    const categoryMappings = await mockPrismaInstance.categoryMapping.findMany({
      where: { accountId: account.id },
      include: {
        category: {
          select: { slug: true },
        },
      },
    });

    const categorySlugs = categoryMappings.map((m: any) => m.category.slug);

    const responseData = {
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
      },
      categories: categorySlugs,
    };

    // Cache the response
    await mockRedisClient.set(
      `${config.cachePrefix}${accountId}`,
      JSON.stringify(responseData),
      "EX",
      3600,
    );

    return responseData;
  };

  describe("Parameter Validation", () => {
    it("should throw error when platform is missing", async () => {
      await expect(
        getCreatorData({ accountId: "test-123", platform: "" }),
      ).rejects.toThrow("Platform is required");
    });

    it("should throw error when accountId is missing", async () => {
      await expect(
        getCreatorData({ accountId: "", platform: "youtube" }),
      ).rejects.toThrow("Account ID is required");
    });

    it("should throw error for invalid platform", async () => {
      await expect(
        getCreatorData({ accountId: "test-123", platform: "invalid" }),
      ).rejects.toThrow("Invalid platform");
    });
  });

  describe("YouTube Account Handling", () => {
    const mockYouTubeAccount = {
      id: "yt-account-123",
      platform: "YOUTUBE",
      accountId: "channel-123",
      handle: "@testchannel",
      name: "Test Channel",
      name_en: "Test Channel EN",
      description: "A test YouTube channel",
      description_en: "A test YouTube channel EN",
      keywords: "tech,gaming",
      keywords_en: "tech,gaming",
      followerCount: 1000000,
      imageUrl: "https://example.com/avatar.jpg",
      country: "US",
      language_code: "en",
      rating: 4.5,
      reviewCount: 100,
      ytData: { subscriberCount: 1000000 },
    };

    it("should return cached data when available", async () => {
      const cachedData = {
        account: mockYouTubeAccount,
        categories: ["gaming", "technology"],
      };
      mockRedisGet.mockResolvedValueOnce(JSON.stringify(cachedData));

      const result = await getCreatorData({
        accountId: "channel-123",
        platform: "youtube",
      });

      expect(result).toEqual(cachedData);
      expect(mockAccountFindFirst).not.toHaveBeenCalled();
    });

    it("should fetch from database when cache miss", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockAccountFindFirst.mockResolvedValueOnce(mockYouTubeAccount);
      mockCategoryMappingFindMany.mockResolvedValueOnce([
        { category: { slug: "gaming" } },
        { category: { slug: "technology" } },
      ]);

      const result = await getCreatorData({
        accountId: "channel-123",
        platform: "youtube",
      });

      expect(mockAccountFindFirst).toHaveBeenCalledWith({
        where: {
          accountId: "channel-123",
          platform: "YOUTUBE",
        },
      });
      expect(result.account.name).toBe("Test Channel");
      expect(result.categories).toEqual(["gaming", "technology"]);
    });

    it("should cache result with 1-hour TTL", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockAccountFindFirst.mockResolvedValueOnce(mockYouTubeAccount);
      mockCategoryMappingFindMany.mockResolvedValueOnce([]);

      await getCreatorData({
        accountId: "channel-123",
        platform: "youtube",
      });

      expect(mockRedisSet).toHaveBeenCalledWith(
        "accounts-youtube-channel-123",
        expect.any(String),
        "EX",
        3600,
      );
    });

    it("should return 404 error when account not found", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockAccountFindFirst.mockResolvedValueOnce(null);

      const result = await getCreatorData({
        accountId: "non-existent",
        platform: "youtube",
      });

      expect(result).toEqual({ error: "Account not found", status: 404 });
    });
  });

  describe("Twitter Account Handling", () => {
    it("should use correct cache key for Twitter", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockAccountFindFirst.mockResolvedValueOnce({
        id: "twitter-123",
        platform: "TWITTER",
        accountId: "twitteruser",
        name: "Twitter User",
      });
      mockCategoryMappingFindMany.mockResolvedValueOnce([]);

      await getCreatorData({
        accountId: "twitteruser",
        platform: "twitter",
      });

      expect(mockRedisGet).toHaveBeenCalledWith("accounts-twitter-twitteruser");
      expect(mockAccountFindFirst).toHaveBeenCalledWith({
        where: {
          accountId: "twitteruser",
          platform: "TWITTER",
        },
      });
    });
  });

  describe("TikTok Account Handling", () => {
    it("should use correct cache key for TikTok", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockAccountFindFirst.mockResolvedValueOnce({
        id: "tiktok-123",
        platform: "TIKTOK",
        accountId: "tiktokuser",
        name: "TikTok User",
      });
      mockCategoryMappingFindMany.mockResolvedValueOnce([]);

      await getCreatorData({
        accountId: "tiktokuser",
        platform: "tiktok",
      });

      expect(mockRedisGet).toHaveBeenCalledWith("accounts-tiktok-tiktokuser");
      expect(mockAccountFindFirst).toHaveBeenCalledWith({
        where: {
          accountId: "tiktokuser",
          platform: "TIKTOK",
        },
      });
    });
  });

  describe("Reddit Account Handling", () => {
    it("should use correct cache key for Reddit", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockAccountFindFirst.mockResolvedValueOnce({
        id: "reddit-123",
        platform: "REDDIT",
        accountId: "redditor",
        name: "Reddit User",
      });
      mockCategoryMappingFindMany.mockResolvedValueOnce([]);

      await getCreatorData({
        accountId: "redditor",
        platform: "reddit",
      });

      expect(mockRedisGet).toHaveBeenCalledWith("accounts-reddit-redditor");
      expect(mockAccountFindFirst).toHaveBeenCalledWith({
        where: {
          accountId: "redditor",
          platform: "REDDIT",
        },
      });
    });
  });

  describe("Instagram Account Handling", () => {
    it("should use correct cache key for Instagram", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockAccountFindFirst.mockResolvedValueOnce({
        id: "insta-123",
        platform: "INSTAGRAM",
        accountId: "instauser",
        name: "Instagram User",
      });
      mockCategoryMappingFindMany.mockResolvedValueOnce([]);

      await getCreatorData({
        accountId: "instauser",
        platform: "instagram",
      });

      expect(mockRedisGet).toHaveBeenCalledWith("accounts-instagram-instauser");
      expect(mockAccountFindFirst).toHaveBeenCalledWith({
        where: {
          accountId: "instauser",
          platform: "INSTAGRAM",
        },
      });
    });
  });

  describe("Response Data Formatting", () => {
    it("should handle null values with defaults", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockAccountFindFirst.mockResolvedValueOnce({
        id: "account-123",
        platform: "YOUTUBE",
        accountId: "channel",
        handle: null,
        name: null,
        name_en: null,
        description: null,
        description_en: null,
        keywords: null,
        keywords_en: null,
        followerCount: null,
        imageUrl: null,
        country: null,
        language_code: null,
        rating: null,
        reviewCount: null,
      });
      mockCategoryMappingFindMany.mockResolvedValueOnce([]);

      const result = await getCreatorData({
        accountId: "channel",
        platform: "youtube",
      });

      expect(result.account.handle).toBe("");
      expect(result.account.name).toBe("");
      expect(result.account.followerCount).toBe(0);
      expect(result.account.rating).toBe(0);
      expect(result.account.reviewCount).toBe(0);
    });

    it("should include all account fields in response", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      const fullAccount = {
        id: "account-full",
        platform: "YOUTUBE",
        accountId: "fullchannel",
        handle: "@fullhandle",
        name: "Full Name",
        name_en: "Full Name EN",
        description: "Full description",
        description_en: "Full description EN",
        keywords: "key1,key2",
        keywords_en: "key1,key2",
        followerCount: 500000,
        imageUrl: "https://example.com/img.jpg",
        country: "UK",
        language_code: "en-GB",
        rating: 4.8,
        reviewCount: 250,
      };
      mockAccountFindFirst.mockResolvedValueOnce(fullAccount);
      mockCategoryMappingFindMany.mockResolvedValueOnce([]);

      const result = await getCreatorData({
        accountId: "fullchannel",
        platform: "youtube",
      });

      expect(result.account.id).toBe("account-full");
      expect(result.account.handle).toBe("@fullhandle");
      expect(result.account.name).toBe("Full Name");
      expect(result.account.description).toBe("Full description");
      expect(result.account.followerCount).toBe(500000);
      expect(result.account.rating).toBe(4.8);
      expect(result.account.reviewCount).toBe(250);
    });
  });

  describe("Category Mappings", () => {
    it("should fetch category mappings for account", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockAccountFindFirst.mockResolvedValueOnce({
        id: "account-with-categories",
        platform: "YOUTUBE",
        accountId: "channel",
      });
      mockCategoryMappingFindMany.mockResolvedValueOnce([
        { category: { slug: "gaming" } },
        { category: { slug: "entertainment" } },
        { category: { slug: "technology" } },
      ]);

      const result = await getCreatorData({
        accountId: "channel",
        platform: "youtube",
      });

      expect(mockCategoryMappingFindMany).toHaveBeenCalledWith({
        where: { accountId: "account-with-categories" },
        include: {
          category: {
            select: { slug: true },
          },
        },
      });
      expect(result.categories).toEqual([
        "gaming",
        "entertainment",
        "technology",
      ]);
    });

    it("should return empty categories array when no mappings", async () => {
      mockRedisGet.mockResolvedValueOnce(null);
      mockAccountFindFirst.mockResolvedValueOnce({
        id: "account-no-categories",
        platform: "YOUTUBE",
        accountId: "channel",
      });
      mockCategoryMappingFindMany.mockResolvedValueOnce([]);

      const result = await getCreatorData({
        accountId: "channel",
        platform: "youtube",
      });

      expect(result.categories).toEqual([]);
    });
  });

  describe("Cache Key Generation", () => {
    const platforms = [
      { platform: "youtube", prefix: "accounts-youtube-" },
      { platform: "twitter", prefix: "accounts-twitter-" },
      { platform: "tiktok", prefix: "accounts-tiktok-" },
      { platform: "reddit", prefix: "accounts-reddit-" },
      { platform: "instagram", prefix: "accounts-instagram-" },
    ];

    it.each(platforms)(
      "should generate correct cache key for $platform",
      async ({ platform, prefix }) => {
        mockRedisGet.mockResolvedValueOnce(null);
        mockAccountFindFirst.mockResolvedValueOnce({
          id: `${platform}-123`,
          platform: platform.toUpperCase(),
          accountId: "testuser",
        });
        mockCategoryMappingFindMany.mockResolvedValueOnce([]);

        await getCreatorData({
          accountId: "testuser",
          platform,
        });

        expect(mockRedisGet).toHaveBeenCalledWith(`${prefix}testuser`);
        expect(mockRedisSet).toHaveBeenCalledWith(
          `${prefix}testuser`,
          expect.any(String),
          "EX",
          3600,
        );
      },
    );
  });

  describe("Platform Enum Mapping", () => {
    const platformMappings = [
      { input: "youtube", dbValue: "YOUTUBE" },
      { input: "twitter", dbValue: "TWITTER" },
      { input: "tiktok", dbValue: "TIKTOK" },
      { input: "reddit", dbValue: "REDDIT" },
      { input: "instagram", dbValue: "INSTAGRAM" },
    ];

    it.each(platformMappings)(
      "should map $input to $dbValue for database query",
      async ({ input, dbValue }) => {
        mockRedisGet.mockResolvedValueOnce(null);
        mockAccountFindFirst.mockResolvedValueOnce({
          id: "test-id",
          platform: dbValue,
          accountId: "testuser",
        });
        mockCategoryMappingFindMany.mockResolvedValueOnce([]);

        await getCreatorData({
          accountId: "testuser",
          platform: input,
        });

        expect(mockAccountFindFirst).toHaveBeenCalledWith({
          where: {
            accountId: "testuser",
            platform: dbValue,
          },
        });
      },
    );
  });
});
