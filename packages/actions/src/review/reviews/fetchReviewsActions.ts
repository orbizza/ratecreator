"use server";

import { auth } from "@clerk/nextjs/server";
import { ReviewType, ReviewValidator } from "@ratecreator/types/review";
import { Platform } from "@ratecreator/types/review";
import { getPrismaClient } from "@ratecreator/db/client";

const prisma = getPrismaClient();

export async function fetchReviewsAction(
  accountId: string,
  platform: Platform,
  currentPage: number,
  reviewsPerPage: number,
) {
  const pageSize = reviewsPerPage;
  const offset = currentPage * pageSize;
  const account = await prisma.account.findUnique({
    where: {
      platform_accountId: {
        platform,
        accountId,
      },
    },
    select: { id: true },
  });

  const reviews = await prisma.review.findMany({
    where: { accountId: account?.id, status: "PUBLISHED" },
    skip: offset,
    take: pageSize,
  });

  console.log("reviews", reviews);

  return reviews.map((review) => ({
    _id: review.id,
    stars: review.stars,
    platform: review.platform,
    accountId: review.accountId,
    content: review.content,
    title: review.title,
    contentUrl: review.contentUrl,
    authorId: review.authorId,
    status: review.status,
    verificationStatus: review.verificationStatus,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    isEdited: review.isEdited,
    editHistory: review.editHistory,
    reportCount: review.reportCount,
    lastActivityAt: review.lastActivityAt,
    viewCount: review.viewCount,
  })) as ReviewType[];
}

export async function fetchTotalReviewsAction(
  accountId: string,
  platform: Platform,
) {
  const account = await prisma.account.findUnique({
    where: {
      platform_accountId: {
        platform,
        accountId,
      },
    },
    select: { id: true },
  });

  const totalReviews = await prisma.review.count({
    where: { accountId: account?.id, status: "PUBLISHED" },
  });

  return totalReviews;
}
