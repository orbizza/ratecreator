import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@ratecreator/db/client";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { platform, identifier } = await req.json();

    if (!platform || !identifier) {
      return NextResponse.json(
        { error: "Platform and identifier are required" },
        { status: 400 },
      );
    }

    const prisma = getPrismaClient();

    // Parse identifier to extract handle/username
    let handle = identifier;

    // Remove URL parts if present
    if (identifier.includes("/")) {
      const parts = identifier.split("/");
      handle = parts[parts.length - 1].replace("@", "");
    }
    handle = handle.replace("@", "").replace("u/", "");

    // Search for account in database
    const account = await prisma.account.findFirst({
      where: {
        platform: platform.toUpperCase(),
        OR: [
          { handle: { equals: handle, mode: "insensitive" } },
          { accountId: handle },
          { name: { contains: handle, mode: "insensitive" } },
        ],
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        handle: true,
        accountId: true,
        imageUrl: true,
        followerCount: true,
        platform: true,
      },
    });

    if (!account) {
      return NextResponse.json(
        {
          error:
            "Account not found. Please check the identifier and try again.",
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      account: {
        id: account.id,
        name: account.name,
        handle: account.handle || account.accountId,
        imageUrl: account.imageUrl,
        followerCount: account.followerCount,
        platform: account.platform,
      },
    });
  } catch (error) {
    console.error("Error searching for account:", error);
    return NextResponse.json(
      { error: "An error occurred while searching" },
      { status: 500 },
    );
  }
}
