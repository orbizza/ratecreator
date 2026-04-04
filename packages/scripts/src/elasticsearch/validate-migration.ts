/**
 * Validate Elasticsearch Migration & Search Quality
 *
 * Validates index health, document counts, facets, filters, AND search quality.
 * Includes test cases that verify AND semantics, relevance ranking, fuzziness,
 * and infix matching.
 *
 * Usage:
 *   yarn validate-elastic-migration
 *
 * Environment Variables Required:
 *   - DATABASE_URL_ONLINE: MongoDB connection string
 *   - ELASTIC_CLOUD_ID: Elastic Cloud deployment ID
 *   - ELASTIC_API_KEY: Elastic Cloud API key
 */

import { getPrismaClient } from "@ratecreator/db/client";
import { Client, type ClientOptions } from "@opensearch-project/opensearch";
import dotenv from "dotenv";
import path from "path";

// Load the main .env file
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const ACCOUNTS_INDEX = process.env.ELASTIC_ACCOUNTS_INDEX || "accounts";
const CATEGORIES_INDEX = process.env.ELASTIC_CATEGORIES_INDEX || "categories";

// Elasticsearch client singleton
let elasticClient: Client | null = null;

function getElasticsearchClient(): Client {
  if (!elasticClient) {
    const url = process.env.ELASTIC_URL;
    const username = process.env.ELASTIC_USERNAME;
    const password = process.env.ELASTIC_PASSWORD;

    if (!url) throw new Error("ELASTIC_URL not configured");
    const opts: ClientOptions = {
      node: url,
      ssl: { rejectUnauthorized: false },
      ...(username && password ? { auth: { username, password } } : {}),
    };
    elasticClient = new Client(opts);
  }
  return elasticClient;
}

interface ValidationResult {
  check: string;
  status: "PASS" | "FAIL" | "WARN";
  expected?: number | string;
  actual?: number | string;
  message?: string;
}

const results: ValidationResult[] = [];

const logResult = (result: ValidationResult) => {
  results.push(result);
  const icon =
    result.status === "PASS"
      ? "\u2713"
      : result.status === "FAIL"
        ? "\u2717"
        : "\u26a0";
  const color =
    result.status === "PASS"
      ? "\x1b[32m"
      : result.status === "FAIL"
        ? "\x1b[31m"
        : "\x1b[33m";
  console.log(`${color}${icon}\x1b[0m ${result.check}`);
  if (result.expected !== undefined || result.actual !== undefined) {
    console.log(`    Expected: ${result.expected}, Actual: ${result.actual}`);
  }
  if (result.message) {
    console.log(`    ${result.message}`);
  }
};

/**
 * Run a search using the same query structure as the production ES client.
 * This mirrors buildQuery() from elasticsearch-client.ts.
 */
