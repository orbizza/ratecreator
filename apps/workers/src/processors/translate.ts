import { getMongoClient } from "@ratecreator/db/mongo-client";
import { ObjectId } from "mongodb";
import { publishMessageWithKey } from "@ratecreator/db/pubsub-client";
import { VertexAI } from "@google-cloud/vertexai";

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID || "",
  location: process.env.GCP_LOCATION || "us-central1",
});

const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

export async function processTranslate(
  data: Record<string, unknown>,
  attributes: Record<string, string>,
): Promise<void> {
  if (!data) {
    console.error("Invalid message: data is null");
    return;
  }

  const payload = data as unknown as AccountDataFetchedEvent;
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
    const topicName = "account-translated";

    await publishMessageWithKey(topicName, accountId, {
      accountId,
      platform,
      name_en: translation.name_en,
      description_en: translation.description_en,
      keywords_en: translation.keywords_en,
      language_code: translation.language_code,
    });

    console.log(`Sent account-translated event for account ${accountId}`);
  } catch (error) {
    console.error(
      `Error processing translation for account ${accountId}:`,
      error,
    );
  }
}
