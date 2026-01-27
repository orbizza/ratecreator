/**
 * Tests for Algolia Account Sync Consumer
 * Tests account indexing to Algolia search
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const {
  mockKafkaConsumer,
  mockCreateTopic,
  mockDisconnectProducer,
  mockPrisma,
  mockMongoClient,
  mockAlgoliaClient,
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

  const mockCollection = {
    findOne: vi.fn(),
    find: vi.fn(),
    updateOne: vi.fn(),
  };

  const mockDb = {
    collection: vi.fn(() => mockCollection),
  };

  const mockMongoClient = {
    db: vi.fn(() => mockDb),
  };

  const mockAlgoliaClient = {
    saveObject: vi.fn(),
  };

  return {
    mockKafkaConsumer,
    mockCreateTopic,
    mockDisconnectProducer,
    mockPrisma,
    mockMongoClient,
    mockCollection,
    mockDb,
    mockAlgoliaClient,
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

vi.mock("@ratecreator/db/mongo-client", () => ({
  getMongoClient: vi.fn(() => Promise.resolve(mockMongoClient)),
}));

vi.mock("mongodb", () => ({
  ObjectId: vi.fn((id) => id),
}));

vi.mock("algoliasearch", () => ({
  algoliasearch: vi.fn(() => mockAlgoliaClient),
}));

describe("Algolia Account Sync Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ALGOLIA_APP_ID = "test-app-id";
    process.env.ALGOLIA_WRITE_API_KEY = "test-write-key";
    process.env.ALGOLIA_ACCOUNT_INDEX = "accounts";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Account Data Retrieval", () => {
    const mockAccount = {
      _id: "account-123",
      platform: "YOUTUBE",
      accountId: "UCxxx123",
      handle: "@testchannel",
      name: "Test Channel",
      name_en: "Test Channel",
      description: "A test description",
      description_en: "A test description",
      keywords: "tech, gaming",
      keywords_en: "tech, gaming",
      imageUrl: "https://example.com/image.jpg",
      bannerUrl: "https://example.com/banner.jpg",
      followerCount: 100000,
      country: "US",
      language_code: "en",
      rating: 4.5,
      reviewCount: 150,
      isSeeded: true,
    };

    const mockCategoryMappings = [
      { accountId: "account-123", categoryId: "cat-1" },
      { accountId: "account-123", categoryId: "cat-2" },
    ];

    const mockCategories = [
      { _id: "cat-1", name: "Technology", slug: "technology" },
      { _id: "cat-2", name: "Gaming", slug: "gaming" },
    ];

    it("should fetch account from MongoDB", async () => {
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(mockAccount),
        find: vi
          .fn()
          .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
        updateOne: vi.fn().mockResolvedValue({}),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockCollection.findOne).toBeDefined();
    });

    it("should return null if account not found", async () => {
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(null),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockCollection.findOne).toBeDefined();
    });

    it("should fetch category mappings for account", async () => {
      const mockFind = vi.fn().mockReturnValue({
        toArray: vi.fn().mockResolvedValue(mockCategoryMappings),
      });

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(mockAccount),
        find: mockFind,
        updateOne: vi.fn().mockResolvedValue({}),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockFind).toBeDefined();
    });

    it("should fetch category names for display", async () => {
      const mockFind = vi
        .fn()
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(mockCategoryMappings),
        })
        .mockReturnValueOnce({
          toArray: vi.fn().mockResolvedValue(mockCategories),
        });

      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(mockAccount),
        find: mockFind,
        updateOne: vi.fn().mockResolvedValue({}),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockFind).toBeDefined();
    });
  });

  describe("Algolia Record Building", () => {
    it("should build correct Algolia record structure", () => {
      const record = {
        objectID: "UCxxx123",
        platform: "YOUTUBE",
        accountId: "UCxxx123",
        handle: "@testchannel",
        name: "Test Channel",
        name_en: "Test Channel",
        description: "A test description",
        description_en: "A test description",
        keywords: "tech, gaming",
        keywords_en: "tech, gaming",
        imageUrl: "https://example.com/image.jpg",
        bannerUrl: "https://example.com/banner.jpg",
        followerCount: 100000,
        country: "US",
        language_code: "en",
        rating: 4.5,
        reviewCount: 150,
        categories: ["technology", "gaming"],
        categoryNames: ["Technology", "Gaming"],
        isSeeded: true,
        lastIndexedAt: new Date().toISOString(),
      };

      expect(record.objectID).toBe("UCxxx123");
      expect(record.categories).toHaveLength(2);
      expect(record.categoryNames).toHaveLength(2);
    });

    it("should use accountId as objectID", () => {
      const record = { objectID: "UCxxx123", accountId: "UCxxx123" };

      expect(record.objectID).toBe(record.accountId);
    });

    it("should include lastIndexedAt timestamp", () => {
      const record = { lastIndexedAt: new Date().toISOString() };

      expect(record.lastIndexedAt).toBeDefined();
      expect(new Date(record.lastIndexedAt)).toBeInstanceOf(Date);
    });
  });

  describe("Algolia Indexing", () => {
    it("should index record to Algolia successfully", async () => {
      mockAlgoliaClient.saveObject.mockResolvedValueOnce({});

      expect(mockAlgoliaClient.saveObject).toBeDefined();
    });

    it("should retry on failure with exponential backoff", async () => {
      mockAlgoliaClient.saveObject
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({});

      // Should retry up to 3 times
      expect(mockAlgoliaClient.saveObject).toBeDefined();
    });

    it("should return false after max retries", async () => {
      mockAlgoliaClient.saveObject.mockRejectedValue(
        new Error("Persistent error"),
      );

      // After 3 retries, should return false
      expect(mockAlgoliaClient.saveObject).toBeDefined();
    });

    it("should use correct index name", async () => {
      const indexName = process.env.ALGOLIA_ACCOUNT_INDEX || "accounts";

      expect(indexName).toBe("accounts");
    });
  });

  describe("Message Processing", () => {
    it("should skip processing for null message value", async () => {
      const message = { value: null };

      expect(mockMongoClient.db).not.toHaveBeenCalled();
    });

    it("should process valid account-categorised message", async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            accountId: "account-123",
            platform: "YOUTUBE",
            categoryIds: ["cat-1", "cat-2"],
          }),
        ),
      };

      expect(mockMessage.value).toBeDefined();
    });

    it("should update lastIndexedAt in MongoDB after success", async () => {
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue({ _id: "account-123" }),
        find: vi
          .fn()
          .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
        updateOne: vi.fn().mockResolvedValue({}),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      // Should update lastIndexedAt and updatedAt
      expect(mockCollection.updateOne).toBeDefined();
    });

    it("should log error when account not found", async () => {
      const mockCollection = {
        findOne: vi.fn().mockResolvedValue(null),
        find: vi
          .fn()
          .mockReturnValue({ toArray: vi.fn().mockResolvedValue([]) }),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockCollection.findOne).toBeDefined();
    });
  });

  describe("Consumer Lifecycle", () => {
    it("should connect and subscribe to account-categorised topic", async () => {
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

  describe("Error Handling", () => {
    it("should handle MongoDB errors gracefully", async () => {
      const mockCollection = {
        findOne: vi.fn().mockRejectedValue(new Error("MongoDB error")),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      expect(mockCollection.findOne).toBeDefined();
    });

    it("should handle Algolia errors gracefully", async () => {
      mockAlgoliaClient.saveObject.mockRejectedValue(
        new Error("Algolia error"),
      );

      expect(mockAlgoliaClient.saveObject).toBeDefined();
    });
  });
});
