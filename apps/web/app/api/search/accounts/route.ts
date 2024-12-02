import { NextRequest, NextResponse } from "next/server";
import { getSearchAccounts } from "@ratecreator/db/algolia-client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract search parameters
    const query = searchParams.get("q") || "";
    const page = parseInt(searchParams.get("page") || "0");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Extract filter parameters
    const platform = searchParams.get("platform");
    const followers = searchParams.get("followers");
    const rating = searchParams.get("rating");
    const videoCount = searchParams.get("videoCount");
    const reviewCount = searchParams.get("reviewCount");
    const country = searchParams.get("country");
    const language = searchParams.get("language");
    const claimed = searchParams.get("claimed");
    const madeForKids = searchParams.get("madeForKids");
    const sortBy = searchParams.get("sortBy") || "followerCount";
    const sortOrder =
      (searchParams.get("sortOrder") as "asc" | "desc") || undefined;

    // Build filters array
    const filters: string[] = [];

    if (platform && platform !== "ALL") {
      filters.push(`platform:${platform}`);
    }

    if (followers) {
      const [min, max] = followers.split("-");
      if (min && max) {
        filters.push(`followerCount:${min} TO ${max}`);
      }
    }

    if (rating) {
      const [min, max] = rating.split("-");
      if (min && max) {
        filters.push(`rating:${min} TO ${max}`);
      }
    }

    if (videoCount) {
      const [min, max] = videoCount.split("-");
      if (min && max) {
        filters.push(`videoCount:${min} TO ${max}`);
      }
    }

    if (reviewCount) {
      const [min, max] = reviewCount.split("-");
      if (min && max) {
        filters.push(`reviewCount:${min} TO ${max}`);
      }
    }

    if (country) {
      filters.push(`country:${country}`);
    }

    if (language) {
      filters.push(`language_code:${language}`);
    }

    if (claimed) {
      filters.push(`claimed:${claimed === "true"}`);
    }

    if (madeForKids) {
      filters.push(`madeForKids:${madeForKids === "true"}`);
    }

    const categories = searchParams.get("categories")?.split(",");
    if (categories?.length) {
      categories.forEach((category) => {
        filters.push(`category:${category}`);
      });
    }

    const params = {
      query,
      page,
      limit,
      filters,
      sortBy,
      sortOrder,
    };
    // Convert string filters to SearchAccountsParams filters object
    const searchFilters: {
      platform?: string[];
      followers?: { min: number; max: number };
      rating?: { min: number; max: number };
      videoCount?: { min: number; max: number };
      reviewCount?: { min: number; max: number };
      country?: string[];
      language?: string[];
      claimed?: boolean;
      madeForKids?: boolean;
      categories?: string[];
    } = {};

    // Parse filters array into proper filter object
    filters.forEach((filter) => {
      const [key, value] = filter.split(":");
      if (key === "videoCount" || key === "reviewCount") {
        const [min, max] = value.split(" TO ").map(Number);
        searchFilters[key] = { min, max };
      } else if (key === "country") {
        searchFilters.country = [value];
      } else if (key === "language_code") {
        searchFilters.language = [value];
      } else if (key === "claimed" || key === "madeForKids") {
        searchFilters[key] = value === "true";
      } else if (key === "category") {
        if (!searchFilters.categories) searchFilters.categories = [];
        searchFilters.categories.push(value);
      }
    });

    // Perform the search with properly typed filters
    const searchResults = await getSearchAccounts({
      ...params,
      filters: searchFilters,
    });

    return NextResponse.json({ searchResults });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 },
    );
  }
}
