import { NextRequest, NextResponse } from "next/server";
import { getSearchAccounts } from "@ratecreator/db/algolia-client";
import qs from "qs";
import { SearchAccountsParams } from "@ratecreator/types/review";
import { getAuth } from "@clerk/nextjs/server";

export async function GET(request: NextRequest) {
  try {
    // Parse the URL and query string using qs
    const url = new URL(request.url);
    const parsedQuery = qs.parse(url.search, { ignoreQueryPrefix: true });
    const { userId } = getAuth(request);

    // Initialize the params object matching SearchAccountsParams interface
    const params: SearchAccountsParams = {
      query: (parsedQuery.query as string) || "",
      page: parsedQuery.page ? parseInt(parsedQuery.page as string) : 0,
      limit: parsedQuery.limit ? parseInt(parsedQuery.limit as string) : 20,
      sortBy: (parsedQuery.sortBy as string) || "followerCount",
      sortOrder: (parsedQuery.sortOrder as "asc" | "desc") || "asc",
      filters: {}, // Initialize filters as an empty object
    };

    if (!userId && params.page && params.page > 0) {
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
          let condition;
          if (followersFilter.endsWith("+")) {
            const min = parseInt(followersFilter.replace(/[^\d]/g, ""), 10);
            condition = `followerCount >= ${min}000000`;
          } else {
            const [minStr, maxStr] = followersFilter.split("-");
            const min = parseInt(minStr.replace(/[^\d]/g, ""), 10);
            const max = parseInt(maxStr.replace(/[^\d]/g, ""), 10);

            let minValue = min;
            let maxValue = max;

            if (minStr.includes("M")) minValue *= 1000000;
            if (maxStr.includes("M")) maxValue *= 1000000;
            if (minStr.includes("K")) minValue *= 1000;
            if (maxStr.includes("K")) maxValue *= 1000;

            condition = `(followerCount >= ${minValue} AND followerCount < ${maxValue})`;
          }

          params.filters = params.filters || {};
          params.filters.followers = condition;
        }
      }

      if ("rating" in filters) {
        const ratingFilter = filters.rating as string;
        if (ratingFilter !== "all") {
          let condition;
          if (ratingFilter.includes("-")) {
            const [minStr, maxStr] = ratingFilter.split("-");
            const min = parseFloat(minStr);
            const max = parseFloat(maxStr);
            condition = `(rating >= ${min} AND rating < ${max + 0.1})`;
          } else {
            const exact = parseFloat(ratingFilter);
            condition = `(rating = ${exact})`;
          }

          params.filters = params.filters || {};
          params.filters.rating = condition;
        }
      }

      if ("videoCount" in filters) {
        const videoCountFilter = filters.videoCount as string;
        if (videoCountFilter !== "all") {
          let condition;
          if (videoCountFilter === "0") {
            condition = `videoCount = 0`;
          } else if (videoCountFilter.includes("+")) {
            const min = parseInt(videoCountFilter.replace(/[^\d]/g, ""), 10);
            condition = `videoCount >= ${min}`;
          } else {
            const [minStr, maxStr] = videoCountFilter.split("-");
            const min = parseInt(minStr.replace(/[^\d]/g, ""), 10);
            const max = parseInt(maxStr.replace(/[^\d]/g, ""), 10);
            condition = `(videoCount >= ${min} AND videoCount <= ${max})`;
          }

          params.filters = params.filters || {};
          params.filters.videoCount = condition;
        }
      }

      if ("reviewCount" in filters) {
        const reviewCountFilter = filters.reviewCount as string;
        if (reviewCountFilter !== "all") {
          let condition;
          if (reviewCountFilter === "0") {
            condition = `reviewCount = 0`;
          } else if (reviewCountFilter.includes("+")) {
            const min = parseInt(reviewCountFilter.replace(/[^\d]/g, ""), 10);
            condition = `reviewCount >= ${min}`;
          } else {
            const [minStr, maxStr] = reviewCountFilter.split("-");
            const min = parseInt(minStr.replace(/[^\d]/g, ""), 10);
            const max = parseInt(maxStr.replace(/[^\d]/g, ""), 10);
            condition = `(reviewCount >= ${min} AND reviewCount <= ${max})`;
          }

          params.filters = params.filters || {};
          params.filters.reviewCount = condition;
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
      { status: 500 },
    );
  }
}
