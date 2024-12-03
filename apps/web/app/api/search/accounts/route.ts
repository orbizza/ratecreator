import { NextRequest, NextResponse } from "next/server";
import { getSearchAccounts } from "@ratecreator/db/algolia-client";
import qs from "qs";
import { SearchAccountsParams } from "@ratecreator/types/review";

export async function GET(request: NextRequest) {
  try {
    // Parse the URL and query string using qs
    const url = new URL(request.url);
    const parsedQuery = qs.parse(url.search, { ignoreQueryPrefix: true });
    // console.log("Parsed Query:", parsedQuery);

    // Initialize the params object matching SearchAccountsParams interface
    const params: SearchAccountsParams = {
      query: (parsedQuery.query as string) || "",
      page: parsedQuery.page ? parseInt(parsedQuery.page as string) : 0,
      limit: parsedQuery.limit ? parseInt(parsedQuery.limit as string) : 20,
      sortBy: (parsedQuery.sortBy as string) || "followerCount",
      sortOrder: (parsedQuery.sortOrder as "asc" | "desc") || "asc",
      filters: {}, // Initialize filters as an empty object
    };

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
        const [min, max] = (filters.followers as string).split("-").map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          params.filters = params.filters || {};
          params.filters.followers = { min, max };
        }
      }

      if ("rating" in filters) {
        const [min, max] = (filters.rating as string).split("-").map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          params.filters = params.filters || {};
          params.filters.rating = { min, max };
        }
      }

      if ("videoCount" in filters) {
        const [min, max] = (filters.videoCount as string)
          .split("-")
          .map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          params.filters = params.filters || {};
          params.filters.videoCount = { min, max };
        }
      }

      if ("reviewCount" in filters) {
        const [min, max] = (filters.reviewCount as string)
          .split("-")
          .map(Number);
        if (!isNaN(min) && !isNaN(max)) {
          params.filters = params.filters || {};
          params.filters.reviewCount = { min, max };
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

    // console.log("Constructed SearchAccountsParams:", params);

    // Pass the params directly to your getSearchAccounts function
    const searchResults = await getSearchAccounts(params);
    // console.log("searchResults in api: ", searchResults.hits[19]);
    return NextResponse.json(searchResults);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    );
  }
}
