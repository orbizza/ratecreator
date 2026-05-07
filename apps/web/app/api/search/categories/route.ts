import { NextRequest, NextResponse } from "next/server";
import { searchCategories } from "@ratecreator/db/elasticsearch-client";
import { searchRateLimitOk } from "../../../../lib/search-rate-limit";

export const dynamic = "force-dynamic";

// Category list is fully public — used by the search bar autocomplete on
// the landing page for anonymous visitors. Per-IP rate limit only.
export async function GET(request: NextRequest) {
  try {
    if (!(await searchRateLimitOk(request, "categories"))) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const url = new URL(request.url);
    const query = url.searchParams.get("query") || "";
    const limit = parseInt(url.searchParams.get("limit") || "20");

    if (!query.trim()) {
      return NextResponse.json({ hits: [] });
    }

    const results = await searchCategories(query);
    const response = NextResponse.json({ hits: results.slice(0, limit) });
    response.headers.set("Cache-Control", "public, max-age=0, s-maxage=60");
    return response;
  } catch (error) {
    console.error("Category search error:", error);
    return NextResponse.json(
      { error: "Failed to search categories" },
      { status: 500 },
    );
  }
}
