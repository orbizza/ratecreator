"use server";

import { getPrismaClient } from "@ratecreator/db/client";
import { auth } from "@clerk/nextjs/server";

interface LinkAccountInput {
  accountId: string;
  platform: string;
  nickname?: string;
  isPrimary?: boolean;
}

interface LinkAccountResult {
  success: boolean;
  linkId?: string;
  error?: string;
}

export async function linkAccount(
  input: LinkAccountInput,
): Promise<LinkAccountResult> {
  const { accountId, platform, nickname, isPrimary } = input;

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

    // Check if account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return {
        success: false,
        error: "Account not found",
      };
    }

    // If setting as primary, unset other primary accounts for this platform
    if (isPrimary) {
      await prisma.userLinkedAccount.updateMany({
        where: {
          userId: user.id,
          platform,
          isPrimary: true,
        },
        data: {
          isPrimary: false,
        },
      });
    }

    // Create or update linked account
    const linkedAccount = await prisma.userLinkedAccount.upsert({
      where: {
        userId_accountId: {
          userId: user.id,
          accountId,
        },
      },
      create: {
        userId: user.id,
        accountId,
        platform,
        nickname,
        isPrimary: isPrimary ?? false,
      },
      update: {
        nickname,
        isPrimary: isPrimary ?? undefined,
      },
    });

    return {
      success: true,
      linkId: linkedAccount.id,
    };
  } catch (error) {
    console.error("Error linking account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to link account",
    };
  }
}

export async function unlinkAccount(
  accountId: string,
): Promise<LinkAccountResult> {
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

    await prisma.userLinkedAccount.delete({
      where: {
        userId_accountId: {
          userId: user.id,
          accountId,
        },
      },
    });

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error unlinking account:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to unlink account",
    };
  }
}

export async function getLinkedAccounts() {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return { success: false, error: "Unauthorized", accounts: [] };
    }

    const prisma = getPrismaClient();

    const user = await prisma.user.findFirst({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return { success: false, error: "User not found", accounts: [] };
    }

    const linkedAccounts = await prisma.userLinkedAccount.findMany({
      where: { userId: user.id },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            handle: true,
            imageUrl: true,
            platform: true,
            followerCount: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
      orderBy: [{ isPrimary: "desc" }, { linkedAt: "desc" }],
    });

    return {
      success: true,
      accounts: linkedAccounts,
    };
  } catch (error) {
    console.error("Error getting linked accounts:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to get linked accounts",
      accounts: [],
    };
  }
}
