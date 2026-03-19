import { NextRequest, NextResponse } from "next/server";
import { searchAccounts } from "@ratecreator/db/elasticsearch-client";
import qs from "qs";
import { SearchAccountsParams } from "@ratecreator/types/review";
import { auth } from "@clerk/nextjs/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Parse the URL and query string using qs
    const url = new URL(request.url);
    const parsedQuery = qs.parse(url.search, { ignoreQueryPrefix: true });
    const { userId } = await auth();

    // Initialize the params object matching SearchAccountsParams interface
    // ES uses 1-based pages, so convert from 0-based (frontend) to 1-based (ES)
    const frontendPage = parsedQuery.page
      ? parseInt(parsedQuery.page as string)
      : 0;

    const params: SearchAccountsParams = {
      query: (parsedQuery.query as string) || "",
      page: frontendPage + 1, // Convert to 1-based for ES
      limit: parsedQuery.limit ? parseInt(parsedQuery.limit as string) : 20,
      sortBy: (parsedQuery.sortBy as string) || "followerCount",
      sortOrder: (parsedQuery.sortOrder as "asc" | "desc") || "desc",
      filters: {}, // Initialize filters as an empty object
    };

    if (!userId && frontendPage > 0) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (params.limit && params.limit > 20) {
      params.limit = 20;
    }

    // Extract filters from parsedQuery
    const filters = parsedQuery.filters || {};

    // Map filters to the params.filters object
    if (typeof filters === "object") {
      if ("platform" in filters) {
        const platformValue = filters.platform;
        if (params.filters) {
          params.filters.platform = Array.isArray(platformValue)
            ? (platformValue as string[])
            : [platformValue as string];
        }
      }

      if ("followers" in filters) {
        const followersFilter = filters.followers as string;
        if (followersFilter !== "all") {
          // Pass the raw string value — ES client has its own parseRange function
          params.filters = params.filters || {};
          params.filters.followers = followersFilter;
        }
      }

      if ("rating" in filters) {
        const ratingFilter = filters.rating as string;
        if (ratingFilter !== "all") {
          // Pass the raw string value — ES client has its own parseRange function
          params.filters = params.filters || {};
          params.filters.rating = ratingFilter;
        }
      }

      if ("videoCount" in filters) {
        const videoCountFilter = filters.videoCount as string;
        if (videoCountFilter !== "all") {
          // Pass the raw string value — ES client has its own parseRange function
          params.filters = params.filters || {};
          params.filters.videoCount = videoCountFilter;
        }
      }

      if ("reviewCount" in filters) {
        const reviewCountFilter = filters.reviewCount as string;
        if (reviewCountFilter !== "all") {
          // Pass the raw string value — ES client has its own parseRange function
          params.filters = params.filters || {};
          params.filters.reviewCount = reviewCountFilter;
        }
      }

      if ("country" in filters) {
        params.filters = params.filters || {};
        params.filters.country = Array.isArray(filters.country)
          ? (filters.country as string[])
          : [filters.country as string];
      }
      if ("language" in filters) {
        params.filters = params.filters || {};
        params.filters.language = Array.isArray(filters.language)
          ? (filters.language as string[])
          : [filters.language as string];
      }
      if ("claimed" in filters) {
        params.filters = params.filters || {};
        params.filters.claimed = filters.claimed === "true";
      }
      if ("madeForKids" in filters) {
        params.filters = params.filters || {};
        params.filters.madeForKids = filters.madeForKids === "true";
      }
      if ("categories" in filters) {
        params.filters = params.filters || {};
        params.filters.categories = Array.isArray(filters.categories)
          ? (filters.categories as string[])
          : [filters.categories as string];
      }

      // Initialize params.filters if not already initialized
      params.filters = params.filters || {};
    }

    // Pass the params directly to the Elasticsearch searchAccounts function
    const searchResults = await searchAccounts(params);

    // Convert ES 1-based page back to 0-based for frontend compatibility
    const response = {
      ...searchResults,
      page: searchResults.page - 1,
    };

    const jsonResponse = NextResponse.json(response);
    jsonResponse.headers.set(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=120",
    );
    return jsonResponse;
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 },
    );
  }
}
