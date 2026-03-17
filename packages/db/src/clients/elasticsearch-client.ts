/**
 * Elasticsearch Client for Elastic Cloud on GCP
 *
 * Provides search functionality as a drop-in replacement for Algolia.
 * Supports full-text search, faceted filtering, and range queries.
 */

import { Client } from "@elastic/elasticsearch";
import type { estypes } from "@elastic/elasticsearch";

// Singleton client instance
let elasticClient: Client | null = null;

/**
 * Get or create Elasticsearch client.
 *
 * Supports two connection modes:
 *   1. Serverless (ELASTIC_URL + ELASTIC_API_KEY) — direct endpoint URL
 *   2. Hosted (ELASTIC_CLOUD_ID + ELASTIC_API_KEY) — Cloud ID based
 */
export function getElasticsearchClient(): Client {
  if (!elasticClient) {
    const url = process.env.ELASTIC_URL;
    const cloudId = process.env.ELASTIC_CLOUD_ID;
    const apiKey = process.env.ELASTIC_API_KEY;

    if (url && apiKey) {
      // Serverless: direct endpoint URL
      elasticClient = new Client({
        node: url,
        auth: { apiKey },
      });
    } else if (cloudId && apiKey) {
      // Hosted: Cloud ID based
      elasticClient = new Client({
        cloud: { id: cloudId },
        auth: { apiKey },
      });
    } else {
      throw new Error(
        "Elasticsearch credentials not configured. Set ELASTIC_URL + ELASTIC_API_KEY (serverless) or ELASTIC_CLOUD_ID + ELASTIC_API_KEY (hosted)",
      );
    }
  }

  return elasticClient;
}

// Index names
const ACCOUNTS_INDEX = process.env.ELASTIC_ACCOUNTS_INDEX || "accounts";
const CATEGORIES_INDEX = process.env.ELASTIC_CATEGORIES_INDEX || "categories";

/**
 * Search parameters matching Algolia interface
 */
