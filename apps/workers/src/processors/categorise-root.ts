import { getPrismaClient } from "@ratecreator/db/client";
import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";
import { publishMessageWithKey } from "@ratecreator/db/pubsub-client";
import { VertexAI } from "@google-cloud/vertexai";

const prisma = getPrismaClient();
const redis = getRedisClient();

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID || "",
  location: process.env.GCP_LOCATION || "us-central1",
});

const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-flash" });

interface AccountTranslatedEvent {
  accountId: string;
  platform: string;
  name_en: string;
  description_en: string;
  keywords_en: string;
  language_code: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const CACHE_TTL = 24 * 60 * 60; // 24 hours

// Get root categories from cache or database
async function getRootCategories(): Promise<Category[]> {
  const cacheKey = "root_categories";
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const categories = await prisma.category.findMany({
    where: { parentId: null, depth: 0 },
    select: { id: true, name: true, slug: true },
  });

  await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(categories));
  return categories;
}

// Get category ID by slug from cache
async function getCategoryIdBySlug(slug: string): Promise<string | null> {
  const cacheKey = `category:${slug}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return cached;
  }

  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (category) {
    await redis.setex(cacheKey, CACHE_TTL, category.id);
    return category.id;
  }

  return null;
}

async function assignRootCategories(
  account: AccountTranslatedEvent,
): Promise<string[]> {
  const rootCategories = await getRootCategories();
  const categoryList = rootCategories
    .map((c) => `${c.slug}: ${c.name}`)
    .join("\n");

  const prompt = `You are an expert content categorization system. Given a creator's profile information, determine which root categories best describe their content.

Available Categories:
${categoryList}

Creator Profile:
- Name: ${account.name_en}
- Description: ${account.description_en}
- Keywords: ${account.keywords_en}
- Platform: ${account.platform}

Instructions:
1. Analyze the creator's profile carefully
2. Select 1-3 root categories that best match their content
3. Return ONLY category slugs, not names
4. Be precise - only select categories that clearly apply

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{"categories": ["category-slug-1", "category-slug-2"]}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 1000,
      },
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean up the response
    let cleanedText = text.trim();
    if (cleanedText.startsWith("```json")) {
      cleanedText = cleanedText.slice(7);
    }
    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.slice(3);
    }
    if (cleanedText.endsWith("```")) {
      cleanedText = cleanedText.slice(0, -3);
    }
    cleanedText = cleanedText.trim();

    const parsed = JSON.parse(cleanedText);
    return parsed.categories || [];
  } catch (error) {
    console.error("Error assigning root categories:", error);
    return [];
  }
}

export async function processCategoriseRoot(
  data: Record<string, unknown>,
  attributes: Record<string, string>,
): Promise<void> {
  if (!data) {
    console.error("Invalid message: data is null");
    return;
  }

  const payload = data as unknown as AccountTranslatedEvent;
  const { accountId, platform } = payload;

  console.log(`Processing root categorisation for account ${accountId}`);

  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    // Assign root categories
    const categorySlugs = await assignRootCategories(payload);

    if (categorySlugs.length === 0) {
      console.error(`No categories assigned for account ${accountId}`);

      // Mark as category failed
      await db.collection("Account").updateOne(
        { _id: new ObjectId(accountId) },
        {
          $set: {
            isCategoryFailed: true,
            updatedAt: new Date(),
          },
        },
      );
      return;
    }

    console.log(`Assigned root categories: ${categorySlugs.join(", ")}`);

    // Get category IDs and create mappings
    const categoryIds: string[] = [];

    for (const slug of categorySlugs) {
      const categoryId = await getCategoryIdBySlug(slug);
      if (categoryId) {
        categoryIds.push(categoryId);

        // Create CategoryMapping if not exists
        await db.collection("CategoryMapping").updateOne(
          {
            accountId: new ObjectId(accountId),
            categoryId: new ObjectId(categoryId),
          },
          {
            $setOnInsert: {
              accountId: new ObjectId(accountId),
              categoryId: new ObjectId(categoryId),
              createdAt: new Date(),
            },
            $set: {
              updatedAt: new Date(),
            },
          },
          { upsert: true },
        );
      }
    }

    // Update account
    await db.collection("Account").updateOne(
      { _id: new ObjectId(accountId) },
      {
        $set: {
          isSeeded: true,
          isCategoryFailed: false,
          updatedAt: new Date(),
        },
      },
    );

    console.log(
      `Updated account ${accountId} with ${categoryIds.length} root categories`,
    );

    // Produce next event for subcategory assignment
    const topicName = "account-root-categorised";

    await publishMessageWithKey(topicName, accountId, {
      accountId,
      platform,
      name_en: payload.name_en,
      description_en: payload.description_en,
      keywords_en: payload.keywords_en,
      rootCategorySlugs: categorySlugs,
      rootCategoryIds: categoryIds,
    });

    console.log(`Sent account-root-categorised event for account ${accountId}`);
  } catch (error) {
    console.error(
      `Error processing categorisation for account ${accountId}:`,
      error,
    );
  }
}
