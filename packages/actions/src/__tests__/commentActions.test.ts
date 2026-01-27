/**
 * Tests for comment actions
 * Tests comment creation, editing, deletion, and retrieval
 */

import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";

// Use vi.hoisted to declare mocks that will be used inside vi.mock
const {
  mockUserFindUnique,
  mockReviewFindUnique,
  mockAccountFindUnique,
  mockCommentFindUnique,
  mockCommentFindMany,
  mockCommentCreate,
  mockCommentUpdate,
  mockCommentCount,
  mockPrismaInstance,
} = vi.hoisted(() => {
  const mockUserFindUnique = vi.fn();
  const mockReviewFindUnique = vi.fn();
  const mockAccountFindUnique = vi.fn();
  const mockCommentFindUnique = vi.fn();
  const mockCommentFindMany = vi.fn();
  const mockCommentCreate = vi.fn();
  const mockCommentUpdate = vi.fn();
  const mockCommentCount = vi.fn();
  const mockPrismaInstance = {
    user: { findUnique: mockUserFindUnique },
    review: { findUnique: mockReviewFindUnique },
    account: { findUnique: mockAccountFindUnique },
    comment: {
      findUnique: mockCommentFindUnique,
      findMany: mockCommentFindMany,
      create: mockCommentCreate,
      update: mockCommentUpdate,
      count: mockCommentCount,
    },
  };
  return {
    mockUserFindUnique,
    mockReviewFindUnique,
    mockAccountFindUnique,
    mockCommentFindUnique,
    mockCommentFindMany,
    mockCommentCreate,
    mockCommentUpdate,
    mockCommentCount,
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
  createComment,
  getCommentsForReview,
  editComment,
  deleteComment,
  getCommentCount,
} from "../review/comments/commentActions";
import { auth } from "@clerk/nextjs/server";

describe("Comment Actions", () => {
  let mockAuth: Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuth = auth as Mock;
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("createComment", () => {
    describe("Authentication", () => {
      it("should return error when user is not logged in", async () => {
        mockAuth.mockResolvedValue({ userId: null });

        const result = await createComment({
          reviewId: "review-123",
          content: "Test comment",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("You must be logged in to comment");
      });

      it("should return error when user is not found in database", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue(null);

        const result = await createComment({
          reviewId: "review-123",
          content: "Test comment",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("User not found");
      });
    });

    describe("Review Validation", () => {
      it("should return error when review does not exist", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockReviewFindUnique.mockResolvedValue(null);

        const result = await createComment({
          reviewId: "non-existent-review",
          content: "Test comment",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Review not found");
      });
    });

    describe("Reply Validation", () => {
      it("should return error when parent comment does not exist", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockReviewFindUnique.mockResolvedValue({
          id: "review-123",
          accountId: "account-id",
          platform: "YOUTUBE",
        });
        mockCommentFindUnique.mockResolvedValue(null);

        const result = await createComment({
          reviewId: "review-123",
          content: "Reply to comment",
          replyToId: "non-existent-comment",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Parent comment not found");
      });

      it("should return error when parent comment belongs to different review", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockReviewFindUnique.mockResolvedValue({
          id: "review-123",
          accountId: "account-id",
          platform: "YOUTUBE",
        });
        mockCommentFindUnique.mockResolvedValue({
          id: "parent-comment-id",
          reviewId: "different-review-id",
        });

        const result = await createComment({
          reviewId: "review-123",
          content: "Reply to comment",
          replyToId: "parent-comment-id",
        });

        expect(result.success).toBe(false);
        expect(result.error).toBe("Comment does not belong to this review");
      });
    });

    describe("Successful Comment Creation", () => {
      const mockUser = { id: "user-id" };
      const mockReview = {
        id: "review-123",
        accountId: "account-id",
        platform: "YOUTUBE",
      };
      const mockCreatedComment = {
        id: "comment-id",
        content: { text: "Test comment" },
        authorId: "user-id",
        reviewId: "review-123",
        createdAt: new Date(),
        updatedAt: new Date(),
        isEdited: false,
        author: {
          id: "user-id",
          firstName: "John",
          lastName: "Doe",
          username: "johndoe",
        },
      };

      beforeEach(() => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue(mockUser);
        mockReviewFindUnique.mockResolvedValue(mockReview);
        mockCommentCreate.mockResolvedValue(mockCreatedComment);
        mockAccountFindUnique.mockResolvedValue({
          accountId: "youtube-channel-id",
        });
      });

      it("should create comment successfully", async () => {
        const result = await createComment({
          reviewId: "review-123",
          content: "Test comment",
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.id).toBe("comment-id");
      });

      it("should include default vote counts in response", async () => {
        const result = await createComment({
          reviewId: "review-123",
          content: "Test comment",
        });

        expect(result.data.upvotes).toBe(0);
        expect(result.data.downvotes).toBe(0);
        expect(result.data.score).toBe(0);
        expect(result.data.userVote).toBeNull();
        expect(result.data.replies).toEqual([]);
        expect(result.data.replyCount).toBe(0);
      });

      it("should create reply to existing comment", async () => {
        mockCommentFindUnique.mockResolvedValue({
          id: "parent-comment-id",
          reviewId: "review-123",
        });

        const result = await createComment({
          reviewId: "review-123",
          content: "Reply comment",
          replyToId: "parent-comment-id",
        });

        expect(result.success).toBe(true);
        expect(mockCommentCreate).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              replyToId: "parent-comment-id",
            }),
          }),
        );
      });
    });
  });

  describe("getCommentsForReview", () => {
    beforeEach(() => {
      mockAuth.mockResolvedValue({ userId: null });
    });

    it("should return comments with pagination", async () => {
      mockCommentCount.mockResolvedValue(25);
      mockCommentFindMany.mockResolvedValue([
        {
          id: "comment-1",
          content: { text: "Comment 1" },
          createdAt: new Date(),
          updatedAt: new Date(),
          isEdited: false,
          author: {
            id: "author-1",
            firstName: "John",
            lastName: "Doe",
            username: "johndoe",
          },
          votes: [],
          replies: [],
          _count: { replies: 0 },
        },
        {
          id: "comment-2",
          content: { text: "Comment 2" },
          createdAt: new Date(),
          updatedAt: new Date(),
          isEdited: false,
          author: {
            id: "author-2",
            firstName: "Jane",
            lastName: "Smith",
            username: "janesmith",
          },
          votes: [],
          replies: [],
          _count: { replies: 0 },
        },
      ]);

      const result = await getCommentsForReview("review-123", {
        page: 1,
        limit: 20,
      });

      expect(result.success).toBe(true);
      expect(result.comments).toHaveLength(2);
      expect(result.total).toBe(25);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(2);
    });

    it("should calculate vote counts correctly", async () => {
      mockCommentCount.mockResolvedValue(1);
      mockCommentFindMany.mockResolvedValue([
        {
          id: "comment-1",
          content: { text: "Comment with votes" },
          createdAt: new Date(),
          updatedAt: new Date(),
          isEdited: false,
          author: {
            id: "author-1",
            firstName: "John",
            lastName: "Doe",
            username: "johndoe",
          },
          votes: [
            { type: "UP", userId: "user-1" },
            { type: "UP", userId: "user-2" },
            { type: "DOWN", userId: "user-3" },
          ],
          replies: [],
          _count: { replies: 0 },
        },
      ]);

      const result = await getCommentsForReview("review-123");

      expect(result.success).toBe(true);
      expect(result.comments![0].upvotes).toBe(2);
      expect(result.comments![0].downvotes).toBe(1);
      expect(result.comments![0].score).toBe(1);
    });

    it("should include user vote when authenticated", async () => {
      mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
      mockUserFindUnique.mockResolvedValue({ id: "current-user-id" });
      mockCommentCount.mockResolvedValue(1);
      mockCommentFindMany.mockResolvedValue([
        {
          id: "comment-1",
          content: { text: "Comment" },
          createdAt: new Date(),
          updatedAt: new Date(),
          isEdited: false,
          author: {
            id: "author-1",
            firstName: "John",
            lastName: "Doe",
            username: "johndoe",
          },
          votes: [{ type: "UP", userId: "current-user-id" }],
          replies: [],
          _count: { replies: 0 },
        },
      ]);

      const result = await getCommentsForReview("review-123");

      expect(result.success).toBe(true);
      expect(result.comments![0].userVote).toBe("UP");
    });

    it("should transform nested replies correctly", async () => {
      mockCommentCount.mockResolvedValue(1);
      mockCommentFindMany.mockResolvedValue([
        {
          id: "comment-1",
          content: { text: "Parent comment" },
          createdAt: new Date(),
          updatedAt: new Date(),
          isEdited: false,
          author: {
            id: "author-1",
            firstName: "John",
            lastName: "Doe",
            username: "johndoe",
          },
          votes: [],
          replies: [
            {
              id: "reply-1",
              content: { text: "Reply" },
              createdAt: new Date(),
              updatedAt: new Date(),
              isEdited: false,
              author: {
                id: "author-2",
                firstName: "Jane",
                lastName: "Smith",
                username: "janesmith",
              },
              votes: [],
              replies: [],
              _count: { replies: 0 },
            },
          ],
          _count: { replies: 1 },
        },
      ]);

      const result = await getCommentsForReview("review-123");

      expect(result.success).toBe(true);
      expect(result.comments![0].replies).toHaveLength(1);
      expect(result.comments![0].replyCount).toBe(1);
    });
  });

  describe("editComment", () => {
    describe("Authentication", () => {
      it("should return error when user is not logged in", async () => {
        mockAuth.mockResolvedValue({ userId: null });

        const result = await editComment("comment-id", "Updated content");

        expect(result.success).toBe(false);
        expect(result.error).toBe("You must be logged in to edit a comment");
      });

      it("should return error when user is not found in database", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue(null);

        const result = await editComment("comment-id", "Updated content");

        expect(result.success).toBe(false);
        expect(result.error).toBe("User not found");
      });
    });

    describe("Authorization", () => {
      it("should return error when comment does not exist", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockCommentFindUnique.mockResolvedValue(null);

        const result = await editComment(
          "non-existent-comment",
          "Updated content",
        );

        expect(result.success).toBe(false);
        expect(result.error).toBe("Comment not found");
      });

      it("should return error when user is not the comment author", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockCommentFindUnique.mockResolvedValue({
          id: "comment-id",
          authorId: "different-user-id",
          content: { text: "Original" },
          editHistory: [],
        });

        const result = await editComment("comment-id", "Updated content");

        expect(result.success).toBe(false);
        expect(result.error).toBe("You can only edit your own comments");
      });
    });

    describe("Successful Edit", () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockCommentFindUnique.mockResolvedValue({
          id: "comment-id",
          authorId: "user-id",
          content: { text: "Original content" },
          editHistory: [],
        });
        mockCommentUpdate.mockResolvedValue({
          id: "comment-id",
          content: { text: "Updated content" },
          isEdited: true,
        });
      });

      it("should edit comment successfully", async () => {
        const result = await editComment("comment-id", "Updated content");

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
      });

      it("should preserve edit history", async () => {
        await editComment("comment-id", "Updated content");

        expect(mockCommentUpdate).toHaveBeenCalledWith({
          where: { id: "comment-id" },
          data: expect.objectContaining({
            isEdited: true,
            editHistory: expect.arrayContaining([
              expect.objectContaining({
                content: { text: "Original content" },
              }),
            ]),
          }),
        });
      });
    });
  });

  describe("deleteComment", () => {
    describe("Authentication", () => {
      it("should return error when user is not logged in", async () => {
        mockAuth.mockResolvedValue({ userId: null });

        const result = await deleteComment("comment-id");

        expect(result.success).toBe(false);
        expect(result.error).toBe("You must be logged in to delete a comment");
      });
    });

    describe("Authorization", () => {
      it("should return error when user is not the comment author", async () => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockCommentFindUnique.mockResolvedValue({
          id: "comment-id",
          authorId: "different-user-id",
        });

        const result = await deleteComment("comment-id");

        expect(result.success).toBe(false);
        expect(result.error).toBe("You can only delete your own comments");
      });
    });

    describe("Soft Delete", () => {
      beforeEach(() => {
        mockAuth.mockResolvedValue({ userId: "clerk-user-123" });
        mockUserFindUnique.mockResolvedValue({ id: "user-id" });
        mockCommentFindUnique.mockResolvedValue({
          id: "comment-id",
          authorId: "user-id",
        });
        mockCommentUpdate.mockResolvedValue({});
      });

      it("should soft delete comment", async () => {
        const result = await deleteComment("comment-id");

        expect(result.success).toBe(true);
        expect(mockCommentUpdate).toHaveBeenCalledWith({
          where: { id: "comment-id" },
          data: {
            isDeleted: true,
            status: "DELETED",
          },
        });
      });
    });
  });

  describe("getCommentCount", () => {
    it("should return comment count for review", async () => {
      mockCommentCount.mockResolvedValue(42);

      const count = await getCommentCount("review-123");

      expect(count).toBe(42);
      expect(mockCommentCount).toHaveBeenCalledWith({
        where: {
          reviewId: "review-123",
          isDeleted: false,
          status: "PUBLISHED",
        },
      });
    });

    it("should return 0 on error", async () => {
      mockCommentCount.mockRejectedValue(new Error("Database error"));

      const count = await getCommentCount("review-123");

      expect(count).toBe(0);
    });
  });
});
