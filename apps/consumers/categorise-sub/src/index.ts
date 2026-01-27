import {
  getKafkaConsumer,
  getKafkaProducer,
  createTopicIfNotExists,
  disconnectProducer,
} from "@ratecreator/db/kafka-client";
import { getPrismaClient } from "@ratecreator/db/client";
import { getRedisClient } from "@ratecreator/db/redis-do";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { VertexAI } from "@google-cloud/vertexai";

const app = new Hono();
const prisma = getPrismaClient();
const redis = getRedisClient();

// Health check endpoint
app.get("/health", (c) =>
  c.json({ status: "healthy", service: "categorise-sub" }),
);

// Initialize Vertex AI with Gemini 2.5 Flash for fast subcategory assignment
const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID || "",
  location: process.env.GCP_LOCATION || "us-central1",
});

const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let consumer: ReturnType<typeof getKafkaConsumer>;

interface AccountRootCategorisedEvent {
  accountId: string;
  platform: string;
  name_en: string;
  description_en: string;
  keywords_en: string;
  rootCategorySlugs: string[];
  rootCategoryIds: string[];
}

interface Category {
  id: string;
  name: string;
  slug: string;
  parentId: string;
  depth: number;
}

const CACHE_TTL = 24 * 60 * 60; // 24 hours

// Get subcategories for given root category IDs
async function getSubcategoriesForRoots(
  rootCategoryIds: string[],
): Promise<Category[]> {
  const allSubcategories: Category[] = [];

  for (const rootId of rootCategoryIds) {
    const cacheKey = `subcategories:${rootId}`;
    const cached = await redis.get(cacheKey);

    if (cached) {
      allSubcategories.push(...JSON.parse(cached));
      continue;
    }

    // Get depth 1 subcategories
    const subcategories = await prisma.category.findMany({
      where: { parentId: rootId, depth: 1 },
      select: { id: true, name: true, slug: true, parentId: true, depth: true },
    });

    // Get depth 2 sub-subcategories
    for (const sub of subcategories) {
      const subSubcategories = await prisma.category.findMany({
        where: { parentId: sub.id, depth: 2 },
        select: {
          id: true,
          name: true,
          slug: true,
          parentId: true,
          depth: true,
        },
      });
      allSubcategories.push(
        ...subSubcategories.map((c) => ({ ...c, parentId: c.parentId || "" })),
      );
    }

    allSubcategories.push(
      ...subcategories.map((c) => ({ ...c, parentId: c.parentId || "" })),
    );
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(subcategories));
  }

  return allSubcategories;
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

async function assignSubcategories(
  account: AccountRootCategorisedEvent,
  subcategories: Category[],
): Promise<string[]> {
  if (subcategories.length === 0) {
    return [];
  }

  const categoryList = subcategories
    .map((c) => `${c.slug}: ${c.name} (depth: ${c.depth})`)
    .join("\n");

  const prompt = `You are an expert content categorization system specializing in ${account.platform} content. Given a creator's profile information and available subcategories, determine which subcategories best describe their content.

Available Subcategories (depth 1 = subcategory, depth 2 = sub-subcategory):
${categoryList}

Creator Profile:
- Name: ${account.name_en}
- Description: ${account.description_en}
- Keywords: ${account.keywords_en}
- Platform: ${account.platform}
- Already assigned root categories: ${account.rootCategorySlugs.join(", ")}

Instructions:
1. Analyze the creator's profile in detail
2. Select 2-5 subcategories that best match their content
3. Prefer depth 2 (more specific) categories when applicable
4. Return ONLY category slugs, not names
5. Be precise - only select categories that clearly apply

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{"categories": ["subcat-slug-1", "subcat-slug-2", "sub-subcat-slug-1"]}`;

  try {
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2000,
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
    console.error("Error assigning subcategories:", error);
    return [];
  }
}

