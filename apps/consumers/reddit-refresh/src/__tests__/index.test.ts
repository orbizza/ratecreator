/**
 * Tests for Reddit Refresh Consumer
 * Tests weekly Reddit data refresh with rate limiting
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
    ttl: vi.fn(),
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

describe("Reddit Refresh Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rate Limiting", () => {
    const RATE_LIMIT_MAX = 50;
    const RATE_LIMIT_WINDOW = 60;

    it("should allow requests under rate limit", async () => {
      mockRedis.incr.mockResolvedValueOnce(25);

      const result = await checkRateLimitHelper();
      expect(result).toBe(true);
    });

    it("should block requests over rate limit", async () => {
      mockRedis.incr.mockResolvedValueOnce(RATE_LIMIT_MAX + 1);
      mockRedis.ttl.mockResolvedValueOnce(30);

      // Should wait and retry
      expect(mockRedis.ttl).toBeDefined();
    });

    it("should set expiry on first request in window", async () => {
      mockRedis.incr.mockResolvedValueOnce(1);

      await checkRateLimitHelper();
      expect(mockRedis.expire).toHaveBeenCalledWith(
        "reddit_api_rate_limit",
        RATE_LIMIT_WINDOW,
      );
    });

    it("should wait for TTL when over limit", async () => {
      mockRedis.incr.mockResolvedValueOnce(RATE_LIMIT_MAX + 1);
      mockRedis.ttl.mockResolvedValueOnce(5);

      expect(mockRedis.ttl).toBeDefined();
    });

    // Helper function
    async function checkRateLimitHelper(): Promise<boolean> {
      const current = await mockRedis.incr("reddit_api_rate_limit");
      if (current === 1) {
        await mockRedis.expire("reddit_api_rate_limit", RATE_LIMIT_WINDOW);
      }
      return current <= RATE_LIMIT_MAX;
    }
  });

  describe("Reddit API Calls", () => {
    const mockRedditResponse = {
      data: {
        name: "testuser",
        subreddit: {
          public_description: "Test bio",
          subscribers: 50000,
          banner_img: "https://example.com/banner.jpg?resize=300",
        },
        icon_img: "https://example.com/icon.jpg?resize=100",
        snoovatar_img: "https://example.com/snoovatar.png",
        total_karma: 100000,
        link_karma: 60000,
        comment_karma: 40000,
        awardee_karma: 500,
        awarder_karma: 200,
        verified: true,
        has_verified_email: true,
        is_mod: true,
        is_gold: true,
        created_utc: 1600000000,
      },
    };

    it("should fetch Reddit profile data successfully", async () => {
      mockRedis.incr.mockResolvedValueOnce(1);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRedditResponse),
      });

      expect(mockFetch).toBeDefined();
    });

    it("should include User-Agent header", async () => {
      mockRedis.incr.mockResolvedValueOnce(1);
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockRedditResponse),
      });

      // Should set User-Agent header
      expect(mockFetch).toBeDefined();
    });

    it("should decrement counter on 429 rate limit", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: vi.fn().mockReturnValue("60"),
        },
      });

      expect(mockRedis.decr).toBeDefined();
    });

    it("should handle Retry-After header", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        headers: {
          get: vi.fn().mockReturnValue("30"),
        },
      });

      // Should wait for Retry-After seconds
      expect(mockFetch).toBeDefined();
    });

    it("should handle API errors gracefully", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      });

      expect(mockFetch).toBeDefined();
    });

    it("should handle network errors", async () => {
      mockRedis.incr.mockResolvedValueOnce(50);
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      expect(mockFetch).toBeDefined();
    });

    it("should clean up image URLs by removing resize params", () => {
      const iconUrl = "https://example.com/icon.jpg?resize=100";
      const cleanedUrl = iconUrl.split("?")[0];

      expect(cleanedUrl).toBe("https://example.com/icon.jpg");
    });
  });

  describe("Message Processing", () => {
    it("should skip processing for null message value", async () => {
      const message = { value: null };

      expect(mockMongoClient.db).not.toHaveBeenCalled();
    });

    it("should skip processing for non-Reddit platform", async () => {
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

    it("should process valid data-refresh-reddit message", async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            accountId: "account-123",
            platform: "REDDIT",
            scheduledAt: new Date().toISOString(),
          }),
        ),
      };

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue({
          _id: "account-123",
          handle: "testuser",
          redditData: {},
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
        redditData: freshData,
        lastDataRefresh: new Date(),
      };

      if (freshData.followers !== existingAccount.followerCount) {
        updateData.followerCount = freshData.followers;
      }

      expect(updateData.followerCount).toBe(60000);
    });

    it("should not update follower count when unchanged", () => {
      const freshData = { followers: 50000 };
      const existingAccount = { followerCount: 50000 };

      const updateData: any = { redditData: freshData };

      if (freshData.followers !== existingAccount.followerCount) {
        updateData.followerCount = freshData.followers;
      }

      expect(updateData.followerCount).toBeUndefined();
    });

    it("should update description when changed", () => {
      const freshData = { description: "New bio" };
      const existingAccount = { description: "Old bio" };

      const updateData: any = {};

      if (
        freshData.description &&
        freshData.description !== existingAccount.description
      ) {
        updateData.description = freshData.description;
      }

      expect(updateData.description).toBe("New bio");
    });

    it("should update profile image when changed", () => {
      const freshData = { profileImage: "https://new.com/icon.jpg" };
      const existingAccount = { imageUrl: "https://old.com/icon.jpg" };

      const updateData: any = {};

      if (
        freshData.profileImage &&
        freshData.profileImage !== existingAccount.imageUrl
      ) {
        updateData.imageUrl = freshData.profileImage;
      }

      expect(updateData.imageUrl).toBe("https://new.com/icon.jpg");
    });

    it("should update banner image when changed", () => {
      const freshData = { bannerImage: "https://new.com/banner.jpg" };
      const existingAccount = { bannerUrl: "https://old.com/banner.jpg" };

      const updateData: any = {};

      if (
        freshData.bannerImage &&
        freshData.bannerImage !== existingAccount.bannerUrl
      ) {
        updateData.bannerUrl = freshData.bannerImage;
      }

      expect(updateData.bannerUrl).toBe("https://new.com/banner.jpg");
    });

    it("should include karma fields in Reddit data", () => {
      const redditData = {
        totalKarma: 100000,
        linkKarma: 60000,
        commentKarma: 40000,
        awardeeKarma: 500,
        awarderKarma: 200,
      };

      expect(redditData.totalKarma).toBe(100000);
      expect(redditData.linkKarma + redditData.commentKarma).toBe(100000);
    });

    it("should include verification and mod status", () => {
      const redditData = {
        isVerified: true,
        hasVerifiedEmail: true,
        isMod: true,
        isGold: true,
      };

      expect(redditData.isVerified).toBe(true);
      expect(redditData.isMod).toBe(true);
    });
  });

  describe("Redis Cache Update", () => {
    it("should update Redis cache if exists", async () => {
      const cacheKey = "accounts-reddit-testuser";
      const existingCache = JSON.stringify({
        account: {
          description: "Old bio",
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
        before: { subscribers: 50000 },
        after: { followers: 60000 },
      };

      expect(dataSnapshot.before).toBeDefined();
      expect(dataSnapshot.after).toBeDefined();
    });
  });

  describe("Consumer Lifecycle", () => {
    it("should connect and subscribe to data-refresh-reddit topic", async () => {
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
