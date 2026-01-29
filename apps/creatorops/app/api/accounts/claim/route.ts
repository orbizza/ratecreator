import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@ratecreator/db/client";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { accountId, platform } = await req.json();

    if (!accountId) {
      return NextResponse.json(
        { error: "Account ID is required" },
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

    // Check if account exists
    const account = await prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Check if user already has a claim on this account
    const existingClaim = await prisma.claimedAccount.findFirst({
      where: {
        userId: user.id,
        accountId,
      },
    });

    if (existingClaim) {
      return NextResponse.json(
        {
          error: "You have already claimed this account",
          claimId: existingClaim.id,
          status: existingClaim.status,
        },
        { status: 400 },
      );
    }

    // Check if account is already verified by another user
    const verifiedClaim = await prisma.claimedAccount.findFirst({
      where: {
        accountId,
        status: "VERIFIED",
      },
    });

    if (verifiedClaim) {
      return NextResponse.json(
        { error: "This account has already been claimed by another user" },
        { status: 400 },
      );
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

    return NextResponse.json({
      success: true,
      claimId: claim.id,
      status: claim.status,
      message: "Claim created successfully. Please complete verification.",
    });
  } catch (error) {
    console.error("Error creating claim:", error);
    return NextResponse.json(
      { error: "An error occurred while creating the claim" },
      { status: 500 },
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkUserId } = await auth();

    if (!clerkUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrismaClient();

    const user = await prisma.user.findFirst({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const claims = await prisma.claimedAccount.findMany({
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
          },
        },
      },
      orderBy: { claimedAt: "desc" },
    });

    return NextResponse.json({ claims });
  } catch (error) {
    console.error("Error fetching claims:", error);
    return NextResponse.json(
      { error: "An error occurred while fetching claims" },
      { status: 500 },
    );
  }
}