async function processMessage(message: any) {
  if (!message.value) {
    console.error("Invalid message: value is null");
    return;
  }

  const payload: AccountRootCategorisedEvent = JSON.parse(
    message.value.toString(),
  );
  const { accountId, platform, rootCategoryIds } = payload;

  console.log(`Processing subcategory assignment for account ${accountId}`);

  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    // Get available subcategories for the assigned root categories
    const subcategories = await getSubcategoriesForRoots(rootCategoryIds);

    if (subcategories.length === 0) {
      console.log(`No subcategories available for account ${accountId}`);

      // Proceed to Algolia sync without subcategories
      const producer = await getKafkaProducer();
      await createTopicIfNotExists("account-categorised");

      await producer.send({
        topic: "account-categorised",
        messages: [
          {
            key: accountId,
            value: JSON.stringify({
              accountId,
              platform,
              categoryIds: rootCategoryIds,
            }),
          },
        ],
      });
      return;
    }

    // Assign subcategories
    const subcategorySlugs = await assignSubcategories(payload, subcategories);

    if (subcategorySlugs.length === 0) {
      console.log(`No subcategories assigned for account ${accountId}`);

      // Mark as subcategory failed but continue
      await db.collection("Account").updateOne(
        { _id: new ObjectId(accountId) },
        {
          $set: {
            isSubCategoryFailed: true,
            updatedAt: new Date(),
          },
        },
      );
    } else {
      console.log(`Assigned subcategories: ${subcategorySlugs.join(", ")}`);

      // Get category IDs and create mappings
      const allCategoryIds = [...rootCategoryIds];

      for (const slug of subcategorySlugs) {
        const categoryId = await getCategoryIdBySlug(slug);
        if (categoryId && !allCategoryIds.includes(categoryId)) {
          allCategoryIds.push(categoryId);

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
            isSubCategoryFailed: false,
            updatedAt: new Date(),
          },
        },
      );

      console.log(
        `Updated account ${accountId} with ${allCategoryIds.length} total categories`,
      );
    }

    // Produce final event for Algolia sync
    const producer = await getKafkaProducer();
    const topicName = "account-categorised";
    await createTopicIfNotExists(topicName);

    // Get all category mappings for this account
    const categoryMappings = await db
      .collection("CategoryMapping")
      .find({ accountId: new ObjectId(accountId) })
      .toArray();

    const finalCategoryIds = categoryMappings.map((cm) =>
      cm.categoryId.toString(),
    );

    await producer.send({
      topic: topicName,
      messages: [
        {
          key: accountId,
          value: JSON.stringify({
            accountId,
            platform,
            categoryIds: finalCategoryIds,
          }),
        },
      ],
    });

    console.log(`Sent account-categorised event for account ${accountId}`);
  } catch (error) {
    console.error(
      `Error processing subcategory assignment for account ${accountId}:`,
      error,
    );
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("categorise-sub-group");

    consumer.on("consumer.connect", () => {
      console.log("Categorise-sub consumer connected successfully");
    });

    consumer.on("consumer.disconnect", () => {
      console.log("Categorise-sub consumer disconnected");
    });

    consumer.on("consumer.crash", (error) => {
      console.error("Categorise-sub consumer crashed:", error);
    });

    await consumer.connect();

    // Subscribe to account-root-categorised topic
    const topicName = "account-root-categorised";
    await createTopicIfNotExists(topicName);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    console.log(
      `Categorise-sub consumer started and subscribed to ${topicName}`,
    );

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received message:", message?.value?.toString());
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start categorise-sub consumer:", error);
    setTimeout(() => {
      console.log("Attempting to reconnect...");
      startConsumer().catch(console.error);
    }, 5000);
  }
}

async function stopConsumer() {
  if (consumer) {
    await consumer.disconnect();
  }
  await prisma.$disconnect();
  await disconnectProducer();
  console.log("Categorise-sub consumer connections closed");
}

// Handle graceful shutdown
process.on("SIGTERM", async () => {
  console.log("SIGTERM signal received. Shutting down...");
  await stopConsumer();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT signal received. Shutting down...");
  await stopConsumer();
  process.exit(0);
});

// Start the HTTP server for health checks
const port = parseInt(process.env.PORT || "3043");
serve({ fetch: app.fetch, port });
console.log(`Health check server running on port ${port}`);

// Start the consumer
console.log("Starting categorise-sub consumer service...");
startConsumer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