export interface SearchAccountsParams {
  query?: string;
  page?: number;
  limit?: number;
  filters?: {
    platform?: string[];
    followers?: string | { min: number; max: number };
    rating?: string | { min: number; max: number };
    videoCount?: string | { min: number; max: number };
    reviewCount?: string | { min: number; max: number };
    country?: string[];
    language?: string[];
    claimed?: boolean;
    madeForKids?: boolean;
    categories?: string[];
  };
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

/**
 * Search result format matching Algolia response
 */
export interface SearchAccountsResult {
  hits: any[];
  nbHits: number;
  page: number;
  nbPages: number;
  hitsPerPage: number;
  facets: {
    platform?: Record<string, number>;
    categories?: Record<string, number>;
    country?: Record<string, number>;
    language_code?: Record<string, number>;
    madeForKids?: Record<string, number>;
  };
  processingTimeMS: number;
}

/**
 * Parse follower/rating range from string format
 */
function parseRange(
  value: string | { min: number; max: number },
): { min: number; max: number } | null {
  if (typeof value === "object") {
    return value;
  }

  // Handle string formats like "1M-10M", "100K+", "0-1000"
  const rangeMatch = value.match(
    /^([\d.]+)([KMB]?)(?:-([\d.]+)([KMB]?)|\+)?$/i,
  );
  if (!rangeMatch) return null;

  const multiplier = (suffix: string): number => {
    switch (suffix.toUpperCase()) {
      case "K":
        return 1000;
      case "M":
        return 1000000;
      case "B":
        return 1000000000;
      default:
        return 1;
    }
  };

  const min = parseFloat(rangeMatch[1]) * multiplier(rangeMatch[2] || "");
  const max = rangeMatch[3]
    ? parseFloat(rangeMatch[3]) * multiplier(rangeMatch[4] || "")
    : Number.MAX_SAFE_INTEGER;

  return { min, max };
}

/**
 * Build Elasticsearch query from search parameters
 */
function buildQuery(params: SearchAccountsParams): any {
  const must: any[] = [];
  const filter: any[] = [];

  // Full-text search query with multiple strategies for comprehensive matching
  if (params.query && params.query.trim()) {
    const query = params.query.trim();
    const queryNoSpaces = query.replace(/\s+/g, "");

    const queryLower = query.toLowerCase();
    const queryNoSpacesLower = queryNoSpaces.toLowerCase();

    const shouldClauses: any[] = [
      // Strategy 1: Exact match on handle/name — highest priority
      // "tseries" → @tseries (289M) ranks above @tseriesbhaktisagar (74.7M)
      {
        term: {
          "handle.keyword": {
            value: queryLower,
            boost: 200,
          },
        },
      },
      {
        wildcard: {
          "name.keyword": {
            value: query,
            boost: 200,
            case_insensitive: true,
          },
        },
      },
      // Strategy 2: Exact token multi_match (no fuzziness) — primary search
      {
        multi_match: {
          query,
          fields: [
            "name^5",
            "name_en^5",
            "handle^4",
            "keywords^2",
            "keywords_en^2",
            "categories^2",
            "description",
            "description_en",
            "platform",
            "language_code",
            "country",
          ],
          type: "best_fields",
        },
      },
      // Strategy 2b: Fuzzy multi_match for typo tolerance on longer queries
      // AUTO:5,8 = exact for 1-4 chars, fuzziness 1 for 5-7, fuzziness 2 for 8+
      // Prevents "sony" from matching "song" (edit distance 1)
      {
        multi_match: {
          query,
          fields: ["name^3", "name_en^3", "handle^2"],
          type: "best_fields",
          fuzziness: "AUTO:5,8",
          prefix_length: 1,
          boost: 0.5,
        },
      },
      // Strategy 3: Phrase prefix on name/handle (handles "mrb" → "MrBeast")
      { match_phrase_prefix: { name: { query, boost: 10 } } },
      { match_phrase_prefix: { name_en: { query, boost: 10 } } },
      { match_phrase_prefix: { handle: { query, boost: 8 } } },
      // Strategy 4: Wildcard on keyword fields for substring matching
      // Handles "beast" → "MrBeast" (infix match, not just prefix)
      {
        wildcard: {
          "name.keyword": {
            value: `*${query}*`,
            boost: 3,
            case_insensitive: true,
          },
        },
      },
      {
        wildcard: {
          "handle.keyword": {
            value: `*${query}*`,
            boost: 3,
            case_insensitive: true,
          },
        },
      },
    ];

    // Strategy 5: If query has spaces, also try concatenated version
    // "mr beast" → "mrbeast" matches "MrBeast" via edge_ngram
    if (queryNoSpacesLower !== queryLower) {
      shouldClauses.push(
        // Exact match on concatenated query
        {
          term: {
            "handle.keyword": {
              value: queryNoSpacesLower,
              boost: 200,
            },
          },
        },
        { match_phrase_prefix: { name: { query: queryNoSpaces, boost: 10 } } },
        {
          match_phrase_prefix: {
            name_en: { query: queryNoSpaces, boost: 10 },
          },
        },
        {
          match_phrase_prefix: {
            handle: { query: queryNoSpaces, boost: 8 },
          },
        },
      );
    }

    must.push({
      function_score: {
        query: {
          bool: {
            should: shouldClauses,
            minimum_should_match: 1,
          },
        },
        functions: [
          {
            field_value_factor: {
              field: "followerCount",
              factor: 0.0001,
              modifier: "sqrt",
              missing: 1,
            },
          },
        ],
        boost_mode: "multiply",
      },
    });
  }

  // Platform filter
  if (params.filters?.platform?.length) {
    filter.push({
      terms: { platform: params.filters.platform.map((p) => p.toUpperCase()) },
    });
  }

  // Country filter
  if (params.filters?.country?.length) {
    filter.push({
      terms: { country: params.filters.country },
    });
  }

  // Language filter
  if (params.filters?.language?.length) {
    filter.push({
      terms: { language_code: params.filters.language },
    });
  }

  // Categories filter
  if (params.filters?.categories?.length) {
    filter.push({
      terms: { categories: params.filters.categories },
    });
  }

  // Boolean filters
  if (params.filters?.madeForKids !== undefined) {
    filter.push({
      term: { madeForKids: params.filters.madeForKids },
    });
  }

  if (params.filters?.claimed !== undefined) {
    filter.push({
      term: { claimed: params.filters.claimed },
    });
  }

  // Range filters
  if (params.filters?.followers) {
    const range = parseRange(params.filters.followers);
    if (range) {
      filter.push({
        range: {
          followerCount: {
            gte: range.min,
            ...(range.max < Number.MAX_SAFE_INTEGER && { lt: range.max }),
          },
        },
      });
    }
  }

  if (params.filters?.rating) {
    const range = parseRange(params.filters.rating);
    if (range) {
      filter.push({
        range: {
          rating: {
            gte: range.min,
            ...(range.max < Number.MAX_SAFE_INTEGER && { lte: range.max }),
          },
        },
      });
    }
  }

  if (params.filters?.reviewCount) {
    const range = parseRange(params.filters.reviewCount);
    if (range) {
      filter.push({
        range: {
          reviewCount: {
            gte: range.min,
            ...(range.max < Number.MAX_SAFE_INTEGER && { lt: range.max }),
          },
        },
      });
    }
  }

  if (params.filters?.videoCount) {
    const range = parseRange(params.filters.videoCount);
    if (range) {
      filter.push({
        range: {
          videoCount: {
            gte: range.min,
            ...(range.max < Number.MAX_SAFE_INTEGER && { lt: range.max }),
          },
        },
      });
    }
  }

  return {
    bool: {
      must: must.length > 0 ? must : [{ match_all: {} }],
      filter,
    },
  };
}

/**
 * Map frontend sort field names to actual Elasticsearch field names.
 * The frontend sends semantic names like "followed" or "rated" from URL params,
 * but ES needs the actual document field names.
 */
const SORT_FIELD_MAP: Record<string, string> = {
  followed: "followerCount",
  followerCount: "followerCount",
  "new-account": "createdDate",
  createdDate: "createdDate",
  rated: "rating",
  rating: "rating",
  "review-count": "reviewCount",
  reviewCount: "reviewCount",
  videos: "videoCount",
  videoCount: "videoCount",
};

/**
 * Build sort configuration.
 * User's explicit sort choice is always primary.
 * Relevance (_score) is used as tiebreaker when there's a search query.
 * The function_score in buildQuery already incorporates follower count
 * into relevance, so results are well-ordered even without _score as primary.
 */
function buildSort(params: SearchAccountsParams): any[] {
  const rawField = params.sortBy || "followerCount";
  const sortField = SORT_FIELD_MAP[rawField] || rawField;
  const sortOrder = params.sortOrder || "desc";

  const sort: any[] = [
    { [sortField]: { order: sortOrder, unmapped_type: "long" } },
  ];

  // Add relevance as tiebreaker when there's a search query
  if (params.query && params.query.trim()) {
    sort.push({ _score: "desc" });
  }

  return sort;
}

/**
 * Transform Elasticsearch aggregations to Algolia-style facets
 */
function transformAggregations(
  aggregations: Record<string, estypes.AggregationsAggregate> | undefined,
): SearchAccountsResult["facets"] {
  if (!aggregations) return {};

  const facets: SearchAccountsResult["facets"] = {};

  const aggKeys = [
    "platform",
    "categories",
    "country",
    "language_code",
    "madeForKids",
  ];

  for (const key of aggKeys) {
    const agg = aggregations[key] as any;
    if (agg?.buckets) {
      facets[key as keyof typeof facets] = {};
      for (const bucket of agg.buckets) {
        const bucketKey =
          typeof bucket.key === "boolean" ? String(bucket.key) : bucket.key;
        facets[key as keyof typeof facets]![bucketKey] = bucket.doc_count;
      }
    }
  }

  return facets;
}

/**
 * Search accounts - main search function
 * Drop-in replacement for Algolia's getSearchAccounts
 */
export async function searchAccounts(
  params: SearchAccountsParams,
): Promise<SearchAccountsResult> {
  const client = getElasticsearchClient();
  const startTime = Date.now();

  const page = params.page || 1;
  const limit = Math.min(params.limit || 20, 100);
  const from = (page - 1) * limit;

  try {
    const response: estypes.SearchResponse = await client.search({
      index: ACCOUNTS_INDEX,
      body: {
        query: buildQuery(params),
        sort: buildSort(params),
        from,
        size: limit,
        aggs: {
          platform: { terms: { field: "platform", size: 10 } },
          categories: { terms: { field: "categories", size: 50 } },
          country: { terms: { field: "country", size: 50 } },
          language_code: { terms: { field: "language_code", size: 30 } },
          madeForKids: { terms: { field: "madeForKids", size: 2 } },
        },
        track_total_hits: true,
      },
    });

    const totalHits =
      typeof response.hits.total === "number"
        ? response.hits.total
        : response.hits.total?.value || 0;

    const hits = response.hits.hits.map((hit) => ({
      objectID: hit._id,
      ...(hit._source as Record<string, unknown>),
    }));

    return {
      hits,
      nbHits: totalHits,
      page,
      nbPages: Math.ceil(totalHits / limit),
      hitsPerPage: limit,
      facets: transformAggregations(response.aggregations),
      processingTimeMS: Date.now() - startTime,
    };
  } catch (error) {
    console.error("Elasticsearch search error:", error);
    throw error;
  }
}

/**
 * Index a single document
 */
export async function indexAccount(account: any): Promise<void> {
  const client = getElasticsearchClient();

  await client.index({
    index: ACCOUNTS_INDEX,
    id: account.objectID || account.accountId,
    body: account,
    refresh: true,
  });
}

/**
 * Bulk index multiple documents
 */
export async function bulkIndexAccounts(accounts: any[]): Promise<void> {
  const client = getElasticsearchClient();

  const operations = accounts.flatMap((account) => [
    {
      index: {
        _index: ACCOUNTS_INDEX,
        _id: account.objectID || account.accountId,
      },
    },
    account,
  ]);

  const response = await client.bulk({ body: operations, refresh: true });

  if (response.errors) {
    const errors = response.items
      .filter((item) => item.index?.error)
      .map((item) => item.index?.error);
    console.error("Bulk indexing errors:", errors);
    throw new Error(`Bulk indexing failed with ${errors.length} errors`);
  }
}

/**
 * Update a document partially (for rating updates)
 */
export async function updateAccount(
  accountId: string,
  updates: Partial<any>,
): Promise<void> {
  const client = getElasticsearchClient();

  await client.update({
    index: ACCOUNTS_INDEX,
    id: accountId,
    body: {
      doc: {
        ...updates,
        lastIndexedAt: new Date().toISOString(),
      },
    },
    refresh: true,
  });
}

/**
 * Delete a document
 */
export async function deleteAccount(accountId: string): Promise<void> {
  const client = getElasticsearchClient();

  await client.delete({
    index: ACCOUNTS_INDEX,
    id: accountId,
    refresh: true,
  });
}

/**
 * Search categories
 */
export async function searchCategories(query: string): Promise<any[]> {
  const client = getElasticsearchClient();

  const response = await client.search({
    index: CATEGORIES_INDEX,
    body: {
      query: {
        multi_match: {
          query,
          fields: [
            "name^5",
            "keywords^2",
            "shortDescription",
            "longDescription",
            "parentCategory",
          ],
          type: "best_fields",
          fuzziness: "AUTO",
        },
      },
      size: 20,
    },
  });

  return response.hits.hits.map((hit) => ({
    objectID: hit._id,
    ...(hit._source as Record<string, unknown>),
  }));
}

/**
 * Create indices with proper mappings
 */
export async function createIndices(): Promise<void> {
  const client = getElasticsearchClient();

  // Accounts index
  const accountsExists = await client.indices.exists({ index: ACCOUNTS_INDEX });
  if (!accountsExists) {
    await client.indices.create({
      index: ACCOUNTS_INDEX,
      body: {
        settings: {
          analysis: {
            analyzer: {
              autocomplete: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase", "autocomplete_filter"],
              },
              autocomplete_search: {
                type: "custom",
                tokenizer: "standard",
                filter: ["lowercase"],
              },
            },
            filter: {
              autocomplete_filter: {
                type: "edge_ngram",
                min_gram: 1,
                max_gram: 20,
              },
            },
          },
        },
        mappings: {
          properties: {
            objectID: { type: "keyword" },
            platform: { type: "keyword" },
            accountId: { type: "keyword" },
            handle: {
              type: "text",
              analyzer: "autocomplete",
              search_analyzer: "autocomplete_search",
              fields: { keyword: { type: "keyword" } },
            },
            name: {
              type: "text",
              analyzer: "autocomplete",
              search_analyzer: "autocomplete_search",
              fields: { keyword: { type: "keyword" } },
            },
            name_en: {
              type: "text",
              analyzer: "autocomplete",
              search_analyzer: "autocomplete_search",
            },
            description: { type: "text" },
            description_en: { type: "text" },
            keywords: { type: "text" },
            keywords_en: { type: "text" },
            imageUrl: { type: "keyword", index: false },
            bannerUrl: { type: "keyword", index: false },
            followerCount: { type: "long" },
            country: { type: "keyword" },
            language_code: { type: "keyword" },
            rating: { type: "float" },
            reviewCount: { type: "integer" },
            madeForKids: { type: "boolean" },
            claimed: { type: "boolean" },
            videoCount: { type: "integer" },
            viewCount: { type: "long" },
            categories: { type: "keyword" },
            categoryNames: { type: "text" },
            createdDate: { type: "date" },
            isSeeded: { type: "boolean" },
            lastIndexedAt: { type: "date" },
          },
        },
      },
    });
    console.log(`Created index: ${ACCOUNTS_INDEX}`);
  }

  // Categories index
  const categoriesExists = await client.indices.exists({
    index: CATEGORIES_INDEX,
  });
  if (!categoriesExists) {
    await client.indices.create({
      index: CATEGORIES_INDEX,
      body: {
        settings: {},
        mappings: {
          properties: {
            objectID: { type: "keyword" },
            name: { type: "text", fields: { keyword: { type: "keyword" } } },
            slug: { type: "keyword" },
            shortDescription: { type: "text" },
            longDescription: { type: "text" },
            keywords: { type: "text" },
            parentId: { type: "keyword" },
            parentCategory: { type: "text" },
            popular: { type: "boolean" },
            depth: { type: "integer" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" },
          },
        },
      },
    });
    console.log(`Created index: ${CATEGORIES_INDEX}`);
  }
}

/**
 * Check cluster health
 */
export async function checkHealth(): Promise<{
  status: string;
  available: boolean;
}> {
  try {
    const client = getElasticsearchClient();
    const health = await client.cluster.health();
    return {
      status: health.status,
      available: health.status !== "red",
    };
  } catch (error) {
    return {
      status: "unavailable",
      available: false,
    };
  }
}
