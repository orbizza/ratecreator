import { getPrismaClient } from "@ratecreator/db/client";
import { getWriteClient } from "@ratecreator/db/algolia-client";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId, Db } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { Platform } from "@ratecreator/types/review";
// Load the main .env file
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

console.log("Starting script...");
// console.log("DATABASE_URL_ONLINE:", process.env.DATABASE_URL_ONLINE);

const BATCH_SIZE = 1000; // Process 10k accounts at a time
const ALGOLIA_BATCH_SIZE = 1000; // Algolia recommends max 1000 objects per batch
const CHECKPOINT_FILE = path.resolve(
  __dirname,
  "twitter_accounts_checkpoint.json",
);
console.log("Checkpoint file location:", CHECKPOINT_FILE);

interface XData {
  verified?: boolean;
  protected?: boolean;
  profile_banner_url?: string;
  created_at?: string;
  public_metrics?: {
    tweet_count?: number;
  };
}

interface Checkpoint {
  lastProcessedId: string | null;
  totalProcessed: number;
  errors: Array<{ id: string; error: string }>;
}

interface CategoryMapping {
  _id: ObjectId;
  categoryId: ObjectId;
}

interface Category {
  _id: ObjectId;
  slug: string;
}

interface Account {
  id: string;
  accountId: string;
  categories: Array<{
    id: string;
    accountId: string;
    categoryId: string;
    createdAt: Date;
    updatedAt: Date;
  }>;
  platform: string;
  handle: string | null;
  name_en: string | null;
  name: string | null;
  description_en: string | null;
  description: string | null;
  followerCount: number | null;
  imageUrl: string | null;
  country: string | null;
  language_code: string | null;
  rating: number | null;
  reviewCount: number | null;
  xData: unknown;
  bannerUrl: string | null | undefined;
  isSeeded: boolean | null;
  isSubCategoryFailed: boolean | null;
  lastIndexedAt: Date | null;
}

// Cache for category mappings
const categorySlugCache = new Map<string, string[]>();

const loadCheckpoint = (): Checkpoint => {
  try {
    if (fs.existsSync(CHECKPOINT_FILE)) {
      return JSON.parse(fs.readFileSync(CHECKPOINT_FILE, "utf8"));
    }
  } catch (error) {
    console.error("Error loading checkpoint:", error);
  }
  return { lastProcessedId: null, totalProcessed: 0, errors: [] };
};

