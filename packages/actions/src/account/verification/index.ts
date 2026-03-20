"use server";

import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import { createNotification } from "../../notifications/notification-service";
import { getYouTubeOAuthConfig } from "./oauth-config";
import { verifyYouTubeOwnership } from "./youtube-verify";
import crypto from "crypto";

const prisma = getPrismaClient();

/**
 * Initiate OAuth verification for a claimed account.
 * Returns the OAuth redirect URL.
 */
export async function initiateOAuthVerification(
  claimId: string,
  platform: string,
): Promise<{ redirectUrl: string } | { error: string }> {
  const { userId: clerkId } = await auth();
  if (!clerkId) return { error: "Unauthorized" };

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) return { error: "User not found" };

  // Verify the claim exists and belongs to this user
  const claim = await prisma.claimedAccount.findFirst({
    where: { id: claimId, userId: user.id, status: "PENDING" },
    select: { id: true, platform: true },
  });

  if (!claim) {
    return { error: "Claim not found or already processed" };
  }

  if (platform.toUpperCase() !== "YOUTUBE") {
    return { error: "Only YouTube verification is supported currently" };
  }

  const config = getYouTubeOAuthConfig();

  // Encrypt claimId into state parameter
  const state = Buffer.from(
    JSON.stringify({ claimId, nonce: crypto.randomBytes(8).toString("hex") }),
  ).toString("base64url");

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    access_type: "offline",
    state,
    prompt: "consent",
  });

  return {
    redirectUrl: `${config.authorizationUrl}?${params.toString()}`,
  };
}

/**
 * Handle OAuth callback — exchange code, verify ownership, update claim.
 */
export async function handleOAuthCallback(
  platform: string,
  code: string,
  state: string,
): Promise<{
  success: boolean;
  claimId?: string;
  error?: string;
}> {
  // Parse state to get claimId
  let claimId: string;
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString());
    claimId = parsed.claimId;
  } catch {
    return { success: false, error: "Invalid state parameter" };
  }

  // Fetch claim with account data
  const claim = await prisma.claimedAccount.findUnique({
    where: { id: claimId },
    include: {
      account: { select: { accountId: true, handle: true, platform: true } },
      user: { select: { id: true } },
    },
  });

  if (!claim) {
    return { success: false, error: "Claim not found" };
  }

  if (claim.status !== "PENDING") {
    return { success: false, error: "Claim already processed" };
  }

  if (platform.toUpperCase() !== "YOUTUBE") {
    return { success: false, error: "Only YouTube verification is supported" };
  }

  // Verify YouTube ownership
  const channelId = claim.account.accountId;
  const result = await verifyYouTubeOwnership(code, channelId);

  if (result.verified) {
    // Update claim to VERIFIED
    await prisma.claimedAccount.update({
      where: { id: claimId },
      data: {
        status: "VERIFIED",
        verifiedAt: new Date(),
        verificationMethod: "oauth",
      },
    });

    // Create UserLinkedAccount
    try {
      await prisma.userLinkedAccount.create({
        data: {
          userId: claim.userId,
          accountId: claim.accountId,
          platform: claim.platform,
          isPrimary: true,
        },
      });
    } catch {
      // May already exist — ignore duplicate
    }

    // Send notification (fire-and-forget)
    createNotification({
      userId: claim.userId,
      type: "ACCOUNT_CLAIMED",
      title: "Account verified!",
      message: `Your ${claim.account.platform} account "${claim.account.handle || claim.account.accountId}" has been verified.`,
      metadata: {
        claimId,
        accountId: claim.accountId,
        platform: claim.account.platform,
      },
    }).catch((err) =>
      console.error("Failed to create claim verification notification:", err),
    );

    return { success: true, claimId };
  } else {
    // Update claim to REJECTED
    await prisma.claimedAccount.update({
      where: { id: claimId },
      data: {
        status: "REJECTED",
        verificationMethod: "oauth",
      },
    });

    return { success: false, claimId, error: result.error };
  }
}
