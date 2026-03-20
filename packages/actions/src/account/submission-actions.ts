"use server";

import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  publishMessageWithKey,
  PUBSUB_TOPICS,
} from "@ratecreator/db/pubsub-client";
import { revalidatePath } from "next/cache";

const prisma = getPrismaClient();

type PlatformInput =
  | "youtube"
  | "twitter"
  | "instagram"
  | "reddit"
  | "tiktok"
  | "twitch";

const MONTHLY_SUBMISSION_LIMIT = 5;

function toPrismaEnum(
  platform: PlatformInput,
): "YOUTUBE" | "TWITTER" | "INSTAGRAM" | "REDDIT" | "TIKTOK" | "TWITCH" {
  return platform.toUpperCase() as ReturnType<typeof toPrismaEnum>;
}

function parseIdentifier(platform: PlatformInput, identifier: string): string {
  let handle = identifier.trim();

  const urlPatterns: Record<PlatformInput, RegExp[]> = {
    youtube: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|c\/|user\/|@)([^\/\?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/([^\/\?]+)/,
    ],
    twitter: [
      /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(@?[^\/\?]+)/,
    ],
    instagram: [/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(@?[^\/\?]+)/],
    reddit: [/(?:https?:\/\/)?(?:www\.)?reddit\.com\/(?:user|u)\/([^\/\?]+)/],
    tiktok: [/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([^\/\?]+)/],
    twitch: [/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([^\/\?]+)/],
  };

  for (const pattern of urlPatterns[platform]) {
    const match = handle.match(pattern);
    if (match?.[1]) {
      handle = match[1];
      break;
    }
  }

  return handle.replace(/^@/, "").replace(/^u\//, "");
}

async function getDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) throw new Error("User not found");
  return user;
}

export async function getMonthlySubmissionCount(): Promise<number> {
  const user = await getDbUser();
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  return prisma.accountSubmission.count({
    where: {
      userId: user.id,
      createdAt: { gte: startOfMonth },
    },
  });
}

export async function submitAccount(
  platform: PlatformInput,
  identifier: string,
): Promise<{
  success: boolean;
  submissionId?: string;
  previewData?: Record<string, unknown>;
  error?: string;
}> {
  try {
    const user = await getDbUser();
    const platformEnum = toPrismaEnum(platform);
    const handle = parseIdentifier(platform, identifier);

    if (!handle) {
      return { success: false, error: "Invalid URL or handle" };
    }

    // Check monthly limit
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const monthlyCount = await prisma.accountSubmission.count({
      where: {
        userId: user.id,
        createdAt: { gte: startOfMonth },
      },
    });

    if (monthlyCount >= MONTHLY_SUBMISSION_LIMIT) {
      return {
        success: false,
        error: `Monthly limit of ${MONTHLY_SUBMISSION_LIMIT} submissions reached. Try again next month.`,
      };
    }

    // Check for existing account (duplicate)
    const existingAccount = await prisma.account.findFirst({
      where: {
        platform: platformEnum,
        OR: [{ accountId: handle }, { handle }],
      },
      select: { id: true, name: true, accountId: true },
    });

    if (existingAccount) {
      return {
        success: false,
        error: `This creator already exists on Rate Creator.`,
      };
    }

    // Check for pending submission
    const pendingSubmission = await prisma.accountSubmission.findFirst({
      where: {
        platform: platformEnum,
        identifier: handle,
        status: { in: ["PENDING", "VALIDATING", "PROCESSING"] },
      },
    });

    if (pendingSubmission) {
      return {
        success: false,
        error:
          "This creator has already been submitted and is being processed.",
      };
    }

    // Create submission
    const submission = await prisma.accountSubmission.create({
      data: {
        userId: user.id,
        platform: platformEnum,
        identifier: handle,
        status: "PENDING",
      },
    });

    return {
      success: true,
      submissionId: submission.id,
    };
  } catch (error) {
    console.error("Error submitting account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to submit creator",
    };
  }
}

export async function confirmSubmission(submissionId: string): Promise<{
  success: boolean;
  accountId?: string;
  error?: string;
}> {
  try {
    const user = await getDbUser();

    const submission = await prisma.accountSubmission.findFirst({
      where: { id: submissionId, userId: user.id, status: "PENDING" },
    });

    if (!submission) {
      return {
        success: false,
        error: "Submission not found or already processed",
      };
    }

    // Update to PROCESSING
    await prisma.accountSubmission.update({
      where: { id: submissionId },
      data: { status: "PROCESSING" },
    });

    // Create the account
    const account = await prisma.account.create({
      data: {
        platform: submission.platform,
        accountId: submission.identifier,
        handle: submission.identifier,
        isSeeded: false,
      },
    });

    // Update submission with accountId
    await prisma.accountSubmission.update({
      where: { id: submissionId },
      data: { accountId: account.id },
    });

    // Publish to pipeline for data fetching
    try {
      await Promise.race([
        publishMessageWithKey(PUBSUB_TOPICS.ACCOUNT_ADDED, account.id, {
          accountId: account.id,
          platform: submission.platform,
          identifier: submission.identifier,
          submissionId: submissionId,
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Pub/Sub timeout")), 5000),
        ),
      ]);
    } catch (err) {
      console.warn("Pub/Sub publish failed, account created anyway:", err);
    }

    revalidatePath("/submit-creator/history");
    return { success: true, accountId: account.id };
  } catch (error) {
    console.error("Error confirming submission:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to confirm submission",
    };
  }
}

export async function getUserSubmissions(
  options: { page?: number; limit?: number } = {},
) {
  const user = await getDbUser();
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const [submissions, total] = await Promise.all([
    prisma.accountSubmission.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        platform: true,
        identifier: true,
        status: true,
        previewData: true,
        rejectionReason: true,
        createdAt: true,
      },
    }),
    prisma.accountSubmission.count({ where: { userId: user.id } }),
  ]);

  return {
    submissions,
    total,
    hasMore: skip + submissions.length < total,
  };
}
