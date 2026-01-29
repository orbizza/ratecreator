import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { VertexAI } from "@google-cloud/vertexai";

interface ImageGenerationRequest {
  prompt: string;
  style?:
    | "photorealistic"
    | "digital-art"
    | "illustration"
    | "minimalist"
    | "abstract";
  aspectRatio?: "1:1" | "16:9" | "4:3" | "9:16";
  negativePrompt?: string;
}

const projectId = process.env.GCP_PROJECT_ID;
const location = process.env.GCP_LOCATION || "us-central1";

let vertexAI: VertexAI | null = null;

function getVertexAI(): VertexAI | null {
  if (!vertexAI && projectId) {
    vertexAI = new VertexAI({
      project: projectId,
      location,
    });
  }
  return vertexAI;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const requestData = (await request.json()) as ImageGenerationRequest;
    const { prompt, style = "photorealistic" } = requestData;

    if (!prompt) {
      return NextResponse.json(
        { error: "Prompt is required" },
        { status: 400 },
      );
    }

    const ai = getVertexAI();

    if (!ai) {
      return NextResponse.json({
        error: "Image generation requires Vertex AI configuration",
        fallback: true,
        suggestion: generateImagePromptSuggestion(prompt, style),
      });
    }

    const styleEnhancements: Record<string, string> = {
      photorealistic:
        "photorealistic, high quality, professional photography, detailed",
      "digital-art": "digital art, vibrant colors, stylized, artistic",
      illustration:
        "illustration style, hand-drawn feel, artistic illustration",
      minimalist: "minimalist design, clean, simple, modern aesthetic",
      abstract: "abstract art, creative, artistic interpretation, modern art",
    };

    const enhancedPrompt = `${prompt}, ${styleEnhancements[style]}, suitable for blog header image`;

    try {
      const imagenModel = ai.preview.getGenerativeModel({
        model: "imagegeneration@006",
      });

      const result = await imagenModel.generateContent({
        contents: [
          {
            role: "user",
            parts: [
              {
                text: `Generate an image: ${enhancedPrompt}`,
              },
            ],
          },
        ],
      });

      const response = result.response;
      const candidates = response.candidates;

      const firstCandidate = candidates?.[0];
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition -- Vertex AI types may return undefined content
      const parts = firstCandidate?.content?.parts;
      if (parts) {
        for (const part of parts) {
          const partWithData = part as {
            inlineData?: { mimeType: string; data: string };
          };
          if (partWithData.inlineData) {
            return NextResponse.json({
              imageBase64: partWithData.inlineData.data,
              mimeType: partWithData.inlineData.mimeType,
            });
          }
        }
      }

      return NextResponse.json({
        error: "Image generation not available with current configuration",
        fallback: true,
        suggestion: generateImagePromptSuggestion(prompt, style),
      });
    } catch {
      return NextResponse.json({
        error: "Image generation service unavailable",
        fallback: true,
        suggestion: generateImagePromptSuggestion(prompt, style),
      });
    }
  } catch {
    return NextResponse.json(
      {
        error: "Failed to process image generation request",
        fallback: true,
      },
      { status: 500 },
    );
  }
}

function generateImagePromptSuggestion(
  prompt: string,
  style: string,
): {
  enhancedPrompt: string;
  stockPhotoKeywords: string[];
  colorPalette: string[];
} {
  const styleKeywords: Record<string, string[]> = {
    photorealistic: [
      "professional photo",
      "high resolution",
      "natural lighting",
    ],
    "digital-art": ["digital artwork", "vibrant", "stylized"],
    illustration: ["illustrated", "hand-drawn", "artistic"],
    minimalist: ["minimal", "clean lines", "simple shapes"],
    abstract: ["abstract", "geometric", "modern art"],
  };

  const defaultKeywords = [
    "professional photo",
    "high resolution",
    "natural lighting",
  ];
  const keywords =
    style in styleKeywords ? styleKeywords[style] : defaultKeywords;
  return {
    enhancedPrompt: `${prompt}, ${keywords.join(", ")}`,
    stockPhotoKeywords: extractKeywords(prompt),
    colorPalette: suggestColorPalette(style),
  };
}

function extractKeywords(prompt: string): string[] {
  const stopWords = new Set([
    "a",
    "an",
    "the",
    "and",
    "or",
    "but",
    "in",
    "on",
    "at",
    "to",
    "for",
    "of",
    "with",
    "by",
    "from",
    "as",
    "is",
    "was",
    "are",
    "were",
    "been",
    "be",
    "have",
    "has",
    "had",
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
    "about",
    "into",
    "through",
    "during",
    "before",
    "after",
    "above",
    "below",
    "between",
    "under",
    "again",
    "further",
    "then",
    "once",
  ]);

  const words = prompt.toLowerCase().split(/\W+/);
  const keywords = words.filter(
    (word) => word.length > 2 && !stopWords.has(word),
  );

  return Array.from(new Set(keywords)).slice(0, 5);
}

function suggestColorPalette(style: string): string[] {
  const palettes: Record<string, string[]> = {
    photorealistic: ["#2C3E50", "#3498DB", "#ECF0F1", "#E74C3C", "#F39C12"],
    "digital-art": ["#9B59B6", "#3498DB", "#1ABC9C", "#F1C40F", "#E74C3C"],
    illustration: ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"],
    minimalist: ["#FFFFFF", "#F5F5F5", "#333333", "#666666", "#000000"],
    abstract: ["#FF4757", "#2ED573", "#1E90FF", "#FFA502", "#A4B0BE"],
  };

  const defaultPalette = [
    "#2C3E50",
    "#3498DB",
    "#ECF0F1",
    "#E74C3C",
    "#F39C12",
  ];
  return style in palettes ? palettes[style] : defaultPalette;
}
