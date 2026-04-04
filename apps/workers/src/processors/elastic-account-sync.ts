import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";
import { Client, type ClientOptions } from "@opensearch-project/opensearch";

// Initialize Elasticsearch client
let elasticClient: Client | null = null;

function getElasticsearchClient(): Client {
  if (!elasticClient) {
    const url = process.env.ELASTIC_URL;
    const username = process.env.ELASTIC_USERNAME;
    const password = process.env.ELASTIC_PASSWORD;

    if (!url) {
      throw new Error("ELASTIC_URL not configured");
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

const ELASTIC_INDEX = process.env.ELASTIC_ACCOUNTS_INDEX || "accounts";

interface AccountCategorisedEvent {
  accountId: string;
  platform: string;
  categoryIds: string[];
}

interface ElasticAccountRecord {
  objectID: string;
  platform: string;
  accountId: string;
  handle?: string;
  name?: string;
  name_en?: string;
  description?: string;
  description_en?: string;
  keywords?: string;
  keywords_en?: string;
  imageUrl?: string;
  bannerUrl?: string;
  followerCount?: number;
  country?: string;
  language_code?: string;
  rating?: number;
  reviewCount?: number;
  madeForKids?: boolean;
  claimed?: boolean;
  videoCount?: number;
  viewCount?: number;
  categories: string[];
  categoryNames: string[];
  createdDate?: string;
  isSeeded: boolean;
  lastIndexedAt: string;
}

async function getAccountForIndexing(
  accountId: string,
): Promise<ElasticAccountRecord | null> {
  const mongoClient = await getMongoClient();
  const db = mongoClient.db("ratecreator");

  const account = await db
    .collection("Account")
    .findOne({ _id: new ObjectId(accountId) });

  if (!account) {
    return null;
  }

  // Get category mappings
  const categoryMappings = await db
    .collection("CategoryMapping")
    .find({ accountId: new ObjectId(accountId) })
    .toArray();

  // Get category names
  const categories = await db
    .collection("Category")
    .find({ _id: { $in: categoryMappings.map((cm) => cm.categoryId) } })
    .toArray();

  const categoryNames = categories.map((c) => c.name);
  const categorySlugs = categories.map((c) => c.slug);

  return {
    objectID: account.accountId,
    platform: account.platform,
    accountId: account.accountId,
    handle: account.handle,
    name: account.name,
    name_en: account.name_en,
    description: account.description,
    description_en: account.description_en,
    keywords: account.keywords,
    keywords_en: account.keywords_en,
    imageUrl: account.imageUrl,
    bannerUrl: account.bannerUrl,
    followerCount: account.followerCount,
    country: account.country,
    language_code: account.language_code,
    rating: account.rating,
    reviewCount: account.reviewCount,
    madeForKids: account.madeForKids,
    claimed: account.claimed,
    videoCount: account.videoCount,
    viewCount: account.viewCount,
    categories: categorySlugs,
    categoryNames: categoryNames,
    createdDate: account.createdAt?.toISOString(),
    isSeeded: account.isSeeded || false,
    lastIndexedAt: new Date().toISOString(),
  };
}

async function indexToElasticsearch(
  record: ElasticAccountRecord,
): Promise<boolean> {
  const maxRetries = 3;
  let retryCount = 0;
  const client = getElasticsearchClient();

  while (retryCount < maxRetries) {
    try {
      await client.index({
        index: ELASTIC_INDEX,
        id: record.objectID,
        body: record,
        refresh: true,
      });

      console.log(`Indexed account ${record.accountId} to Elasticsearch`);
      return true;
    } catch (error: any) {
      retryCount++;
      console.error(
        `Failed to index to Elasticsearch (attempt ${retryCount}/${maxRetries}):`,
        error.message,
      );

      if (retryCount === maxRetries) {
        return false;
      }

      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * Math.pow(2, retryCount - 1)),
      );
    }
  }

  return false;
}

async function createIndexIfNotExists() {
  const client = getElasticsearchClient();

  try {
    const indexExists = await client.indices.exists({ index: ELASTIC_INDEX });

    if (!indexExists) {
      await client.indices.create({
        index: ELASTIC_INDEX,
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
      console.log(`Created Elasticsearch index: ${ELASTIC_INDEX}`);
    } else {
      console.log(`Elasticsearch index ${ELASTIC_INDEX} already exists`);
    }
  } catch (error) {
    console.error("Error creating Elasticsearch index:", error);
    throw error;
  }
}

export async function processElasticAccountSync(
  data: Record<string, unknown>,
  attributes: Record<string, string>,
): Promise<void> {
  const payload = data as unknown as AccountCategorisedEvent;
  const { accountId } = payload;

  console.log(`Processing Elasticsearch sync for account ${accountId}`);

  try {
    // Ensure index exists
    await createIndexIfNotExists();

    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    // Get full account data for indexing
    const record = await getAccountForIndexing(accountId);

    if (!record) {
      console.error(`Account ${accountId} not found for indexing`);
      return;
    }

    // Index to Elasticsearch
    const success = await indexToElasticsearch(record);

    if (success) {
      // Update lastIndexedAt in MongoDB
      await db.collection("Account").updateOne(
        { _id: new ObjectId(accountId) },
        {
          $set: {
            lastIndexedAt: new Date(),
            updatedAt: new Date(),
          },
        },
      );

      console.log(
        `Successfully synced account ${accountId} to Elasticsearch with ${record.categories.length} categories`,
      );
    } else {
      console.error(
        `Failed to sync account ${accountId} to Elasticsearch after retries`,
      );
    }
  } catch (error) {
    console.error(
      `Error processing Elasticsearch sync for account ${accountId}:`,
      error,
    );
  }
}
