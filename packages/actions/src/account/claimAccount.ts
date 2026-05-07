"use server";

import { getPrismaClient } from "@ratecreator/db/client";
import { auth } from "@clerk/nextjs/server";

interface ClaimAccountInput {
  accountId: string;
  platform?: string;
}

interface ClaimAccountResult {
  success: boolean;
  claimId?: string;
  status?: string;
  error?: string;
}

export async function claimAccount(
  input: ClaimAccountInput,
): Promise<ClaimAccountResult> {
  const { accountId, platform } = input;

  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return {
        success: false,
        error: "Unauthorized",
      };
    }

    const prisma = getPrismaClient();

    // Get user from database
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

    // Check if user already has a claim on this account
    const existingClaim = await prisma.claimedAccount.findFirst({
      where: {
        userId: user.id,
        accountId,
      },
    });

    if (existingClaim) {
      return {
        success: true,
        claimId: existingClaim.id,
        status: existingClaim.status,
      };
    }

    // Check if account is already verified by another user
    const verifiedClaim = await prisma.claimedAccount.findFirst({
      where: {
        accountId,
        status: "VERIFIED",
      },
    });

    if (verifiedClaim) {
      return {
        success: false,
        error: "This account has already been claimed by another user",
      };
    }

    // Create claim
    const claim = await prisma.claimedAccount.create({
      data: {
        userId: user.id,
        accountId,
        platform: platform || account.platform.toLowerCase(),
        status: "PENDING",
      },
    });

    return {
      success: true,
      claimId: claim.id,
      status: claim.status,
    };
  } catch (error) {
    console.error("Error claiming account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to claim account",
    };
  }
}

export async function verifyClaim(input: {
  claimId: string;
  verificationMethod: string;
  verificationData?: Record<string, any>;
}): Promise<ClaimAccountResult> {
  const { claimId, verificationMethod, verificationData } = input;

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

    const claim = await prisma.claimedAccount.findFirst({
      where: {
        id: claimId,
        userId: user.id,
      },
      include: {
        account: true,
      },
    });

    if (!claim) {
      return {
        success: false,
        error: "Claim not found",
      };
    }

    if (claim.status === "VERIFIED") {
      return {
        success: true,
        claimId: claim.id,
        status: "VERIFIED",
      };
    }

    // NOTE: OAuth verification must be performed server-side via the platform's
    // OAuth handshake — never trust a client-supplied platformUserId. The
    // earlier implementation accepted any caller who echoed the claim's
    // accountId as `verificationData.platformUserId`, which let any signed-in
    // user verify any unverified claim. Verification methods are disabled
    // until proper server-side flows are implemented.
    switch (verificationMethod) {
      case "oauth":
      case "bio_link":
      case "dns":
      case "meta_tag":
        return {
          success: false,
          error: "Verification flow not yet implemented",
        };

      default:
        return {
          success: false,
          error: "Invalid verification method",
        };
    }
  } catch (error) {
    console.error("Error verifying claim:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to verify claim",
    };
  }
}
