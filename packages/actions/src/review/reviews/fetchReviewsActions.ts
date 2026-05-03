"use server";

import { auth } from "@clerk/nextjs/server";
import { ReviewType, ReviewValidator } from "@ratecreator/types/review";
import { Platform } from "@ratecreator/types/review";
import { getPrismaClient } from "@ratecreator/db/client";

const prisma = getPrismaClient();

const MAX_PAGE_SIZE = 50;

function clampPage(currentPage: number, reviewsPerPage: number) {
  const pageSize = Math.max(
    1,
    Math.min(
      MAX_PAGE_SIZE,
      Number.isFinite(reviewsPerPage) ? reviewsPerPage : 10,
    ),
  );
  const page = Math.max(
    0,
    Math.min(10000, Number.isFinite(currentPage) ? currentPage : 0),
  );
  return { pageSize, offset: page * pageSize };
}

function extractImageUrl(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const v = (payload as Record<string, unknown>).image_url;
  return typeof v === "string" ? v : "";
}

export async function fetchReviewsAction(
  accountId: string,
  platform: Platform,
  currentPage: number,
  reviewsPerPage: number,
) {
  const { pageSize, offset } = clampPage(currentPage, reviewsPerPage);

  const { userId } = await auth();

  const user = await prisma.user.findUnique({
    where: {
      clerkId: userId || "",
    },
    select: { id: true },
  });

  const account = await prisma.account.findUnique({
    where: {
      platform_accountId: {
        platform,
        accountId,
      },
    },
    select: { id: true, isSuspended: true, isDeleted: true },
  });

  if (!account || account.isDeleted) {
    return [] as ReviewType[];
  }

  const reviews = await prisma.review.findMany({
    where: {
      accountId: account?.id,
      status: "PUBLISHED",
      ...(user?.id && {
        NOT: {
          authorId: user.id,
        },
      }),
    },
    skip: offset,
    take: pageSize,
    include: {
      author: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          username: true,
          webhookPayload: true,
        },
      },
    },
  });

  return reviews.map((review) => ({
    _id: review.id,
    stars: review.stars,
    platform: review.platform,
    accountId: review.accountId,
    content: review.content,
    title: review.title,
    contentUrl: review.contentUrl,
    authorId: review.authorId,
    author: review.author
      ? {
          id: review.author.id,
          firstName: review.author.firstName || "",
          lastName: review.author.lastName || "",
          username: review.author.username || "",
          imageUrl: extractImageUrl(review.author.webhookPayload),
        }
      : undefined,
    status: review.status,
    verificationStatus: review.verificationStatus,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
    isEdited: review.isEdited,
    editHistory: review.editHistory,
    lastActivityAt: review.lastActivityAt,
    viewCount: review.viewCount,
  })) as ReviewType[];
}

export async function fetchSelfReviewsAction(
  accountId: string,
  platform: Platform,
) {
  const { userId } = await auth();

  const user = await prisma.user.findUnique({
    where: {
      clerkId: userId || "",
    },
    select: { id: true },
  });

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
    where: {
      accountId: account?.id,
      status: "PUBLISHED",
      authorId: user?.id,
    },
  });

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
