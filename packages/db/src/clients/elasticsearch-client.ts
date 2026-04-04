/**
 * Elasticsearch Client for Elastic Cloud on GCP
 *
 * Provides search functionality as a drop-in replacement for Algolia.
 * Supports full-text search, faceted filtering, and range queries.
 *
 * Search architecture:
 *   - MUST layer: AND semantics — every search term must match somewhere
 *   - SHOULD layer: Relevance boosting — exact, phrase, infix, fuzzy matches
 *   - FILTER layer: Faceted filters (platform, country, range, etc.)
 *   - function_score: Popularity boost via followerCount
 */

import { Client, type ClientOptions } from "@opensearch-project/opensearch";

// Singleton client instance
let elasticClient: Client | null = null;

/**
 * Get or create OpenSearch client.
 *
 * Connection modes:
 *   1. URL + basic auth (ELASTIC_URL + ELASTIC_USERNAME + ELASTIC_PASSWORD)
 *   2. URL only, no auth (ELASTIC_URL with security disabled)
 */
export function getElasticsearchClient(): Client {
  if (!elasticClient) {
    const url = process.env.ELASTIC_URL;
    const username = process.env.ELASTIC_USERNAME;
    const password = process.env.ELASTIC_PASSWORD;

    if (!url) {
      throw new Error(
        "OpenSearch not configured. Set ELASTIC_URL (and ELASTIC_USERNAME + ELASTIC_PASSWORD for auth)",
      );
    }

    const opts: ClientOptions = {
      node: url,
      ssl: { rejectUnauthorized: false },
      ...(username && password ? { auth: { username, password } } : {}),
    };

    elasticClient = new Client(opts);
  }

  return elasticClient;
}

// Index names
const ACCOUNTS_INDEX = process.env.ELASTIC_ACCOUNTS_INDEX || "accounts";
const CATEGORIES_INDEX = process.env.ELASTIC_CATEGORIES_INDEX || "categories";

/**
 * Search feature flags — tune search behavior without code changes.
 * All default to enabled if the env var is not set.
 */
