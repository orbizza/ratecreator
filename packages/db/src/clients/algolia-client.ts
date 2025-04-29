/**
 * @fileoverview Algolia search client implementation for Rate Creator platform
 * @module clients/algolia-client
 * @description Provides a singleton client for interacting with Algolia search service,
 * handling search operations, index management, and error handling.
 */

import { algoliasearch, SearchClient } from "algoliasearch";
// import { SearchResponse } from "@algolia/client-search";
import {
  SearchAccount,
  SearchAccountsParams,
  SearchResults,
} from "@ratecreator/types/review";

/**
 * Singleton instance of the Algolia search client
 * @private
 */
let searchClientInstance: SearchClient | null = null;

/**
 * Singleton instance of the Algolia write client
 * @private
 */
let writeClientInstance: SearchClient | null = null;

/**
 * Returns a singleton instance of the Algolia search client
 * @returns {SearchClient} The Algolia search client instance
 * @throws {Error} If Algolia credentials are not configured
 */
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

/**
 * Returns a singleton instance of the Algolia write client
 * @returns {SearchClient} The Algolia write client instance
 * @throws {Error} If Algolia credentials are not configured
 */
export const getWriteClient = (): SearchClient => {
  if (!writeClientInstance) {
    writeClientInstance = algoliasearch(
      process.env.ALGOLIA_APP_ID!,
      process.env.ALGOLIA_WRITE_API_KEY!,
    );
  }
  return writeClientInstance;
};

// export const writeAccount = async (account: Account) => {
//   const client = getWriteClient();
//   const index = client.initIndex("accounts");
//   await index.saveObject(account);
// };

/**
 * Performs a search for accounts based on provided parameters
 * @param {SearchAccountsParams} params - Search parameters including filters, sorting, and pagination
 * @returns {Promise<SearchResults>} Search results containing accounts and facets
 * @throws {Error} If search operation fails
 */
export const getSearchAccounts = async (
  params: SearchAccountsParams,
): Promise<SearchResults> => {
  const client = getSearchClient();
  const BASE_INDEX_NAME = "accounts";
  let indexName = BASE_INDEX_NAME;

  // Determine index name based on sort parameters
  if (params.sortBy) {
    if (params.sortBy === "followed" && params.sortOrder === "desc") {
      indexName = `${BASE_INDEX_NAME}`;
    } else {
      indexName = `${BASE_INDEX_NAME}_${params.sortBy}_${params.sortOrder}`;
    }
  }

  // Build filter string from provided filters
  let filters: string[] = [];
  if (params.filters) {
    // Handle category filters
    if (params.filters.categories && params.filters.categories.length > 0) {
      const categoryFilters = params.filters.categories.map(
        (c: string) => `categories:"${c}"`,
      );
      filters.push(`(${categoryFilters.join(" OR ")})`);
    }

    // Handle platform filters
    if (params.filters.platform && params.filters.platform.length > 0) {
      const platformFilters = params.filters.platform.map(
        (p: string) => `platform:${p.toUpperCase()}`,
      );
      filters.push(`(${platformFilters.join(" OR ")})`);
    }

    // Handle followers range
    if (params.filters.followers) {
      if (typeof params.filters.followers === "string") {
        filters.push(params.filters.followers);
      } else {
        const { min, max } = params.filters.followers;
        filters.push(`followerCount >= ${min} AND followerCount < ${max}`);
      }
    }

    // Handle rating range
    if (params.filters.rating) {
      if (typeof params.filters.rating === "string") {
        filters.push(params.filters.rating);
      } else {
        const { min, max } = params.filters.rating;
        filters.push(`rating >= ${min} AND rating < ${max}`);
      }
    }

    // Handle video count range
    if (params.filters.videoCount) {
      if (typeof params.filters.videoCount === "string") {
        filters.push(params.filters.videoCount);
      } else {
        const { min, max } = params.filters.videoCount;
        filters.push(`rating >= ${min} AND rating < ${max}`);
      }
    }

    // Handle review count range
    if (params.filters.reviewCount) {
      if (typeof params.filters.reviewCount === "string") {
        filters.push(params.filters.reviewCount);
      } else {
        const { min, max } = params.filters.reviewCount;
        filters.push(`rating >= ${min} AND rating < ${max}`);
      }
    }

    // Handle country filters
    if (params.filters.country && params.filters.country.length > 0) {
      const countryFilters = params.filters.country.map(
        (c: string) => `country:${c}`,
      );
      filters.push(`(${countryFilters.join(" OR ")})`);
    }

    // Handle language filters
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

    // // Handle categories (AND between categories)
    // if (params.filters.categories && params.filters.categories.length > 0) {
    //   const categoryFilters = params.filters.categories.map(
    //     (c: string) => `categories:"${c}"`
    //   );
    //   filters.push(`(${categoryFilters.join(" OR ")})`);
    // }
  }

  // console.log("Final filters:", filters.join(" AND "));

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

    // Return the exact structure from Algolia

    return searchResults.results[0] as SearchResults;
  } catch (error) {
    console.error("Algolia search error:", error);
    throw error;
  }
};
