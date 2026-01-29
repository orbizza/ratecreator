"use server";

import { VertexAI } from "@google-cloud/vertexai";

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: process.env.GCP_PROJECT_ID || "",
  location: process.env.GCP_LOCATION || "us-central1",
});

const model = vertexAI.getGenerativeModel({ model: "gemini-2.0-flash" });

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

  try {
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
    console.error("Translation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
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

  try {
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
    console.error("Batch translation error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Batch translation failed",
    };
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

  try {
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
    console.error("Language detection error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Language detection failed",
    };
  }
}
