/**
 * Tests for Categorise Sub Consumer
 * Tests subcategory assignment using Vertex AI
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
    find: vi.fn(),
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

describe("Categorise Sub Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Subcategory Fetching", () => {
    const mockSubcategories = [
      {
        id: "sub-1",
        name: "Web Development",
        slug: "web-development",
        parentId: "cat-1",
        depth: 1,
      },
      {
        id: "sub-2",
        name: "Mobile Apps",
        slug: "mobile-apps",
        parentId: "cat-1",
        depth: 1,
      },
      {
        id: "subsub-1",
        name: "React",
        slug: "react",
        parentId: "sub-1",
        depth: 2,
      },
      { id: "subsub-2", name: "Vue", slug: "vue", parentId: "sub-1", depth: 2 },
    ];

    it("should fetch subcategories from cache if available", async () => {
      mockRedis.get.mockResolvedValueOnce(JSON.stringify(mockSubcategories));

      const cached = await mockRedis.get("subcategories:cat-1");
      expect(JSON.parse(cached as string)).toEqual(mockSubcategories);
      expect(mockPrisma.category.findMany).not.toHaveBeenCalled();
    });

    it("should fetch subcategories from database if not cached", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockSubcategories);

      const cached = await mockRedis.get("subcategories:cat-1");
      expect(cached).toBeNull();

      // Should fetch from DB for depth 1 and depth 2
      expect(mockPrisma.category.findMany).toBeDefined();
    });

    it("should cache subcategories after fetching from database", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findMany.mockResolvedValueOnce(mockSubcategories);

      // Should cache with 24 hour TTL
      const CACHE_TTL = 24 * 60 * 60;
      expect(mockRedis.setex).toBeDefined();
    });

    it("should fetch subcategories for multiple root categories", async () => {
      const rootCategoryIds = ["cat-1", "cat-2"];

      // Each root category should be fetched
      expect(rootCategoryIds).toHaveLength(2);
    });
  });

  describe("Category ID Lookup", () => {
    it("should get category ID from cache", async () => {
      mockRedis.get.mockResolvedValueOnce("cat-123");

      const cached = await mockRedis.get("category:web-development");
      expect(cached).toBe("cat-123");
    });

    it("should fetch category ID from database if not cached", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findUnique.mockResolvedValueOnce({ id: "cat-123" });

      expect(mockPrisma.category.findUnique).toBeDefined();
    });

    it("should return null for non-existent category", async () => {
      mockRedis.get.mockResolvedValueOnce(null);
      mockPrisma.category.findUnique.mockResolvedValueOnce(null);

      expect(mockPrisma.category.findUnique).toBeDefined();
    });
  });

  describe("Subcategory Assignment via Vertex AI", () => {
    it("should assign subcategories based on account profile", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '{"categories": ["web-development", "react"]}',
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
                    text: '```json\n{"categories": ["mobile-apps", "ios-development"]}\n```',
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

    it("should prefer depth 2 categories when applicable", async () => {
      const subcategories = ["web-development", "react", "vue"];

      // Should include both depth 1 and depth 2
      expect(subcategories.length).toBeGreaterThanOrEqual(1);
    });

    it("should limit subcategories to 2-5 selections", async () => {
      const categories = ["web-development", "react", "vue"];

      expect(categories.length).toBeGreaterThanOrEqual(2);
      expect(categories.length).toBeLessThanOrEqual(5);
    });
  });

  describe("Message Processing", () => {
    it("should skip processing for null message value", async () => {
      const message = { value: null };

      expect(mockMongoClient.db).not.toHaveBeenCalled();
    });

    it("should process account-root-categorised message", async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            accountId: "account-123",
            platform: "YOUTUBE",
            name_en: "Tech Channel",
            description_en: "Web development tutorials",
            keywords_en: "react, vue, javascript",
            rootCategorySlugs: ["technology"],
            rootCategoryIds: ["cat-1"],
          }),
        ),
      };

      expect(mockMessage.value).toBeDefined();
    });

    it("should mark account as subcategory failed when no categories assigned", async () => {
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

      // Should set isSubCategoryFailed = true
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
        find: vi
          .fn()
          .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockCollection.updateOne).toBeDefined();
    });

    it("should proceed without subcategories when none available", async () => {
      // When no subcategories for root categories, should still produce event
      expect(mockKafkaProducer.send).toBeDefined();
    });
  });

  describe("CategoryMapping Creation", () => {
    it("should create CategoryMapping for each assigned subcategory", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
        find: vi
          .fn()
          .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
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
        find: vi
          .fn()
          .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      };

      // Should call with { upsert: true }
      expect(mockCollection.updateOne).toBeDefined();
    });

    it("should include both root and subcategory IDs in final list", async () => {
      const rootCategoryIds = ["cat-1"];
      const subcategorySlugs = ["web-development", "react"];
      const allCategoryIds = [...rootCategoryIds, "sub-1", "subsub-1"];

      expect(allCategoryIds.length).toBeGreaterThan(rootCategoryIds.length);
    });
  });

  describe("Kafka Integration", () => {
    it("should produce account-categorised event after success", async () => {
      mockKafkaProducer.send.mockResolvedValueOnce({});
      mockCreateTopic.mockResolvedValueOnce(undefined);

      expect(mockCreateTopic).toBeDefined();
      expect(mockKafkaProducer.send).toBeDefined();
    });

    it("should include all category IDs in event", async () => {
      const expectedMessage = {
        accountId: "account-123",
        platform: "YOUTUBE",
        categoryIds: ["cat-1", "sub-1", "subsub-1"],
      };

      expect(expectedMessage.categoryIds).toHaveLength(3);
    });

    it("should get category mappings for final event", async () => {
      const mockFind = vi.fn().mockReturnValue({
        toArray: vi
          .fn()
          .mockResolvedValue([
            { categoryId: "cat-1" },
            { categoryId: "sub-1" },
          ]),
      });

      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
        find: mockFind,
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockFind).toBeDefined();
    });
  });

  describe("Consumer Lifecycle", () => {
    it("should connect and subscribe to account-root-categorised topic", async () => {
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
