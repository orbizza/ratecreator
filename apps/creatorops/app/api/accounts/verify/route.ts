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
        return NextResponse.json(
          {
            error:
              "Verification flow not yet implemented. Please contact support.",
          },
          { status: 501 },
        );

      default:
        return NextResponse.json(
          { error: "Invalid verification method" },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error("Error verifying claim:", error);
    return NextResponse.json(
      { error: "An error occurred during verification" },
      { status: 500 },
    );
  }
}
