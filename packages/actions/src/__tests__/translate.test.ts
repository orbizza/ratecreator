/**
 * Tests for Translation Actions
 * Tests Vertex AI Gemini translation functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const {
  mockGenerateContent,
  MockVertexAI,
  mockAuth,
  mockRedisIncr,
  mockRedisExpire,
  mockGetRedisClient,
} = vi.hoisted(() => {
  const mockGenerateContent = vi.fn();

  const MockVertexAI = vi.fn().mockImplementation(() => ({
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: mockGenerateContent,
    }),
  }));

  const mockAuth = vi.fn();
  const mockRedisIncr = vi.fn();
  const mockRedisExpire = vi.fn();
  const mockGetRedisClient = vi.fn(() => ({
    incr: mockRedisIncr,
    expire: mockRedisExpire,
  }));

  return {
    mockGenerateContent,
    MockVertexAI,
    mockAuth,
    mockRedisIncr,
    mockRedisExpire,
    mockGetRedisClient,
  };
});

// Mock modules
vi.mock("@google-cloud/vertexai", () => ({
  VertexAI: MockVertexAI,
}));

// translate.ts now requires auth + per-user Redis rate limit. We default to
// signed-in `u1` with a fresh counter so the existing happy-path tests keep
// passing; per-test overrides cover the unauth/over-limit/over-size paths.
vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: mockGetRedisClient,
}));

import {
  translateToEnglish,
  batchTranslate,
  detectLanguage,
} from "../translation/translate";

describe("Translation Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: signed-in user with fresh rate-limit counter (under threshold).
    mockAuth.mockResolvedValue({ userId: "u1" });
    mockRedisIncr.mockResolvedValue(1);
    mockRedisExpire.mockResolvedValue(1);
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

    it("should return generic error on API failure (does not leak provider message)", async () => {
      // Source now scrubs unknown errors and returns the generic
      // "Translation failed" string so we don't leak Vertex AI internals.
      mockGenerateContent.mockRejectedValueOnce(
        new Error("API quota exceeded"),
      );

      const result = await translateToEnglish("Test text");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Translation failed");
    });

    it("should return generic error on invalid JSON response", async () => {
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
      expect(result.error).toBe("Translation failed");
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

    it("should reject unauthenticated callers", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });
      const result = await translateToEnglish("Hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
      // Vertex AI must NOT have been called — that's the whole point of the
      // auth gate (we pay per call).
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should reject input over MAX_INPUT_BYTES (4 KiB)", async () => {
      const big = "a".repeat(4097);
      const result = await translateToEnglish(big);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Input too large");
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should reject when per-user rate limit is exceeded", async () => {
      // 61st call within the same window — gateTranslationCall throws
      // RateLimitedError which we surface verbatim to the caller.
      mockRedisIncr.mockResolvedValueOnce(61);
      const result = await translateToEnglish("Hola");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/rate limit/i);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should set the per-user expire only on the first hit of the window", async () => {
      // First call: count=1 → expire is set.
      mockRedisIncr.mockResolvedValueOnce(1);
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  { text: '{"lang":"en","confidence":0.99,"text_en":"hi"}' },
                ],
              },
            },
          ],
        },
      });
      await translateToEnglish("hi");
      expect(mockRedisExpire).toHaveBeenCalledWith(
        "rl:translate:single:u1",
        60,
      );

      // Second call: count=2 → expire NOT touched.
      mockRedisExpire.mockClear();
      mockRedisIncr.mockResolvedValueOnce(2);
      mockGenerateContent.mockResolvedValueOnce({
        response: {
          candidates: [
            {
              content: {
                parts: [
                  { text: '{"lang":"en","confidence":0.99,"text_en":"hi"}' },
                ],
              },
            },
          ],
        },
      });
      await translateToEnglish("hi");
      expect(mockRedisExpire).not.toHaveBeenCalled();
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

    it("should return generic error on API failure", async () => {
      mockGenerateContent.mockRejectedValueOnce(new Error("Network error"));

      const result = await batchTranslate({ key: "value" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Batch translation failed");
    });

    it("should return generic error on invalid JSON response", async () => {
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
      expect(result.error).toBe("Batch translation failed");
    });

    it("should reject unauthenticated callers", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });
      const result = await batchTranslate({ a: "x" });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should reject batch larger than 50 items", async () => {
      const items: Record<string, string> = {};
      for (let i = 0; i < 51; i++) items[`k${i}`] = "x";
      const result = await batchTranslate(items);
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/too many items/i);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should reject when total payload exceeds the byte cap", async () => {
      // 4 keys * 4097 bytes = ~16 KiB, well over MAX_INPUT_BYTES * 4.
      const items: Record<string, string> = {
        a: "a".repeat(4097),
        b: "b".repeat(4097),
        c: "c".repeat(4097),
        d: "d".repeat(4097),
        e: "e".repeat(4097),
      };
      const result = await batchTranslate(items);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Input too large");
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should reject when batch rate limit is exceeded", async () => {
      mockRedisIncr.mockResolvedValueOnce(61);
      const result = await batchTranslate({ a: "hola" });
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/rate limit/i);
      expect(mockGenerateContent).not.toHaveBeenCalled();
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

    it("should return generic error on API failure", async () => {
      mockGenerateContent.mockRejectedValueOnce(
        new Error("Service unavailable"),
      );

      const result = await detectLanguage("Test text");

      expect(result.success).toBe(false);
      expect(result.error).toBe("Language detection failed");
    });

    it("should return generic error on invalid JSON response", async () => {
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
      expect(result.error).toBe("Language detection failed");
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

    it("should reject unauthenticated callers", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });
      const result = await detectLanguage("hello");
      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should reject input over MAX_INPUT_BYTES", async () => {
      const big = "a".repeat(4097);
      const result = await detectLanguage(big);
      expect(result.success).toBe(false);
      expect(result.error).toBe("Input too large");
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });

    it("should reject when rate limit is exceeded", async () => {
      mockRedisIncr.mockResolvedValueOnce(61);
      const result = await detectLanguage("Hola");
      expect(result.success).toBe(false);
      expect(result.error).toMatch(/rate limit/i);
      expect(mockGenerateContent).not.toHaveBeenCalled();
    });
  });
});
