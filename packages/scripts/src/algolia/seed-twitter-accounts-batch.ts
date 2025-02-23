import { getPrismaClient } from "@ratecreator/db/client";
import { getWriteClient } from "@ratecreator/db/algolia-client";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId, Db } from "mongodb";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";

// Load the main .env file
dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const BATCH_SIZE = 10000; // Process 10k accounts at a time
const ALGOLIA_BATCH_SIZE = 1000; // Algolia recommends max 1000 objects per batch
const CHECKPOINT_FILE = "twitter_accounts_checkpoint.json";

interface XData {
  verified?: boolean;
  protected?: boolean;
  profile_banner_url?: string;
  verified_type?: string;
  created_at?: string;
  public_metrics?: {
    followers_count?: number;
    following_count?: number;
    tweet_count?: number;
    listed_count?: number;
    like_count?: number;
    media_count?: number;
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
  } catch (error) {
    console.error("Error saving checkpoint:", error);
  }
};

const getCategorySlugs = async (
  categoryMappingIds: string[],
  db: Db
): Promise<string[]> => {
  const uncachedIds = categoryMappingIds.filter(
    (id) => !categorySlugCache.has(id)
  );

  if (uncachedIds.length === 0) {
    return categoryMappingIds.flatMap((id) => categorySlugCache.get(id) || []);
  }

  try {
    // Fetch all uncached category mappings in one query
    const categoryMappings = await db
      .collection<CategoryMapping>("CategoryMapping")
      .find({ _id: { $in: uncachedIds.map((id) => new ObjectId(id)) } })
      .toArray();

    const categoryIds = categoryMappings.map(
      (mapping: CategoryMapping) => mapping.categoryId
    );

    // Fetch all categories in one query
    const categories = await db
      .collection<Category>("Category")
      .find({ _id: { $in: categoryIds } })
      .project({ slug: 1, _id: 1 })
      .toArray();

    // Update cache for all fetched mappings
    categoryMappings.forEach((mapping: CategoryMapping) => {
      const category = categories.find(
        (c) => c._id.toString() === mapping.categoryId.toString()
      );
      const mappingId = mapping._id.toString();
      categorySlugCache.set(mappingId, category ? [category.slug] : []);
    });

    // Return all slugs including previously cached ones
    return categoryMappingIds.flatMap((id) => categorySlugCache.get(id) || []);
  } catch (error) {
    console.error("Error fetching category slugs:", error);
    return [];
  }
};

const processAccountBatch = async (
  accounts: Account[],
  db: Db,
  client: any,
  checkpoint: Checkpoint
) => {
  let algoliaObjects = []; // Changed to let since we'll reassign

  for (const account of accounts) {
    try {
      const categoryMappingIds = account.categories.map(
        (category) => category.id
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
            { $set: { lastIndexedAt: new Date() } }
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
  const prisma = getPrismaClient();
  const client = getWriteClient();
  const mongo_client = await getMongoClient();
  const db = mongo_client.db("ratecreator");

  const checkpoint = loadCheckpoint();
  console.log(
    `Resuming from checkpoint: ${checkpoint.totalProcessed} accounts processed`
  );

  try {
    let processedCount = 0;
    let startTime = Date.now();

    while (true) {
      const accounts = await prisma.account.findMany({
        where: {
          id: checkpoint.lastProcessedId
            ? { gt: checkpoint.lastProcessedId }
            : undefined,
          platform: "TWITTER",
          isSuspended: false,
        },
        orderBy: {
          id: "asc",
        },
        take: BATCH_SIZE,
        include: {
          categories: true,
        },
      });

      if (accounts.length === 0) break;

      await processAccountBatch(accounts, db, client, checkpoint);

      processedCount += accounts.length;
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      const rate = processedCount / elapsedMinutes;

      console.log(
        `Processed ${processedCount} accounts. Rate: ${rate.toFixed(2)} accounts/minute`
      );
      saveCheckpoint(checkpoint);
    }

    console.log("Finished processing all accounts");
    console.log(`Total processed: ${checkpoint.totalProcessed}`);
    console.log(`Total errors: ${checkpoint.errors.length}`);

    if (checkpoint.errors.length > 0) {
      console.log("Error details saved in checkpoint file");
    }
  } catch (error) {
    console.error("Fatal error:", error);
  } finally {
    await prisma.$disconnect();
    process.exit(0);
  }
};

seedAccounts();
