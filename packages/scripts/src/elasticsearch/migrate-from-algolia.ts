/**
 * Migrate Data from Algolia to Elasticsearch
 *
 * This script exports data from Algolia and imports it to Elasticsearch.
 * Useful if you want to preserve existing Algolia data exactly as-is.
 *
 * Usage:
 *   yarn migrate-from-algolia
 *   yarn migrate-from-algolia --index accounts
 *   yarn migrate-from-algolia --index categories
 *
 * Environment Variables Required:
 *   - ALGOLIA_APP_ID: Algolia Application ID
 *   - ALGOLIA_WRITE_API_KEY: Algolia API key with read access
 *   - ELASTIC_CLOUD_ID: Elastic Cloud deployment ID
 *   - ELASTIC_API_KEY: Elastic Cloud API key
 */

import { algoliasearch } from "algoliasearch";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load the main .env file
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const ELASTIC_BATCH_SIZE = 500;
const CHECKPOINT_FILE = "algolia_to_elastic_checkpoint.json";

// Elasticsearch client singleton
let elasticClient: Client | null = null;

function getElasticsearchClient(): Client {
  if (!elasticClient) {
    const cloudId = process.env.ELASTIC_CLOUD_ID;
    const apiKey = process.env.ELASTIC_API_KEY;
    const username = process.env.ELASTIC_USERNAME;
    const password = process.env.ELASTIC_PASSWORD;

    if (cloudId && apiKey) {
      elasticClient = new Client({
        cloud: { id: cloudId },
        auth: { apiKey },
      });
    } else if (cloudId && username && password) {
      elasticClient = new Client({
        cloud: { id: cloudId },
        auth: { username, password },
      });
    } else {
      throw new Error(
        "Elasticsearch credentials not configured. Set ELASTIC_CLOUD_ID and ELASTIC_API_KEY",
      );
    }
  }
  return elasticClient;
}

interface Checkpoint {
  indexName: string;
  totalExported: number;
  totalIndexed: number;
  errors: Array<{ id: string; error: string }>;
  startedAt: string;
  completedAt: string | null;
}

const loadCheckpoint = (indexName: string): Checkpoint => {
  const checkpointFile = `algolia_to_elastic_${indexName}_checkpoint.json`;

  try {
    if (fs.existsSync(checkpointFile)) {
      return JSON.parse(fs.readFileSync(checkpointFile, "utf8"));
    }
  } catch (error) {
    console.error("Error loading checkpoint:", error);
  }
  return {
    indexName,
    totalExported: 0,
    totalIndexed: 0,
    errors: [],
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
};

const saveCheckpoint = (checkpoint: Checkpoint) => {
  const checkpointFile = `algolia_to_elastic_${checkpoint.indexName}_checkpoint.json`;

  try {
    fs.writeFileSync(checkpointFile, JSON.stringify(checkpoint, null, 2));
  } catch (error) {
    console.error("Error saving checkpoint:", error);
  }
};

const createAccountsIndex = async (client: Client, indexName: string) => {
  const indexExists = await client.indices.exists({ index: indexName });

  if (!indexExists) {
    console.log(`Creating index: ${indexName}`);
    await client.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 2,
          number_of_replicas: 1,
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
    console.log(`Index ${indexName} created successfully`);
  } else {
    console.log(`Index ${indexName} already exists`);
  }
};

const createCategoriesIndex = async (client: Client, indexName: string) => {
  const indexExists = await client.indices.exists({ index: indexName });

  if (!indexExists) {
    console.log(`Creating index: ${indexName}`);
    await client.indices.create({
      index: indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 1,
        },
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
            depth: { type: "integer" },
            popular: { type: "boolean" },
            createdAt: { type: "date" },
            updatedAt: { type: "date" },
          },
        },
      },
    });
    console.log(`Index ${indexName} created successfully`);
  } else {
    console.log(`Index ${indexName} already exists`);
  }
};

const bulkIndexToElasticsearch = async (
  client: Client,
  indexName: string,
  documents: any[],
): Promise<{ success: number; failed: number; errors: string[] }> => {
  if (documents.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }

  const operations = documents.flatMap((doc) => [
    { index: { _index: indexName, _id: doc.objectID } },
    doc,
  ]);

  try {
    const response = await client.bulk({ body: operations, refresh: false });

    let success = 0;
    let failed = 0;
    const errors: string[] = [];

    if (response.errors) {
      response.items.forEach((item, idx) => {
        if (item.index?.error) {
          failed++;
          errors.push(`${documents[idx].objectID}: ${item.index.error.reason}`);
        } else {
          success++;
        }
      });
    } else {
      success = documents.length;
    }

    return { success, failed, errors };
  } catch (error: any) {
    console.error("Bulk indexing error:", error.message);
    return { success: 0, failed: documents.length, errors: [error.message] };
  }
};

