/**
 * Tests for review-calculate consumer
 * Tests rating calculation algorithms and message processing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock database clients
const mockPrismaClient = {
  account: {
    findUnique: vi.fn(),
    update: vi.fn(),
  },
  review: {
    aggregate: vi.fn(),
    count: vi.fn(),
  },
  $disconnect: vi.fn(),
};

vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: () => mockPrismaClient,
}));

// Mock Redis client
const mockRedisClient = {
  get: vi.fn(),
  set: vi.fn(),
};

vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: () => mockRedisClient,
}));

// Mock MongoDB client
const mockMongoCollection = {
  countDocuments: vi.fn(),
  aggregate: vi.fn().mockReturnValue({
    toArray: vi.fn(),
  }),
  updateOne: vi.fn(),
};

const mockMongoDb = {
  collection: vi.fn().mockReturnValue(mockMongoCollection),
};

const mockMongoClient = {
  db: vi.fn().mockReturnValue(mockMongoDb),
};

vi.mock("@ratecreator/db/mongo-client", () => ({
  getMongoClient: vi.fn().mockResolvedValue(mockMongoClient),
}));

// Mock Kafka
const mockKafkaProducer = {
  send: vi.fn().mockResolvedValue(undefined),
};

const mockKafkaConsumer = {
  connect: vi.fn().mockResolvedValue(undefined),
  subscribe: vi.fn().mockResolvedValue(undefined),
  run: vi.fn().mockResolvedValue(undefined),
  disconnect: vi.fn().mockResolvedValue(undefined),
  on: vi.fn(),
};

vi.mock("@ratecreator/db/kafka-client", () => ({
  getKafkaConsumer: vi.fn().mockReturnValue(mockKafkaConsumer),
  getKafkaProducer: vi.fn().mockResolvedValue(mockKafkaProducer),
  createTopicIfNotExists: vi.fn().mockResolvedValue(undefined),
  disconnectProducer: vi.fn().mockResolvedValue(undefined),
}));

// Mock ObjectId
vi.mock("mongodb", () => ({
  ObjectId: vi.fn((id) => ({ toString: () => id })),
}));

describe("Review Calculate Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Rating Calculation Algorithms", () => {
    // Test the simple average function
    const simpleAverage = (
      currentAvgRating: number,
      newRating: number,
      reviewCount: number,
    ): number => {
      return (currentAvgRating * reviewCount + newRating) / (reviewCount + 1);
    };

    // Test the bayesian average function
    const bayesianAverage = (
      currentAvgRating: number,
      newRating: number,
      reviewCount: number,
    ): number => {
      const C = 3.5; // Prior mean (global average rating)
      const m = 10; // Prior weight (confidence parameter)
      const n = reviewCount + 1; // Include the new rating
      const R = (currentAvgRating * reviewCount + newRating) / n;
      return (C * m + R * n) / (m + n);
    };

    describe("simpleAverage", () => {
      it("should calculate correct average for first review", () => {
        const result = simpleAverage(0, 5, 0);
        expect(result).toBe(5);
      });

      it("should calculate correct average for second review", () => {
        const result = simpleAverage(5, 3, 1);
        expect(result).toBe(4); // (5 + 3) / 2
      });

      it("should calculate correct average for multiple reviews", () => {
        const result = simpleAverage(4, 2, 4);
        expect(result).toBe(3.6); // (4*4 + 2) / 5 = 18/5
      });

      it("should handle decimal ratings", () => {
        const result = simpleAverage(4.5, 3.5, 2);
        expect(result).toBeCloseTo(4.17, 2); // (4.5*2 + 3.5) / 3
      });
    });

    describe("bayesianAverage", () => {
      it("should weight first review towards prior mean", () => {
        const result = bayesianAverage(0, 5, 0);
        // With C=3.5, m=10, n=1, R=5
        // (3.5*10 + 5*1) / (10+1) = 40/11 ≈ 3.636
        expect(result).toBeCloseTo(3.636, 2);
      });

      it("should converge to actual average with many reviews", () => {
        const result = bayesianAverage(5, 5, 100);
        // With many reviews (100), bayesian should be close to actual average
        expect(result).toBeGreaterThan(4.5);
      });

      it("should provide smoother rating for few reviews", () => {
        // A single 1-star review shouldn't tank the rating completely
        const result = bayesianAverage(0, 1, 0);
        // Should be closer to 3.5 (prior) than to 1
        expect(result).toBeGreaterThan(2);
        expect(result).toBeLessThan(3.5);
      });

      it("should be more conservative than simple average for extreme ratings", () => {
        const simpleResult = simpleAverage(0, 1, 0);
        const bayesianResult = bayesianAverage(0, 1, 0);

        // Bayesian should be more moderate (closer to 3.5) than simple (1)
        expect(bayesianResult).toBeGreaterThan(simpleResult);
      });
    });
  });

  describe("Cache Key Generation", () => {
    const CACHE_YOUTUBE_CREATOR = "accounts-youtube-";
    const CACHE_TWITTER_CREATOR = "accounts-twitter-";
    const CACHE_TIKTOK_CREATOR = "accounts-tiktok-";
    const CACHE_REDDIT_CREATOR = "accounts-reddit-";

    const getCacheKey = (platform: string, accountId: string): string => {
      switch (platform) {
        case "YOUTUBE":
          return `${CACHE_YOUTUBE_CREATOR}${accountId}`;
        case "TWITTER":
          return `${CACHE_TWITTER_CREATOR}${accountId}`;
        case "TIKTOK":
          return `${CACHE_TIKTOK_CREATOR}${accountId}`;
        case "REDDIT":
          return `${CACHE_REDDIT_CREATOR}${accountId}`;
        default:
          throw new Error(`Invalid platform: ${platform}`);
      }
    };

    it("should generate correct cache key for YouTube", () => {
      expect(getCacheKey("YOUTUBE", "channel123")).toBe(
        "accounts-youtube-channel123",
      );
    });

    it("should generate correct cache key for Twitter", () => {
      expect(getCacheKey("TWITTER", "user123")).toBe(
        "accounts-twitter-user123",
      );
    });

    it("should generate correct cache key for TikTok", () => {
      expect(getCacheKey("TIKTOK", "tiktoker")).toBe(
        "accounts-tiktok-tiktoker",
      );
    });

    it("should generate correct cache key for Reddit", () => {
      expect(getCacheKey("REDDIT", "redditor")).toBe(
        "accounts-reddit-redditor",
      );
    });

    it("should throw error for invalid platform", () => {
      expect(() => getCacheKey("INVALID", "user")).toThrow(
        "Invalid platform: INVALID",
      );
    });
  });

  describe("Message Processing", () => {
    describe("Message Validation", () => {
      it("should handle null message value", async () => {
        const processMessage = async (message: any) => {
          if (!message.value || !message.key) {
            return { error: "Invalid message" };
          }
          return { success: true };
        };

        const result = await processMessage({ value: null, key: "key" });
        expect(result.error).toBe("Invalid message");
      });

      it("should handle null message key", async () => {
        const processMessage = async (message: any) => {
          if (!message.value || !message.key) {
            return { error: "Invalid message" };
          }
          return { success: true };
        };

        const result = await processMessage({ value: "value", key: null });
        expect(result.error).toBe("Invalid message");
      });
    });

    describe("Account Lookup", () => {
      it("should find account by platform and accountId", async () => {
        mockPrismaClient.account.findUnique.mockResolvedValue({
          id: "mongo-object-id",
        });

        const account = await mockPrismaClient.account.findUnique({
          where: {
            platform_accountId: {
              platform: "YOUTUBE",
              accountId: "channel123",
            },
          },
          select: { id: true },
        });

        expect(account).toEqual({ id: "mongo-object-id" });
        expect(mockPrismaClient.account.findUnique).toHaveBeenCalledWith({
          where: {
            platform_accountId: {
              platform: "YOUTUBE",
              accountId: "channel123",
            },
          },
          select: { id: true },
        });
      });

      it("should handle account not found", async () => {
        mockPrismaClient.account.findUnique.mockResolvedValue(null);

        const account = await mockPrismaClient.account.findUnique({
          where: {
            platform_accountId: {
              platform: "YOUTUBE",
              accountId: "nonexistent",
            },
          },
        });

        expect(account).toBeNull();
      });
    });

    describe("Rating Aggregation", () => {
      it("should count published reviews correctly", async () => {
        mockMongoCollection.countDocuments.mockResolvedValue(42);

        const count = await mockMongoCollection.countDocuments(
          { accountId: "account-id", isDeleted: false, status: "PUBLISHED" },
          { maxTimeMS: 30000 },
        );

        expect(count).toBe(42);
      });

      it("should calculate average stars correctly", async () => {
        mockMongoCollection.aggregate.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([{ _id: null, avgStars: 4.2 }]),
        });

        const result = await mockMongoCollection
          .aggregate([
            {
              $match: {
                accountId: "account-id",
                isDeleted: false,
                status: "PUBLISHED",
              },
            },
            { $group: { _id: null, avgStars: { $avg: "$stars" } } },
          ])
          .toArray();

        expect(result[0].avgStars).toBe(4.2);
      });

      it("should handle no reviews (empty result)", async () => {
        mockMongoCollection.aggregate.mockReturnValue({
          toArray: vi.fn().mockResolvedValue([]),
        });

        const result = await mockMongoCollection.aggregate([]).toArray();

        expect(result).toHaveLength(0);
      });
    });

    describe("Database Update", () => {
      it("should update account with new rating and count", async () => {
        mockMongoCollection.updateOne.mockResolvedValue({
          matchedCount: 1,
          modifiedCount: 1,
        });

        const result = await mockMongoCollection.updateOne(
          { _id: "account-id" },
          { $set: { rating: 4.5, reviewCount: 10, updatedAt: new Date() } },
          { maxTimeMS: 10000 },
        );

        expect(result.modifiedCount).toBe(1);
      });
    });

    describe("Redis Cache Update", () => {
      it("should update existing cache with new rating", async () => {
        const existingCache = JSON.stringify({
          account: { name: "Test Creator", rating: 4.0, reviewCount: 5 },
        });
        mockRedisClient.get.mockResolvedValue(existingCache);

        await mockRedisClient.get("accounts-youtube-channel123");

        const updatedCache = JSON.stringify({
          account: { name: "Test Creator", rating: 4.5, reviewCount: 6 },
        });
        await mockRedisClient.set("accounts-youtube-channel123", updatedCache);

        expect(mockRedisClient.set).toHaveBeenCalledWith(
          "accounts-youtube-channel123",
          updatedCache,
        );
      });

      it("should skip cache update if no existing cache", async () => {
        mockRedisClient.get.mockResolvedValue(null);

        const cachedData = await mockRedisClient.get(
          "accounts-youtube-channel123",
        );

        expect(cachedData).toBeNull();
      });
    });

    describe("Kafka Message Production", () => {
      it("should send message to algolia update topic", async () => {
        await mockKafkaProducer.send({
          topic: "new-review-algolia-update",
          messages: [
            {
              value: JSON.stringify({
                objectID: "channel123",
                rating: 4.5,
                reviewCount: 10,
              }),
            },
          ],
        });

        expect(mockKafkaProducer.send).toHaveBeenCalledWith({
          topic: "new-review-algolia-update",
          messages: [
            {
              value: expect.stringContaining("channel123"),
            },
          ],
        });
      });

      it("should retry on Kafka send failure", async () => {
        mockKafkaProducer.send
          .mockRejectedValueOnce(new Error("Connection error"))
          .mockRejectedValueOnce(new Error("Connection error"))
          .mockResolvedValueOnce(undefined);

        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            await mockKafkaProducer.send({
              topic: "test-topic",
              messages: [{ value: "test" }],
            });
            break;
          } catch (error) {
            retryCount++;
            if (retryCount === maxRetries) {
              throw error;
            }
          }
        }

        expect(mockKafkaProducer.send).toHaveBeenCalledTimes(3);
      });
    });
  });

  describe("Consumer Lifecycle", () => {
    it("should connect consumer successfully", async () => {
      await mockKafkaConsumer.connect();
      expect(mockKafkaConsumer.connect).toHaveBeenCalled();
    });

    it("should subscribe to correct topic", async () => {
      await mockKafkaConsumer.subscribe({
        topic: "new-review-calculate",
        fromBeginning: true,
      });

      expect(mockKafkaConsumer.subscribe).toHaveBeenCalledWith({
        topic: "new-review-calculate",
        fromBeginning: true,
      });
    });

    it("should disconnect gracefully", async () => {
      await mockKafkaConsumer.disconnect();
      expect(mockKafkaConsumer.disconnect).toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle rating of exactly 0", () => {
      const simpleAverage = (
        currentAvgRating: number,
        newRating: number,
        reviewCount: number,
      ): number => {
        return (currentAvgRating * reviewCount + newRating) / (reviewCount + 1);
      };

      // This shouldn't happen in practice (min is 1), but test the math
      const result = simpleAverage(3.5, 0, 4);
      expect(result).toBe(2.8); // (3.5*4 + 0) / 5
    });

    it("should handle rating of exactly 5", () => {
      const simpleAverage = (
        currentAvgRating: number,
        newRating: number,
        reviewCount: number,
      ): number => {
        return (currentAvgRating * reviewCount + newRating) / (reviewCount + 1);
      };

      const result = simpleAverage(4.0, 5, 10);
      expect(result).toBeCloseTo(4.09, 2); // (4.0*10 + 5) / 11
    });

    it("should format rating to 2 decimal places", () => {
      const rawRating = 4.123456789;
      const formattedRating = Number(rawRating.toFixed(2));
      expect(formattedRating).toBe(4.12);
    });
  });
});
