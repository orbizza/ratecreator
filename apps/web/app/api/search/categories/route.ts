import { NextRequest, NextResponse } from "next/server";
import { searchCategories } from "@ratecreator/db/elasticsearch-client";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "";
    const limit = parseInt(url.searchParams.get("limit") || "20");

    if (!query.trim()) {
      return NextResponse.json({ hits: [] });
    }

    const results = await searchCategories(query);
    return NextResponse.json({ hits: results.slice(0, limit) });
  } catch (error) {
    console.error("Category search error:", error);
    return NextResponse.json(
      { error: "Failed to search categories" },
      { status: 500 },
    );
  }
}
