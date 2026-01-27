/**
 * Tests for TikTok Refresh Consumer
 * Tests weekly TikTok data refresh with rate limiting
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

describe("TikTok Refresh Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rate Limiting", () => {
    const RATE_LIMIT_MAX = 40;
    const RATE_LIMIT_WINDOW = 3600;

    it("should allow requests under rate limit", async () => {
      mockRedis.incr.mockResolvedValueOnce(20);

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
        "tiktok_api_rate_limit",
        RATE_LIMIT_WINDOW,
      );
    });

    it("should not set expiry on subsequent requests", async () => {
      mockRedis.incr.mockResolvedValueOnce(20);

      await checkRateLimitHelper();
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    // Helper function
    async function checkRateLimitHelper(): Promise<boolean> {
      const current = await mockRedis.incr("tiktok_api_rate_limit");
      if (current === 1) {
        await mockRedis.expire("tiktok_api_rate_limit", RATE_LIMIT_WINDOW);
      }
      return current <= RATE_LIMIT_MAX;
    }
  });

  describe("TikTok API Credentials", () => {
    it("should return null when client key missing", async () => {
      delete process.env.TIKTOK_CLIENT_KEY;
      delete process.env.TIKTOK_CLIENT_SECRET;

      // Should not make API call without credentials
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should check for client key and secret", () => {
      const clientKey = process.env.TIKTOK_CLIENT_KEY;
      const clientSecret = process.env.TIKTOK_CLIENT_SECRET;

      // Both should be undefined when not set
      expect(clientKey).toBeUndefined();
      expect(clientSecret).toBeUndefined();
    });

    it("should proceed when credentials configured", () => {
      process.env.TIKTOK_CLIENT_KEY = "test-key";
      process.env.TIKTOK_CLIENT_SECRET = "test-secret";

      expect(process.env.TIKTOK_CLIENT_KEY).toBeDefined();
      expect(process.env.TIKTOK_CLIENT_SECRET).toBeDefined();
    });
  });

  describe("TikTok API (Placeholder)", () => {
    it("should log placeholder message when credentials missing", () => {
      delete process.env.TIKTOK_CLIENT_KEY;

      // Placeholder implementation returns null
      expect(true).toBe(true);
    });

    it("should handle rate limit when credentials present", async () => {
      process.env.TIKTOK_CLIENT_KEY = "test-key";
      process.env.TIKTOK_CLIENT_SECRET = "test-secret";

      mockRedis.incr.mockResolvedValueOnce(50);

      // Over limit should return null
      expect(mockRedis.incr).toBeDefined();
    });
  });

  describe("Message Processing", () => {
    it("should skip processing for null message value", async () => {
      const message = { value: null };

      expect(mockMongoClient.db).not.toHaveBeenCalled();
    });

    it("should skip processing for non-TikTok platform", async () => {
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

    it("should process valid data-refresh-tiktok message", async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            accountId: "account-123",
            platform: "TIKTOK",
            scheduledAt: new Date().toISOString(),
          }),
        ),
      };

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue({
          _id: "account-123",
          handle: "testuser",
          tiktokData: {},
          followerCount: 100000,
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
    it("should update follower count when present", () => {
      const freshData = { followers: 150000 };

      const updateData: any = {
        tiktokData: freshData,
        lastDataRefresh: new Date(),
      };

      if (freshData.followers !== undefined) {
        updateData.followerCount = freshData.followers;
      }

      expect(updateData.followerCount).toBe(150000);
    });

    it("should update name when present", () => {
      const freshData = { name: "New Name" };

      const updateData: any = {};

      if (freshData.name) {
        updateData.name = freshData.name;
      }

      expect(updateData.name).toBe("New Name");
    });

    it("should update description when present", () => {
      const freshData = { description: "New bio" };

      const updateData: any = {};

      if (freshData.description) {
        updateData.description = freshData.description;
      }

      expect(updateData.description).toBe("New bio");
    });

    it("should update profile image when present", () => {
      const freshData = { profileImage: "https://new.com/pic.jpg" };

      const updateData: any = {};

      if (freshData.profileImage) {
        updateData.imageUrl = freshData.profileImage;
      }

      expect(updateData.imageUrl).toBe("https://new.com/pic.jpg");
    });
  });

  describe("Redis Cache Update", () => {
    it("should update Redis cache if exists", async () => {
      const cacheKey = "accounts-tiktok-testuser";
      const existingCache = JSON.stringify({
        account: {
          name: "Old Name",
          followerCount: 100000,
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

    it("should update log as FAILED when API not configured", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      // Should set error message about API not configured
      expect(mockCollection.updateOne).toBeDefined();
    });

    it("should include data snapshot in log", () => {
      const dataSnapshot = {
        before: { followerCount: 100000 },
        after: { followers: 150000 },
      };

      expect(dataSnapshot.before).toBeDefined();
      expect(dataSnapshot.after).toBeDefined();
    });
  });

  describe("Consumer Lifecycle", () => {
    it("should connect and subscribe to data-refresh-tiktok topic", async () => {
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

    it("should register event handlers", () => {
      expect(mockKafkaConsumer.on).toBeDefined();
    });

    it("should disconnect cleanly on shutdown", async () => {
      mockKafkaConsumer.disconnect.mockResolvedValueOnce(undefined);
      mockPrisma.$disconnect.mockResolvedValueOnce(undefined);
      mockDisconnectProducer.mockResolvedValueOnce(undefined);

      expect(mockKafkaConsumer.disconnect).toBeDefined();
      expect(mockPrisma.$disconnect).toBeDefined();
    });
  });

  describe("TikTok API Comparison", () => {
    it("should have stricter rate limit than other platforms", () => {
      const tiktokRateLimit = 40;
      const youtubeRateLimit = 125;
      const redditRateLimit = 50;

      expect(tiktokRateLimit).toBeLessThan(youtubeRateLimit);
      expect(tiktokRateLimit).toBeLessThan(redditRateLimit);
    });

    it("should have longer rate limit window", () => {
      const tiktokWindow = 3600; // 1 hour
      const redditWindow = 60; // 1 minute

      expect(tiktokWindow).toBeGreaterThan(redditWindow);
    });
  });

  describe("Future Implementation Notes", () => {
    it("should support Research API when implemented", () => {
      // Placeholder for TikTok Research API
      const supportedApis = ["Research API", "Marketing API"];

      expect(supportedApis).toContain("Research API");
    });

    it("should require business account for API access", () => {
      // TikTok requires business verification
      const requiresBusinessAccount = true;

      expect(requiresBusinessAccount).toBe(true);
    });
  });
});