const migrateFromAlgolia = async (indexName: string) => {
  console.log("=".repeat(60));
  console.log("Algolia to Elasticsearch Migration");
  console.log("=".repeat(60));
  console.log(`Source Index (Algolia): ${indexName}`);
  console.log(`Target Index (Elastic): ${indexName}`);
  console.log("=".repeat(60));

  // Initialize Algolia client
  const algoliaAppId = process.env.ALGOLIA_APP_ID;
  const algoliaApiKey = process.env.ALGOLIA_WRITE_API_KEY;

  if (!algoliaAppId || !algoliaApiKey) {
    throw new Error(
      "Algolia credentials not configured. Set ALGOLIA_APP_ID and ALGOLIA_WRITE_API_KEY",
    );
  }

  const algoliaClient = algoliasearch(algoliaAppId, algoliaApiKey);
  const elasticClient = getElasticsearchClient();
  const checkpoint = loadCheckpoint(indexName);

  try {
    // Create index with appropriate mappings
    if (indexName === "accounts") {
      await createAccountsIndex(elasticClient, indexName);
    } else if (indexName === "categories") {
      await createCategoriesIndex(elasticClient, indexName);
    } else {
      // Generic index creation
      const indexExists = await elasticClient.indices.exists({
        index: indexName,
      });
      if (!indexExists) {
        await elasticClient.indices.create({ index: indexName });
      }
    }

    console.log("\nExporting data from Algolia...");

    // Use Algolia browse to iterate through all records
    let totalProcessed = 0;
    let totalIndexed = 0;
    let batch: any[] = [];
    const startTime = Date.now();

    // Algolia browse API
    const browseResponse = await algoliaClient.browse({
      indexName,
      browseParams: {
        hitsPerPage: 1000,
      },
    });

    // Process hits
    const processHits = async (hits: any[]) => {
      for (const hit of hits) {
        // Transform Algolia record for Elasticsearch
        const doc = {
          ...hit,
          objectID: hit.objectID,
          lastIndexedAt: new Date().toISOString(),
        };

        // Remove Algolia-specific fields
        delete doc._highlightResult;
        delete doc._rankingInfo;

        batch.push(doc);
        totalProcessed++;

        if (batch.length >= ELASTIC_BATCH_SIZE) {
          const result = await bulkIndexToElasticsearch(
            elasticClient,
            indexName,
            batch,
          );
          totalIndexed += result.success;
          checkpoint.totalIndexed = totalIndexed;

          if (result.errors.length > 0) {
            result.errors.forEach((err) => {
              checkpoint.errors.push({ id: "bulk", error: err });
            });
          }

          batch = [];

          const elapsed = (Date.now() - startTime) / 1000;
          console.log(
            `  Processed: ${totalProcessed} | Indexed: ${totalIndexed} | Rate: ${((totalProcessed / elapsed) * 60).toFixed(0)}/min`,
          );
        }
      }
    };

    // Process initial response
    await processHits(browseResponse.hits);
    checkpoint.totalExported = totalProcessed;

    // Note: For very large datasets, you may need to handle pagination
    // The algoliasearch library should handle cursor-based pagination automatically

    // Index remaining batch
    if (batch.length > 0) {
      const result = await bulkIndexToElasticsearch(
        elasticClient,
        indexName,
        batch,
      );
      totalIndexed += result.success;
      checkpoint.totalIndexed = totalIndexed;
    }

    // Refresh index
    console.log("\nRefreshing index...");
    await elasticClient.indices.refresh({ index: indexName });

    // Final summary
    checkpoint.completedAt = new Date().toISOString();
    saveCheckpoint(checkpoint);

    const totalTime = (Date.now() - startTime) / 1000;
    console.log("\n" + "=".repeat(60));
    console.log("MIGRATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`Total Exported from Algolia: ${checkpoint.totalExported}`);
    console.log(`Total Indexed to Elasticsearch: ${checkpoint.totalIndexed}`);
    console.log(`Errors: ${checkpoint.errors.length}`);
    console.log(`Total Time: ${(totalTime / 60).toFixed(2)} minutes`);
  } catch (error) {
    console.error("\nFatal error:", error);
    saveCheckpoint(checkpoint);
  }
};

// Parse command line arguments
const args = process.argv.slice(2);
let indexName = "accounts"; // Default

for (let i = 0; i < args.length; i++) {
  if (args[i] === "--index" && args[i + 1]) {
    indexName = args[i + 1];
  }
}

// Run migration
migrateFromAlgolia(indexName).then(() => process.exit(0));
