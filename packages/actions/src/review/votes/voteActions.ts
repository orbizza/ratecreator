"use server";

import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import { revalidatePath } from "next/cache";

const prisma = getPrismaClient();

export type VoteType = "UP" | "DOWN";

export interface VoteResult {
  success: boolean;
  upvotes?: number;
  downvotes?: number;
  score?: number;
  userVote?: VoteType | null;
  error?: string;
}

/**
 * Vote on a review (upvote or downvote)
 * If the user already voted the same way, remove the vote
 * If the user already voted the opposite way, change the vote
 */
export async function voteOnReview(
  reviewId: string,
  voteType: VoteType,
): Promise<VoteResult> {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return {
        success: false,
        error: "You must be logged in to vote",
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

    // Check if review exists
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, accountId: true, platform: true },
    });

    if (!review) {
      return {
        success: false,
        error: "Review not found",
      };
    }

    // Check for existing vote
    const existingVote = await prisma.vote.findUnique({
      where: {
        userId_reviewId: {
          userId: user.id,
          reviewId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Same vote type - remove the vote (toggle off)
        await prisma.vote.delete({
          where: { id: existingVote.id },
        });
      } else {
        // Different vote type - update the vote
        await prisma.vote.update({
          where: { id: existingVote.id },
          data: { type: voteType },
        });
      }
    } else {
      // No existing vote - create a new one
      await prisma.vote.create({
        data: {
          userId: user.id,
          reviewId,
          type: voteType,
        },
      });
    }

    // Get updated vote counts
    const voteCounts = await getReviewVoteCounts(reviewId, user.id);

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

    return {
      success: true,
      ...voteCounts,
    };
  } catch (error) {
    console.error("Error voting on review:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to vote",
    };
  }
}

/**
 * Vote on a comment (upvote or downvote)
 * If the user already voted the same way, remove the vote
 * If the user already voted the opposite way, change the vote
 */
export async function voteOnComment(
  commentId: string,
  voteType: VoteType,
): Promise<VoteResult> {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return {
        success: false,
        error: "You must be logged in to vote",
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

    // Check if comment exists
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { id: true, reviewId: true },
    });

    if (!comment) {
      return {
        success: false,
        error: "Comment not found",
      };
    }

    // Check for existing vote
    const existingVote = await prisma.commentVote.findUnique({
      where: {
        userId_commentId: {
          userId: user.id,
          commentId,
        },
      },
    });

    if (existingVote) {
      if (existingVote.type === voteType) {
        // Same vote type - remove the vote (toggle off)
        await prisma.commentVote.delete({
          where: { id: existingVote.id },
        });
      } else {
        // Different vote type - update the vote
        await prisma.commentVote.update({
          where: { id: existingVote.id },
          data: { type: voteType },
        });
      }
    } else {
      // No existing vote - create a new one
      await prisma.commentVote.create({
        data: {
          userId: user.id,
          commentId,
          type: voteType,
        },
      });
    }

    // Get updated vote counts
    const voteCounts = await getCommentVoteCounts(commentId, user.id);

    return {
      success: true,
      ...voteCounts,
    };
  } catch (error) {
    console.error("Error voting on comment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to vote",
    };
  }
}

/**
 * Get vote counts for a review
 */
export async function getReviewVoteCounts(
  reviewId: string,
  userId?: string | null,
): Promise<{
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteType | null;
}> {
  try {
    const votes = await prisma.vote.findMany({
      where: { reviewId },
      select: {
        type: true,
        userId: true,
      },
    });

    const upvotes = votes.filter((v) => v.type === "UP").length;
    const downvotes = votes.filter((v) => v.type === "DOWN").length;
    const userVote = userId
      ? (votes.find((v) => v.userId === userId)?.type as
          | VoteType
          | undefined) || null
      : null;

    return {
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      userVote,
    };
  } catch (error) {
    console.error("Error getting review vote counts:", error);
    return {
      upvotes: 0,
      downvotes: 0,
      score: 0,
      userVote: null,
    };
  }
}

/**
 * Get vote counts for a comment
 */
export async function getCommentVoteCounts(
  commentId: string,
  userId?: string | null,
): Promise<{
  upvotes: number;
  downvotes: number;
  score: number;
  userVote: VoteType | null;
}> {
  try {
    const votes = await prisma.commentVote.findMany({
      where: { commentId },
      select: {
        type: true,
        userId: true,
      },
    });

    const upvotes = votes.filter((v) => v.type === "UP").length;
    const downvotes = votes.filter((v) => v.type === "DOWN").length;
    const userVote = userId
      ? (votes.find((v) => v.userId === userId)?.type as
          | VoteType
          | undefined) || null
      : null;

    return {
      upvotes,
      downvotes,
      score: upvotes - downvotes,
      userVote,
    };
  } catch (error) {
    console.error("Error getting comment vote counts:", error);
    return {
      upvotes: 0,
      downvotes: 0,
      score: 0,
      userVote: null,
    };
  }
}

/**
 * Get vote counts for multiple reviews at once (batch)
 */
export async function getReviewVoteCountsBatch(
  reviewIds: string[],
  userId?: string | null,
): Promise<
  Record<
    string,
    {
      upvotes: number;
      downvotes: number;
      score: number;
      userVote: VoteType | null;
    }
  >
> {
  try {
    const votes = await prisma.vote.findMany({
      where: { reviewId: { in: reviewIds } },
      select: {
        reviewId: true,
        type: true,
        userId: true,
      },
    });

    const result: Record<
      string,
      {
        upvotes: number;
        downvotes: number;
        score: number;
        userVote: VoteType | null;
      }
    > = {};

    // Initialize all reviews with zero counts
    for (const reviewId of reviewIds) {
      result[reviewId] = {
        upvotes: 0,
        downvotes: 0,
        score: 0,
        userVote: null,
      };
    }

    // Count votes for each review
    for (const vote of votes) {
      if (vote.type === "UP") {
        result[vote.reviewId].upvotes++;
      } else {
        result[vote.reviewId].downvotes++;
      }

      // Check if this is the current user's vote
      if (userId && vote.userId === userId) {
        result[vote.reviewId].userVote = vote.type as VoteType;
      }
    }

    // Calculate scores
    for (const reviewId of reviewIds) {
      result[reviewId].score =
        result[reviewId].upvotes - result[reviewId].downvotes;
    }

    return result;
  } catch (error) {
    console.error("Error getting batch review vote counts:", error);
    return {};
  }
}
