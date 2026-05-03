import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { searchCategories } from "@ratecreator/db/elasticsearch-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "";
    const limit = parseInt(url.searchParams.get("limit") || "20");

    if (!query.trim()) {
      return NextResponse.json({ hits: [] });
    }

    const results = await searchCategories(query);
    const response = NextResponse.json({ hits: results.slice(0, limit) });
    response.headers.set("Cache-Control", "private, no-store");
    return response;
  } catch (error) {
    console.error("Category search error:", error);
    return NextResponse.json(
      { error: "Failed to search categories" },
      { status: 500 },
    );
  }
}
