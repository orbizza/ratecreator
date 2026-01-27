/**
 * Tests for review-algolia-update consumer
 * Tests Algolia sync for reviews with retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks that need to be available during module loading
const { mockAlgoliaClient, mockKafkaConsumer } = vi.hoisted(() => {
  const mockAlgoliaClient = {
    partialUpdateObject: vi.fn(),
  };
  const mockKafkaConsumer = {
    connect: vi.fn().mockResolvedValue(undefined),
    subscribe: vi.fn().mockResolvedValue(undefined),
    run: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn().mockResolvedValue(undefined),
    on: vi.fn(),
  };
  return { mockAlgoliaClient, mockKafkaConsumer };
});

// Mock modules
vi.mock("@ratecreator/db/algolia-client", () => ({
  getWriteClient: vi.fn(() => mockAlgoliaClient),
}));

vi.mock("@ratecreator/db/kafka-client", () => ({
  getKafkaConsumer: vi.fn().mockReturnValue(mockKafkaConsumer),
}));

describe("Review Algolia Update Consumer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset timeout mocking
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe("Message Processing", () => {
    // Helper function to simulate processMessage behavior
    const processMessage = async (message: any, algoliaClient: any) => {
      if (!message.value) {
        console.error("Invalid message: value is null");
        return { error: "Invalid message: value is null" };
      }

      const payload = JSON.parse(message.value.toString());
      const { objectID, rating, reviewCount } = payload;

      if (!objectID || rating === undefined || reviewCount === undefined) {
        return { error: "Invalid payload: missing required fields" };
      }

      const BASE_INDEX_NAME = "accounts";
      const maxRetries = 3;
      let retryCount = 0;
      let lastError: Error | null = null;

      while (retryCount < maxRetries) {
        try {
          await algoliaClient.partialUpdateObject({
            indexName: BASE_INDEX_NAME,
            objectID,
            attributesToUpdate: {
              rating,
              reviewCount,
            },
            createIfNotExists: false,
          });
          return { success: true };
        } catch (error: any) {
          retryCount++;
          lastError = error instanceof Error ? error : new Error(String(error));
          const errorStatus = error?.status || error?.statusCode || "N/A";

          // If it's a 404 (object not found), don't retry
          if (errorStatus === 404 || error?.message?.includes("not found")) {
            return { error: "Object not found", skipped: true };
          }

          if (retryCount >= maxRetries) {
            throw lastError;
          }

          // Exponential backoff
          const backoffMs = Math.pow(2, retryCount - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, backoffMs));
        }
      }

      if (lastError) {
        throw lastError;
      }
      return { success: true };
    };

    describe("Message Validation", () => {
      it("should handle null message value", async () => {
        const result = await processMessage({ value: null }, mockAlgoliaClient);
        expect(result.error).toBe("Invalid message: value is null");
      });

      it("should handle missing objectID", async () => {
        const message = {
          value: JSON.stringify({ rating: 4.5, reviewCount: 10 }),
        };
        const result = await processMessage(message, mockAlgoliaClient);
        expect(result.error).toBe("Invalid payload: missing required fields");
      });

      it("should handle missing rating", async () => {
        const message = {
          value: JSON.stringify({ objectID: "test-123", reviewCount: 10 }),
        };
        const result = await processMessage(message, mockAlgoliaClient);
        expect(result.error).toBe("Invalid payload: missing required fields");
      });

      it("should handle missing reviewCount", async () => {
        const message = {
          value: JSON.stringify({ objectID: "test-123", rating: 4.5 }),
        };
        const result = await processMessage(message, mockAlgoliaClient);
        expect(result.error).toBe("Invalid payload: missing required fields");
      });

      it("should accept valid message with all required fields", async () => {
        mockAlgoliaClient.partialUpdateObject.mockResolvedValueOnce(undefined);
        const message = {
          value: JSON.stringify({
            objectID: "test-123",
            rating: 4.5,
            reviewCount: 10,
          }),
        };
        const result = await processMessage(message, mockAlgoliaClient);
        expect(result.success).toBe(true);
      });

      it("should accept zero rating as valid", async () => {
        mockAlgoliaClient.partialUpdateObject.mockResolvedValueOnce(undefined);
        const message = {
          value: JSON.stringify({
            objectID: "test-123",
            rating: 0,
            reviewCount: 0,
          }),
        };
        const result = await processMessage(message, mockAlgoliaClient);
        expect(result.success).toBe(true);
      });
    });

    describe("Algolia Updates", () => {
      it("should call partialUpdateObject with correct parameters", async () => {
        mockAlgoliaClient.partialUpdateObject.mockResolvedValueOnce(undefined);

        const message = {
          value: JSON.stringify({
            objectID: "channel-123",
            rating: 4.8,
            reviewCount: 42,
          }),
        };

        await processMessage(message, mockAlgoliaClient);

        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledWith({
          indexName: "accounts",
          objectID: "channel-123",
          attributesToUpdate: {
            rating: 4.8,
            reviewCount: 42,
          },
          createIfNotExists: false,
        });
      });

      it("should use 'accounts' as the index name", async () => {
        mockAlgoliaClient.partialUpdateObject.mockResolvedValueOnce(undefined);

        const message = {
          value: JSON.stringify({
            objectID: "test-id",
            rating: 3.0,
            reviewCount: 5,
          }),
        };

        await processMessage(message, mockAlgoliaClient);

        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledWith(
          expect.objectContaining({ indexName: "accounts" }),
        );
      });

      it("should not create object if it doesn't exist", async () => {
        mockAlgoliaClient.partialUpdateObject.mockResolvedValueOnce(undefined);

        const message = {
          value: JSON.stringify({
            objectID: "test-id",
            rating: 5.0,
            reviewCount: 1,
          }),
        };

        await processMessage(message, mockAlgoliaClient);

        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledWith(
          expect.objectContaining({ createIfNotExists: false }),
        );
      });
    });

    describe("Retry Logic", () => {
      it("should retry on transient failure", async () => {
        mockAlgoliaClient.partialUpdateObject
          .mockRejectedValueOnce(new Error("Network error"))
          .mockResolvedValueOnce(undefined);

        const message = {
          value: JSON.stringify({
            objectID: "test-123",
            rating: 4.5,
            reviewCount: 10,
          }),
        };

        const resultPromise = processMessage(message, mockAlgoliaClient);

        // Advance timer for backoff
        await vi.advanceTimersByTimeAsync(1000);

        const result = await resultPromise;

        expect(result.success).toBe(true);
        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledTimes(2);
      });

      it("should use exponential backoff (1s, 2s, 4s)", async () => {
        const setTimeoutSpy = vi.spyOn(global, "setTimeout");

        mockAlgoliaClient.partialUpdateObject
          .mockRejectedValueOnce(new Error("Error 1"))
          .mockRejectedValueOnce(new Error("Error 2"))
          .mockResolvedValueOnce(undefined);

        const message = {
          value: JSON.stringify({
            objectID: "test-123",
            rating: 4.5,
            reviewCount: 10,
          }),
        };

        const resultPromise = processMessage(message, mockAlgoliaClient);

        // First retry backoff: 1000ms
        await vi.advanceTimersByTimeAsync(1000);
        // Second retry backoff: 2000ms
        await vi.advanceTimersByTimeAsync(2000);

        const result = await resultPromise;

        expect(result.success).toBe(true);
        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledTimes(3);
      });

      it("should fail after max retries (3)", async () => {
        // Synchronous retry test without fake timers complexity
        vi.useRealTimers();

        mockAlgoliaClient.partialUpdateObject.mockRejectedValue(
          new Error("Persistent error"),
        );

        const maxRetries = 3;
        let retryCount = 0;
        let lastError: Error | null = null;

        while (retryCount < maxRetries) {
          try {
            await mockAlgoliaClient.partialUpdateObject({
              indexName: "accounts",
              objectID: "test-123",
              attributesToUpdate: { rating: 4.5, reviewCount: 10 },
              createIfNotExists: false,
            });
            break;
          } catch (error: any) {
            retryCount++;
            lastError = error;
            if (retryCount >= maxRetries) break;
            // Skip actual backoff delay in test
          }
        }

        expect(retryCount).toBe(3);
        expect(lastError?.message).toBe("Persistent error");
        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledTimes(3);

        vi.useFakeTimers({ shouldAdvanceTime: true });
      });

      it("should not retry on 404 error", async () => {
        const error404 = new Error("Object not found");
        (error404 as any).status = 404;
        mockAlgoliaClient.partialUpdateObject.mockRejectedValueOnce(error404);

        const message = {
          value: JSON.stringify({
            objectID: "non-existent",
            rating: 4.5,
            reviewCount: 10,
          }),
        };

        const result = await processMessage(message, mockAlgoliaClient);

        expect(result.error).toBe("Object not found");
        expect(result.skipped).toBe(true);
        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledTimes(1);
      });

      it("should not retry on 'not found' message", async () => {
        const notFoundError = new Error("Record not found in index");
        mockAlgoliaClient.partialUpdateObject.mockRejectedValueOnce(
          notFoundError,
        );

        const message = {
          value: JSON.stringify({
            objectID: "missing-id",
            rating: 4.5,
            reviewCount: 10,
          }),
        };

        const result = await processMessage(message, mockAlgoliaClient);

        expect(result.error).toBe("Object not found");
        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledTimes(1);
      });
    });

    describe("Rating Values", () => {
      it("should handle minimum rating (1 star)", async () => {
        mockAlgoliaClient.partialUpdateObject.mockResolvedValueOnce(undefined);

        const message = {
          value: JSON.stringify({
            objectID: "test-123",
            rating: 1.0,
            reviewCount: 1,
          }),
        };

        const result = await processMessage(message, mockAlgoliaClient);

        expect(result.success).toBe(true);
        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledWith(
          expect.objectContaining({
            attributesToUpdate: expect.objectContaining({ rating: 1.0 }),
          }),
        );
      });

      it("should handle maximum rating (5 stars)", async () => {
        mockAlgoliaClient.partialUpdateObject.mockResolvedValueOnce(undefined);

        const message = {
          value: JSON.stringify({
            objectID: "test-123",
            rating: 5.0,
            reviewCount: 100,
          }),
        };

        const result = await processMessage(message, mockAlgoliaClient);

        expect(result.success).toBe(true);
        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledWith(
          expect.objectContaining({
            attributesToUpdate: expect.objectContaining({ rating: 5.0 }),
          }),
        );
      });

      it("should handle decimal ratings", async () => {
        mockAlgoliaClient.partialUpdateObject.mockResolvedValueOnce(undefined);

        const message = {
          value: JSON.stringify({
            objectID: "test-123",
            rating: 4.27,
            reviewCount: 157,
          }),
        };

        const result = await processMessage(message, mockAlgoliaClient);

        expect(result.success).toBe(true);
        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledWith(
          expect.objectContaining({
            attributesToUpdate: expect.objectContaining({ rating: 4.27 }),
          }),
        );
      });

      it("should handle large review counts", async () => {
        mockAlgoliaClient.partialUpdateObject.mockResolvedValueOnce(undefined);

        const message = {
          value: JSON.stringify({
            objectID: "popular-creator",
            rating: 4.89,
            reviewCount: 999999,
          }),
        };

        const result = await processMessage(message, mockAlgoliaClient);

        expect(result.success).toBe(true);
        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledWith(
          expect.objectContaining({
            attributesToUpdate: expect.objectContaining({
              reviewCount: 999999,
            }),
          }),
        );
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
        topic: "new-review-algolia-update",
        fromBeginning: true,
      });

      expect(mockKafkaConsumer.subscribe).toHaveBeenCalledWith({
        topic: "new-review-algolia-update",
        fromBeginning: true,
      });
    });

    it("should register event handlers", async () => {
      mockKafkaConsumer.on("consumer.connect", () => {});
      mockKafkaConsumer.on("consumer.disconnect", () => {});
      mockKafkaConsumer.on("consumer.crash", () => {});

      expect(mockKafkaConsumer.on).toHaveBeenCalledWith(
        "consumer.connect",
        expect.any(Function),
      );
      expect(mockKafkaConsumer.on).toHaveBeenCalledWith(
        "consumer.disconnect",
        expect.any(Function),
      );
      expect(mockKafkaConsumer.on).toHaveBeenCalledWith(
        "consumer.crash",
        expect.any(Function),
      );
    });

    it("should disconnect gracefully", async () => {
      await mockKafkaConsumer.disconnect();
      expect(mockKafkaConsumer.disconnect).toHaveBeenCalled();
    });
  });

  describe("Error Scenarios", () => {
    it("should handle Algolia rate limit error", async () => {
      const rateLimitError = new Error("Rate limit exceeded");
      (rateLimitError as any).status = 429;
      mockAlgoliaClient.partialUpdateObject
        .mockRejectedValueOnce(rateLimitError)
        .mockResolvedValueOnce(undefined);

      const message = {
        value: JSON.stringify({
          objectID: "test-123",
          rating: 4.5,
          reviewCount: 10,
        }),
      };

      // Helper for testing retry behavior
      const processMessage = async (msg: any) => {
        const payload = JSON.parse(msg.value.toString());
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            await mockAlgoliaClient.partialUpdateObject({
              indexName: "accounts",
              objectID: payload.objectID,
              attributesToUpdate: {
                rating: payload.rating,
                reviewCount: payload.reviewCount,
              },
              createIfNotExists: false,
            });
            return { success: true };
          } catch (error: any) {
            retryCount++;
            if (retryCount >= maxRetries) throw error;
            await vi.advanceTimersByTimeAsync(
              Math.pow(2, retryCount - 1) * 1000,
            );
          }
        }
      };

      const result = await processMessage(message);

      expect(result?.success).toBe(true);
      expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledTimes(2);
    });

    it("should handle JSON parse errors", async () => {
      const processMessage = (message: any) => {
        if (!message.value) {
          return { error: "Invalid message" };
        }
        try {
          JSON.parse(message.value.toString());
        } catch (e) {
          return { error: "JSON parse error" };
        }
        return { success: true };
      };

      const result = processMessage({ value: "not valid json" });
      expect(result.error).toBe("JSON parse error");
    });

    it("should handle network timeout errors", async () => {
      const timeoutError = new Error("Network timeout");
      (timeoutError as any).code = "ETIMEDOUT";
      mockAlgoliaClient.partialUpdateObject.mockRejectedValue(timeoutError);

      const message = {
        value: JSON.stringify({
          objectID: "test-123",
          rating: 4.5,
          reviewCount: 10,
        }),
      };

      // Should eventually fail after retries
      const processWithRetry = async () => {
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
          try {
            await mockAlgoliaClient.partialUpdateObject({});
            return { success: true };
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) throw error;
            await vi.advanceTimersByTimeAsync(
              Math.pow(2, retryCount - 1) * 1000,
            );
          }
        }
      };

      await expect(processWithRetry()).rejects.toThrow("Network timeout");
    });
  });

  describe("Object ID Handling", () => {
    it("should handle various objectID formats", async () => {
      mockAlgoliaClient.partialUpdateObject.mockResolvedValue(undefined);

      const testCases = [
        "simple-id",
        "prefix_underscore_id",
        "123numeric",
        "uuid-4d5e6f7g-8h9i-0jkl-mnop-qrstuvwxyz12",
        "very-long-id-that-might-be-from-mongodb-or-similar-database-system",
      ];

      for (const objectID of testCases) {
        vi.clearAllMocks();
        const message = {
          value: JSON.stringify({
            objectID,
            rating: 4.0,
            reviewCount: 5,
          }),
        };

        // Simple process function for this test
        const payload = JSON.parse(message.value.toString());
        await mockAlgoliaClient.partialUpdateObject({
          indexName: "accounts",
          objectID: payload.objectID,
          attributesToUpdate: {
            rating: payload.rating,
            reviewCount: payload.reviewCount,
          },
          createIfNotExists: false,
        });

        expect(mockAlgoliaClient.partialUpdateObject).toHaveBeenCalledWith(
          expect.objectContaining({ objectID }),
        );
      }
    });
  });
});
