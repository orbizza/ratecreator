/**
 * Tests for vote actions
 * Tests voting on reviews and comments, including toggle behavior
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

// Use vi.hoisted to declare mocks that will be used inside vi.mock
const {
  mockUserFindUnique,
  mockReviewFindUnique,
  mockAccountFindUnique,
  mockCommentFindUnique,
  mockVoteFindUnique,
  mockVoteFindMany,
  mockVoteCreate,
  mockVoteUpdate,
  mockVoteDelete,
  mockCommentVoteFindUnique,
  mockCommentVoteFindMany,
  mockCommentVoteCreate,
  mockCommentVoteUpdate,
  mockCommentVoteDelete,
  mockPrismaInstance,
} = vi.hoisted(() => {
  const mockUserFindUnique = vi.fn();
  const mockReviewFindUnique = vi.fn();
  const mockAccountFindUnique = vi.fn();
  const mockCommentFindUnique = vi.fn();
  const mockVoteFindUnique = vi.fn();
  const mockVoteFindMany = vi.fn();
  const mockVoteCreate = vi.fn();
  const mockVoteUpdate = vi.fn();
  const mockVoteDelete = vi.fn();
  const mockCommentVoteFindUnique = vi.fn();
  const mockCommentVoteFindMany = vi.fn();
  const mockCommentVoteCreate = vi.fn();
  const mockCommentVoteUpdate = vi.fn();
  const mockCommentVoteDelete = vi.fn();
  const mockPrismaInstance = {
    user: { findUnique: mockUserFindUnique },
    review: { findUnique: mockReviewFindUnique },
    account: { findUnique: mockAccountFindUnique },
    comment: { findUnique: mockCommentFindUnique },
    vote: {
      findUnique: mockVoteFindUnique,
      findMany: mockVoteFindMany,
      create: mockVoteCreate,
      update: mockVoteUpdate,
      delete: mockVoteDelete,
    },
    commentVote: {
      findUnique: mockCommentVoteFindUnique,
      findMany: mockCommentVoteFindMany,
      create: mockCommentVoteCreate,
      update: mockCommentVoteUpdate,
      delete: mockCommentVoteDelete,
    },
  };
  return {
    mockUserFindUnique,
    mockReviewFindUnique,
    mockAccountFindUnique,
    mockCommentFindUnique,
    mockVoteFindUnique,
    mockVoteFindMany,
    mockVoteCreate,
    mockVoteUpdate,
    mockVoteDelete,
    mockCommentVoteFindUnique,
    mockCommentVoteFindMany,
    mockCommentVoteCreate,
    mockCommentVoteUpdate,
    mockCommentVoteDelete,
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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Import after mocks
import {
  voteOnReview,
  voteOnComment,
  getReviewVoteCounts,
  getCommentVoteCounts,
  getReviewVoteCountsBatch,
} from "../review/votes/voteActions";
import { auth } from "@clerk/nextjs/server";

describe("Vote Actions", () => {
  let mockAuth: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = auth as Mock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("voteOnReview", () => {
    describe("Authentication", () => {
      it("should return error when user is not logged in", async () => {
        mockAuth.mockResolvedValue({ userId: null });

        const result = await voteOnReview("review-123", "UP");

        expect(result.success).toBe(false);
        expect(result.error).toBe("You must be logged in to vote");
      });

      it("should return error when user is not found in database", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue(null);

        const result = await voteOnReview("review-123", "UP");

        expect(result.success).toBe(false);
        expect(result.error).toBe("User not found");
      });
    });

    describe("Review Validation", () => {
      it("should return error when review does not exist", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockReviewFindUnique.mockResolvedValue(null);

        const result = await voteOnReview("non-existent-review", "UP");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Review not found");
      });
    });

    describe("New Vote", () => {
      const mockUser = { id: "user-id" };
      const mockReview = {
        id: "review-123",
        accountId: "account-id",
        platform: "YOUTUBE",
      };

      beforeEach(() => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue(mockUser);
        mockReviewFindUnique.mockResolvedValue(mockReview);
        mockVoteFindUnique.mockResolvedValue(null);
        mockVoteCreate.mockResolvedValue({
          id: "vote-id",
          type: "UP",
          userId: "user-id",
          reviewId: "review-123",
        });
        mockVoteFindMany.mockResolvedValue([{ type: "UP", userId: "user-id" }]);
        mockAccountFindUnique.mockResolvedValue({
          accountId: "channel-id",
        });
      });

      it("should create new upvote when user has not voted", async () => {
        const result = await voteOnReview("review-123", "UP");

        expect(result.success).toBe(true);
        expect(mockVoteCreate).toHaveBeenCalledWith({
          data: {
            userId: "user-id",
            reviewId: "review-123",
            type: "UP",
          },
        });
      });

      it("should create new downvote when user has not voted", async () => {
        mockVoteFindMany.mockResolvedValue([
          { type: "DOWN", userId: "user-id" },
        ]);

        const result = await voteOnReview("review-123", "DOWN");

        expect(result.success).toBe(true);
        expect(mockVoteCreate).toHaveBeenCalledWith({
          data: {
            userId: "user-id",
            reviewId: "review-123",
            type: "DOWN",
          },
        });
      });
    });

    describe("Toggle Vote (Same Vote Type)", () => {
      const mockUser = { id: "user-id" };
      const mockReview = {
        id: "review-123",
        accountId: "account-id",
        platform: "YOUTUBE",
      };
      const mockExistingVote = {
        id: "vote-id",
        type: "UP",
        userId: "user-id",
        reviewId: "review-123",
      };

      beforeEach(() => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue(mockUser);
        mockReviewFindUnique.mockResolvedValue(mockReview);
        mockVoteFindUnique.mockResolvedValue(mockExistingVote);
        mockVoteDelete.mockResolvedValue(mockExistingVote);
        mockVoteFindMany.mockResolvedValue([]);
        mockAccountFindUnique.mockResolvedValue({
          accountId: "channel-id",
        });
      });

      it("should remove vote when user votes same type again (toggle off)", async () => {
        const result = await voteOnReview("review-123", "UP");

        expect(result.success).toBe(true);
        expect(mockVoteDelete).toHaveBeenCalledWith({
          where: { id: "vote-id" },
        });
        expect(mockVoteCreate).not.toHaveBeenCalled();
        expect(mockVoteUpdate).not.toHaveBeenCalled();
      });
    });

    describe("Change Vote (Different Vote Type)", () => {
      const mockUser = { id: "user-id" };
      const mockReview = {
        id: "review-123",
        accountId: "account-id",
        platform: "YOUTUBE",
      };
      const mockExistingVote = {
        id: "vote-id",
        type: "UP",
        userId: "user-id",
        reviewId: "review-123",
      };

      beforeEach(() => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue(mockUser);
        mockReviewFindUnique.mockResolvedValue(mockReview);
        mockVoteFindUnique.mockResolvedValue(mockExistingVote);
        mockVoteUpdate.mockResolvedValue({
          ...mockExistingVote,
          type: "DOWN",
        });
        mockVoteFindMany.mockResolvedValue([
          { type: "DOWN", userId: "user-id" },
        ]);
        mockAccountFindUnique.mockResolvedValue({
          accountId: "channel-id",
        });
      });

      it("should update vote when user changes vote type", async () => {
        const result = await voteOnReview("review-123", "DOWN");

        expect(result.success).toBe(true);
        expect(mockVoteUpdate).toHaveBeenCalledWith({
          where: { id: "vote-id" },
          data: { type: "DOWN" },
        });
        expect(mockVoteDelete).not.toHaveBeenCalled();
      });
    });
  });

  describe("voteOnComment", () => {
    describe("Authentication", () => {
      it("should return error when user is not logged in", async () => {
        mockAuth.mockResolvedValue({ userId: null });

        const result = await voteOnComment("comment-123", "UP");

        expect(result.success).toBe(false);
        expect(result.error).toBe("You must be logged in to vote");
      });
    });

    describe("Comment Validation", () => {
      it("should return error when comment does not exist", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockCommentFindUnique.mockResolvedValue(null);

        const result = await voteOnComment("non-existent-comment", "UP");

        expect(result.success).toBe(false);
        expect(result.error).toBe("Comment not found");
      });
    });

    describe("New Comment Vote", () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockCommentFindUnique.mockResolvedValue({
          id: "comment-123",
          reviewId: "review-id",
        });
        mockCommentVoteFindUnique.mockResolvedValue(null);
        mockCommentVoteCreate.mockResolvedValue({
          id: "vote-id",
          type: "UP",
        });
        mockCommentVoteFindMany.mockResolvedValue([
          { type: "UP", userId: "user-id" },
        ]);
      });

      it("should create new vote on comment", async () => {
        const result = await voteOnComment("comment-123", "UP");

        expect(result.success).toBe(true);
        expect(mockCommentVoteCreate).toHaveBeenCalledWith({
          data: {
            userId: "user-id",
            commentId: "comment-123",
            type: "UP",
          },
        });
      });
    });

    describe("Toggle Comment Vote", () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockCommentFindUnique.mockResolvedValue({
          id: "comment-123",
          reviewId: "review-id",
        });
        mockCommentVoteFindUnique.mockResolvedValue({
          id: "vote-id",
          type: "UP",
        });
        mockCommentVoteDelete.mockResolvedValue({});
        mockCommentVoteFindMany.mockResolvedValue([]);
      });

      it("should toggle off when same vote type", async () => {
        const result = await voteOnComment("comment-123", "UP");

        expect(result.success).toBe(true);
        expect(mockCommentVoteDelete).toHaveBeenCalled();
      });
    });

    describe("Change Comment Vote", () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockCommentFindUnique.mockResolvedValue({
          id: "comment-123",
          reviewId: "review-id",
        });
        mockCommentVoteFindUnique.mockResolvedValue({
          id: "vote-id",
          type: "UP",
        });
        mockCommentVoteUpdate.mockResolvedValue({
          type: "DOWN",
        });
        mockCommentVoteFindMany.mockResolvedValue([
          { type: "DOWN", userId: "user-id" },
        ]);
      });

      it("should update when different vote type", async () => {
        const result = await voteOnComment("comment-123", "DOWN");

        expect(result.success).toBe(true);
        expect(mockCommentVoteUpdate).toHaveBeenCalledWith({
          where: { id: "vote-id" },
          data: { type: "DOWN" },
        });
      });
    });
  });

  describe("getReviewVoteCounts", () => {
    it("should calculate vote counts correctly", async () => {
      mockVoteFindMany.mockResolvedValue([
        { type: "UP", userId: "user-1" },
        { type: "UP", userId: "user-2" },
        { type: "UP", userId: "user-3" },
        { type: "DOWN", userId: "user-4" },
        { type: "DOWN", userId: "user-5" },
      ]);

      const result = await getReviewVoteCounts("review-123");

      expect(result.upvotes).toBe(3);
      expect(result.downvotes).toBe(2);
      expect(result.score).toBe(1);
    });

    it("should return user vote when userId provided", async () => {
      mockVoteFindMany.mockResolvedValue([
        { type: "UP", userId: "current-user" },
        { type: "DOWN", userId: "other-user" },
      ]);

      const result = await getReviewVoteCounts("review-123", "current-user");

      expect(result.userVote).toBe("UP");
    });

    it("should return null userVote when user has not voted", async () => {
      mockVoteFindMany.mockResolvedValue([
        { type: "UP", userId: "other-user" },
      ]);

      const result = await getReviewVoteCounts("review-123", "current-user");

      expect(result.userVote).toBeNull();
    });

    it("should return zero counts on error", async () => {
      mockVoteFindMany.mockRejectedValue(new Error("Database error"));

      const result = await getReviewVoteCounts("review-123");

      expect(result.upvotes).toBe(0);
      expect(result.downvotes).toBe(0);
      expect(result.score).toBe(0);
      expect(result.userVote).toBeNull();
    });
  });

  describe("getCommentVoteCounts", () => {
    it("should calculate comment vote counts correctly", async () => {
      mockCommentVoteFindMany.mockResolvedValue([
        { type: "UP", userId: "user-1" },
        { type: "UP", userId: "user-2" },
        { type: "DOWN", userId: "user-3" },
      ]);

      const result = await getCommentVoteCounts("comment-123");

      expect(result.upvotes).toBe(2);
      expect(result.downvotes).toBe(1);
      expect(result.score).toBe(1);
    });

    it("should return user vote for comments", async () => {
      mockCommentVoteFindMany.mockResolvedValue([
        { type: "DOWN", userId: "current-user" },
      ]);

      const result = await getCommentVoteCounts("comment-123", "current-user");

      expect(result.userVote).toBe("DOWN");
    });
  });

  describe("getReviewVoteCountsBatch", () => {
    it("should return vote counts for multiple reviews", async () => {
      mockVoteFindMany.mockResolvedValue([
        { reviewId: "review-1", type: "UP", userId: "user-1" },
        { reviewId: "review-1", type: "UP", userId: "user-2" },
        { reviewId: "review-2", type: "DOWN", userId: "user-3" },
        { reviewId: "review-3", type: "UP", userId: "user-4" },
        { reviewId: "review-3", type: "DOWN", userId: "user-5" },
      ]);

      const result = await getReviewVoteCountsBatch([
        "review-1",
        "review-2",
        "review-3",
      ]);

      expect(result["review-1"].upvotes).toBe(2);
      expect(result["review-1"].downvotes).toBe(0);
      expect(result["review-1"].score).toBe(2);

      expect(result["review-2"].upvotes).toBe(0);
      expect(result["review-2"].downvotes).toBe(1);
      expect(result["review-2"].score).toBe(-1);

      expect(result["review-3"].upvotes).toBe(1);
      expect(result["review-3"].downvotes).toBe(1);
      expect(result["review-3"].score).toBe(0);
    });

    it("should include user votes in batch results", async () => {
      mockVoteFindMany.mockResolvedValue([
        { reviewId: "review-1", type: "UP", userId: "current-user" },
        { reviewId: "review-2", type: "DOWN", userId: "current-user" },
        { reviewId: "review-3", type: "UP", userId: "other-user" },
      ]);

      const result = await getReviewVoteCountsBatch(
        ["review-1", "review-2", "review-3"],
        "current-user",
      );

      expect(result["review-1"].userVote).toBe("UP");
      expect(result["review-2"].userVote).toBe("DOWN");
      expect(result["review-3"].userVote).toBeNull();
    });

    it("should return empty object on error", async () => {
      mockVoteFindMany.mockRejectedValue(new Error("Database error"));

      const result = await getReviewVoteCountsBatch(["review-1", "review-2"]);

      expect(result).toEqual({});
    });

    it("should initialize reviews with zero counts even if no votes exist", async () => {
      mockVoteFindMany.mockResolvedValue([]);

      const result = await getReviewVoteCountsBatch(["review-1", "review-2"]);

      expect(result["review-1"]).toEqual({
        upvotes: 0,
        downvotes: 0,
        score: 0,
        userVote: null,
      });
      expect(result["review-2"]).toEqual({
        upvotes: 0,
        downvotes: 0,
        score: 0,
        userVote: null,
      });
    });
  });
});
