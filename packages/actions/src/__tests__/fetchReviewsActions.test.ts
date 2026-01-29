/**
 * Tests for fetchReviewsActions
 * Tests fetching reviews with pagination and user filtering
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

// Use vi.hoisted to declare mocks that will be used inside vi.mock
const {
  mockUserFindUnique,
  mockAccountFindUnique,
  mockReviewFindMany,
  mockReviewCount,
  mockPrismaInstance,
} = vi.hoisted(() => {
  const mockUserFindUnique = vi.fn();
  const mockAccountFindUnique = vi.fn();
  const mockReviewFindMany = vi.fn();
  const mockReviewCount = vi.fn();
  const mockPrismaInstance = {
    user: { findUnique: mockUserFindUnique },
    account: { findUnique: mockAccountFindUnique },
    review: {
      findMany: mockReviewFindMany,
      count: mockReviewCount,
    },
  };
  return {
    mockUserFindUnique,
    mockAccountFindUnique,
    mockReviewFindMany,
    mockReviewCount,
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

vi.mock("@ratecreator/types/review", () => ({
  ReviewValidator: { parse: vi.fn((data) => data) },
  Platform: {},
  ReviewType: {},
}));

// Import after mocks
import {
  fetchReviewsAction,
  fetchSelfReviewsAction,
  fetchTotalReviewsAction,
} from "../review/reviews/fetchReviewsActions";
import { auth } from "@clerk/nextjs/server";

describe("fetchReviewsActions", () => {
  let mockAuth: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = auth as Mock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchReviewsAction", () => {
    const mockAccount = {
      id: "account-db-id",
    };

    const mockReviews = [
      {
        id: "review-1",
        stars: 5,
        platform: "YOUTUBE",
        accountId: "account-db-id",
        content: { text: "Great content!" },
        title: "Amazing Creator",
        contentUrl: null,
        authorId: "author-1",
        author: {
          id: "author-1",
          firstName: "John",
          lastName: "Doe",
          username: "johndoe",
          clerkId: "clerk-1",
          webhookPayload: { image_url: "https://example.com/avatar.jpg" },
          email: "john@example.com",
        },
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        isEdited: false,
        editHistory: [],
        lastActivityAt: new Date("2024-01-01"),
        viewCount: 100,
      },
      {
        id: "review-2",
        stars: 4,
        platform: "YOUTUBE",
        accountId: "account-db-id",
        content: { text: "Good videos" },
        title: "Nice Channel",
        contentUrl: null,
        authorId: "author-2",
        author: {
          id: "author-2",
          firstName: "Jane",
          lastName: "Smith",
          username: "janesmith",
          clerkId: "clerk-2",
          webhookPayload: {},
          email: "jane@example.com",
        },
        status: "PUBLISHED",
        verificationStatus: "UNVERIFIED",
        createdAt: new Date("2024-01-02"),
        updatedAt: new Date("2024-01-02"),
        isEdited: false,
        editHistory: [],
        lastActivityAt: new Date("2024-01-02"),
        viewCount: 50,
      },
    ];

    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: null });
      mockAccountFindUnique.mockResolvedValue(mockAccount);
      mockReviewFindMany.mockResolvedValue(mockReviews);
    });

    it("should fetch reviews with pagination", async () => {
      const result = await fetchReviewsAction("channel-id", "YOUTUBE", 0, 10);

      expect(result).toHaveLength(2);
      expect(mockReviewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
        }),
      );
    });

    it("should calculate correct offset for page", async () => {
      await fetchReviewsAction("channel-id", "YOUTUBE", 2, 10);

      expect(mockReviewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it("should transform review data correctly", async () => {
      const result = await fetchReviewsAction("channel-id", "YOUTUBE", 0, 10);

      expect(result[0]).toEqual(
        expect.objectContaining({
          _id: "review-1",
          stars: 5,
          platform: "YOUTUBE",
          title: "Amazing Creator",
          author: expect.objectContaining({
            id: "author-1",
            firstName: "John",
            lastName: "Doe",
            imageUrl: "https://example.com/avatar.jpg",
          }),
        }),
      );
    });

    it("should handle missing author image gracefully", async () => {
      const result = await fetchReviewsAction("channel-id", "YOUTUBE", 0, 10);

      expect(result[1].author?.imageUrl).toBe("");
    });

    it("should exclude current user reviews when authenticated", async () => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "current-user-id" });

      await fetchReviewsAction("channel-id", "YOUTUBE", 0, 10);

      expect(mockReviewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            NOT: {
              authorId: "current-user-id",
            },
          }),
        }),
      );
    });

    it("should only fetch PUBLISHED reviews", async () => {
      await fetchReviewsAction("channel-id", "YOUTUBE", 0, 10);

      expect(mockReviewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "PUBLISHED",
          }),
        }),
      );
    });

    it("should include author in the response", async () => {
      await fetchReviewsAction("channel-id", "YOUTUBE", 0, 10);

      expect(mockReviewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          include: {
            author: true,
          },
        }),
      );
    });
  });

  describe("fetchSelfReviewsAction", () => {
    beforeEach(() => {
      mockAuth.mockReturnValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "user-id" });
      mockAccountFindUnique.mockResolvedValue({ id: "account-id" });
    });

    it("should fetch only current user reviews", async () => {
      mockReviewFindMany.mockResolvedValue([
        {
          id: "review-1",
          stars: 5,
          platform: "YOUTUBE",
          accountId: "account-id",
          content: { text: "My review" },
          title: "My Title",
          contentUrl: null,
          authorId: "user-id",
          status: "PUBLISHED",
          verificationStatus: "UNVERIFIED",
          createdAt: new Date(),
          updatedAt: new Date(),
          isEdited: false,
          editHistory: [],
          reportCount: 0,
          lastActivityAt: new Date(),
          viewCount: 10,
        },
      ]);

      const result = await fetchSelfReviewsAction("channel-id", "YOUTUBE");

      expect(result).toHaveLength(1);
      expect(mockReviewFindMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            authorId: "user-id",
          }),
        }),
      );
    });

    it("should return empty array when user not authenticated", async () => {
      mockAuth.mockReturnValue({ userId: null });
      mockUserFindUnique.mockResolvedValue(null);
      mockReviewFindMany.mockResolvedValue([]);

      const result = await fetchSelfReviewsAction("channel-id", "YOUTUBE");

      expect(result).toHaveLength(0);
    });

    it("should transform self review data correctly", async () => {
      mockReviewFindMany.mockResolvedValue([
        {
          id: "review-1",
          stars: 4,
          platform: "YOUTUBE",
          accountId: "account-id",
          content: { text: "Self review" },
          title: "My Review",
          contentUrl: "https://example.com",
          authorId: "user-id",
          status: "PUBLISHED",
          verificationStatus: "VERIFIED",
          createdAt: new Date("2024-01-01"),
          updatedAt: new Date("2024-01-02"),
          isEdited: true,
          editHistory: [{ editedAt: new Date() }],
          reportCount: 2,
          lastActivityAt: new Date("2024-01-02"),
          viewCount: 50,
        },
      ]);

      const result = await fetchSelfReviewsAction("channel-id", "YOUTUBE");

      expect(result[0]).toEqual(
        expect.objectContaining({
          _id: "review-1",
          stars: 4,
          isEdited: true,
          reportCount: 2,
        }),
      );
    });
  });

  describe("fetchTotalReviewsAction", () => {
    it("should return total count of published reviews", async () => {
      mockAccountFindUnique.mockResolvedValue({ id: "account-id" });
      mockReviewCount.mockResolvedValue(42);

      const result = await fetchTotalReviewsAction("channel-id", "YOUTUBE");

      expect(result).toBe(42);
      expect(mockReviewCount).toHaveBeenCalledWith({
        where: { accountId: "account-id", status: "PUBLISHED" },
      });
    });

    it("should return 0 when account not found", async () => {
      mockAccountFindUnique.mockResolvedValue(null);
      mockReviewCount.mockResolvedValue(0);

      const result = await fetchTotalReviewsAction("non-existent", "YOUTUBE");

      expect(result).toBe(0);
    });

    it("should look up account by platform and accountId", async () => {
      mockAccountFindUnique.mockResolvedValue({ id: "account-id" });
      mockReviewCount.mockResolvedValue(10);

      await fetchTotalReviewsAction("creator-handle", "TIKTOK");

      expect(mockAccountFindUnique).toHaveBeenCalledWith({
        where: {
          platform_accountId: {
            platform: "TIKTOK",
            accountId: "creator-handle",
          },
        },
        select: { id: true },
      });
    });
  });
});
