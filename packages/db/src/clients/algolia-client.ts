import { algoliasearch, SearchClient } from "algoliasearch";
// import { SearchResponse } from "@algolia/client-search";
import { SearchAccount, SearchAccountsParams } from "@ratecreator/types/review";

let searchClientInstance: SearchClient | null = null;
let writeClientInstance: SearchClient | null = null;

export const getSearchClient = (): SearchClient => {
  if (!searchClientInstance) {
    const algoliaClient = algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
      process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY!,
    );
    searchClientInstance = algoliaClient;
  }
  return searchClientInstance;
};

export const getWriteClient = (): SearchClient => {
  if (!writeClientInstance) {
    writeClientInstance = algoliasearch(
      process.env.ALGOLIA_APP_ID!,
      process.env.ALGOLIA_WRITE_API_KEY!,
    );
  }
  return writeClientInstance;
};

export const getSearchAccounts = async (
  params: SearchAccountsParams,
): Promise<SearchAccount[]> => {
  const client = getSearchClient();
  const BASE_INDEX_NAME = "accounts";
  let indexName = BASE_INDEX_NAME;
  if (params.sortBy) {
    indexName = `${BASE_INDEX_NAME}_${params.sortBy}_${params.sortOrder}`;
  }

  const filters: string[] = [];
  if (params.filters) {
    // Handle platform filter (multiple platforms using OR)
    if (params.filters.platform && params.filters.platform.length > 0) {
      const platformFilters = params.filters.platform.map(
        (p: string) => `platform:${p.toUpperCase()}`,
      );
      filters.push(`(${platformFilters.join(" OR ")})`);
    }
    // filters: 'platform:YOUTUBE'
    // Handle followers range
    if (params.filters.followers) {
      const { min, max } = params.filters.followers;
      filters.push(`followerCount:${min} TO ${max}`);
    }

    // Handle rating range
    if (params.filters.rating) {
      const { min, max } = params.filters.rating;
      filters.push(`rating:${min} TO ${max}`);
    }

    // Handle video count range
    if (params.filters.videoCount) {
      const { min, max } = params.filters.videoCount;
      filters.push(`videoCount:${min} TO ${max}`);
    }

    // Handle review count range
    if (params.filters.reviewCount) {
      const { min, max } = params.filters.reviewCount;
      filters.push(`reviewCount:${min} TO ${max}`);
    }
    // Handle multiple countries (OR)
    if (params.filters.country && params.filters.country.length > 0) {
      const countryFilters = params.filters.country.map(
        (c: string) => `country:${c}`,
      );
      filters.push(`(${countryFilters.join(" OR ")})`);
    }

    // Handle multiple languages (OR)
    if (params.filters.language && params.filters.language.length > 0) {
      const languageFilters = params.filters.language.map(
        (l: string) => `language_code:${l}`,
      );
      filters.push(`(${languageFilters.join(" OR ")})`);
    }

    // Handle boolean filters
    if (params.filters.claimed !== undefined) {
      filters.push(`claimed:${params.filters.claimed}`);
    }

    if (params.filters.madeForKids !== undefined) {
      filters.push(`madeForKids:${params.filters.madeForKids}`);
    }

    // Handle categories (AND between categories)
    if (params.filters.categories && params.filters.categories.length > 0) {
      const categoryFilters = params.filters.categories.map(
        (c: string) => `categories:${c}`,
      );
      filters.push(`(${categoryFilters.join(" OR ")})`);
    }
  }

  try {
    const searchResults = await client.search<SearchAccount>([
      {
        indexName: indexName,
        params: {
          query: params.query || "",
          page: params.page || 0,
          filters: filters.join(" AND "),
          facets: [
            "platform",
            "categories",
            "country",
            "language_code",
            "madeForKids",
          ],
        },
      },
    ]);
    console.log("params: ", params);
    // Access the first result from the array of SearchResponses
    if ("hits" in searchResults.results[0]) {
      return searchResults.results[0].hits;
    } else {
      throw new Error("Invalid search results format");
    }
  } catch (error) {
    console.error("Algolia search error:", error);
    throw error;
  }
};
