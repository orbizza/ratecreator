import { NextRequest, NextResponse } from "next/server";
import { getMetadata } from "@ratecreator/actions/review";

export async function GET(request: NextRequest) {
  try {
    const url = request.nextUrl.searchParams.get("url");

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const metadata = await getMetadata(url);
    return NextResponse.json(metadata);
  } catch (error) {
    console.error("Error processing metadata request:", error);
    return NextResponse.json(
      { error: "Failed to fetch metadata" },
      { status: 500 }
    );
  }
}
