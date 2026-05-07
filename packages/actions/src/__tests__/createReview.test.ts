/**
 * Tests for createReview action
 *
 * The verification-spoofing fix means the validator no longer accepts
 * `status` / `verificationStatus` / `authorId` from the caller. The action
 * always writes `status: "PUBLISHED"` + `verificationStatus: "IN_PROGRESS"`
 * and pulls authorId from the session, never the payload. It also refuses
 * a duplicate review by the same author against the same account, and
 * refuses any review against a suspended or deleted account.
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

// Use vi.hoisted to declare mocks that will be used inside vi.mock
const {
  mockUserFindUnique,
  mockAccountFindUnique,
  mockReviewCreate,
  mockReviewFindFirst,
  mockPublishMessageWithKey,
  mockRedisDel,
  mockPrismaInstance,
} = vi.hoisted(() => {
  const mockUserFindUnique = vi.fn();
  const mockAccountFindUnique = vi.fn();
  const mockReviewCreate = vi.fn();
  const mockReviewFindFirst = vi.fn();
  const mockPublishMessageWithKey = vi.fn().mockResolvedValue(undefined);
  const mockRedisDel = vi.fn().mockResolvedValue(undefined);
  const mockPrismaInstance = {
    user: { findUnique: mockUserFindUnique },
    account: { findUnique: mockAccountFindUnique },
    review: { create: mockReviewCreate, findFirst: mockReviewFindFirst },
  };
  return {
    mockUserFindUnique,
    mockAccountFindUnique,
    mockReviewCreate,
    mockReviewFindFirst,
    mockPublishMessageWithKey,
    mockRedisDel,
    mockPrismaInstance,
  };
});

// Mock modules
vi.mock("@clerk/nextjs/server", () => ({
  auth: vi.fn(),
}));

vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrismaInstance),
}));

vi.mock("@ratecreator/db/pubsub-client", () => ({
  publishMessageWithKey: mockPublishMessageWithKey,
}));

vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => ({
    del: mockRedisDel,
  })),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("@ratecreator/types/review", () => ({
  ReviewValidator: {
    parse: vi.fn((data) => data),
  },
  Platform: {},
}));

// Import after mocks
import { createReview } from "../review/reviews/createReview";
import { auth } from "@clerk/nextjs/server";

// The validator now strips status/verificationStatus/authorId, so the test
// payloads don't carry them — the action always writes "PUBLISHED" /
// "IN_PROGRESS" itself.
const baseReview = {
  title: "Test Review",
  stars: 5,
  platform: "youtube",
  accountId: "test-account-id",
  content: "Test content",
};

const liveAccount = (platform = "YOUTUBE") => ({
  id: "account-db-id",
  platform,
  isSuspended: false,
  isDeleted: false,
});

describe("createReview", () => {
  let mockAuth: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = auth as Mock;
    // Reset mock implementations
    mockPublishMessageWithKey.mockResolvedValue(undefined);
    // Default: no prior review by this author for this account.
    mockReviewFindFirst.mockResolvedValue(null);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication", () => {
    it("should return error when user is not logged in", async () => {
      mockAuth.mockReturnValue({ userId: null });

      const result = await createReview({
        ...baseReview,
        accountId: "test-account-id",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("should return error when user is not found in database", async () => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue(null);

      const result = await createReview(baseReview);

      expect(result.success).toBe(false);
      expect(result.error).toContain("User not found");
    });
  });

  describe("Account Validation", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "user-db-id" });
    });

    it("should return error when account is not found", async () => {
      mockAccountFindUnique.mockResolvedValue(null);

      const result = await createReview({
        ...baseReview,
        accountId: "non-existent-account",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Account not found");
    });

    it("should refuse to create a review for a deleted account", async () => {
      mockAccountFindUnique.mockResolvedValue({
        id: "account-db-id",
        platform: "YOUTUBE",
        isSuspended: false,
        isDeleted: true,
      });

      const result = await createReview(baseReview);

      expect(result.success).toBe(false);
      expect(result.error).toContain("Account not found");
      expect(mockReviewCreate).not.toHaveBeenCalled();
    });

    it("should refuse to create a review for a suspended account", async () => {
      mockAccountFindUnique.mockResolvedValue({
        id: "account-db-id",
        platform: "YOUTUBE",
        isSuspended: true,
        isDeleted: false,
      });

      const result = await createReview(baseReview);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/disabled.*suspended/i);
      expect(mockReviewCreate).not.toHaveBeenCalled();
    });

    it("should query account with platform, accountId, and the suspension flags", async () => {
      mockAccountFindUnique.mockResolvedValue(liveAccount());
      mockReviewCreate.mockResolvedValue({ id: "review-id" });

      await createReview({
        ...baseReview,
        accountId: "channel-123",
      });

      expect(mockAccountFindUnique).toHaveBeenCalledWith({
        where: {
          platform_accountId: {
            platform: "YOUTUBE",
            accountId: "channel-123",
          },
        },
        select: {
          platform: true,
          id: true,
          isSuspended: true,
          isDeleted: true,
        },
      });
    });

    it("should refuse a duplicate review from the same author for the same account", async () => {
      mockAccountFindUnique.mockResolvedValue(liveAccount());
      mockReviewFindFirst.mockResolvedValueOnce({ id: "existing-review-id" });

      const result = await createReview(baseReview);

      expect(result.success).toBe(false);
      expect(result.error).toMatch(/already reviewed/i);
      expect(mockReviewCreate).not.toHaveBeenCalled();
      // Make sure the duplicate check is keyed on account+author+isDeleted=false
      // (an admin-soft-deleted prior review should not block a fresh one).
      expect(mockReviewFindFirst).toHaveBeenCalledWith({
        where: {
          accountId: "account-db-id",
          authorId: "user-db-id",
          isDeleted: false,
        },
        select: { id: true },
      });
    });
  });

  describe("Successful Review Creation", () => {
    const validReviewData = {
      title: "Great Creator!",
      stars: 5,
      platform: "youtube",
      accountId: "channel-123",
      content: { text: "Amazing content!" },
    };

    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "user-db-id" });
      mockAccountFindUnique.mockResolvedValue(liveAccount());
    });

    it("should create review successfully with valid data", async () => {
      const createdReview = {
        id: "review-123",
        title: "Great Creator!",
        stars: 5,
        authorId: "user-db-id",
        accountId: "account-db-id",
      };
      mockReviewCreate.mockResolvedValue(createdReview);

      const result = await createReview(validReviewData);

      expect(result.success).toBe(true);
      expect(result.data).toEqual(createdReview);
    });

    it("should always write status PUBLISHED + verificationStatus IN_PROGRESS, ignoring caller payload", async () => {
      mockReviewCreate.mockResolvedValue({ id: "review-123" });

      // Caller tries to self-mark VERIFIED. Source must IGNORE both fields.
      await createReview({
        ...validReviewData,
        // @ts-expect-error — these fields no longer exist on the schema
        status: "DELETED",
        verificationStatus: "VERIFIED",
        authorId: "victim-user-id",
      });

      expect(mockReviewCreate).toHaveBeenCalledWith({
        data: {
          title: "Great Creator!",
          authorId: "user-db-id", // from session, not payload
          platform: "YOUTUBE",
          accountId: "account-db-id",
          stars: 5,
          status: "PUBLISHED",
          verificationStatus: "IN_PROGRESS",
          content: { text: "Amazing content!" },
          contentUrl: undefined,
          redditMetadata: undefined,
        },
      });
    });

    it("should lookup user by clerkId", async () => {
      mockReviewCreate.mockResolvedValue({ id: "review-123" });

      await createReview(validReviewData);

      expect(mockUserFindUnique).toHaveBeenCalledWith({
        where: { clerkId: "clerk-user-123" },
        select: { id: true },
      });
    });
  });

  describe("Star Ratings", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "user-db-id" });
      mockAccountFindUnique.mockResolvedValue(liveAccount());
      mockReviewCreate.mockResolvedValue({ id: "review-123" });
    });

    const starRatings = [1, 2, 3, 4, 5];

    it.each(starRatings)("should accept star rating of %i", async (stars) => {
      const result = await createReview({
        ...baseReview,
        stars,
        accountId: "channel-123",
      });

      expect(result.success).toBe(true);
      expect(mockReviewCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({ stars }),
      });
    });
  });

  describe("Reddit Metadata", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "user-db-id" });
      mockAccountFindUnique.mockResolvedValue(liveAccount("REDDIT"));
      mockReviewCreate.mockResolvedValue({ id: "review-123" });
    });

    it("should include redditMetadata for Reddit platform", async () => {
      const redditReviewData = {
        title: "Reddit Review",
        stars: 4,
        platform: "REDDIT",
        accountId: "reddit-user-123",
        content: "Test content",
        contentUrl: "https://reddit.com/r/test/comments/abc123/test_post",
        redditMetadata: {
          title: "Test Post Title",
          author: "testuser",
          subreddit: "test",
        },
      };

      await createReview(redditReviewData);

      expect(mockReviewCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          redditMetadata: {
            slug: "https://reddit.com/r/test/comments/abc123/test_post",
            title: "Test Post Title",
            author: "testuser",
            subreddit: "test",
          },
        }),
      });
    });

    it("should not include redditMetadata for non-Reddit platforms", async () => {
      mockAccountFindUnique.mockResolvedValue(liveAccount("YOUTUBE"));

      await createReview({
        title: "YouTube Review",
        stars: 4,
        platform: "youtube",
        accountId: "channel-123",
        content: "Test content",
      });

      expect(mockReviewCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          redditMetadata: undefined,
        }),
      });
    });
  });

  describe("Error Handling", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "user-db-id" });
      mockAccountFindUnique.mockResolvedValue(liveAccount());
    });

    it("should handle database errors gracefully", async () => {
      mockReviewCreate.mockRejectedValue(
        new Error("Database connection error"),
      );

      const result = await createReview(baseReview);

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection error");
    });

    it("should handle unexpected errors", async () => {
      mockReviewCreate.mockRejectedValue("Unexpected error type");

      const result = await createReview(baseReview);

      expect(result.success).toBe(false);
      expect(result.error).toBe("An unexpected error occurred");
    });
  });

  describe("Platform Handling", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "user-db-id" });
      mockReviewCreate.mockResolvedValue({ id: "review-123" });
    });

    const platforms = [
      { input: "youtube", expected: "YOUTUBE" },
      { input: "twitter", expected: "TWITTER" },
      { input: "instagram", expected: "INSTAGRAM" },
      { input: "reddit", expected: "REDDIT" },
      { input: "tiktok", expected: "TIKTOK" },
      { input: "twitch", expected: "TWITCH" },
    ];

    it.each(platforms)(
      "should convert $input platform to $expected",
      async ({ input, expected }) => {
        mockAccountFindUnique.mockResolvedValue(liveAccount(expected));

        await createReview({
          title: "Test Review",
          stars: 5,
          platform: input,
          accountId: "account-123",
          content: "Test content",
        });

        expect(mockAccountFindUnique).toHaveBeenCalledWith({
          where: {
            platform_accountId: {
              platform: expected,
              accountId: "account-123",
            },
          },
          select: {
            platform: true,
            id: true,
            isSuspended: true,
            isDeleted: true,
          },
        });
      },
    );
  });

  describe("Content URL", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "user-db-id" });
      mockAccountFindUnique.mockResolvedValue(liveAccount());
      mockReviewCreate.mockResolvedValue({ id: "review-123" });
    });

    it("should include contentUrl when provided", async () => {
      await createReview({
        title: "Video Review",
        stars: 5,
        platform: "youtube",
        accountId: "channel-123",
        content: "Great video!",
        contentUrl: "https://youtube.com/watch?v=abc123",
      });

      expect(mockReviewCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentUrl: "https://youtube.com/watch?v=abc123",
        }),
      });
    });
  });
});
