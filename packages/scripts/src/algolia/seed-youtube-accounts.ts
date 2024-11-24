import { getPrismaClient } from "@ratecreator/db/client";
import { getWriteClient } from "@ratecreator/db/algolia-client";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import pLimit from "p-limit";
import { ObjectId } from "mongodb";

const prisma = getPrismaClient();
const client = getWriteClient();
const limit = pLimit(20); // Adjust concurrency limit as needed

// Helper function to fetch category slugs based on CategoryMapping
const getCategorySlugs = async (
  categoryMappingIds: string[],
): Promise<string[]> => {
  try {
    // Get a MongoDB client
    const mongo_client = await getMongoClient();
    const db = mongo_client.db("ratecreator");

    // Fetch all category mappings for the given categoryMappingIds
    const categoryMappings = await db
      .collection("CategoryMapping")
      .find({ _id: { $in: categoryMappingIds.map((id) => new ObjectId(id)) } })
      .toArray();

    if (categoryMappings.length === 0) {
      console.log("No category mappings found for the provided IDs.");
      return [];
    }

    // Extract category IDs from the category mappings
    const categoryIds = categoryMappings.map((mapping) => mapping.categoryId);

    // Fetch the slugs of the categories based on categoryIds
    const categories = await db
      .collection("Category")
      .find({ _id: { $in: categoryIds.map((id) => new ObjectId(id)) } })
      .project({ slug: 1 })
      .toArray();

    if (categories.length === 0) {
      console.log("No categories found for the provided category IDs.");
    }

    return categories.map((category) => category.slug);
  } catch (error) {
    console.error("Error fetching category slugs:", error);
    return [];
  }
};

interface YTData {
  snippet?: {
    publishedAt?: string;
  };
  status?: {
    madeForKids?: boolean;
  };
  statistics?: {
    viewCount?: number;
    videoCount?: number;
  };
  brandingSettings?: {
    image?: {
      bannerExternalUrl?: string;
    };
  };
}

const seedAccounts = async () => {
  const mongo_client = await getMongoClient();
  const db = mongo_client.db("ratecreator");
  try {
    // Fetch accounts with specific conditions
    // const accounts = await prisma.account.findMany({
    //   where: {
    //     lastIndexedAt: { equals: null },
    //     isSeeded: true,
    //     isSubCategoryFailed: false,
    //     platform: "YOUTUBE",
    //   },
    //   orderBy: {
    //     followerCount: "desc",
    //   },
    //   take: 1982,
    //   include: {
    //     categories: true,
    //   },
    // });

    const accounts = await prisma.account.findMany({
      where: {
        lastIndexedAt: { not: null },
        isSeeded: true,
        isSubCategoryFailed: false,
        platform: "YOUTUBE",
      },
      orderBy: {
        followerCount: "desc",
      },
      take: 21982,
      include: {
        categories: true,
      },
    });

    if (accounts.length === 0) {
      console.log("No accounts found for seeding.");
      return;
    }

    const promises = accounts.map(async (account) => {
      try {
        // Extract category IDs from the account
        const categoryMappingIds = account.categories.map(
          (category) => category.id,
        );
        const categorySlugs = categoryMappingIds.length
          ? await getCategorySlugs(categoryMappingIds)
          : [];

        // Save to Algolia index
        await limit(() =>
          client.saveObject({
            indexName: "accounts",
            body: {
              objectID: account.accountId,
              platform: account.platform,
              handle: account.handle,
              name: account.name_en,
              description: account.description_en,
              keywords: account.keywords_en,
              followerCount: account.followerCount,
              imageUrl: account.imageUrl,
              country: account.country,
              language_code: account.language_code,
              rating: account.rating,
              reviewCount: account.reviewCount,
              madeForKids:
                (account.ytData as YTData)?.status?.madeForKids ?? false,
              viewCount: (account.ytData as YTData)?.statistics?.viewCount ?? 0,
              videoCount:
                (account.ytData as YTData)?.statistics?.videoCount ?? 0,
              bannerURL:
                (account.ytData as YTData)?.brandingSettings?.image
                  ?.bannerExternalUrl ?? "",
              categories: categorySlugs,
              createdDate:
                (account.ytData as YTData)?.snippet?.publishedAt ?? null,
            },
          }),
        );

        // Update the lastIndexedAt timestamp using Prisma
        await db
          .collection("Account")
          .updateOne(
            { _id: new ObjectId(account.id) },
            { $set: { lastIndexedAt: new Date() } },
          );

        console.log(`Account ${account.accountId} indexed successfully`);
      } catch (error) {
        console.error(`Error processing account ${account.accountId}:`, error);
      }
    });

    const responses = await Promise.all(promises);
    console.log("Accounts seeded with count:", responses.length);
  } catch (error) {
    console.error("Error seeding accounts:", error);
  } finally {
    process.exit(0);
  }
};

seedAccounts();
