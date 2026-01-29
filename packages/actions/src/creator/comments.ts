"use server";

import { getPrismaClient } from "@ratecreator/db/client";
import { auth } from "@clerk/nextjs/server";

interface CommentFilter {
  page?: number;
  limit?: number;
  filter?: "all" | "unanswered" | "answered";
}

interface CommentResult {
  success: boolean;
  comments?: any[];
  total?: number;
  page?: number;
  totalPages?: number;
  error?: string;
}

export async function getCommentsForAccount(
  accountId: string,
  options: CommentFilter = {},
): Promise<CommentResult> {
  const { page = 1, limit = 20, filter = "all" } = options;

  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const prisma = getPrismaClient();

    // Verify user has access to this account
    const user = await prisma.user.findFirst({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Check if user has claimed this account
    const claim = await prisma.claimedAccount.findFirst({
      where: {
        userId: user.id,
        accountId,
        status: "VERIFIED",
      },
    });

    if (!claim) {
      return {
        success: false,
        error: "You don't have access to this account's comments",
      };
    }

    // Build filter conditions
    const whereConditions: any = {
      review: {
        accountId,
        isDeleted: false,
      },
      isDeleted: false,
    };

    // Filter by answered/unanswered
    // A comment is "answered" if it has a reply from the account owner
    if (filter === "unanswered") {
      whereConditions.replies = {
        none: {
          authorId: user.id,
        },
      };
    } else if (filter === "answered") {
      whereConditions.replies = {
        some: {
          authorId: user.id,
        },
      };
    }

    // Get total count
    const total = await prisma.comment.count({
      where: whereConditions,
    });

    // Get comments with pagination
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
        review: {
          select: {
            id: true,
            title: true,
            stars: true,
          },
        },
        replies: {
          where: {
            authorId: user.id,
            isDeleted: false,
          },
          select: {
            id: true,
            content: true,
            createdAt: true,
          },
        },
        votes: {
          select: {
            type: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    // Calculate vote counts
    const commentsWithVotes = comments.map((comment) => {
      const upvotes = comment.votes.filter((v) => v.type === "UP").length;
      const downvotes = comment.votes.filter((v) => v.type === "DOWN").length;

      return {
        ...comment,
        upvotes,
        downvotes,
        score: upvotes - downvotes,
        hasOwnerReply: comment.replies.length > 0,
      };
    });

    return {
      success: true,
      comments: commentsWithVotes,
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

export async function replyToComment(
  commentId: string,
  content: string,
): Promise<{ success: boolean; replyId?: string; error?: string }> {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const prisma = getPrismaClient();

    const user = await prisma.user.findFirst({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return {
        success: false,
        error: "User not found",
      };
    }

    // Get the comment and verify access
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        review: {
          select: {
            id: true,
            accountId: true,
          },
        },
      },
    });

    if (!comment) {
      return {
        success: false,
        error: "Comment not found",
      };
    }

    // Verify user has access to this account
    const claim = await prisma.claimedAccount.findFirst({
      where: {
        userId: user.id,
        accountId: comment.review.accountId,
        status: "VERIFIED",
      },
    });

    if (!claim) {
      return {
        success: false,
        error: "You don't have permission to reply to this comment",
      };
    }

    // Create the reply
    const reply = await prisma.comment.create({
      data: {
        content: { text: content },
        authorId: user.id,
        reviewId: comment.reviewId,
        replyToId: commentId,
        status: "PUBLISHED",
      },
    });

    return {
      success: true,
      replyId: reply.id,
    };
  } catch (error) {
    console.error("Error replying to comment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to reply",
    };
  }
}

export async function markCommentAsRead(
  commentId: string,
): Promise<{ success: boolean; error?: string }> {
  // Placeholder for future implementation
  // This could track which comments the creator has seen
  return {
    success: true,
  };
}
