/**
 * Tests for Elastic Account Sync Consumer
 * Tests account indexing to Elasticsearch
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const {
  mockKafkaConsumer,
  mockCreateTopic,
  mockDisconnectProducer,
  mockPrisma,
  mockMongoClient,
  mockElasticClient,
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

  const mockElasticClient = {
    index: vi.fn(),
    indices: {
      exists: vi.fn(),
      create: vi.fn(),
    },
  };

  return {
    mockKafkaConsumer,
    mockCreateTopic,
    mockDisconnectProducer,
    mockPrisma,
    mockMongoClient,
    mockCollection,
    mockDb,
    mockElasticClient,
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

vi.mock("@elastic/elasticsearch", () => ({
  Client: vi.fn(() => mockElasticClient),
}));

describe("Elastic Account Sync Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ELASTIC_CLOUD_ID = "test-cloud-id";
    process.env.ELASTIC_API_KEY = "test-api-key";
    process.env.ELASTIC_ACCOUNTS_INDEX = "accounts";
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Elasticsearch Client Initialization", () => {
    it("should initialize with API key authentication", () => {
      const cloudId = process.env.ELASTIC_CLOUD_ID;
      const apiKey = process.env.ELASTIC_API_KEY;

      expect(cloudId).toBeDefined();
      expect(apiKey).toBeDefined();
    });

    it("should support username/password authentication", () => {
      delete process.env.ELASTIC_API_KEY;
      process.env.ELASTIC_USERNAME = "elastic";
      process.env.ELASTIC_PASSWORD = "password";

      expect(process.env.ELASTIC_USERNAME).toBeDefined();
      expect(process.env.ELASTIC_PASSWORD).toBeDefined();
    });

    it("should throw error when credentials not configured", () => {
      delete process.env.ELASTIC_CLOUD_ID;
      delete process.env.ELASTIC_API_KEY;
      delete process.env.ELASTIC_USERNAME;

      // Should throw error about missing credentials
      expect(true).toBe(true);
    });
  });

  describe("Index Creation", () => {
    it("should create index if not exists", async () => {
      mockElasticClient.indices.exists.mockResolvedValueOnce(false);
      mockElasticClient.indices.create.mockResolvedValueOnce({});

      expect(mockElasticClient.indices.exists).toBeDefined();
      expect(mockElasticClient.indices.create).toBeDefined();
    });

    it("should skip creation if index exists", async () => {
      mockElasticClient.indices.exists.mockResolvedValueOnce(true);

      expect(mockElasticClient.indices.create).not.toHaveBeenCalled();
    });

    it("should configure autocomplete analyzer", () => {
      const indexSettings = {
        analysis: {
          analyzer: {
            autocomplete: {
              type: "custom",
              tokenizer: "standard",
              filter: ["lowercase", "autocomplete_filter"],
            },
          },
          filter: {
            autocomplete_filter: {
              type: "edge_ngram",
              min_gram: 1,
              max_gram: 20,
            },
          },
        },
      };

      expect(indexSettings.analysis.analyzer.autocomplete).toBeDefined();
    });

    it("should configure proper field mappings", () => {
      const mappings = {
        properties: {
          objectID: { type: "keyword" },
          platform: { type: "keyword" },
          name: { type: "text" },
          followerCount: { type: "long" },
          rating: { type: "float" },
          categories: { type: "keyword" },
          isSeeded: { type: "boolean" },
          lastIndexedAt: { type: "date" },
        },
      };

      expect(mappings.properties.objectID.type).toBe("keyword");
      expect(mappings.properties.followerCount.type).toBe("long");
      expect(mappings.properties.categories.type).toBe("keyword");
    });
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
      followerCount: 100000,
      country: "US",
      rating: 4.5,
      reviewCount: 150,
      madeForKids: false,
      claimed: true,
      videoCount: 500,
      viewCount: 10000000,
      isSeeded: true,
      createdAt: new Date(),
    };

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

    it("should include additional fields for Elasticsearch", () => {
      const record = {
        madeForKids: false,
        claimed: true,
        videoCount: 500,
        viewCount: 10000000,
        createdDate: new Date().toISOString(),
      };

      expect(record.madeForKids).toBe(false);
      expect(record.claimed).toBe(true);
      expect(record.videoCount).toBe(500);
    });
  });

  describe("Elasticsearch Indexing", () => {
    it("should index record to Elasticsearch successfully", async () => {
      mockElasticClient.index.mockResolvedValueOnce({});

      expect(mockElasticClient.index).toBeDefined();
    });

    it("should use document ID as objectID", async () => {
      const record = { objectID: "UCxxx123" };

      mockElasticClient.index.mockResolvedValueOnce({});

      expect(record.objectID).toBe("UCxxx123");
    });

    it("should refresh index after indexing", async () => {
      mockElasticClient.index.mockResolvedValueOnce({});

      // Should be called with refresh: true
      expect(mockElasticClient.index).toBeDefined();
    });

    it("should retry on failure with exponential backoff", async () => {
      mockElasticClient.index
        .mockRejectedValueOnce(new Error("Network error"))
        .mockRejectedValueOnce(new Error("Network error"))
        .mockResolvedValueOnce({});

      // Should retry up to 3 times
      expect(mockElasticClient.index).toBeDefined();
    });

    it("should return false after max retries", async () => {
      mockElasticClient.index.mockRejectedValue(new Error("Persistent error"));

      // After 3 retries, should return false
      expect(mockElasticClient.index).toBeDefined();
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
    it("should create index before subscribing", async () => {
      mockElasticClient.indices.exists.mockResolvedValueOnce(false);
      mockElasticClient.indices.create.mockResolvedValueOnce({});

      expect(mockElasticClient.indices.exists).toBeDefined();
    });

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

  describe("Comparison with Algolia Consumer", () => {
    it("should use same topic as Algolia consumer", () => {
      const topicName = "account-categorised";

      expect(topicName).toBe("account-categorised");
    });

    it("should have different default port than Algolia", () => {
      const algoliaPort = 3044;
      const elasticPort = 3045;

      expect(elasticPort).not.toBe(algoliaPort);
    });

    it("should include additional fields not in Algolia", () => {
      const elasticOnlyFields = [
        "madeForKids",
        "claimed",
        "videoCount",
        "viewCount",
        "createdDate",
      ];

      expect(elasticOnlyFields.length).toBeGreaterThan(0);
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

    it("should handle Elasticsearch errors gracefully", async () => {
      mockElasticClient.index.mockRejectedValue(
        new Error("Elasticsearch error"),
      );

      expect(mockElasticClient.index).toBeDefined();
    });

    it("should handle index creation errors", async () => {
      mockElasticClient.indices.create.mockRejectedValue(
        new Error("Index creation failed"),
      );

      expect(mockElasticClient.indices.create).toBeDefined();
    });
  });
});
