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
  c.json({ status: "healthy", service: "categorise-root" }),
);

// Initialize Vertex AI with Gemini 2.5 Pro for better category understanding
const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID || "",
  location: process.env.GCP_LOCATION || "us-central1",
});

const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-pro" });

let consumer: ReturnType<typeof getKafkaConsumer>;

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

async function processMessage(message: any) {
  if (!message.value) {
    console.error("Invalid message: value is null");
    return;
  }

  const payload: AccountTranslatedEvent = JSON.parse(message.value.toString());
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
    const producer = await getKafkaProducer();
    const topicName = "account-root-categorised";
    await createTopicIfNotExists(topicName);

    await producer.send({
      topic: topicName,
      messages: [
        {
          key: accountId,
          value: JSON.stringify({
            accountId,
            platform,
            name_en: payload.name_en,
            description_en: payload.description_en,
            keywords_en: payload.keywords_en,
            rootCategorySlugs: categorySlugs,
            rootCategoryIds: categoryIds,
          }),
        },
      ],
    });

    console.log(`Sent account-root-categorised event for account ${accountId}`);
  } catch (error) {
    console.error(
      `Error processing categorisation for account ${accountId}:`,
      error,
    );
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("categorise-root-group");

    consumer.on("consumer.connect", () => {
      console.log("Categorise-root consumer connected successfully");
    });

    consumer.on("consumer.disconnect", () => {
      console.log("Categorise-root consumer disconnected");
    });

    consumer.on("consumer.crash", (error) => {
      console.error("Categorise-root consumer crashed:", error);
    });

    await consumer.connect();

    // Subscribe to account-translated topic
    const topicName = "account-translated";
    await createTopicIfNotExists(topicName);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    console.log(
      `Categorise-root consumer started and subscribed to ${topicName}`,
    );

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received message:", message?.value?.toString());
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start categorise-root consumer:", error);
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
  console.log("Categorise-root consumer connections closed");
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
const port = parseInt(process.env.PORT || "3042");
serve({ fetch: app.fetch, port });
console.log(`Health check server running on port ${port}`);

// Start the consumer
console.log("Starting categorise-root consumer service...");
startConsumer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
