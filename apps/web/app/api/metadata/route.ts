import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getMetadata } from "@ratecreator/actions/review";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "youtu.be",
  "twitter.com",
  "www.twitter.com",
  "x.com",
  "www.x.com",
  "tiktok.com",
  "www.tiktok.com",
  "vm.tiktok.com",
  "reddit.com",
  "www.reddit.com",
  "old.reddit.com",
  "instagram.com",
  "www.instagram.com",
  "instagr.am",
]);

function isAllowedUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
      return false;
    }
    return ALLOWED_HOSTS.has(parsed.hostname.toLowerCase());
  } catch {
    return false;
  }
}

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    if (!isAllowedUrl(url)) {
      return NextResponse.json(
        { error: "URL host not allowed" },
        { status: 400 },
      );
    }

    const metadata = await getMetadata(url);
    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error processing metadata request:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 },
    );
  }
}
