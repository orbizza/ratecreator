/**
 * Tests for worker processors: review-calculate and review-elastic-update
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks
// ---------------------------------------------------------------------------

const {
  mockPrisma,
  mockRedis,
  mockMongoCollection,
  mockMongoDb,
  mockMongoClient,
  mockPublishMessage,
  mockUpdateAccount,
  FakeObjectId,
} = vi.hoisted(() => {
  const mockMongoCollection = {
    countDocuments: vi.fn(),
    aggregate: vi.fn().mockReturnValue({ toArray: vi.fn() }),
    updateOne: vi.fn(),
  };

  const mockMongoDb = {
    collection: vi.fn().mockReturnValue(mockMongoCollection),
  };

  const mockMongoClient = {
    db: vi.fn().mockReturnValue(mockMongoDb),
  };

  const mockPrisma = {
    account: {
      findUnique: vi.fn(),
    },
  };

  const mockRedis = {
    get: vi.fn(),
    set: vi.fn(),
  };

  const mockPublishMessage = vi.fn();

  const mockUpdateAccount = vi.fn();

  // Create a class-like constructor so `new ObjectId(id)` works
  class FakeObjectId {
    _id: string;
    constructor(id: string) {
      this._id = id;
    }
    toString() {
      return this._id;
    }
    toJSON() {
      return this._id;
    }
  }

  return {
    mockPrisma,
    mockRedis,
    mockMongoCollection,
    mockMongoDb,
    mockMongoClient,
    mockPublishMessage,
    mockUpdateAccount,
    FakeObjectId,
  };
});

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: () => mockPrisma,
}));

vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: () => mockRedis,
}));

vi.mock("@ratecreator/db/mongo-client", () => ({
  getMongoClient: vi.fn().mockResolvedValue(mockMongoClient),
}));

vi.mock("@ratecreator/db/pubsub-client", () => ({
  publishMessage: mockPublishMessage,
}));

vi.mock("@ratecreator/db/elasticsearch-client", () => ({
  updateAccount: mockUpdateAccount,
}));

vi.mock("mongodb", () => ({
  ObjectId: FakeObjectId,
}));

// ---------------------------------------------------------------------------
// Helper: match a FakeObjectId wrapping a given string
// ---------------------------------------------------------------------------
function objectIdWith(id: string) {
  return expect.objectContaining({ _id: id });
}

// ---------------------------------------------------------------------------
// processReviewCalculate
// ---------------------------------------------------------------------------

describe("processReviewCalculate", () => {
  let processReviewCalculate: (
    data: Record<string, unknown>,
    attributes: Record<string, string>,
  ) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    // Reset aggregate mock chain for each test
    const toArrayFn = vi.fn();
    mockMongoCollection.aggregate.mockReturnValue({ toArray: toArrayFn });

    const mod = await import("../processors/review-calculate");
    processReviewCalculate = mod.processReviewCalculate;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should calculate rating and update account", async () => {
    const accountId = "UC_test123";
    const mongoId = "507f1f77bcf86cd799439011";

    mockPrisma.account.findUnique.mockResolvedValue({ id: mongoId });
    mockMongoCollection.countDocuments.mockResolvedValue(5);
    mockMongoCollection.aggregate.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ avgStars: 4.2 }]),
    });
    mockMongoCollection.updateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });
    mockRedis.get.mockResolvedValue(null);
    mockPublishMessage.mockResolvedValue(undefined);

    await processReviewCalculate(
      { accountId, rating: 4, platform: "YOUTUBE" },
      {},
    );

    // Prisma lookup with compound key
    expect(mockPrisma.account.findUnique).toHaveBeenCalledWith({
      where: {
        platform_accountId: {
          platform: "YOUTUBE",
          accountId,
        },
      },
      select: { id: true },
    });

    // MongoDB countDocuments
    expect(mockMongoCollection.countDocuments).toHaveBeenCalledWith(
      {
        accountId: objectIdWith(mongoId),
        isDeleted: false,
        status: "PUBLISHED",
      },
      { maxTimeMS: 30000 },
    );

    // MongoDB aggregation pipeline
    expect(mockMongoCollection.aggregate).toHaveBeenCalledWith(
      [
        {
          $match: {
            accountId: objectIdWith(mongoId),
            isDeleted: false,
            status: "PUBLISHED",
          },
        },
        { $group: { _id: null, avgStars: { $avg: "$stars" } } },
      ],
      { maxTimeMS: 30000 },
    );

    // MongoDB update
    const updateCall = mockMongoCollection.updateOne.mock.calls[0];
    expect(updateCall[0]).toEqual({ _id: objectIdWith(mongoId) });
    expect(updateCall[1].$set.rating).toBe(4.2);
    expect(updateCall[1].$set.reviewCount).toBe(5);
    expect(updateCall[1].$set.updatedAt).toBeInstanceOf(Date);
    expect(updateCall[2]).toEqual({ maxTimeMS: 10000 });

    // Pub/Sub publish
    expect(mockPublishMessage).toHaveBeenCalledWith(
      "new-review-elastic-update",
      {
        objectID: accountId,
        rating: 4.2,
        reviewCount: 5,
      },
    );
  });

  it("should handle account not found", async () => {
    mockPrisma.account.findUnique.mockResolvedValue(null);

    await processReviewCalculate(
      { accountId: "UC_nonexistent", rating: 3, platform: "YOUTUBE" },
      {},
    );

    // Should not proceed to aggregation
    expect(mockMongoCollection.countDocuments).not.toHaveBeenCalled();
    expect(mockMongoCollection.aggregate).not.toHaveBeenCalled();
    expect(mockMongoCollection.updateOne).not.toHaveBeenCalled();
    expect(mockPublishMessage).not.toHaveBeenCalled();
  });

  it("should update Redis cache when cached", async () => {
    const accountId = "UC_cached";
    const mongoId = "507f1f77bcf86cd799439022";

    mockPrisma.account.findUnique.mockResolvedValue({ id: mongoId });
    mockMongoCollection.countDocuments.mockResolvedValue(10);
    mockMongoCollection.aggregate.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ avgStars: 3.8 }]),
    });
    mockMongoCollection.updateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });

    const existingCache = JSON.stringify({
      account: {
        name: "Test Creator",
        rating: 3.5,
        reviewCount: 9,
      },
      otherData: "preserved",
    });
    mockRedis.get.mockResolvedValue(existingCache);
    mockRedis.set.mockResolvedValue("OK");
    mockPublishMessage.mockResolvedValue(undefined);

    await processReviewCalculate(
      { accountId, rating: 4, platform: "YOUTUBE" },
      {},
    );

    // Verify Redis was read with the correct cache key
    expect(mockRedis.get).toHaveBeenCalledWith(`accounts-youtube-${accountId}`);

    // Verify Redis set merges the data correctly
    expect(mockRedis.set).toHaveBeenCalledWith(
      `accounts-youtube-${accountId}`,
      JSON.stringify({
        account: {
          name: "Test Creator",
          rating: 3.8,
          reviewCount: 10,
        },
        otherData: "preserved",
      }),
    );
  });

  it("should skip Redis update when not cached", async () => {
    const accountId = "UC_uncached";
    const mongoId = "507f1f77bcf86cd799439033";

    mockPrisma.account.findUnique.mockResolvedValue({ id: mongoId });
    mockMongoCollection.countDocuments.mockResolvedValue(2);
    mockMongoCollection.aggregate.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ avgStars: 4.0 }]),
    });
    mockMongoCollection.updateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });
    mockRedis.get.mockResolvedValue(null);
    mockPublishMessage.mockResolvedValue(undefined);

    await processReviewCalculate(
      { accountId, rating: 4, platform: "TWITTER" },
      {},
    );

    expect(mockRedis.get).toHaveBeenCalledWith(`accounts-twitter-${accountId}`);
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it("should publish to elastic update topic", async () => {
    const accountId = "UC_pubsub";
    const mongoId = "507f1f77bcf86cd799439044";

    mockPrisma.account.findUnique.mockResolvedValue({ id: mongoId });
    mockMongoCollection.countDocuments.mockResolvedValue(3);
    mockMongoCollection.aggregate.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ avgStars: 4.5 }]),
    });
    mockMongoCollection.updateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });
    mockRedis.get.mockResolvedValue(null);
    mockPublishMessage.mockResolvedValue(undefined);

    await processReviewCalculate(
      { accountId, rating: 5, platform: "TIKTOK" },
      {},
    );

    expect(mockPublishMessage).toHaveBeenCalledTimes(1);
    expect(mockPublishMessage).toHaveBeenCalledWith(
      "new-review-elastic-update",
      {
        objectID: accountId,
        rating: 4.5,
        reviewCount: 3,
      },
    );
  });

  it("should handle invalid platform", async () => {
    const accountId = "UC_invalid_plat";
    const mongoId = "507f1f77bcf86cd799439055";

    mockPrisma.account.findUnique.mockResolvedValue({ id: mongoId });
    mockMongoCollection.countDocuments.mockResolvedValue(1);
    mockMongoCollection.aggregate.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ avgStars: 3.0 }]),
    });
    mockMongoCollection.updateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });

    // Should not throw (outer try/catch swallows it), but should not publish
    await processReviewCalculate(
      { accountId, rating: 3, platform: "INVALID_PLATFORM" },
      {},
    );

    // The switch will hit default and throw, which is caught by the outer catch
    // So publish should never be called
    expect(mockPublishMessage).not.toHaveBeenCalled();
    // Redis set should not be called either since we never get the cache key
    expect(mockRedis.set).not.toHaveBeenCalled();
  });

  it("should handle MongoDB aggregation error", async () => {
    const accountId = "UC_agg_fail";
    const mongoId = "507f1f77bcf86cd799439066";

    mockPrisma.account.findUnique.mockResolvedValue({ id: mongoId });
    mockMongoCollection.countDocuments.mockRejectedValue(
      new Error("Aggregation timed out"),
    );

    // Should not throw (outer try/catch swallows it)
    await processReviewCalculate(
      { accountId, rating: 4, platform: "YOUTUBE" },
      {},
    );

    // Should not proceed to update or publish
    expect(mockMongoCollection.updateOne).not.toHaveBeenCalled();
    expect(mockPublishMessage).not.toHaveBeenCalled();
  });

  it("should retry Pub/Sub publish on failure up to 3 times", async () => {
    const accountId = "UC_retry";
    const mongoId = "507f1f77bcf86cd799439077";

    mockPrisma.account.findUnique.mockResolvedValue({ id: mongoId });
    mockMongoCollection.countDocuments.mockResolvedValue(1);
    mockMongoCollection.aggregate.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([{ avgStars: 4.0 }]),
    });
    mockMongoCollection.updateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });
    mockRedis.get.mockResolvedValue(null);

    // Fail twice, succeed on third attempt
    mockPublishMessage
      .mockRejectedValueOnce(new Error("Pub/Sub unavailable"))
      .mockRejectedValueOnce(new Error("Pub/Sub unavailable"))
      .mockResolvedValueOnce(undefined);

    const promise = processReviewCalculate(
      { accountId, rating: 4, platform: "REDDIT" },
      {},
    );

    // Advance through the retry setTimeout delays (1000ms, 2000ms)
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    await promise;

    expect(mockPublishMessage).toHaveBeenCalledTimes(3);
  });

  it("should use correct cache key for each platform", async () => {
    const mongoId = "507f1f77bcf86cd799439088";
    const platformKeys: Record<string, string> = {
      YOUTUBE: "accounts-youtube-",
      TWITTER: "accounts-twitter-",
      TIKTOK: "accounts-tiktok-",
      REDDIT: "accounts-reddit-",
    };

    for (const [platform, prefix] of Object.entries(platformKeys)) {
      vi.clearAllMocks();

      const accountId = `UC_${platform.toLowerCase()}`;
      mockPrisma.account.findUnique.mockResolvedValue({ id: mongoId });
      mockMongoCollection.countDocuments.mockResolvedValue(1);
      mockMongoCollection.aggregate.mockReturnValue({
        toArray: vi.fn().mockResolvedValue([{ avgStars: 3.5 }]),
      });
      mockMongoCollection.updateOne.mockResolvedValue({
        matchedCount: 1,
        modifiedCount: 1,
      });
      mockRedis.get.mockResolvedValue(null);
      mockPublishMessage.mockResolvedValue(undefined);

      await processReviewCalculate({ accountId, rating: 4, platform }, {});

      expect(mockRedis.get).toHaveBeenCalledWith(`${prefix}${accountId}`);
    }
  });

  it("should use rating as fallback when aggregation returns no results", async () => {
    const accountId = "UC_no_reviews";
    const mongoId = "507f1f77bcf86cd799439099";

    mockPrisma.account.findUnique.mockResolvedValue({ id: mongoId });
    mockMongoCollection.countDocuments.mockResolvedValue(0);
    // Empty aggregation result (no reviews match)
    mockMongoCollection.aggregate.mockReturnValue({
      toArray: vi.fn().mockResolvedValue([]),
    });
    mockMongoCollection.updateOne.mockResolvedValue({
      matchedCount: 1,
      modifiedCount: 1,
    });
    mockRedis.get.mockResolvedValue(null);
    mockPublishMessage.mockResolvedValue(undefined);

    await processReviewCalculate(
      { accountId, rating: 4, platform: "YOUTUBE" },
      {},
    );

    // When aggregatedAvg is null, the code falls back to the raw rating
    const updateCall = mockMongoCollection.updateOne.mock.calls[0];
    expect(updateCall[0]).toEqual({ _id: objectIdWith(mongoId) });
    expect(updateCall[1].$set.rating).toBe(4);
    expect(updateCall[1].$set.reviewCount).toBe(0);
    expect(updateCall[1].$set.updatedAt).toBeInstanceOf(Date);
    expect(updateCall[2]).toEqual({ maxTimeMS: 10000 });

    expect(mockPublishMessage).toHaveBeenCalledWith(
      "new-review-elastic-update",
      {
        objectID: accountId,
        rating: 4,
        reviewCount: 0,
      },
    );
  });
});

// ---------------------------------------------------------------------------
// processReviewElasticUpdate
// ---------------------------------------------------------------------------

describe("processReviewElasticUpdate", () => {
  let processReviewElasticUpdate: (
    data: Record<string, unknown>,
    attributes: Record<string, string>,
  ) => Promise<void>;

  beforeEach(async () => {
    vi.clearAllMocks();
    vi.useFakeTimers();

    const mod = await import("../processors/review-elastic-update");
    processReviewElasticUpdate = mod.processReviewElasticUpdate;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should update ES with rating and reviewCount", async () => {
    mockUpdateAccount.mockResolvedValue({ result: "updated" });

    await processReviewElasticUpdate(
      { objectID: "UC_test123", rating: 4.5, reviewCount: 10 },
      {},
    );

    expect(mockUpdateAccount).toHaveBeenCalledTimes(1);
    expect(mockUpdateAccount).toHaveBeenCalledWith("UC_test123", {
      rating: 4.5,
      reviewCount: 10,
    });
  });

  it("should handle missing required fields - no objectID", async () => {
    await processReviewElasticUpdate({ rating: 4.5, reviewCount: 10 }, {});

    // Should return early without calling updateAccount
    expect(mockUpdateAccount).not.toHaveBeenCalled();
  });

  it("should handle missing required fields - no rating", async () => {
    await processReviewElasticUpdate(
      { objectID: "UC_test123", reviewCount: 10 },
      {},
    );

    expect(mockUpdateAccount).not.toHaveBeenCalled();
  });

  it("should handle missing required fields - no reviewCount", async () => {
    await processReviewElasticUpdate(
      { objectID: "UC_test123", rating: 4.5 },
      {},
    );

    expect(mockUpdateAccount).not.toHaveBeenCalled();
  });

  it("should handle ES 404 gracefully (skip without retrying)", async () => {
    const error404 = new Error("document_missing_exception") as any;
    error404.meta = { statusCode: 404 };
    mockUpdateAccount.mockRejectedValue(error404);

    // Should not throw
    await processReviewElasticUpdate(
      { objectID: "UC_missing", rating: 4.0, reviewCount: 5 },
      {},
    );

    // Should only try once since 404 is handled gracefully
    expect(mockUpdateAccount).toHaveBeenCalledTimes(1);
  });

  it("should retry on failure up to 3 times with exponential backoff", async () => {
    const transientError = new Error("Connection timeout");
    mockUpdateAccount
      .mockRejectedValueOnce(transientError)
      .mockRejectedValueOnce(transientError)
      .mockResolvedValueOnce({ result: "updated" });

    const promise = processReviewElasticUpdate(
      { objectID: "UC_retry", rating: 4.0, reviewCount: 5 },
      {},
    );

    // First retry: backoff = 2^(1-1) * 1000 = 1000ms
    await vi.advanceTimersByTimeAsync(1000);
    // Second retry: backoff = 2^(2-1) * 1000 = 2000ms
    await vi.advanceTimersByTimeAsync(2000);

    await promise;

    expect(mockUpdateAccount).toHaveBeenCalledTimes(3);
  });

  it("should throw after max retries exhausted", async () => {
    const persistentError = new Error("Cluster unavailable");
    mockUpdateAccount
      .mockRejectedValueOnce(persistentError)
      .mockRejectedValueOnce(persistentError)
      .mockRejectedValueOnce(persistentError);

    // Immediately capture the rejection to prevent unhandled rejection warnings
    let caughtError: Error | undefined;
    const promise = processReviewElasticUpdate(
      { objectID: "UC_fail", rating: 4.0, reviewCount: 5 },
      {},
    ).catch((err: Error) => {
      caughtError = err;
    });

    // Advance through all backoff timers: 1000ms then 2000ms
    await vi.advanceTimersByTimeAsync(1000);
    await vi.advanceTimersByTimeAsync(2000);
    await vi.runAllTimersAsync();
    await promise;

    expect(caughtError).toBeDefined();
    expect(caughtError!.message).toBe("Cluster unavailable");
    expect(mockUpdateAccount).toHaveBeenCalledTimes(3);
  });

  it("should pass correct data structure to updateAccount", async () => {
    mockUpdateAccount.mockResolvedValue({ result: "updated" });

    await processReviewElasticUpdate(
      { objectID: "UC_struct", rating: 3.75, reviewCount: 42 },
      {},
    );

    // Ensure only rating and reviewCount are passed (not objectID)
    expect(mockUpdateAccount).toHaveBeenCalledWith("UC_struct", {
      rating: 3.75,
      reviewCount: 42,
    });
  });
});
