"use server";

import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import { revalidatePath } from "next/cache";
import { createNotification } from "../../notifications/notification-service";

const prisma = getPrismaClient();

export interface CommentInput {
  reviewId: string;
  content: string;
  replyToId?: string; // For nested comments
}

export interface CommentResult {
  success: boolean;
  data?: any;
  error?: string;
}

export interface CommentWithReplies {
  id: string;
  content: any;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  author: {
    id: string;
    firstName: string | null;
    lastName: string | null;
    username: string | null;
  };
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: "UP" | "DOWN" | null;
  replies: CommentWithReplies[];
  replyCount: number;
}

/**
 * Create a new comment on a review
 */
export async function createComment(
  input: CommentInput,
): Promise<CommentResult> {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return {
        success: false,
        error: "You must be logged in to comment",
      };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Verify the review exists
    const review = await prisma.review.findUnique({
      where: { id: input.reviewId },
      select: { id: true, accountId: true, platform: true },
    });

    if (!review) {
      return {
        success: false,
        error: "Review not found",
      };
    }

    // If replying to a comment, verify it exists
    if (input.replyToId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: input.replyToId },
        select: { id: true, reviewId: true },
      });

      if (!parentComment) {
        return {
          success: false,
          error: "Parent comment not found",
        };
      }

      // Ensure the parent comment belongs to the same review
      if (parentComment.reviewId !== input.reviewId) {
        return {
          success: false,
          error: "Comment does not belong to this review",
        };
      }
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        content: { text: input.content },
        authorId: user.id,
        reviewId: input.reviewId,
        replyToId: input.replyToId || null,
        status: "PUBLISHED",
      },
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
      },
    });

    // Revalidate the page
    const account = await prisma.account.findUnique({
      where: { id: review.accountId },
      select: { accountId: true },
    });

    if (account) {
      revalidatePath(
        `/profile/${review.platform.toLowerCase()}/${account.accountId}`,
      );
    }

    // Send notification to parent comment author (fire-and-forget)
    if (input.replyToId) {
      const parentComment = await prisma.comment.findUnique({
        where: { id: input.replyToId },
        select: { authorId: true },
      });

      if (parentComment && parentComment.authorId !== user.id) {
        createNotification({
          userId: parentComment.authorId,
          type: "COMMENT_REPLY",
          title: "New reply to your comment",
          message:
            input.content.length > 100
              ? input.content.substring(0, 100) + "..."
              : input.content,
          metadata: {
            commentId: comment.id,
            reviewId: input.reviewId,
            platform: review.platform,
            accountId: account?.accountId || "",
          },
        }).catch((err) =>
          console.error("Failed to create comment reply notification:", err),
        );
      }
    }

    return {
      success: true,
      data: {
        ...comment,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        userVote: null,
        replies: [],
        replyCount: 0,
      },
    };
  } catch (error) {
    console.error("Error creating comment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to create comment",
    };
  }
}

export type CommentSortBy = "new" | "top" | "controversial";

/**
 * Get nested replies for a single comment (for "continue thread" deep-link)
 */
export async function getNestedReplies(
  commentId: string,
  options: { page?: number; limit?: number } = {},
): Promise<{
  success: boolean;
  comment?: CommentWithReplies;
  error?: string;
}> {
  const { page = 1, limit = 20 } = options;

  try {
    const { userId: clerkUserId } = await auth();
    let currentUserId: string | null = null;

    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
      currentUserId = user?.id || null;
    }

    const comment = await prisma.comment.findUnique({
      where: { id: commentId, isDeleted: false, status: "PUBLISHED" },
      include: {
        author: {
          select: { id: true, firstName: true, lastName: true, username: true },
        },
        votes: { select: { type: true, userId: true } },
        replies: {
          where: { isDeleted: false, status: "PUBLISHED" },
          skip: (page - 1) * limit,
          take: limit,
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
            votes: { select: { type: true, userId: true } },
            replies: {
              where: { isDeleted: false, status: "PUBLISHED" },
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
                votes: { select: { type: true, userId: true } },
                _count: { select: { replies: true } },
              },
              orderBy: { createdAt: "asc" },
            },
            _count: { select: { replies: true } },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: { select: { replies: true } },
      },
    });

    if (!comment) {
      return { success: false, error: "Comment not found" };
    }

    const transformComment = (c: any): CommentWithReplies => {
      const upvotes = c.votes.filter((v: any) => v.type === "UP").length;
      const downvotes = c.votes.filter((v: any) => v.type === "DOWN").length;
      const userVote = currentUserId
        ? c.votes.find((v: any) => v.userId === currentUserId)?.type || null
        : null;

      return {
        id: c.id,
        content: c.content,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        isEdited: c.isEdited,
        author: c.author,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote,
        replies: c.replies?.map(transformComment) || [],
        replyCount: c._count?.replies || 0,
      };
    };

    return { success: true, comment: transformComment(comment) };
  } catch (error) {
    console.error("Error getting nested replies:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to get nested replies",
    };
  }
}

/**
 * Get comments for a review with nested replies
 */
