import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@ratecreator/db/client";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { claimId, verificationMethod, verificationData } = await req.json();

    if (!claimId || !verificationMethod) {
      return NextResponse.json(
        { error: "Claim ID and verification method are required" },
        { status: 400 },
      );
    }

    const prisma = getPrismaClient();

    // Get user from database
    const user = await prisma.user.findFirst({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get the claim
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
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    if (claim.status === "VERIFIED") {
      return NextResponse.json(
        { error: "This claim has already been verified" },
        { status: 400 },
      );
    }

    // Verify based on method
    let isVerified = false;

    switch (verificationMethod) {
      case "oauth":
        // OAuth verification - check if the OAuth user ID matches the account ID
        if (verificationData?.platformUserId === claim.account.accountId) {
          isVerified = true;
        }
        break;

      case "bio_link":
        // Bio link verification - would need to fetch the profile and check for verification code
        // This is a placeholder for future implementation
        break;

      case "dns":
        // DNS verification - would need to check DNS TXT record
        // This is a placeholder for future implementation
        break;

      case "meta_tag":
        // Meta tag verification - would need to fetch the website and check meta tag
        // This is a placeholder for future implementation
        break;

      default:
        return NextResponse.json(
          { error: "Invalid verification method" },
          { status: 400 },
        );
    }

    if (isVerified) {
      // Update the claim to verified
      await prisma.claimedAccount.update({
        where: { id: claimId },
        data: {
          status: "VERIFIED",
          verifiedAt: new Date(),
          verificationMethod,
        },
      });

      // Also create a linked account entry for convenience
      await prisma.userLinkedAccount.upsert({
        where: {
          userId_accountId: {
            userId: user.id,
            accountId: claim.accountId,
          },
        },
        create: {
          userId: user.id,
          accountId: claim.accountId,
          platform: claim.platform,
          isPrimary: true,
        },
        update: {},
      });

      return NextResponse.json({
        success: true,
        message: "Account verified successfully",
        status: "VERIFIED",
      });
    }

    return NextResponse.json(
      { error: "Verification failed. Please try again." },
      { status: 400 },
    );
  } catch (error) {
    console.error("Error verifying claim:", error);
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 },
    );
  }
}
