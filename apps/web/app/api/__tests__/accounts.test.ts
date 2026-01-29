/**
 * Tests for Accounts API Route
 * Tests platform-specific account fetching with caching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Use vi.hoisted for mocks
const { mockRedis, mockPrisma } = vi.hoisted(() => {
  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
  };

  const mockPrisma = {
    account: {
      findFirst: vi.fn(),
    },
    categoryMapping: {
      findMany: vi.fn(),
    },
  };

  return { mockRedis, mockPrisma };
});

// Mock modules
vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => mockRedis),
}));

vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@ratecreator/types/review", () => ({
  CreatorData: {},
}));

import { GET } from "../accounts/route";

describe("Accounts API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (params: Record<string, string>) => {
    const url = new URL("http://localhost:3000/api/accounts");
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });
    return new NextRequest(url);
  };

  describe("Parameter Validation", () => {
    it("should return 400 when platform is missing", async () => {
      const request = createRequest({ accountId: "123" });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Platform is required");
    });

    it("should return 400 when accountId is missing", async () => {
      const request = createRequest({ platform: "youtube" });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Account ID is required");
    });

    it("should return 400 for invalid platform", async () => {
      const request = createRequest({ platform: "invalid", accountId: "123" });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("Invalid platform");
    });
  });

  describe("YouTube Account", () => {
    const mockAccount = {
      id: "account-1",
      platform: "YOUTUBE",
      accountId: "UC123",
      handle: "@testchannel",
      name: "Test Channel",
      name_en: "Test Channel EN",
      description: "A test channel",
      description_en: "A test channel EN",
      keywords: "test,channel",
      keywords_en: "test,channel",
      followerCount: 100000,
      imageUrl: "https://example.com/image.jpg",
      country: "US",
      language_code: "en",
      rating: 4.5,
      reviewCount: 10,
      ytData: { subscriberCount: 100000 },
    };

    it("should return cached data if available", async () => {
      const cachedData = JSON.stringify({
        account: mockAccount,
        categories: ["tech"],
      });
      mockRedis.get.mockResolvedValueOnce(cachedData);

      const request = createRequest({
        platform: "youtube",
        accountId: "UC123",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.account).toBeDefined();
      expect(mockPrisma.account.findFirst).not.toHaveBeenCalled();
    });

    it("should fetch from database when cache miss", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(mockAccount);
      mockPrisma.categoryMapping.findMany.mockResolvedValueOnce([
        { category: { slug: "tech" } },
      ]);

      const request = createRequest({
        platform: "youtube",
        accountId: "UC123",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.account).toBeDefined();
      expect(data.categories).toContain("tech");
      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: { accountId: "UC123", platform: "YOUTUBE" },
      });
    });

    it("should return 404 when account not found", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(null);

      const request = createRequest({
        platform: "youtube",
        accountId: "UC123",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe("Account not found");
    });

    it("should cache the fetched data", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(mockAccount);
      mockPrisma.categoryMapping.findMany.mockResolvedValueOnce([]);

      const request = createRequest({
        platform: "youtube",
        accountId: "UC123",
      });
      await GET(request);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "accounts-youtube-UC123",
        expect.any(String),
      );
    });

    it("should format response to match CreatorData type", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(mockAccount);
      mockPrisma.categoryMapping.findMany.mockResolvedValueOnce([]);

      const request = createRequest({
        platform: "youtube",
        accountId: "UC123",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.account.id).toBe("account-1");
      expect(data.account.platform).toBe("YOUTUBE");
      expect(data.account.ytData).toBeDefined();
      expect(data.categories).toEqual([]);
    });
  });

  describe("Twitter Account", () => {
    const mockAccount = {
      id: "account-2",
      platform: "TWITTER",
      accountId: "twitter123",
      handle: "@testuser",
      name: "Test User",
      description: "A test user",
      followerCount: 50000,
      imageUrl: "https://example.com/image.jpg",
      xData: { followersCount: 50000 },
    };

    it("should fetch twitter account successfully", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(mockAccount);
      mockPrisma.categoryMapping.findMany.mockResolvedValueOnce([]);

      const request = createRequest({
        platform: "twitter",
        accountId: "twitter123",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.account.xData).toBeDefined();
      expect(mockPrisma.account.findFirst).toHaveBeenCalledWith({
        where: { accountId: "twitter123", platform: "TWITTER" },
      });
    });

    it("should use correct cache key for twitter", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(mockAccount);
      mockPrisma.categoryMapping.findMany.mockResolvedValueOnce([]);

      const request = createRequest({
        platform: "twitter",
        accountId: "twitter123",
      });
      await GET(request);

      expect(mockRedis.set).toHaveBeenCalledWith(
        "accounts-twitter-twitter123",
        expect.any(String),
      );
    });
  });

  describe("TikTok Account", () => {
    const mockAccount = {
      id: "account-3",
      platform: "TIKTOK",
      accountId: "tiktok123",
      handle: "@tiktoker",
      name: "TikToker",
      description: "A TikTok creator",
      followerCount: 200000,
      tiktokData: { followerCount: 200000 },
    };

    it("should fetch tiktok account successfully", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(mockAccount);
      mockPrisma.categoryMapping.findMany.mockResolvedValueOnce([]);

      const request = createRequest({
        platform: "tiktok",
        accountId: "tiktok123",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.account.tiktokData).toBeDefined();
    });
  });

  describe("Reddit Account", () => {
    const mockAccount = {
      id: "account-4",
      platform: "REDDIT",
      accountId: "reddit123",
      handle: "redditor",
      name: "Redditor",
      description: "A Reddit user",
      followerCount: 10000,
      redditData: { totalKarma: 50000 },
    };

    it("should fetch reddit account successfully", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(mockAccount);
      mockPrisma.categoryMapping.findMany.mockResolvedValueOnce([]);

      const request = createRequest({
        platform: "reddit",
        accountId: "reddit123",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.account.redditData).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should return 500 on database error", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockRejectedValueOnce(new Error("DB Error"));

      const request = createRequest({
        platform: "youtube",
        accountId: "UC123",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBeDefined();
    });

    it("should return 500 on redis error for cache read", async () => {
      mockRedis.get.mockRejectedValueOnce(new Error("Redis Error"));

      const request = createRequest({
        platform: "youtube",
        accountId: "UC123",
      });
      const response = await GET(request);

      expect(response.status).toBe(500);
    });

    it("should handle null values in account fields", async () => {
      const accountWithNulls = {
        id: "account-5",
        platform: "YOUTUBE",
        accountId: "UC456",
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
        ytData: null,
      };

      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(accountWithNulls);
      mockPrisma.categoryMapping.findMany.mockResolvedValueOnce([]);

      const request = createRequest({
        platform: "youtube",
        accountId: "UC456",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.account.handle).toBe("");
      expect(data.account.name).toBe("");
      expect(data.account.followerCount).toBe(0);
    });
  });

  describe("Category Mappings", () => {
    it("should include category slugs in response", async () => {
      const mockAccount = {
        id: "account-6",
        platform: "YOUTUBE",
        accountId: "UC789",
      };

      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(mockAccount);
      mockPrisma.categoryMapping.findMany.mockResolvedValueOnce([
        { category: { slug: "tech" } },
        { category: { slug: "gaming" } },
        { category: { slug: "education" } },
      ]);

      const request = createRequest({
        platform: "youtube",
        accountId: "UC789",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.categories).toEqual(["tech", "gaming", "education"]);
    });

    it("should handle empty category mappings", async () => {
      const mockAccount = {
        id: "account-7",
        platform: "YOUTUBE",
        accountId: "UC101",
      };

      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.account.findFirst.mockResolvedValueOnce(mockAccount);
      mockPrisma.categoryMapping.findMany.mockResolvedValueOnce([]);

      const request = createRequest({
        platform: "youtube",
        accountId: "UC101",
      });
      const response = await GET(request);
      const data = await response.json();

      expect(data.categories).toEqual([]);
    });
  });
});