const saveCheckpoint = (checkpoint: Checkpoint) => {
  try {
    fs.writeFileSync(CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
    console.log("Checkpoint saved successfully at:", CHECKPOINT_FILE);
  } catch (error) {
    console.error("Error saving checkpoint:", error);
  }
};

const getCategorySlugs = async (
  categoryIds: string[],
  db: Db,
): Promise<string[]> => {
  const uncachedIds = categoryIds.filter((id) => !categorySlugCache.has(id));

  if (uncachedIds.length === 0) {
    return categoryIds.flatMap((id) => categorySlugCache.get(id) || []);
  }

  try {
    // Fetch all categories in one query
    const categories = (await db
      .collection<Category>("Category")
      .find({ _id: { $in: uncachedIds.map((id) => new ObjectId(id)) } })
      .project({ slug: 1, _id: 1 })
      .toArray()) as Category[];

    // Update cache for all fetched categories
    categories.forEach((category: Category) => {
      const categoryId = category._id.toString();
      categorySlugCache.set(categoryId, [category.slug]);
    });

    // Return all slugs including previously cached ones
    return categoryIds.flatMap((id) => categorySlugCache.get(id) || []);
  } catch (error) {
    console.error("Error fetching category slugs:", error);
    return [];
  }
};

const processAccountBatch = async (
  accounts: Account[],
  db: Db,
  client: any,
  checkpoint: Checkpoint,
) => {
  let algoliaObjects = []; // Changed to let since we'll reassign

  for (const account of accounts) {
    try {
      const categoryMappingIds = account.categories.map(
        (category) => category.categoryId,
      );
      const categorySlugs = await getCategorySlugs(categoryMappingIds, db);

      const xData = account.xData as XData | null;

      algoliaObjects.push({
        objectID: account.accountId,
        platform: account.platform,
        handle: account.handle || "",
        name: account.name_en || account.name || "",
        description: account.description_en || account.description || "",
        keywords: "",
        followerCount: account.followerCount || 0,
        imageUrl: account.imageUrl || "",
        country: account.country || "",
        language_code: account.language_code || "",
        rating: account.rating || 0,
        reviewCount: account.reviewCount || 0,
        videoCount: xData?.public_metrics?.tweet_count || 0,
        bannerURL: account.bannerUrl ?? xData?.profile_banner_url ?? "",
        categories: categorySlugs,
        createdDate: xData?.created_at ?? null,
      });

      // Process batch when we reach ALGOLIA_BATCH_SIZE or it's the last item
      if (
        algoliaObjects.length === ALGOLIA_BATCH_SIZE ||
        account === accounts[accounts.length - 1]
      ) {
        if (algoliaObjects.length > 0) {
          // Only process if we have objects
          await client.saveObjects({
            indexName: "accounts",
            batch: algoliaObjects,
          });

          // Update lastIndexedAt for processed accounts
          await db.collection("Account").updateMany(
            {
              _id: {
                $in: accounts
                  .slice(0, algoliaObjects.length)
                  .map((a) => new ObjectId(a.id)),
              },
            },
            { $set: { lastIndexedAt: new Date() } },
          );

          algoliaObjects = []; // Reset array after processing
        }
      }

      checkpoint.lastProcessedId = account.id;
      checkpoint.totalProcessed++;
    } catch (error: unknown) {
      console.error(`Error processing account ${account.accountId}:`, error);
      checkpoint.errors.push({
        id: account.id,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }
};

const seedAccounts = async () => {
  console.log("Initializing connections...");

  const prisma = getPrismaClient();
  console.log("Prisma client initialized");

  const client = getWriteClient();
  console.log("Algolia client initialized");

  console.log("Connecting to MongoDB...");
  const mongo_client = await getMongoClient();
  console.log("MongoDB client connected");

  const db = mongo_client.db("ratecreator");
  console.log("MongoDB database selected");

  const checkpoint = loadCheckpoint();
  console.log(
    `Resuming from checkpoint: ${checkpoint.totalProcessed} accounts processed`,
  );

  try {
    console.log("Starting to fetch accounts...");
    console.log("Fetching first batch of accounts...");
    let processedCount = 0;
    let startTime = Date.now();

    while (true) {
      console.log(
        `Querying accounts with lastProcessedId: ${checkpoint.lastProcessedId}`,
      );
      try {
        console.log("Building query...");
        const query = {
          where: {
            ...(checkpoint.lastProcessedId && {
              id: { gt: checkpoint.lastProcessedId },
            }),
            platform: "TWITTER" as Platform,
            isSuspended: false,
          },
          orderBy: {
            id: "asc",
          },
          take: BATCH_SIZE,
          include: {
            categories: true,
          },
        } as const;
        console.log("Query structure:", JSON.stringify(query, null, 2));
        console.log("Executing query...");
        console.time("Query execution time");
        const accounts = await prisma.account.findMany(query);
        console.timeEnd("Query execution time");
        console.log(`Found ${accounts.length} accounts to process`);

        if (accounts.length === 0) {
          console.log("No more accounts to process. Exiting...");
          break;
        }

        console.log("Processing account batch...");
        console.time("Batch processing time");
        await processAccountBatch(accounts, db, client, checkpoint);
        console.timeEnd("Batch processing time");
        console.log("Finished processing account batch");

        processedCount += accounts.length;
        const elapsedMinutes = (Date.now() - startTime) / 60000;
        const rate = processedCount / elapsedMinutes;

        console.log(
          `Processed ${processedCount} accounts. Rate: ${rate.toFixed(2)} accounts/minute`,
        );
        saveCheckpoint(checkpoint);
      } catch (error) {
        console.error("Error in main processing loop:", error);
        if (error instanceof Error) {
          console.error("Error stack:", error.stack);
        }
        break;
      }
    }

    console.log("Finished processing all accounts");
    console.log(`Total processed: ${checkpoint.totalProcessed}`);
    console.log(`Total errors: ${checkpoint.errors.length}`);

    if (checkpoint.errors.length > 0) {
      console.log("Error details saved in checkpoint file");
    }
  } catch (error) {
    console.error("Fatal error:", error);
    if (error instanceof Error) {
      console.error("Error stack:", error.stack);
    }
  } finally {
    console.log("Cleaning up connections...");
    await prisma.$disconnect();
    await mongo_client.close();
    console.log("Connections closed");
    process.exit(0);
  }
};

seedAccounts();
