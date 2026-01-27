/**
 * Tests for Translation Actions
 * Tests Vertex AI Gemini translation functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockGenerateContent, MockVertexAI } = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();

  const MockVertexAI = vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  }));

  return { mockGenerateContent, MockVertexAI };
});

// Mock modules
vi.mock("@google-cloud/vertexai", () => ({
  VertexAI: MockVertexAI,
}));

import {
  translateToEnglish,
  batchTranslate,
  detectLanguage,
} from "../translation/translate";

describe("Translation Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("translateToEnglish", () => {
    it("should return empty result for empty text", async () => {
      const result = await translateToEnglish("");

      expect(result.success).toBe(true);
      expect(result.detectedLanguage).toBe("unknown");
      expect(result.confidence).toBe(0);
      expect(result.translatedText).toBe("");
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should return empty result for whitespace-only text", async () => {
      const result = await translateToEnglish("   ");

      expect(result.success).toBe(true);
      expect(result.detectedLanguage).toBe("unknown");
      expect(result.translatedText).toBe("");
    });

    it("should translate text successfully", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '{"lang": "es", "confidence": 0.98, "text_en": "Hello, how are you?"}',
                  },
                ],
              },
            },
          ],
        },
      });

      const result = await translateToEnglish("Hola, ¿cómo estás?");

      expect(result.success).toBe(true);
      expect(result.detectedLanguage).toBe("es");
      expect(result.confidence).toBe(0.98);
      expect(result.translatedText).toBe("Hello, how are you?");
    });

    it("should handle JSON response with code block markers", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '```json\n{"lang": "ja", "confidence": 0.95, "text_en": "Good morning"}\n```',
                  },
                ],
              },
            },
          ],
        },
      });

      const result = await translateToEnglish("おはようございます");

      expect(result.success).toBe(true);
      expect(result.detectedLanguage).toBe("ja");
      expect(result.translatedText).toBe("Good morning");
    });

    it("should handle JSON response with simple code block", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '```\n{"lang": "fr", "confidence": 0.92, "text_en": "Thank you"}\n```',
                  },
                ],
              },
            },
          ],
        },
      });

      const result = await translateToEnglish("Merci");

      expect(result.success).toBe(true);
      expect(result.detectedLanguage).toBe("fr");
      expect(result.translatedText).toBe("Thank you");
    });

    it("should return error on API failure", async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error("API quota exceeded"),
      );

      const result = await translateToEnglish("Test text");

      expect(result.success).toBe(false);
      expect(result.error).toBe("API quota exceeded");
    });

    it("should return error on invalid JSON response", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: "invalid json response" }],
              },
            },
          ],
        },
      });

      const result = await translateToEnglish("Test text");

      expect(result.success).toBe(false);
      expect(result.error).toContain("JSON");
    });

    it("should handle empty response from API", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [],
        },
      });

      const result = await translateToEnglish("Test text");

      expect(result.success).toBe(false);
    });
  });

  describe("batchTranslate", () => {
    it("should return empty results for empty input", async () => {
      const result = await batchTranslate({});

      expect(result.success).toBe(true);
      expect(result.results).toEqual({});
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should translate multiple items successfully", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      name: {
                        lang: "ja",
                        confidence: 0.95,
                        text_en: "Mountain",
                      },
                      description: {
                        lang: "ja",
                        confidence: 0.92,
                        text_en: "A beautiful mountain",
                      },
                    }),
                  },
                ],
              },
            },
          ],
        },
      });

      const result = await batchTranslate({
        name: "山",
        description: "美しい山",
      });

      expect(result.success).toBe(true);
      expect(result.results?.name.text_en).toBe("Mountain");
      expect(result.results?.description.text_en).toBe("A beautiful mountain");
    });

    it("should handle JSON with code block markers", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: '```json\n{"key1": {"lang": "de", "confidence": 0.9, "text_en": "Hello"}}\n```',
                  },
                ],
              },
            },
          ],
        },
      });

      const result = await batchTranslate({ key1: "Hallo" });

      expect(result.success).toBe(true);
      expect(result.results?.key1.text_en).toBe("Hello");
    });

    it("should return error on API failure", async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error("Network error"));

      const result = await batchTranslate({ key: "value" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });

    it("should return error on invalid JSON response", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: "not valid json" }],
              },
            },
          ],
        },
      });

      const result = await batchTranslate({ key: "value" });

      expect(result.success).toBe(false);
      expect(result.error).toContain("JSON");
    });
  });

  describe("detectLanguage", () => {
    it("should return unknown for empty text", async () => {
      const result = await detectLanguage("");

      expect(result.success).toBe(true);
      expect(result.language).toBe("unknown");
      expect(result.confidence).toBe(0);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should return unknown for whitespace-only text", async () => {
      const result = await detectLanguage("   ");

      expect(result.success).toBe(true);
      expect(result.language).toBe("unknown");
    });

    it("should detect language successfully", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: '{"lang": "en", "confidence": 0.99}' }],
              },
            },
          ],
        },
      });

      const result = await detectLanguage("Hello, world!");

      expect(result.success).toBe(true);
      expect(result.language).toBe("en");
      expect(result.confidence).toBe(0.99);
    });

    it("should detect non-English languages", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: '{"lang": "zh", "confidence": 0.97}' }],
              },
            },
          ],
        },
      });

      const result = await detectLanguage("你好世界");

      expect(result.success).toBe(true);
      expect(result.language).toBe("zh");
      expect(result.confidence).toBe(0.97);
    });

    it("should handle JSON with code block markers", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  { text: '```json\n{"lang": "ko", "confidence": 0.94}\n```' },
                ],
              },
            },
          ],
        },
      });

      const result = await detectLanguage("안녕하세요");

      expect(result.success).toBe(true);
      expect(result.language).toBe("ko");
    });

    it("should return error on API failure", async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error("Service unavailable"),
      );

      const result = await detectLanguage("Test text");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Service unavailable");
    });

    it("should return error on invalid JSON response", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [{ text: "invalid" }],
              },
            },
          ],
        },
      });

      const result = await detectLanguage("Test text");

      expect(result.success).toBe(false);
    });

    it("should handle empty candidates array", async () => {
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [],
        },
      });

      const result = await detectLanguage("Test text");

      expect(result.success).toBe(false);
    });
  });
});
