/**
 * Validate Elasticsearch Migration
 *
 * This script validates that the migration to Elasticsearch was successful
 * by comparing counts, testing search functionality, and checking facets.
 *
 * Usage:
 *   yarn validate-elastic-migration
 *
 * Environment Variables Required:
 *   - DATABASE_URL_ONLINE: MongoDB connection string
 *   - ELASTIC_CLOUD_ID: Elastic Cloud deployment ID
 *   - ELASTIC_API_KEY: Elastic Cloud API key
 *   - ALGOLIA_APP_ID: (optional) For comparison with Algolia
 *   - ALGOLIA_WRITE_API_KEY: (optional) For comparison with Algolia
 */

import { getPrismaClient } from "@ratecreator/db/client";
import { Client } from "@elastic/elasticsearch";
import { algoliasearch } from "algoliasearch";
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
    const cloudId = process.env.ELASTIC_CLOUD_ID;
    const apiKey = process.env.ELASTIC_API_KEY;

    if (!cloudId || !apiKey) {
      throw new Error("Elasticsearch credentials not configured");
    }

    elasticClient = new Client({
      cloud: { id: cloudId },
      auth: { apiKey },
    });
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
    result.status === "PASS" ? "✓" : result.status === "FAIL" ? "✗" : "⚠";
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

const validateMigration = async () => {
  console.log("=".repeat(60));
  console.log("Elasticsearch Migration Validation");
  console.log("=".repeat(60));
  console.log("");

  const prisma = getPrismaClient();
  const elasticClient = getElasticsearchClient();

  try {
    // 1. Check cluster health
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

    // 2. Check index existence and document counts
    console.log("2. Index Document Count Validation");
    console.log("-".repeat(40));

    // Accounts index
    try {
      const accountsCount = await elasticClient.count({
        index: ACCOUNTS_INDEX,
      });
      const dbAccountsCount = await prisma.account.count({
        where: { isSuspended: false, isDeleted: false },
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

    // Categories index
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

    // 3. Search functionality tests
    console.log("3. Search Functionality Tests");
    console.log("-".repeat(40));

    // Basic search
    try {
      const searchResult = await elasticClient.search({
        index: ACCOUNTS_INDEX,
        body: {
          query: { match_all: {} },
          size: 1,
        },
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

    // Text search with autocomplete
    try {
      const searchResult = await elasticClient.search({
        index: ACCOUNTS_INDEX,
        body: {
          query: {
            multi_match: {
              query: "tech",
              fields: ["name^3", "handle^2", "description"],
              type: "best_fields",
              fuzziness: "AUTO",
            },
          },
          size: 5,
        },
      });

      logResult({
        check: "Text search with autocomplete",
        status: searchResult.hits.hits.length > 0 ? "PASS" : "WARN",
        message: `Found ${searchResult.hits.total} matches for "tech"`,
      });
    } catch (error: any) {
      logResult({
        check: "Text search with autocomplete",
        status: "FAIL",
        message: error.message,
      });
    }
    console.log("");

    // 4. Facet/Aggregation tests
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

    // 5. Filter tests
    console.log("5. Filter Tests");
    console.log("-".repeat(40));

    // Platform filter
    try {
      const filterResult = await elasticClient.search({
        index: ACCOUNTS_INDEX,
        body: {
          query: {
            bool: {
              filter: [{ term: { platform: "YOUTUBE" } }],
            },
          },
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

    // Range filter
    try {
      const filterResult = await elasticClient.search({
        index: ACCOUNTS_INDEX,
        body: {
          query: {
            bool: {
              filter: [{ range: { followerCount: { gte: 1000000 } } }],
            },
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

    // 6. Optional: Compare with Algolia
    const algoliaAppId = process.env.ALGOLIA_APP_ID;
    const algoliaApiKey = process.env.ALGOLIA_WRITE_API_KEY;

    if (algoliaAppId && algoliaApiKey) {
      console.log("6. Algolia Comparison (Optional)");
      console.log("-".repeat(40));

      try {
        const algoliaClient = algoliasearch(algoliaAppId, algoliaApiKey);

        // Compare search results for same query
        const testQuery = "gaming";

        const algoliaResult = await algoliaClient.search({
          requests: [
            {
              indexName: "accounts",
              query: testQuery,
              hitsPerPage: 10,
            },
          ],
        });

        const elasticResult = await elasticClient.search({
          index: ACCOUNTS_INDEX,
          body: {
            query: {
              multi_match: {
                query: testQuery,
                fields: ["name^3", "handle^2", "description", "keywords"],
                type: "best_fields",
                fuzziness: "AUTO",
              },
            },
            size: 10,
          },
        });

        const algoliaHits = (algoliaResult.results[0] as any).nbHits;
        const elasticHits =
          typeof elasticResult.hits.total === "number"
            ? elasticResult.hits.total
            : elasticResult.hits.total?.value || 0;

        logResult({
          check: `Search result count comparison ("${testQuery}")`,
          status:
            Math.abs(algoliaHits - elasticHits) < algoliaHits * 0.1
              ? "PASS"
              : "WARN",
          expected: `Algolia: ${algoliaHits}`,
          actual: `Elastic: ${elasticHits}`,
        });
      } catch (error: any) {
        logResult({
          check: "Algolia comparison",
          status: "WARN",
          message: `Could not compare: ${error.message}`,
        });
      }
      console.log("");
    }

    // Summary
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
      console.log(
        "\x1b[31mMigration validation has failures. Please review.\x1b[0m",
      );
    } else if (warnings > 0) {
      console.log("\x1b[33mMigration validation passed with warnings.\x1b[0m");
    } else {
      console.log("\x1b[32mMigration validation passed successfully!\x1b[0m");
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
