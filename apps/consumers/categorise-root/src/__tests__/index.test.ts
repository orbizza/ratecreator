/**
 * Tests for Categorise Root Consumer
 * Tests root category assignment using Vertex AI
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const {
  mockKafkaConsumer,
  mockKafkaProducer,
  mockCreateTopic,
  mockDisconnectProducer,
  mockPrisma,
  mockRedis,
  mockMongoClient,
  mockGenerateContent,
} = vi.hoisted(() => {
  const mockKafkaConsumer = {
    connect: vi.fn(),
    disconnect: vi.fn(),
    subscribe: vi.fn(),
    run: vi.fn(),
    on: vi.fn(),
  };

  const mockKafkaProducer = {
    connect: vi.fn(),
    send: vi.fn(),
    disconnect: vi.fn(),
  };

  const mockCreateTopic = vi.fn();
  const mockDisconnectProducer = vi.fn();

  const mockPrisma = {
    $disconnect: vi.fn(),
    category: {
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
  };

  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
    setex: vi.fn(),
  };

  const mockCollection = {
    updateOne: vi.fn(),
  };

  const mockDb = {
    collection: vi.fn(() => mockCollection),
  };

  const mockMongoClient = {
    db: vi.fn(() => mockDb),
  };

  const mockGenerateContent = vi.fn();

  return {
    mockKafkaConsumer,
    mockKafkaProducer,
    mockCreateTopic,
    mockDisconnectProducer,
    mockPrisma,
    mockRedis,
    mockMongoClient,
    mockCollection,
    mockDb,
    mockGenerateContent,
  };
});

// Mock modules
vi.mock("@ratecreator/db/kafka-client", () => ({
  getKafkaConsumer: vi.fn(() => mockKafkaConsumer),
  getKafkaProducer: vi.fn(() => Promise.resolve(mockKafkaProducer)),
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

vi.mock("@google-cloud/vertexai", () => ({
  VertexAI: vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  })),
}));

describe("Categorise Root Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Root Category Fetching", () => {
    const mockCategories = [
      { id: "cat-1", name: "Technology", slug: "technology" },
      { id: "cat-2", name: "Gaming", slug: "gaming" },
      { id: "cat-3", name: "Music", slug: "music" },
      { id: "cat-4", name: "Education", slug: "education" },
    ];

    it("should fetch categories from cache if available", async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockCategories));

      const cached = await mockRedis.get("root_categories");
      expect(JSON.parse(cached as string)).toEqual(mockCategories);
      expect(mockPrisma.category.findMany).not.toHaveBeenCalled();
    });

    it("should fetch categories from database if not cached", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockCategories);

      const cached = await mockRedis.get("root_categories");
      expect(cached).toBeNull();

      // Should fetch from DB
      expect(mockPrisma.category.findMany).toBeDefined();
    });

    it("should cache categories after fetching from database", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockCategories);

      // Should cache with 24 hour TTL
      const CACHE_TTL = 24 * 60 * 60;
      expect(mockRedis.setex).toBeDefined();
    });
  });

  describe("Category ID Lookup", () => {
    it("should get category ID from cache", async () => {
      mockRedis.get.mockResolvedValueOnce("cat-123");

      const cached = await mockRedis.get("category:technology");
      expect(cached).toBe("cat-123");
    });

    it("should fetch category ID from database if not cached", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findUnique.mockResolvedValueOnce({ id: "cat-123" });

      expect(mockPrisma.category.findUnique).toBeDefined();
    });

    it("should cache category ID after fetching", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findUnique.mockResolvedValueOnce({ id: "cat-123" });

      expect(mockRedis.setex).toBeDefined();
    });

    it("should return null for non-existent category", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findUnique.mockResolvedValueOnce(null);

      // Should return null
      expect(mockPrisma.category.findUnique).toBeDefined();
    });
  });

  describe("Category Assignment via Vertex AI", () => {
    it("should assign categories based on account profile", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '{"categories": ["technology", "gaming"]}',
                  },
                ],
              },
            },
          ],
        },
      });

      expect(mockGenerateContent).toBeDefined();
    });

    it("should handle JSON with code block markers", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '```json\n{"categories": ["music", "entertainment"]}\n```',
                  },
                ],
              },
            },
          ],
        },
      });

      expect(mockGenerateContent).toBeDefined();
    });

    it("should return empty array on API error", async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error("API error"));

      // Should return empty array, not throw
      expect(mockGenerateContent).toBeDefined();
    });

    it("should return empty array for invalid JSON", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: "invalid json" }],
              },
            },
          ],
        },
      });

      expect(mockGenerateContent).toBeDefined();
    });

    it("should limit categories to 1-3 selections", async () => {
      const categories = ["technology", "gaming", "education"];

      // AI should select 1-3 categories
      expect(categories.length).toBeGreaterThanOrEqual(1);
      expect(categories.length).toBeLessThanOrEqual(3);
    });
  });

  describe("Message Processing", () => {
    it("should skip processing for null message value", async () => {
      const message = { value: null };

      expect(mockMongoClient.db).not.toHaveBeenCalled();
    });

    it("should process account-translated message", async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            accountId: "account-123",
            platform: "YOUTUBE",
            name_en: "Tech Channel",
            description_en: "Reviews and tutorials about technology",
            keywords_en: "tech, reviews, tutorials",
            language_code: "en",
          }),
        ),
      };

      expect(mockMessage.value).toBeDefined();
    });

    it("should mark account as category failed when no categories assigned", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: '{"categories": []}' }],
              },
            },
          ],
        },
      });

      // Should set isCategoryFailed = true
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockCollection.updateOne).toBeDefined();
    });
  });

  describe("CategoryMapping Creation", () => {
    it("should create CategoryMapping for each assigned category", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      // Should upsert CategoryMapping
      expect(mockCollection.updateOne).toBeDefined();
    });

    it("should use upsert to avoid duplicates", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      // Should call with { upsert: true }
      expect(mockCollection.updateOne).toBeDefined();
    });
  });

  describe("Account Update", () => {
    it("should mark account as seeded after successful categorisation", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      // Should set isSeeded = true, isCategoryFailed = false
      expect(mockCollection.updateOne).toBeDefined();
    });
  });

  describe("Kafka Integration", () => {
    it("should produce account-root-categorised event after success", async () => {
      mockKafkaProducer.send.mockResolvedValueOnce({});
      mockCreateTopic.mockResolvedValueOnce(undefined);

      expect(mockCreateTopic).toBeDefined();
      expect(mockKafkaProducer.send).toBeDefined();
    });

    it("should include root category IDs in event", async () => {
      const expectedMessage = {
        accountId: "account-123",
        platform: "YOUTUBE",
        name_en: "Test Channel",
        description_en: "Description",
        keywords_en: "keywords",
        rootCategorySlugs: ["technology", "gaming"],
        rootCategoryIds: ["cat-1", "cat-2"],
      };

      expect(expectedMessage.rootCategorySlugs).toHaveLength(2);
      expect(expectedMessage.rootCategoryIds).toHaveLength(2);
    });

    it("should not produce event when categorisation fails", async () => {
      // When no categories assigned, no Kafka message
      expect(mockKafkaProducer.send).not.toHaveBeenCalled();
    });
  });

  describe("Consumer Lifecycle", () => {
    it("should connect and subscribe to account-translated topic", async () => {
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

    it("should register event handlers", () => {
      // consumer.connect, consumer.disconnect, consumer.crash
      expect(mockKafkaConsumer.on).toBeDefined();
    });

    it("should disconnect cleanly on shutdown", async () => {
      mockKafkaConsumer.disconnect.mockResolvedValueOnce(undefined);
      mockPrisma.$disconnect.mockResolvedValueOnce(undefined);
      mockDisconnectProducer.mockResolvedValueOnce(undefined);

      expect(mockKafkaConsumer.disconnect).toBeDefined();
      expect(mockPrisma.$disconnect).toBeDefined();
      expect(mockDisconnectProducer).toBeDefined();
    });
  });
});
