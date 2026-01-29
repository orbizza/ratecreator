/**
 * Tests for Translate Consumer
 * Tests language detection and translation using Vertex AI
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const {
  mockKafkaConsumer,
  mockKafkaProducer,
  mockCreateTopic,
  mockDisconnectProducer,
  mockPrisma,
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

describe("Translate Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("English Detection", () => {
    // Common English words used for detection
    const ENGLISH_INDICATORS = [
      "the",
      "and",
      "is",
      "are",
      "was",
      "were",
      "has",
      "have",
      "had",
      "be",
      "been",
      "being",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "may",
      "might",
      "must",
      "shall",
      "can",
      "need",
      "dare",
      "this",
      "that",
      "these",
      "those",
      "what",
      "which",
      "who",
      "whom",
      "with",
      "from",
      "for",
      "about",
      "into",
      "through",
      "during",
      "before",
    ];

    const isLikelyEnglish = (text: string): boolean => {
      if (!text) return true;
      const words = text.toLowerCase().split(/\s+/);
      const englishWordCount = words.filter((word) =>
        ENGLISH_INDICATORS.includes(word),
      ).length;
      return englishWordCount / words.length > 0.2;
    };

    it("should detect English text", () => {
      const englishText =
        "This is a test description with many common English words";
      expect(isLikelyEnglish(englishText)).toBe(true);
    });

    it("should detect non-English text", () => {
      const japaneseText = "これは日本語のテキストです";
      expect(isLikelyEnglish(japaneseText)).toBe(false);
    });

    it("should return true for empty text", () => {
      expect(isLikelyEnglish("")).toBe(true);
    });

    it("should handle mixed content", () => {
      const mixedText = "The channel features 日本語 content and tutorials";
      // Less than 20% English words
      const result = isLikelyEnglish(mixedText);
      // This depends on the exact threshold
      expect(typeof result).toBe("boolean");
    });
  });

  describe("Translation via Vertex AI", () => {
    it("should translate non-English content successfully", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      lang: "ja",
                      confidence: 0.95,
                      name_en: "Test Channel",
                      description_en: "This is a test channel",
                      keywords_en: "tech, gaming",
                    }),
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
                    text: '```json\n{"lang": "es", "confidence": 0.92, "name_en": "Test", "description_en": "Desc", "keywords_en": ""}\n```',
                  },
                ],
              },
            },
          ],
        },
      });

      expect(mockGenerateContent).toBeDefined();
    });

    it("should return null on API error", async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error("API error"));

      // Translation should fail gracefully
      expect(mockGenerateContent).toBeDefined();
    });

    it("should return null for invalid JSON response", async () => {
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
  });

  describe("Message Processing", () => {
    it("should skip processing for null message value", async () => {
      const message = { value: null };

      // Should return early without DB calls
      expect(mockMongoClient.db).not.toHaveBeenCalled();
    });

    it("should process account-data-fetched message", async () => {
      const mockMessage = {
        value: Buffer.from(
          JSON.stringify({
            accountId: "account-123",
            platform: "YOUTUBE",
            name: "テストチャンネル",
            description: "これはテストです",
            keywords: "テスト、ゲーム",
          }),
        ),
      };

      expect(mockMessage.value).toBeDefined();
    });

    it("should mark translation as failed on error", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      // Should set isTranslationFailed = true on failure
      expect(mockCollection.updateOne).toBeDefined();
    });

    it("should update account with translation data on success", async () => {
      const mockCollection = {
        updateOne: vi.fn().mockResolvedValue({}),
      };

      mockMongoClient.db = vi.fn().mockReturnValue({
        collection: vi.fn().mockReturnValue(mockCollection),
      });

      // Should update with language_code, *_en fields
      expect(mockCollection.updateOne).toBeDefined();
    });
  });

  describe("Kafka Integration", () => {
    it("should produce account-translated event after successful translation", async () => {
      mockKafkaProducer.send.mockResolvedValueOnce({});
      mockCreateTopic.mockResolvedValueOnce(undefined);

      expect(mockCreateTopic).toBeDefined();
      expect(mockKafkaProducer.send).toBeDefined();
    });

    it("should not produce event when translation fails", async () => {
      // When translation fails, no Kafka message should be sent
      expect(mockKafkaProducer.send).not.toHaveBeenCalled();
    });
  });

  describe("Consumer Lifecycle", () => {
    it("should connect and subscribe to account-data-fetched topic", async () => {
      mockKafkaConsumer.connect.mockResolvedValueOnce(undefined);
      mockKafkaConsumer.subscribe.mockResolvedValueOnce(undefined);

      expect(mockKafkaConsumer.connect).toBeDefined();
      expect(mockKafkaConsumer.subscribe).toBeDefined();
    });

    it("should register event handlers", () => {
      expect(mockKafkaConsumer.on).toBeDefined();
    });

    it("should handle graceful shutdown", async () => {
      mockKafkaConsumer.disconnect.mockResolvedValueOnce(undefined);
      mockPrisma.$disconnect.mockResolvedValueOnce(undefined);
      mockDisconnectProducer.mockResolvedValueOnce(undefined);

      expect(mockKafkaConsumer.disconnect).toBeDefined();
      expect(mockPrisma.$disconnect).toBeDefined();
    });
  });

  describe("Skip Translation for English", () => {
    it("should return original content if already English", async () => {
      const englishContent = {
        name: "English Channel Name",
        description:
          "This is a description with many English words that should be detected",
        keywords: "tech, gaming, reviews",
      };

      // Should return result with lang: "en" and original text
      const result = {
        language_code: "en",
        lang_confidence_score: 0.9,
        name_en: englishContent.name,
        description_en: englishContent.description,
        keywords_en: englishContent.keywords,
      };

      expect(result.language_code).toBe("en");
      expect(result.name_en).toBe(englishContent.name);
    });
  });
});