async function searchWithQuery(
  client: Client,
  query: string,
  size: number = 10,
): Promise<{ totalHits: number; hits: any[]; took: number }> {
  const terms = query.split(/\s+/).filter((t) => t.length > 0);
  const queryNoSpaces = query.replace(/\s+/g, "");

  const searchFields = [
    "name^5",
    "handle^4",
    "keywords^2",
    "categoryNames^2",
    "description",
    "platform",
    "language_code",
    "country",
  ];

  // MUST layer — AND semantics
  let mustClause: any;
  if (terms.length > 1) {
    mustClause = {
      bool: {
        must: terms.map((term) => ({
          bool: {
            should: [
              { multi_match: { query: term, fields: searchFields } },
              { match_phrase_prefix: { name: { query: term } } },
              { match_phrase_prefix: { handle: { query: term } } },
            ],
            minimum_should_match: 1,
          },
        })),
      },
    };
  } else {
    mustClause = {
      bool: {
        should: [
          { multi_match: { query, fields: searchFields } },
          { match_phrase_prefix: { name: { query } } },
          { match_phrase_prefix: { handle: { query } } },
          { match: { "name.infix": { query } } },
          { match: { "handle.infix": { query } } },
        ],
        minimum_should_match: 1,
      },
    };
  }

  // SHOULD layer — relevance boosting
  const shouldClauses: any[] = [
    { match: { "name.exact": { query, boost: 200 } } },
    { match: { "handle.exact": { query, boost: 200 } } },
    { match_phrase: { name: { query, boost: 50 } } },
    { match_phrase: { handle: { query, boost: 50 } } },
    { match_phrase_prefix: { name: { query, boost: 20 } } },
    { match_phrase_prefix: { handle: { query, boost: 20 } } },
    { match: { "name.infix": { query, boost: 5 } } },
    { match: { "handle.infix": { query, boost: 5 } } },
    {
      multi_match: {
        query,
        fields: ["name^3", "handle^2"],
        type: "best_fields",
        fuzziness: "AUTO:5,8",
        prefix_length: 2,
        boost: 0.3,
      },
    },
  ];

  if (terms.length > 1) {
    shouldClauses.push(
      { match: { "name.exact": { query: queryNoSpaces, boost: 200 } } },
      { match: { "handle.exact": { query: queryNoSpaces, boost: 200 } } },
      { match_phrase_prefix: { name: { query: queryNoSpaces, boost: 20 } } },
      { match_phrase_prefix: { handle: { query: queryNoSpaces, boost: 20 } } },
    );
  }

  const response = await client.search({
    index: ACCOUNTS_INDEX,
    body: {
      query: {
        function_score: {
          query: {
            bool: {
              must: [mustClause],
              should: shouldClauses,
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
      },
      sort: [{ _score: "desc" }, { followerCount: { order: "desc" } }],
      size,
      track_total_hits: true,
    },
  });

  const totalHits =
    typeof response.hits.total === "number"
      ? response.hits.total
      : response.hits.total?.value || 0;

  return {
    totalHits,
    hits: response.hits.hits.map((hit) => ({
      ...(hit._source as any),
      _score: hit._score,
    })),
    took: response.took,
  };
}

const validateMigration = async () => {
  console.log("=".repeat(60));
  console.log("Elasticsearch Migration & Search Quality Validation");
  console.log("=".repeat(60));
  console.log("");

  const prisma = getPrismaClient();
  const elasticClient = getElasticsearchClient();

  try {
    // ── 1. Cluster Health ────────────────────────────────────
    console.log("1. Cluster Health Check");
    console.log("-".repeat(40));
    try {
      const health = await elasticClient.cluster.health();
      logResult({
        check: "Cluster health",
        status:
          health.status === "green"
            ? "PASS"
            : health.status === "yellow"
              ? "WARN"
              : "FAIL",
        actual: health.status,
        message: `${health.number_of_nodes} nodes, ${health.active_primary_shards} primary shards`,
      });
    } catch (error: any) {
      logResult({
        check: "Cluster health",
        status: "FAIL",
        message: error.message,
      });
    }
    console.log("");

    // ── 2. Document Counts ───────────────────────────────────
    console.log("2. Index Document Count Validation");
    console.log("-".repeat(40));

    try {
      const accountsCount = await elasticClient.count({
        index: ACCOUNTS_INDEX,
      });
      const dbAccountsCount = await prisma.account.count({
        where: { isSuspended: false },
      });

      const percentIndexed = (
        (accountsCount.count / dbAccountsCount) *
        100
      ).toFixed(2);
      logResult({
        check: `Accounts index (${ACCOUNTS_INDEX})`,
        status: accountsCount.count >= dbAccountsCount * 0.95 ? "PASS" : "WARN",
        expected: dbAccountsCount,
        actual: accountsCount.count,
        message: `${percentIndexed}% indexed`,
      });
    } catch (error: any) {
      logResult({
        check: `Accounts index (${ACCOUNTS_INDEX})`,
        status: "FAIL",
        message: error.message,
      });
    }

    try {
      const categoriesCount = await elasticClient.count({
        index: CATEGORIES_INDEX,
      });
      const dbCategoriesCount = await prisma.category.count();

      logResult({
        check: `Categories index (${CATEGORIES_INDEX})`,
        status: categoriesCount.count === dbCategoriesCount ? "PASS" : "WARN",
        expected: dbCategoriesCount,
        actual: categoriesCount.count,
      });
    } catch (error: any) {
      logResult({
        check: `Categories index (${CATEGORIES_INDEX})`,
        status: "FAIL",
        message: error.message,
      });
    }
    console.log("");

    // ── 3. Basic Search ──────────────────────────────────────
    console.log("3. Basic Search Tests");
    console.log("-".repeat(40));

    try {
      const searchResult = await elasticClient.search({
        index: ACCOUNTS_INDEX,
        body: { query: { match_all: {} }, size: 1 },
      });

      logResult({
        check: "Basic search (match_all)",
        status: searchResult.hits.hits.length > 0 ? "PASS" : "FAIL",
        message: `Returned ${searchResult.hits.hits.length} results`,
      });
    } catch (error: any) {
      logResult({
        check: "Basic search (match_all)",
        status: "FAIL",
        message: error.message,
      });
    }
    console.log("");

    // ── 4. Aggregation Tests ─────────────────────────────────
    console.log("4. Aggregation (Facet) Tests");
    console.log("-".repeat(40));

    try {
      const aggResult = await elasticClient.search({
        index: ACCOUNTS_INDEX,
        body: {
          size: 0,
          aggs: {
            platforms: { terms: { field: "platform", size: 10 } },
            countries: { terms: { field: "country", size: 10 } },
            languages: { terms: { field: "language_code", size: 10 } },
            categories: { terms: { field: "categories", size: 20 } },
          },
        },
      });

      const platforms =
        (aggResult.aggregations?.platforms as any)?.buckets || [];
      const countries =
        (aggResult.aggregations?.countries as any)?.buckets || [];
      const categories =
        (aggResult.aggregations?.categories as any)?.buckets || [];

      logResult({
        check: "Platform aggregation",
        status: platforms.length > 0 ? "PASS" : "WARN",
        message: `Found ${platforms.length} platforms: ${platforms.map((b: any) => b.key).join(", ")}`,
      });

      logResult({
        check: "Country aggregation",
        status: countries.length > 0 ? "PASS" : "WARN",
        message: `Found ${countries.length} countries`,
      });

      logResult({
        check: "Categories aggregation",
        status: categories.length > 0 ? "PASS" : "WARN",
        message: `Found ${categories.length} category facets`,
      });
    } catch (error: any) {
      logResult({
        check: "Aggregations",
        status: "FAIL",
        message: error.message,
      });
    }
    console.log("");

    // ── 5. Filter Tests ──────────────────────────────────────
    console.log("5. Filter Tests");
    console.log("-".repeat(40));

    try {
      const filterResult = await elasticClient.search({
        index: ACCOUNTS_INDEX,
        body: {
          query: { bool: { filter: [{ term: { platform: "YOUTUBE" } }] } },
          size: 1,
        },
      });

      const totalHits =
        typeof filterResult.hits.total === "number"
          ? filterResult.hits.total
          : filterResult.hits.total?.value || 0;

      logResult({
        check: "Platform filter (YOUTUBE)",
        status: totalHits > 0 ? "PASS" : "WARN",
        message: `Found ${totalHits} YouTube accounts`,
      });
    } catch (error: any) {
      logResult({
        check: "Platform filter",
        status: "FAIL",
        message: error.message,
      });
    }

    try {
      const filterResult = await elasticClient.search({
        index: ACCOUNTS_INDEX,
        body: {
          query: {
            bool: { filter: [{ range: { followerCount: { gte: 1000000 } } }] },
          },
          size: 1,
        },
      });

      const totalHits =
        typeof filterResult.hits.total === "number"
          ? filterResult.hits.total
          : filterResult.hits.total?.value || 0;

      logResult({
        check: "Range filter (followers >= 1M)",
        status: totalHits > 0 ? "PASS" : "WARN",
        message: `Found ${totalHits} accounts with 1M+ followers`,
      });
    } catch (error: any) {
      logResult({
        check: "Range filter",
        status: "FAIL",
        message: error.message,
      });
    }
    console.log("");

    // ── 6. Search Quality Tests ──────────────────────────────
    console.log("6. Search Quality Tests");
    console.log("-".repeat(40));

    const qualityTests = [
      {
        name: 'AND semantics: "ai skills"',
        query: "ai skills",
        check: (result: { totalHits: number; hits: any[] }) => {
          if (result.totalHits > 500) {
            return {
              status: "FAIL" as const,
              message: `Expected < 500, got ${result.totalHits}. AND semantics not working — OR semantics returning too many results`,
            };
          }
          return {
            status: "PASS" as const,
            message: `${result.totalHits} results (< 500 threshold)`,
          };
        },
      },
      {
        name: 'No false fuzziness: "sony"',
        query: "sony",
        check: (result: { totalHits: number; hits: any[] }) => {
          if (result.totalHits > 1000) {
            return {
              status: "FAIL" as const,
              message: `Expected < 1000, got ${result.totalHits}. Fuzziness matching "song" etc.`,
            };
          }
          return {
            status: "PASS" as const,
            message: `${result.totalHits} results (< 1000 threshold)`,
          };
        },
      },
      {
        name: 'Exact match ranking: "tseries"',
        query: "tseries",
        check: (result: { totalHits: number; hits: any[] }) => {
          if (result.hits.length === 0) {
            return { status: "WARN" as const, message: "No results" };
          }
          const topHandle = result.hits[0]?.handle?.toLowerCase();
          const topName = result.hits[0]?.name?.toLowerCase();
          if (
            topHandle?.includes("tseries") ||
            topName?.includes("tseries") ||
            topName?.includes("t-series")
          ) {
            return {
              status: "PASS" as const,
              message: `Top result: ${result.hits[0]?.name} (@${result.hits[0]?.handle})`,
            };
          }
          return {
            status: "WARN" as const,
            message: `Top result is ${result.hits[0]?.name} — expected T-Series`,
          };
        },
      },
      {
        name: 'Multi-word concatenation: "mr beast"',
        query: "mr beast",
        check: (result: { totalHits: number; hits: any[] }) => {
          if (result.hits.length === 0) {
            return { status: "WARN" as const, message: "No results" };
          }
          const topName = result.hits[0]?.name?.toLowerCase();
          const topHandle = result.hits[0]?.handle?.toLowerCase();
          if (topName?.includes("mrbeast") || topHandle?.includes("mrbeast")) {
            return {
              status: "PASS" as const,
              message: `Top result: ${result.hits[0]?.name} (@${result.hits[0]?.handle})`,
            };
          }
          return {
            status: "WARN" as const,
            message: `Top result is ${result.hits[0]?.name} — expected MrBeast`,
          };
        },
      },
      {
        name: 'Infix matching: "beast" (post-reindex)',
        query: "beast",
        check: (result: { totalHits: number; hits: any[] }) => {
          const hasMrBeast = result.hits.some(
            (h) =>
              h.name?.toLowerCase().includes("mrbeast") ||
              h.handle?.toLowerCase().includes("mrbeast"),
          );
          if (hasMrBeast) {
            return {
              status: "PASS" as const,
              message: `MrBeast found in top ${result.hits.length} results (infix matching works)`,
            };
          }
          return {
            status: "WARN" as const,
            message: `MrBeast not in top results — infix fields may not exist yet (pre-reindex)`,
          };
        },
      },
      {
        name: "Search latency",
        query: "tech review",
        check: (result: { totalHits: number; hits: any[]; took: number }) => {
          if (result.took > 200) {
            return {
              status: "WARN" as const,
              message: `${result.took}ms (> 200ms threshold)`,
            };
          }
          return {
            status: "PASS" as const,
            message: `${result.took}ms`,
          };
        },
      },
    ];

    for (const test of qualityTests) {
      try {
        const result = await searchWithQuery(elasticClient, test.query, 10);
        const checkResult = test.check(result);
        logResult({
          check: test.name,
          status: checkResult.status,
          message: checkResult.message,
        });
      } catch (error: any) {
        logResult({
          check: test.name,
          status: "FAIL",
          message: error.message,
        });
      }
    }
    console.log("");

    // ── Summary ──────────────────────────────────────────────
    console.log("=".repeat(60));
    console.log("VALIDATION SUMMARY");
    console.log("=".repeat(60));

    const passed = results.filter((r) => r.status === "PASS").length;
    const failed = results.filter((r) => r.status === "FAIL").length;
    const warnings = results.filter((r) => r.status === "WARN").length;

    console.log(`\x1b[32mPassed: ${passed}\x1b[0m`);
    console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
    console.log(`\x1b[33mWarnings: ${warnings}\x1b[0m`);
    console.log("");

    if (failed > 0) {
      console.log("\x1b[31mValidation has failures. Please review.\x1b[0m");
    } else if (warnings > 0) {
      console.log("\x1b[33mValidation passed with warnings.\x1b[0m");
    } else {
      console.log("\x1b[32mValidation passed successfully!\x1b[0m");
    }
  } catch (error) {
    console.error("\nFatal error:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
};

// Run validation
validateMigration();