export async function getCommentsForReview(
  reviewId: string,
  options: { page?: number; limit?: number; sortBy?: CommentSortBy } = {},
): Promise<{
  success: boolean;
  comments?: CommentWithReplies[];
  total?: number;
  page?: number;
  totalPages?: number;
  error?: string;
}> {
  const { page = 1, limit = 20, sortBy = "new" } = options;

  try {
    const { userId: clerkUserId } = await auth();
    let currentUserId: string | null = null;

    if (clerkUserId) {
      const user = await prisma.user.findUnique({
        where: { clerkId: clerkUserId },
        select: { id: true },
      });
      currentUserId = user?.id || null;
    }

    // Get top-level comments (no replyToId)
    const whereConditions = {
      reviewId,
      replyToId: null, // Only top-level comments
      isDeleted: false,
      status: "PUBLISHED" as const,
    };

    const total = await prisma.comment.count({
      where: whereConditions,
    });

    const comments = await prisma.comment.findMany({
      where: whereConditions,
      include: {
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            username: true,
          },
        },
        votes: {
          select: {
            type: true,
            userId: true,
          },
        },
        replies: {
          where: {
            isDeleted: false,
            status: "PUBLISHED",
          },
          include: {
            author: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                username: true,
              },
            },
            votes: {
              select: {
                type: true,
                userId: true,
              },
            },
            replies: {
              where: {
                isDeleted: false,
                status: "PUBLISHED",
              },
              include: {
                author: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    username: true,
                  },
                },
                votes: {
                  select: {
                    type: true,
                    userId: true,
                  },
                },
                _count: {
                  select: { replies: true },
                },
              },
              orderBy: { createdAt: "asc" },
            },
            _count: {
              select: { replies: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: { replies: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Transform comments to include vote counts and user's vote
    const transformComment = (comment: any): CommentWithReplies => {
      const upvotes = comment.votes.filter((v: any) => v.type === "UP").length;
      const downvotes = comment.votes.filter(
        (v: any) => v.type === "DOWN",
      ).length;
      const userVote = currentUserId
        ? comment.votes.find((v: any) => v.userId === currentUserId)?.type ||
          null
        : null;

      return {
        id: comment.id,
        content: comment.content,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        isEdited: comment.isEdited,
        author: comment.author,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        userVote,
        replies: comment.replies?.map(transformComment) || [],
        replyCount: comment._count?.replies || 0,
      };
    };

    let transformedComments = comments.map(transformComment);

    // Apply sort
    if (sortBy === "top") {
      transformedComments.sort((a, b) => b.score - a.score);
    } else if (sortBy === "controversial") {
      // Controversial: most total votes with close up/down ratio
      transformedComments.sort((a, b) => {
        const totalA = a.upvotes + a.downvotes;
        const totalB = b.upvotes + b.downvotes;
        if (totalA === 0 && totalB === 0) return 0;
        if (totalA === 0) return 1;
        if (totalB === 0) return -1;
        const ratioA =
          totalA > 0 ? Math.abs(a.upvotes - a.downvotes) / totalA : 1;
        const ratioB =
          totalB > 0 ? Math.abs(b.upvotes - b.downvotes) / totalB : 1;
        // Lower ratio = more controversial, tie-break by total votes
        if (ratioA !== ratioB) return ratioA - ratioB;
        return totalB - totalA;
      });
    }
    // sortBy === "new" uses default createdAt DESC from the query

    return {
      success: true,
      comments: transformedComments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  } catch (error) {
    console.error("Error getting comments:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to get comments",
    };
  }
}

/**
 * Edit a comment
 */
export async function editComment(
  commentId: string,
  content: string,
): Promise<CommentResult> {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return {
        success: false,
        error: "You must be logged in to edit a comment",
      };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
        content: true,
        editHistory: true,
      },
    });

    if (!comment) {
      return {
        success: false,
        error: "Comment not found",
      };
    }

    // Verify ownership
    if (comment.authorId !== user.id) {
      return {
        success: false,
        error: "You can only edit your own comments",
      };
    }

    // Update the comment with edit history
    const editHistory = Array.isArray(comment.editHistory)
      ? [
          ...comment.editHistory,
          { content: comment.content, editedAt: new Date() },
        ]
      : [{ content: comment.content, editedAt: new Date() }];

    const updatedComment = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: { text: content },
        isEdited: true,
        editHistory,
      },
    });

    return {
      success: true,
      data: updatedComment,
    };
  } catch (error) {
    console.error("Error editing comment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to edit comment",
    };
  }
}

/**
 * Delete a comment (soft delete)
 */
export async function deleteComment(commentId: string): Promise<CommentResult> {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return {
        success: false,
        error: "You must be logged in to delete a comment",
      };
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get the comment
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        id: true,
        authorId: true,
      },
    });

    if (!comment) {
      return {
        success: false,
        error: "Comment not found",
      };
    }

    // Verify ownership
    if (comment.authorId !== user.id) {
      return {
        success: false,
        error: "You can only delete your own comments",
      };
    }

    // Soft delete the comment
    await prisma.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        status: "DELETED",
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting comment:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete comment",
    };
  }
}

/**
 * Get comment count for a review
 */
export async function getCommentCount(reviewId: string): Promise<number> {
  try {
    const count = await prisma.comment.count({
      where: {
        reviewId,
        isDeleted: false,
        status: "PUBLISHED",
      },
    });
    return count;
  } catch (error) {
    console.error("Error getting comment count:", error);
    return 0;
  }
}
