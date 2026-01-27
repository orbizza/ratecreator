/**
 * Migrate Categories from MongoDB to Elasticsearch
 *
 * This script migrates the category taxonomy from MongoDB to Elasticsearch.
 * Categories are used for faceted filtering in search.
 *
 * Usage:
 *   yarn migrate-categories-elastic
 *
 * Environment Variables Required:
 *   - DATABASE_URL_ONLINE: MongoDB connection string
 *   - ELASTIC_CLOUD_ID: Elastic Cloud deployment ID
 *   - ELASTIC_API_KEY: Elastic Cloud API key
 *   - ELASTIC_CATEGORIES_INDEX: Index name (default: 'categories')
 */

import { getPrismaClient } from "@ratecreator/db/client";
import { Client } from "@elastic/elasticsearch";
import dotenv from "dotenv";
import path from "path";

// Load the main .env file
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const ELASTIC_INDEX = process.env.ELASTIC_CATEGORIES_INDEX || "categories";

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

const createIndexIfNotExists = async (client: Client) => {
  try {
    const indexExists = await client.indices.exists({ index: ELASTIC_INDEX });

    if (!indexExists) {
      console.log(`Creating index: ${ELASTIC_INDEX}`);
      await client.indices.create({
        index: ELASTIC_INDEX,
        body: {
          settings: {
            number_of_shards: 1,
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
              name: {
                type: "text",
                analyzer: "autocomplete",
                search_analyzer: "autocomplete_search",
                fields: { keyword: { type: "keyword" } },
              },
              slug: { type: "keyword" },
              shortDescription: { type: "text" },
              longDescription: { type: "text" },
              keywords: { type: "text" },
              parentId: { type: "keyword" },
              parentCategory: { type: "text" },
              parentSlug: { type: "keyword" },
              depth: { type: "integer" },
              popular: { type: "boolean" },
              path: { type: "keyword" },
              createdAt: { type: "date" },
              updatedAt: { type: "date" },
            },
          },
        },
      });
      console.log(`Index ${ELASTIC_INDEX} created successfully`);
    } else {
      console.log(`Index ${ELASTIC_INDEX} already exists`);
    }
  } catch (error) {
    console.error("Error creating index:", error);
    throw error;
  }
};

interface CategoryWithParent {
  id: string;
  name: string;
  slug: string;
  shortDescription: string | null;
  longDescription: string | null;
  keywords: string[];
  parentId: string | null;
  depth: number;
  popular: boolean;
  createdAt: Date;
  updatedAt: Date;
  parent?: {
    name: string;
    slug: string;
  } | null;
}

const buildCategoryPath = (
  category: CategoryWithParent,
  categoriesMap: Map<string, CategoryWithParent>,
): string => {
  const path: string[] = [category.slug];
  let current = category;

  while (current.parentId) {
    const parent = categoriesMap.get(current.parentId);
    if (parent) {
      path.unshift(parent.slug);
      current = parent;
    } else {
      break;
    }
  }

  return path.join(" > ");
};

const migrateCategories = async () => {
  console.log("=".repeat(60));
  console.log("Elasticsearch Category Migration");
  console.log("=".repeat(60));
  console.log(`Index: ${ELASTIC_INDEX}`);
  console.log("=".repeat(60));

  const prisma = getPrismaClient();
  const elasticClient = getElasticsearchClient();

  try {
    // Create index if not exists
    await createIndexIfNotExists(elasticClient);

    // Fetch all categories with parent info
    console.log("\nFetching categories from database...");
    const categories = await prisma.category.findMany({
      include: {
        parent: {
          select: {
            name: true,
            slug: true,
          },
        },
      },
      orderBy: [{ depth: "asc" }, { name: "asc" }],
    });

    console.log(`Found ${categories.length} categories`);

    // Build categories map for path construction
    const categoriesMap = new Map<string, CategoryWithParent>();
    categories.forEach((cat) => {
      categoriesMap.set(cat.id, cat as CategoryWithParent);
    });

    // Build Elasticsearch documents
    const documents = categories.map((category) => {
      const catWithParent = category as CategoryWithParent;
      return {
        objectID: category.id,
        name: category.name,
        slug: category.slug,
        shortDescription: category.shortDescription || "",
        longDescription: category.longDescription || "",
        keywords: (category.keywords || []).join(", "),
        parentId: category.parentId || null,
        parentCategory: category.parent?.name || null,
        parentSlug: category.parent?.slug || null,
        depth: category.depth,
        popular: category.popular,
        path: buildCategoryPath(catWithParent, categoriesMap),
        createdAt: category.createdAt.toISOString(),
        updatedAt: category.updatedAt.toISOString(),
      };
    });

    // Bulk index to Elasticsearch
    console.log("\nIndexing categories to Elasticsearch...");

    const operations = documents.flatMap((doc) => [
      { index: { _index: ELASTIC_INDEX, _id: doc.objectID } },
      doc,
    ]);

    const response = await elasticClient.bulk({
      body: operations,
      refresh: true,
    });

    // Check for errors
    let successCount = 0;
    let errorCount = 0;

    if (response.errors) {
      response.items.forEach((item, idx) => {
        if (item.index?.error) {
          errorCount++;
          console.error(
            `Error indexing ${documents[idx].name}: ${item.index.error.reason}`,
          );
        } else {
          successCount++;
        }
      });
    } else {
      successCount = documents.length;
    }

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("MIGRATION COMPLETE");
    console.log("=".repeat(60));
    console.log(`Total Categories: ${categories.length}`);
    console.log(`Successfully Indexed: ${successCount}`);
    console.log(`Errors: ${errorCount}`);

    // Display category hierarchy summary
    const rootCategories = categories.filter((c) => c.depth === 0);
    const subCategories = categories.filter((c) => c.depth === 1);
    const subSubCategories = categories.filter((c) => c.depth === 2);

    console.log(`\nCategory Breakdown:`);
    console.log(`  Root Categories (depth=0): ${rootCategories.length}`);
    console.log(`  Subcategories (depth=1): ${subCategories.length}`);
    console.log(`  Sub-subcategories (depth=2): ${subSubCategories.length}`);
  } catch (error) {
    console.error("\nFatal error:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
};

// Run migration
migrateCategories();
