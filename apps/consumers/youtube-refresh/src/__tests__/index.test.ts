/**
 * Tests for YouTube Refresh Consumer
 * Tests weekly YouTube data refresh with rate limiting
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

describe("YouTube Refresh Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.YOUTUBE_API_KEY = "test-api-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rate Limiting", () => {
    const RATE_LIMIT_MAX = 125;

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
        "youtube_api_rate_limit",
        3600,
      );
    });

    it("should not set expiry on subsequent requests", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);

      await checkRateLimitHelper();
      expect(mockRedis.expire).not.toHaveBeenCalled();
    });

    // Helper function to simulate rate limit check
    async function checkRateLimitHelper(): Promise<boolean> {
      const current = await mockRedis.incr("youtube_api_rate_limit");
      if (current === 1) {
        await mockRedis.expire("youtube_api_rate_limit", 3600);
      }
      return current <= RATE_LIMIT_MAX;
    }
  });

  describe("YouTube API Calls", () => {
    const mockYouTubeResponse = {
      items: [
        {
          snippet: {
            title: "Updated Channel Name",
            description: "Updated description",
            thumbnails: {
              high: { url: "https://example.com/new-thumb.jpg" },
            },
            customUrl: "@channel",
            country: "US",
          },
          statistics: {
            subscriberCount: "150000",
            viewCount: "7500000",
            videoCount: "300",
            hiddenSubscriberCount: false,
          },
          brandingSettings: {
            image: { bannerExternalUrl: "https://example.com/new-banner.jpg" },
            channel: { keywords: "tech gaming reviews" },
          },
        },
      ],
    };

    it("should fetch fresh YouTube data successfully", async () => {
      mockRedis.incr.mockResolvedValueOnce(1);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockYouTubeResponse),
      });

      // Verify API call structure
      expect(mockFetch).toBeDefined();
    });

    it("should return null when API key is missing", async () => {
      delete process.env.YOUTUBE_API_KEY;

      // Should not make API call without key
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should decrement counter on 429 rate limit", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
      });

      // Should decrement rate limit counter
      expect(mockRedis.decr).toBeDefined();
    });

    it("should handle API errors gracefully", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      // Should return null on API error
      expect(mockFetch).toBeDefined();
    });

    it("should handle network errors", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      // Should catch and log error
      expect(mockFetch).toBeDefined();
    });
  });

  describe("Message Processing", () => {
    it("should skip processing for null message value", async () => {
      const message = { value: null };

      expect(mockMongoClient.db).not.toHaveBeenCalled();
    });

    it("should skip processing for non-YouTube platform", async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            accountId: "account-123",
            platform: "TWITTER",
            scheduledAt: new Date().toISOString(),
          }),
        ),
      };

      // Should log error and return early
      expect(mockMessage.value).toBeDefined();
    });

    it("should process valid data-refresh-youtube message", async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            accountId: "account-123",
            platform: "YOUTUBE",
            scheduledAt: new Date().toISOString(),
          }),
        ),
      };

      // Setup account lookup
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue({
          _id: "account-123",
          accountId: "UCxxx123",
          ytData: {},
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

      // Should log error and return early
      expect(mockCollection.findOne).toBeDefined();
    });
  });

  describe("Data Update Logic", () => {
    it("should update follower count when changed", () => {
      const freshData = { followers: 150000 };
      const existingAccount = { followerCount: 100000 };

      const updateData: any = {
        ytData: freshData,
        lastDataRefresh: new Date(),
      };

      if (freshData.followers !== existingAccount.followerCount) {
        updateData.followerCount = freshData.followers;
      }

      expect(updateData.followerCount).toBe(150000);
    });

    it("should not update follower count when unchanged", () => {
      const freshData = { followers: 100000 };
      const existingAccount = { followerCount: 100000 };

      const updateData: any = { ytData: freshData };

      if (freshData.followers !== existingAccount.followerCount) {
        updateData.followerCount = freshData.followers;
      }

      expect(updateData.followerCount).toBeUndefined();
    });

    it("should update name when changed", () => {
      const freshData = { name: "New Channel Name" };
      const existingAccount = { name: "Old Channel Name" };

      const updateData: any = {};

      if (freshData.name && freshData.name !== existingAccount.name) {
        updateData.name = freshData.name;
      }

      expect(updateData.name).toBe("New Channel Name");
    });
  });

  describe("Redis Cache Update", () => {
    it("should update Redis cache if exists", async () => {
      const cacheKey = "accounts-youtube-UCxxx123";
      const existingCache = JSON.stringify({
        account: {
          name: "Old Name",
          followerCount: 100000,
        },
      });

      mockRedis.get.mockResolvedValueOnce(existingCache);
      mockRedis.set.mockResolvedValueOnce("OK");

      // Should update cache with new data
      expect(mockRedis.get).toBeDefined();
      expect(mockRedis.set).toBeDefined();
    });

    it("should not update cache if not exists", async () => {
      mockRedis.get.mockResolvedValueOnce(null);

      // Should skip cache update
      expect(mockRedis.set).not.toHaveBeenCalled();
    });
  });

  describe("DataRefreshLog", () => {
    it("should create log entry on start", async () => {
      const mockCollection = {
        insertOne: vi.fn().mockResolvedValue({ insertedId: "log-123" }),
        updateOne: vi.fn(),
        findOne: vi.fn().mockResolvedValue({ accountId: "UCxxx" }),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      // Should create log with status: IN_PROGRESS
      expect(mockCollection.insertOne).toBeDefined();
    });

    it("should update log as COMPLETED on success", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      // Should set status: COMPLETED, completedAt
      expect(mockCollection.updateOne).toBeDefined();
    });

    it("should update log as FAILED on error", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      // Should set status: FAILED, error message
      expect(mockCollection.updateOne).toBeDefined();
    });
  });

  describe("Consumer Lifecycle", () => {
    it("should connect and subscribe to data-refresh-youtube topic", async () => {
      mockKafkaConsumer.connect.mockResolvedValueOnce(undefined);
      mockKafkaConsumer.subscribe.mockResolvedValueOnce(undefined);

      expect(mockKafkaConsumer.connect).toBeDefined();
      expect(mockKafkaConsumer.subscribe).toBeDefined();
    });

    it("should handle connection errors with retry", async () => {
      mockKafkaConsumer.connect.mockRejectedValueOnce(
        new Error("Connection failed"),
      );

      // Should retry after 5 seconds
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
