/**
 * Tests for createReview action
 * Tests review creation with authentication, validation, and Kafka publishing
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

// Use vi.hoisted to declare mocks that will be used inside vi.mock
const {
  mockUserFindUnique,
  mockAccountFindUnique,
  mockReviewCreate,
  mockKafkaSend,
  mockPrismaInstance,
} = vi.hoisted(() => {
  const mockUserFindUnique = vi.fn();
  const mockAccountFindUnique = vi.fn();
  const mockReviewCreate = vi.fn();
  const mockKafkaSend = vi.fn().mockResolvedValue(undefined);
  const mockPrismaInstance = {
    user: { findUnique: mockUserFindUnique },
    account: { findUnique: mockAccountFindUnique },
    review: { create: mockReviewCreate },
  };
  return {
    mockUserFindUnique,
    mockAccountFindUnique,
    mockReviewCreate,
    mockKafkaSend,
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

vi.mock("@ratecreator/db/kafka-client", () => ({
  getKafkaProducer: vi.fn(() =>
    Promise.resolve({
      send: mockKafkaSend,
    }),
  ),
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

describe("createReview", () => {
  let mockAuth: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = auth as Mock;
    // Reset mock implementations
    mockKafkaSend.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Authentication", () => {
    it("should return error when user is not logged in", async () => {
      mockAuth.mockReturnValue({ userId: null });

      const result = await createReview({
        title: "Test Review",
        stars: 5,
        platform: "youtube",
        accountId: "test-account-id",
        content: "Test content",
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unauthorized");
    });

    it("should return error when user is not found in database", async () => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue(null);

      const result = await createReview({
        title: "Test Review",
        stars: 5,
        platform: "youtube",
        accountId: "test-account-id",
        content: "Test content",
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
      });

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
        title: "Test Review",
        stars: 5,
        platform: "youtube",
        accountId: "non-existent-account",
        content: "Test content",
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Account not found");
    });

    it("should query account with platform and accountId", async () => {
      mockAccountFindUnique.mockResolvedValue({
        id: "account-db-id",
        platform: "YOUTUBE",
      });
      mockReviewCreate.mockResolvedValue({ id: "review-id" });

      await createReview({
        title: "Test Review",
        stars: 5,
        platform: "youtube",
        accountId: "channel-123",
        content: "Test content",
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
      });

      expect(mockAccountFindUnique).toHaveBeenCalledWith({
        where: {
          platform_accountId: {
            platform: "YOUTUBE",
            accountId: "channel-123",
          },
        },
        select: { platform: true, id: true },
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
      status: "PUBLISHED",
      verificationStatus: "UNVERIFIED",
    };

    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "user-db-id" });
      mockAccountFindUnique.mockResolvedValue({
        id: "account-db-id",
        platform: "YOUTUBE",
      });
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

    it("should call prisma.review.create with correct data", async () => {
      mockReviewCreate.mockResolvedValue({ id: "review-123" });

      await createReview(validReviewData);

      expect(mockReviewCreate).toHaveBeenCalledWith({
        data: {
          title: "Great Creator!",
          authorId: "user-db-id",
          platform: "YOUTUBE",
          accountId: "account-db-id",
          stars: 5,
          status: "PUBLISHED",
          verificationStatus: "UNVERIFIED",
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
      mockAccountFindUnique.mockResolvedValue({
        id: "account-db-id",
        platform: "YOUTUBE",
      });
      mockReviewCreate.mockResolvedValue({ id: "review-123" });
    });

    const starRatings = [1, 2, 3, 4, 5];

    it.each(starRatings)("should accept star rating of %i", async (stars) => {
      const result = await createReview({
        title: "Test Review",
        stars,
        platform: "youtube",
        accountId: "channel-123",
        content: "Test content",
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
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
      mockAccountFindUnique.mockResolvedValue({
        id: "account-db-id",
        platform: "REDDIT",
      });
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
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
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
      mockAccountFindUnique.mockResolvedValue({
        id: "account-db-id",
        platform: "YOUTUBE",
      });

      await createReview({
        title: "YouTube Review",
        stars: 4,
        platform: "youtube",
        accountId: "channel-123",
        content: "Test content",
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
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
      mockAccountFindUnique.mockResolvedValue({
        id: "account-db-id",
        platform: "YOUTUBE",
      });
    });

    it("should handle database errors gracefully", async () => {
      mockReviewCreate.mockRejectedValue(
        new Error("Database connection error"),
      );

      const result = await createReview({
        title: "Test Review",
        stars: 5,
        platform: "youtube",
        accountId: "channel-123",
        content: "Test content",
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Database connection error");
    });

    it("should handle unexpected errors", async () => {
      mockReviewCreate.mockRejectedValue("Unexpected error type");

      const result = await createReview({
        title: "Test Review",
        stars: 5,
        platform: "youtube",
        accountId: "channel-123",
        content: "Test content",
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
      });

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
        mockAccountFindUnique.mockResolvedValue({
          id: "account-db-id",
          platform: expected,
        });

        await createReview({
          title: "Test Review",
          stars: 5,
          platform: input,
          accountId: "account-123",
          content: "Test content",
          status: "PUBLISHED",
          verificationStatus: "UNVERIFIED",
        });

        expect(mockAccountFindUnique).toHaveBeenCalledWith({
          where: {
            platform_accountId: {
              platform: expected,
              accountId: "account-123",
            },
          },
          select: { platform: true, id: true },
        });
      },
    );
  });

  describe("Content URL", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "user-db-id" });
      mockAccountFindUnique.mockResolvedValue({
        id: "account-db-id",
        platform: "YOUTUBE",
      });
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
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
      });

      expect(mockReviewCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contentUrl: "https://youtube.com/watch?v=abc123",
        }),
      });
    });
  });
});