const SEARCH_CONFIG = {
  enableFuzzy: process.env.SEARCH_ENABLE_FUZZY !== "false",
  enableInfix: process.env.SEARCH_ENABLE_INFIX !== "false",
  enablePopularityBoost: process.env.SEARCH_ENABLE_POPULARITY_BOOST !== "false",
  fuzzyThreshold: process.env.SEARCH_FUZZY_THRESHOLD || "5,8",
  fuzzyPrefixLength: parseInt(
    process.env.SEARCH_FUZZY_PREFIX_LENGTH || "2",
    10,
  ),
  infixMinQueryLength: parseInt(
    process.env.SEARCH_INFIX_MIN_QUERY_LENGTH || "4",
    10,
  ),
  popularityFactor: parseFloat(
    process.env.SEARCH_POPULARITY_FACTOR || "0.0001",
  ),
  popularityModifier: process.env.SEARCH_POPULARITY_MODIFIER || "sqrt",
};

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
 * Searchable fields ordered by priority (matching Algolia's configuration).
 * Boosts match Algolia's ordered/unordered attribute priority.
 */
const SEARCH_FIELDS = [
  "name^5",
  "handle^4",
  "keywords^2",
  "categoryNames^2",
  "description",
  "platform",
  "language_code",
  "country",
];

/**
 * Build Elasticsearch query from search parameters.
 *
 * Architecture:
 *   function_score {
 *     query: bool {
 *       must:   AND semantics — each term must match somewhere
 *       should: Relevance boosting — exact/phrase/infix/fuzzy
 *       filter: Faceted filters
 *     }
 *     functions: popularity boost (followerCount)
 *   }
 */
function buildQuery(params: SearchAccountsParams): any {
  const filter: any[] = [];

  // ── Filters (unchanged from previous implementation) ───────

  if (params.filters?.platform?.length) {
    filter.push({
      terms: { platform: params.filters.platform.map((p) => p.toUpperCase()) },
    });
  }

  if (params.filters?.country?.length) {
    filter.push({
      terms: { country: params.filters.country },
    });
  }

  if (params.filters?.language?.length) {
    filter.push({
      terms: { language_code: params.filters.language },
    });
  }

  if (params.filters?.categories?.length) {
    filter.push({
      terms: { categories: params.filters.categories },
    });
  }

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

  // ── No query: match all with filters ───────────────────────

  if (!params.query || !params.query.trim()) {
    return {
      bool: {
        must: [{ match_all: {} }],
        filter,
      },
    };
  }

  // ── Full-text search query ─────────────────────────────────

  const query = params.query.trim();
  const queryNoSpaces = query.replace(/\s+/g, "");
  const terms = query.split(/\s+/).filter((t) => t.length > 0);

  // LAYER 1: MUST — AND semantics (filters out non-matching docs)
  let mustClause: any;

  if (terms.length > 1) {
    // Multi-word: EACH term must match in at least one field
    mustClause = {
      bool: {
        must: terms.map((term) => ({
          bool: {
            should: [
              { multi_match: { query: term, fields: SEARCH_FIELDS } },
              { match_phrase_prefix: { name: { query: term } } },
              { match_phrase_prefix: { handle: { query: term } } },
            ],
            minimum_should_match: 1,
          },
        })),
      },
    };
  } else {
    // Single-word: term must match in at least one field
    const singleWordShould: any[] = [
      { multi_match: { query, fields: SEARCH_FIELDS } },
      { match_phrase_prefix: { name: { query } } },
      { match_phrase_prefix: { handle: { query } } },
    ];

    // Infix matching for substrings ("beast" → "MrBeast")
    if (
      SEARCH_CONFIG.enableInfix &&
      query.length >= SEARCH_CONFIG.infixMinQueryLength
    ) {
      singleWordShould.push(
        { match: { "name.infix": { query } } },
        { match: { "handle.infix": { query } } },
      );
    }

    mustClause = {
      bool: {
        should: singleWordShould,
        minimum_should_match: 1,
      },
    };
  }

  // LAYER 2: SHOULD — Relevance boosting (scores matched docs)
  const shouldClauses: any[] = [
    // Exact match on name/handle (boost: 200) — case-insensitive via exact_lowercase analyzer
    { match: { "name.exact": { query, boost: 200 } } },
    { match: { "handle.exact": { query, boost: 200 } } },
    // Phrase match on name/handle (boost: 50) — rewards word-order match
    { match_phrase: { name: { query, boost: 50 } } },
    { match_phrase: { handle: { query, boost: 50 } } },
    // Phrase prefix on name/handle (boost: 20) — handles partial typing
    { match_phrase_prefix: { name: { query, boost: 20 } } },
    { match_phrase_prefix: { handle: { query, boost: 20 } } },
  ];

  // Infix matching (boost: 5) — substring matching via ngram tokens
  if (
    SEARCH_CONFIG.enableInfix &&
    query.length >= SEARCH_CONFIG.infixMinQueryLength
  ) {
    shouldClauses.push(
      { match: { "name.infix": { query, boost: 5 } } },
      { match: { "handle.infix": { query, boost: 5 } } },
    );
  }

  // Fuzzy matching (boost: 0.3) — typo tolerance, gated and conservative
  // AUTO:5,8 = exact for 1-4 chars, fuzziness 1 for 5-7, fuzziness 2 for 8+
  if (SEARCH_CONFIG.enableFuzzy) {
    shouldClauses.push({
      multi_match: {
        query,
        fields: ["name^3", "handle^2"],
        type: "best_fields",
        fuzziness: `AUTO:${SEARCH_CONFIG.fuzzyThreshold}`,
        prefix_length: SEARCH_CONFIG.fuzzyPrefixLength,
        boost: 0.3,
      },
    });
  }

  // Concatenated form for multi-word queries ("mr beast" → "mrbeast")
  if (terms.length > 1) {
    shouldClauses.push(
      { match: { "name.exact": { query: queryNoSpaces, boost: 200 } } },
      { match: { "handle.exact": { query: queryNoSpaces, boost: 200 } } },
      {
        match_phrase_prefix: { name: { query: queryNoSpaces, boost: 20 } },
      },
      {
        match_phrase_prefix: { handle: { query: queryNoSpaces, boost: 20 } },
      },
    );
  }

  return {
    function_score: {
      query: {
        bool: {
          must: [mustClause],
          should: shouldClauses,
          filter,
        },
      },
      functions: SEARCH_CONFIG.enablePopularityBoost
        ? [
            {
              field_value_factor: {
                field: "followerCount",
                factor: SEARCH_CONFIG.popularityFactor,
                modifier: SEARCH_CONFIG.popularityModifier,
                missing: 1,
              },
            },
          ]
        : [],
      boost_mode: "multiply",
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
 * Build sort configuration with smart relevance handling.
 *
 * When user has a search query AND hasn't explicitly changed the sort
 * dropdown (default is "followed"/followerCount), use _score as primary
 * sort so relevance drives the ordering. The function_score already
 * factors in followerCount via field_value_factor, so popular accounts
 * still get boosted within relevance ranking.
 *
 * When user explicitly changes sort (e.g., "rated", "videos"), honor that.
 */
function buildSort(params: SearchAccountsParams): any[] {
  const rawField = params.sortBy || "followerCount";
  const sortField = SORT_FIELD_MAP[rawField] || rawField;
  const sortOrder = params.sortOrder || "desc";

  const hasQuery = params.query && params.query.trim();
  const isDefaultSort = rawField === "followed" || rawField === "followerCount";

  // When searching with default sort, prioritize relevance
  if (hasQuery && isDefaultSort) {
    return [
      { _score: "desc" },
      { followerCount: { order: "desc", unmapped_type: "long" } },
    ];
  }

  // When user explicitly changed sort, honor it
  const sort: any[] = [
    { [sortField]: { order: sortOrder, unmapped_type: "long" } },
  ];

  // Add relevance as tiebreaker when there's a search query
  if (hasQuery) {
    sort.push({ _score: "desc" });
  }

  return sort;
}

/**
 * Transform Elasticsearch aggregations to Algolia-style facets
 */
function transformAggregations(
  aggregations: Record<string, unknown> | undefined,
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
    const agg = aggregations[key] as
      | { buckets: { key: string | boolean; doc_count: number }[] }
      | undefined;
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
    const response = await client.search({
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

    const total = response.body.hits.total;
    const totalHits = typeof total === "number" ? total : total?.value || 0;

    const hits = response.body.hits.hits.map(
      (hit: { _id: string; _source?: Record<string, unknown> }) => ({
        objectID: hit._id,
        ...(hit._source ?? {}),
      }),
    );

    return {
      hits,
      nbHits: totalHits,
      page,
      nbPages: Math.ceil(totalHits / limit),
      hitsPerPage: limit,
      facets: transformAggregations(response.body.aggregations),
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

  if (response.body.errors) {
    const errors = response.body.items
      .filter((item: Record<string, { error?: unknown }>) => item.index?.error)
      .map((item: Record<string, { error?: unknown }>) => item.index?.error);
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

  return response.body.hits.hits.map(
    (hit: { _id: string; _source?: Record<string, unknown> }) => ({
      objectID: hit._id,
      ...(hit._source ?? {}),
    }),
  );
}

/**
 * Accounts index settings — analyzers and field mappings.
 *
 * Analyzers:
 *   - autocomplete: edge_ngram (2-20) for prefix matching
 *   - autocomplete_search: standard tokenizer for search-time (no ngrams)
 *   - infix: ngram (3-8) for substring matching ("beast" → "MrBeast")
 *   - exact_lowercase: keyword + lowercase for case-insensitive exact match
 */
const ACCOUNTS_INDEX_SETTINGS = {
  settings: {
    analysis: {
      analyzer: {
        autocomplete: {
          type: "custom" as const,
          tokenizer: "standard",
          filter: ["lowercase", "autocomplete_filter"],
        },
        autocomplete_search: {
          type: "custom" as const,
          tokenizer: "standard",
          filter: ["lowercase"],
        },
        infix: {
          type: "custom" as const,
          tokenizer: "standard",
          filter: ["lowercase", "infix_filter"],
        },
        exact_lowercase: {
          type: "custom" as const,
          tokenizer: "keyword",
          filter: ["lowercase", "trim"],
        },
      },
      filter: {
        autocomplete_filter: {
          type: "edge_ngram" as const,
          min_gram: 2,
          max_gram: 20,
        },
        infix_filter: {
          type: "ngram" as const,
          min_gram: 4,
          max_gram: 5,
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
        fields: {
          keyword: { type: "keyword" },
          exact: { type: "text", analyzer: "exact_lowercase" },
          infix: {
            type: "text",
            analyzer: "infix",
            search_analyzer: "autocomplete_search",
          },
        },
      },
      name: {
        type: "text",
        analyzer: "autocomplete",
        search_analyzer: "autocomplete_search",
        fields: {
          keyword: { type: "keyword" },
          exact: { type: "text", analyzer: "exact_lowercase" },
          infix: {
            type: "text",
            analyzer: "infix",
            search_analyzer: "autocomplete_search",
          },
        },
      },
      description: { type: "text" },
      keywords: { type: "text" },
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
};

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
      body: ACCOUNTS_INDEX_SETTINGS as any,
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
 * Exported for use by migration/reindex scripts
 */
export { ACCOUNTS_INDEX_SETTINGS };

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
      status: health.body.status,
      available: health.body.status !== "red",
    };
  } catch (error) {
    return {
      status: "unavailable",
      available: false,
    };
  }
}
