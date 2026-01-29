import {
  getKafkaConsumer,
  getKafkaProducer,
  createTopicIfNotExists,
  disconnectProducer,
} from "@ratecreator/db/kafka-client";
import { getPrismaClient } from "@ratecreator/db/client";
import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";
import { Hono } from "hono";
import { serve } from "@hono/node-server";
import { VertexAI } from "@google-cloud/vertexai";

const app = new Hono();
const prisma = getPrismaClient();

// Health check endpoint
app.get("/health", (c) => c.json({ status: "healthy", service: "translate" }));

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID || "",
  location: process.env.GCP_LOCATION || "us-central1",
});

const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-flash" });

let consumer: ReturnType<typeof getKafkaConsumer>;

interface AccountDataFetchedEvent {
  accountId: string;
  platform: string;
  name?: string;
  description?: string;
  keywords?: string;
}

interface TranslationResult {
  language_code: string;
  lang_confidence_score: number;
  name_en: string;
  description_en: string;
  keywords_en: string;
}

// Common English words to detect English content
const ENGLISH_INDICATORS = [
  "the",
  "and",
  "is",
  "are",
  "was",
  "were",
  "has",
  "have",
  "had",
  "be",
  "been",
  "being",
  "do",
  "does",
  "did",
  "will",
  "would",
  "could",
  "should",
  "may",
  "might",
  "must",
  "shall",
  "can",
  "need",
  "dare",
  "this",
  "that",
  "these",
  "those",
  "what",
  "which",
  "who",
  "whom",
  "with",
  "from",
  "for",
  "about",
  "into",
  "through",
  "during",
  "before",
];

function isLikelyEnglish(text: string): boolean {
  if (!text) return true;

  const words = text.toLowerCase().split(/\s+/);
  const englishWordCount = words.filter((word) =>
    ENGLISH_INDICATORS.includes(word),
  ).length;

  // If more than 20% of words are common English words, likely English
  return englishWordCount / words.length > 0.2;
}

async function translateContent(
  name: string | undefined,
  description: string | undefined,
  keywords: string | undefined,
): Promise<TranslationResult | null> {
  // Check if content is likely English
  const textToCheck = `${name || ""} ${description || ""}`;

  if (isLikelyEnglish(textToCheck)) {
    return {
      language_code: "en",
      lang_confidence_score: 0.9,
      name_en: name || "",
      description_en: description || "",
      keywords_en: keywords || "",
    };
  }

  try {
    const prompt = `You are a language detection and translation expert. Analyze the following content, detect its language, and translate it to English.

Input:
Name: ${name || "N/A"}
Description: ${description || "N/A"}
Keywords: ${keywords || "N/A"}

Respond with ONLY a JSON object in this exact format (no markdown, no code blocks):
{
  "lang": "detected_language_code",
  "confidence": 0.95,
  "name_en": "translated name in English",
  "description_en": "translated description in English",
  "keywords_en": "translated keywords in English"
}

If the content is already in English, return the original text with "lang": "en".
If a field is empty or N/A, return an empty string for that field.`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 4000,
      },
    });

    const response = result.response;
    const text = response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean up the response - remove markdown code blocks if present
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

    return {
      language_code: parsed.lang || "unknown",
      lang_confidence_score: parsed.confidence || 0,
      name_en: parsed.name_en || name || "",
      description_en: parsed.description_en || description || "",
      keywords_en: parsed.keywords_en || keywords || "",
    };
  } catch (error) {
    console.error("Translation error:", error);
    return null;
  }
}

async function processMessage(message: any) {
  if (!message.value) {
    console.error("Invalid message: value is null");
    return;
  }

  const payload: AccountDataFetchedEvent = JSON.parse(message.value.toString());
  const { accountId, platform, name, description, keywords } = payload;

  console.log(`Processing translation for account ${accountId}`);

  try {
    const mongoClient = await getMongoClient();
    const db = mongoClient.db("ratecreator");

    // Translate content
    const translation = await translateContent(name, description, keywords);

    if (!translation) {
      console.error(`Translation failed for account ${accountId}`);

      // Mark as translation failed
      await db.collection("Account").updateOne(
        { _id: new ObjectId(accountId) },
        {
          $set: {
            isTranslationFailed: true,
            updatedAt: new Date(),
          },
        },
      );
      return;
    }

    console.log(
      `Detected language: ${translation.language_code} (confidence: ${translation.lang_confidence_score})`,
    );

    // Update account with translation data
    await db.collection("Account").updateOne(
      { _id: new ObjectId(accountId) },
      {
        $set: {
          language_code: translation.language_code,
          lang_confidence_score: translation.lang_confidence_score,
          name_en: translation.name_en,
          description_en: translation.description_en,
          keywords_en: translation.keywords_en,
          isTranslationFailed: false,
          updatedAt: new Date(),
        },
      },
      { maxTimeMS: 10000 },
    );

    console.log(`Updated account ${accountId} with translation data`);

    // Produce next event for categorisation
    const producer = await getKafkaProducer();
    const topicName = "account-translated";
    await createTopicIfNotExists(topicName);

    await producer.send({
      topic: topicName,
      messages: [
        {
          key: accountId,
          value: JSON.stringify({
            accountId,
            platform,
            name_en: translation.name_en,
            description_en: translation.description_en,
            keywords_en: translation.keywords_en,
            language_code: translation.language_code,
          }),
        },
      ],
    });

    console.log(`Sent account-translated event for account ${accountId}`);
  } catch (error) {
    console.error(
      `Error processing translation for account ${accountId}:`,
      error,
    );
  }
}

async function startConsumer() {
  try {
    consumer = getKafkaConsumer("translate-group");

    consumer.on("consumer.connect", () => {
      console.log("Translate consumer connected successfully");
    });

    consumer.on("consumer.disconnect", () => {
      console.log("Translate consumer disconnected");
    });

    consumer.on("consumer.crash", (error) => {
      console.error("Translate consumer crashed:", error);
    });

    await consumer.connect();

    // Subscribe to account-data-fetched topic
    const topicName = "account-data-fetched";
    await createTopicIfNotExists(topicName);
    await consumer.subscribe({ topic: topicName, fromBeginning: true });

    console.log(`Translate consumer started and subscribed to ${topicName}`);

    await consumer.run({
      eachMessage: async ({ message }) => {
        console.log("Received message:", message?.value?.toString());
        await processMessage(message);
      },
    });
  } catch (error) {
    console.error("Failed to start translate consumer:", error);
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
  console.log("Translate consumer connections closed");
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
const port = parseInt(process.env.PORT || "3041");
serve({ fetch: app.fetch, port });
console.log(`Health check server running on port ${port}`);

// Start the consumer
console.log("Starting translate consumer service...");
startConsumer().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
