"use server";

import { VertexAI } from "@google-cloud/vertexai";
import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@ratecreator/db/redis-do";

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID || "",
  location: process.env.GCP_LOCATION || "us-central1",
});

const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const redis = getRedisClient();

// Translation actions are exposed as Server Actions at deterministic IDs.
// Without auth + rate limit, anyone in the world can drive Vertex AI calls
// on our billing. Cap to 60 calls/min per signed-in user; refuse anonymous.
const TRANSLATION_RATE_PER_MIN = 60;
const TRANSLATION_RATE_WINDOW_SEC = 60;
const MAX_INPUT_BYTES = 4096; // 4 KiB per call

class RateLimitedError extends Error {
  constructor() {
    super("Rate limit exceeded — try again in a minute");
  }
}

async function gateTranslationCall(scope: "single" | "batch") {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  const key = `rl:translate:${scope}:${userId}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, TRANSLATION_RATE_WINDOW_SEC);
  }
  if (count > TRANSLATION_RATE_PER_MIN) {
    throw new RateLimitedError();
  }
}

function bytesOf(s: string): number {
  return Buffer.byteLength(s, "utf8");
}

interface TranslationResult {
  success: boolean;
  detectedLanguage?: string;
  confidence?: number;
  translatedText?: string;
  error?: string;
}

interface BatchTranslationResult {
  success: boolean;
  results?: Record<
    string,
    {
      lang: string;
      confidence: number;
      text_en: string;
    }
  >;
  error?: string;
}

export async function translateToEnglish(
  text: string,
): Promise<TranslationResult> {
  if (!text || text.trim().length === 0) {
    return {
      success: true,
      detectedLanguage: "unknown",
      confidence: 0,
      translatedText: "",
    };
  }
  if (bytesOf(text) > MAX_INPUT_BYTES) {
    return { success: false, error: "Input too large" };
  }

  try {
    await gateTranslationCall("single");
    const prompt = `Detect the language of the following text and translate it to English.
Return JSON only: {"lang": "language_code", "confidence": 0.95, "text_en": "translated text"}

Text: ${text}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 2000,
      },
    });

    const response = result.response;
    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean up response
    let cleanedText = responseText.trim();
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
      success: true,
      detectedLanguage: parsed.lang,
      confidence: parsed.confidence,
      translatedText: parsed.text_en,
    };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Translation error:", error);
    return {
      success: false,
      error: "Translation failed",
    };
  }
}

export async function batchTranslate(
  items: Record<string, string>,
): Promise<BatchTranslationResult> {
  if (Object.keys(items).length === 0) {
    return {
      success: true,
      results: {},
    };
  }
  if (Object.keys(items).length > 50) {
    return { success: false, error: "Too many items (max 50 per batch)" };
  }
  const totalBytes = Object.values(items).reduce(
    (acc, v) => acc + bytesOf(typeof v === "string" ? v : ""),
    0,
  );
  if (totalBytes > MAX_INPUT_BYTES * 4) {
    return { success: false, error: "Input too large" };
  }

  try {
    await gateTranslationCall("batch");
    const prompt = `Detect the language and translate the following texts to English.
Return JSON only with the same keys: {"key1": {"lang": "code", "confidence": 0.95, "text_en": "translated"}, ...}

Texts:
${JSON.stringify(items, null, 2)}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 8000,
      },
    });

    const response = result.response;
    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Clean up response
    let cleanedText = responseText.trim();
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
      success: true,
      results: parsed,
    };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Batch translation error:", error);
    return { success: false, error: "Batch translation failed" };
  }
}

export async function detectLanguage(text: string): Promise<{
  success: boolean;
  language?: string;
  confidence?: number;
  error?: string;
}> {
  if (!text || text.trim().length === 0) {
    return {
      success: true,
      language: "unknown",
      confidence: 0,
    };
  }
  if (bytesOf(text) > MAX_INPUT_BYTES) {
    return { success: false, error: "Input too large" };
  }

  try {
    await gateTranslationCall("single");
    const prompt = `Detect the language of the following text.
Return JSON only: {"lang": "language_code", "confidence": 0.95}

Text: ${text}`;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0,
        maxOutputTokens: 100,
      },
    });

    const response = result.response;
    const responseText =
      response.candidates?.[0]?.content?.parts?.[0]?.text || "";

    let cleanedText = responseText.trim();
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
      success: true,
      language: parsed.lang,
      confidence: parsed.confidence,
    };
  } catch (error) {
    if (error instanceof RateLimitedError) {
      return { success: false, error: error.message };
    }
    if (error instanceof Error && error.message === "Unauthorized") {
      return { success: false, error: "Unauthorized" };
    }
    console.error("Language detection error:", error);
    return { success: false, error: "Language detection failed" };
  }
}
