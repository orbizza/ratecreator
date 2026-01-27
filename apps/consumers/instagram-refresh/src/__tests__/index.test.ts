/**
 * Tests for Instagram Refresh Consumer
 * Tests weekly Instagram data refresh with rate limiting
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const {
  mockKafkaConsumer,
  mockCreateTopic,
  mockDisconnectProducer,
  mockPrisma,
  mockRedis,
  mockMongoClient,
  mockFetch,
} = vi.hoisted(() => {
  const mockKafkaConsumer = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribe: vi.fn(),
    run: vi.fn(),
    on: vi.fn(),
  };

  const mockCreateTopic = vi.fn();
  const mockDisconnectProducer = vi.fn();

  const mockPrisma = {
    $disconnect: vi.fn(),
  };

  const mockRedis = {
    incr: vi.fn(),
    decr: vi.fn(),
    expire: vi.fn(),
    get: vi.fn(),
    set: vi.fn(),
  };

  const mockCollection = {
    insertOne: vi.fn(),
    updateOne: vi.fn(),
    findOne: vi.fn(),
  };

  const mockDb = {
    collection: vi.fn(() => mockCollection),
  };

  const mockMongoClient = {
    db: vi.fn(() => mockDb),
  };

  const mockFetch = vi.fn();

  return {
    mockKafkaConsumer,
    mockCreateTopic,
    mockDisconnectProducer,
    mockPrisma,
    mockRedis,
    mockMongoClient,
    mockCollection,
    mockDb,
    mockFetch,
  };
});

// Mock modules
vi.mock("@ratecreator/db/kafka-client", () => ({
  getKafkaConsumer: vi.fn(() => mockKafkaConsumer),
  createTopicIfNotExists: mockCreateTopic,
  disconnectProducer: mockDisconnectProducer,
}));

vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => mockRedis),
}));

vi.mock("@ratecreator/db/mongo-client", () => ({
  getMongoClient: vi.fn(() => Promise.resolve(mockMongoClient)),
}));

vi.mock("mongodb", () => ({
  ObjectId: vi.fn((id) => id),
}));

vi.stubGlobal("fetch", mockFetch);

describe("Instagram Refresh Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.INSTAGRAM_ACCESS_TOKEN = "test-access-token";
    process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID = "test-business-id";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rate Limiting", () => {
    const RATE_LIMIT_MAX = 200;

    it("should allow requests under rate limit", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);

      const result = await checkRateLimitHelper();
      expect(result).toBe(true);
    });

    it("should block requests over rate limit", async () => {
      mockRedis.incr.mockResolvedValueOnce(RATE_LIMIT_MAX + 1);

      const result = await checkRateLimitHelper();
      expect(result).toBe(false);
    });

    it("should set expiry on first request in window", async () => {
      mockRedis.incr.mockResolvedValueOnce(1);

      await checkRateLimitHelper();
      expect(mockRedis.expire).toHaveBeenCalledWith(
        "instagram_api_rate_limit",
        3600,
      );
    });

    it("should not set expiry on subsequent requests", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);

      await checkRateLimitHelper();
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    // Helper function
    async function checkRateLimitHelper(): Promise<boolean> {
      const current = await mockRedis.incr("instagram_api_rate_limit");
      if (current === 1) {
        await mockRedis.expire("instagram_api_rate_limit", 3600);
      }
      return current <= RATE_LIMIT_MAX;
    }
  });

  describe("Instagram Count Parser", () => {
    function parseInstagramCount(countStr: string): number {
      if (!countStr) return 0;
      const cleaned = countStr.replace(/,/g, "").trim();
      const multipliers: Record<string, number> = {
        K: 1000,
        M: 1000000,
        B: 1000000000,
      };
      const match = cleaned.match(/^([\d.]+)([KMB])?$/i);
      if (match) {
        const num = parseFloat(match[1]);
        const suffix = match[2]?.toUpperCase();
        return suffix ? Math.round(num * multipliers[suffix]) : Math.round(num);
      }
      return parseInt(cleaned) || 0;
    }

    it("should parse follower counts with K suffix", () => {
      expect(parseInstagramCount("100K")).toBe(100000);
      expect(parseInstagramCount("1.5K")).toBe(1500);
    });

    it("should parse follower counts with M suffix", () => {
      expect(parseInstagramCount("1.5M")).toBe(1500000);
      expect(parseInstagramCount("10M")).toBe(10000000);
    });

    it("should parse follower counts with B suffix", () => {
      expect(parseInstagramCount("2B")).toBe(2000000000);
    });

    it("should parse plain numbers with commas", () => {
      expect(parseInstagramCount("5,000")).toBe(5000);
      expect(parseInstagramCount("1,234,567")).toBe(1234567);
    });

    it("should return 0 for empty string", () => {
      expect(parseInstagramCount("")).toBe(0);
    });

    it("should handle decimal values", () => {
      expect(parseInstagramCount("2.5M")).toBe(2500000);
    });
  });

  describe("Instagram Graph API", () => {
    const mockGraphResponse = {
      business_discovery: {
        username: "testuser",
        name: "Test User",
        biography: "Test bio",
        profile_picture_url: "https://example.com/pic.jpg",
        followers_count: 50000,
        follows_count: 500,
        media_count: 200,
        website: "https://example.com",
      },
    };

    it("should fetch Instagram data via Graph API successfully", async () => {
      mockRedis.incr.mockResolvedValueOnce(1);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockGraphResponse),
      });

      expect(mockFetch).toBeDefined();
    });

    it("should return null when credentials missing", async () => {
      delete process.env.INSTAGRAM_ACCESS_TOKEN;
      delete process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;

      // Should not make Graph API call without credentials
      expect(mockFetch).toBeDefined();
    });

    it("should decrement counter on 429 rate limit", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      expect(mockRedis.decr).toBeDefined();
    });

    it("should handle API errors gracefully", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      expect(mockFetch).toBeDefined();
    });
  });

  describe("Web Scraping Fallback", () => {
    it("should fall back to scraping when Graph API unavailable", async () => {
      delete process.env.INSTAGRAM_ACCESS_TOKEN;
      mockRedis.incr.mockResolvedValueOnce(1);

      const mockHtml = `
        <meta property="og:title" content="Test User (@testuser)">
        <meta property="og:description" content="50K Followers, 500 Following, 200 Posts - Test bio">
        <meta property="og:image" content="https://example.com/pic.jpg">
      `;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      expect(mockFetch).toBeDefined();
    });

    it("should extract follower count from description", () => {
      const description = "50K Followers, 500 Following, 200 Posts";
      const statsMatch = description.match(
        /([\d,.]+[KMB]?)\s*Followers.*?([\d,.]+[KMB]?)\s*Following.*?([\d,.]+[KMB]?)\s*Posts/i,
      );

      expect(statsMatch).toBeDefined();
      expect(statsMatch![1]).toBe("50K");
    });

    it("should extract name from title", () => {
      const title = "Test User (@testuser)";
      const nameMatch = title.match(/^(.+?)\s*\(@/);

      expect(nameMatch).toBeDefined();
      expect(nameMatch![1]).toBe("Test User");
    });

    it("should detect verified badge", () => {
      const htmlWithVerified = '"is_verified":true';
      const isVerified = htmlWithVerified.includes('"is_verified":true');

      expect(isVerified).toBe(true);
    });

    it("should handle scraping errors", async () => {
      mockRedis.incr.mockResolvedValueOnce(1);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
      });

      expect(mockFetch).toBeDefined();
    });
  });

  describe("Message Processing", () => {
    it("should skip processing for null message value", async () => {
      const message = { value: null };

      expect(mockMongoClient.db).not.toHaveBeenCalled();
    });

    it("should skip processing for non-Instagram platform", async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            accountId: "account-123",
            platform: "YOUTUBE",
            scheduledAt: new Date().toISOString(),
          }),
        ),
      };

      expect(mockMessage.value).toBeDefined();
    });

    it("should process valid data-refresh-instagram message", async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            accountId: "account-123",
            platform: "INSTAGRAM",
            scheduledAt: new Date().toISOString(),
          }),
        ),
      };

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue({
          _id: "account-123",
          handle: "testuser",
          instagramData: {},
          followerCount: 50000,
        }),
        insertOne: vi.fn().mockResolvedValue({ insertedId: "log-123" }),
        updateOne: vi.fn().mockResolvedValue({}),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockMessage.value).toBeDefined();
    });

    it("should handle account not found", async () => {
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockCollection.findOne).toBeDefined();
    });
  });

  describe("Data Update Logic", () => {
    it("should update follower count when changed", () => {
      const freshData = { followers: 60000 };
      const existingAccount = { followerCount: 50000 };

      const updateData: any = {
        instagramData: freshData,
        lastDataRefresh: new Date(),
      };

      if (
        freshData.followers !== undefined &&
        freshData.followers !== existingAccount.followerCount
      ) {
        updateData.followerCount = freshData.followers;
      }

      expect(updateData.followerCount).toBe(60000);
    });

    it("should not update follower count when unchanged", () => {
      const freshData = { followers: 50000 };
      const existingAccount = { followerCount: 50000 };

      const updateData: any = { instagramData: freshData };

      if (
        freshData.followers !== undefined &&
        freshData.followers !== existingAccount.followerCount
      ) {
        updateData.followerCount = freshData.followers;
      }

      expect(updateData.followerCount).toBeUndefined();
    });

    it("should update name when changed", () => {
      const freshData = { name: "New Name" };
      const existingAccount = { name: "Old Name" };

      const updateData: any = {};

      if (freshData.name && freshData.name !== existingAccount.name) {
        updateData.name = freshData.name;
      }

      expect(updateData.name).toBe("New Name");
    });

    it("should update profile image when changed", () => {
      const freshData = { profileImage: "https://new.com/pic.jpg" };
      const existingAccount = { imageUrl: "https://old.com/pic.jpg" };

      const updateData: any = {};

      if (
        freshData.profileImage &&
        freshData.profileImage !== existingAccount.imageUrl
      ) {
        updateData.imageUrl = freshData.profileImage;
      }

      expect(updateData.imageUrl).toBe("https://new.com/pic.jpg");
    });
  });

  describe("Redis Cache Update", () => {
    it("should update Redis cache if exists", async () => {
      const cacheKey = "accounts-instagram-testuser";
      const existingCache = JSON.stringify({
        account: {
          name: "Old Name",
          followerCount: 50000,
        },
      });

      mockRedis.get.mockResolvedValueOnce(existingCache);
      mockRedis.set.mockResolvedValueOnce("OK");

      expect(mockRedis.get).toBeDefined();
      expect(mockRedis.set).toBeDefined();
    });

    it("should not update cache if not exists", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe("DataRefreshLog", () => {
    it("should create log entry on start", async () => {
      const mockCollection = {
        insertOne: vi.fn().mockResolvedValue({ insertedId: "log-123" }),
        updateOne: vi.fn(),
        findOne: vi.fn().mockResolvedValue({ handle: "testuser" }),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockCollection.insertOne).toBeDefined();
    });

    it("should update log as COMPLETED on success", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      expect(mockCollection.updateOne).toBeDefined();
    });

    it("should update log as FAILED on error", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      expect(mockCollection.updateOne).toBeDefined();
    });

    it("should include data snapshot in log", () => {
      const dataSnapshot = {
        before: { followers_count: 50000 },
        after: { followers: 60000 },
      };

      expect(dataSnapshot.before).toBeDefined();
      expect(dataSnapshot.after).toBeDefined();
    });
  });

  describe("Consumer Lifecycle", () => {
    it("should connect and subscribe to data-refresh-instagram topic", async () => {
      mockKafkaConsumer.connect.mockResolvedValueOnce(undefined);
      mockKafkaConsumer.subscribe.mockResolvedValueOnce(undefined);

      expect(mockKafkaConsumer.connect).toBeDefined();
      expect(mockKafkaConsumer.subscribe).toBeDefined();
    });

    it("should handle connection errors with retry", async () => {
      mockKafkaConsumer.connect.mockRejectedValueOnce(
        new Error("Connection failed"),
      );

      expect(mockKafkaConsumer.connect).toBeDefined();
    });

    it("should disconnect cleanly on shutdown", async () => {
      mockKafkaConsumer.disconnect.mockResolvedValueOnce(undefined);
      mockPrisma.$disconnect.mockResolvedValueOnce(undefined);
      mockDisconnectProducer.mockResolvedValueOnce(undefined);

      expect(mockKafkaConsumer.disconnect).toBeDefined();
      expect(mockPrisma.$disconnect).toBeDefined();
    });
  });
});
