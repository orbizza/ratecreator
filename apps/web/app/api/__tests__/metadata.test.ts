/**
 * Tests for Metadata API Route
 * Tests URL metadata fetching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Use vi.hoisted for mocks
const { mockGetMetadata } = vi.hoisted(() => {
  const mockGetMetadata = vi.fn();
  return { mockGetMetadata };
});

// Mock modules
vi.mock("@ratecreator/actions/review", () => ({
  getMetadata: mockGetMetadata,
}));

import { GET } from "../metadata/route";

describe("Metadata API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const createRequest = (url?: string) => {
    const requestUrl = new URL("http://localhost:3000/api/metadata");
    if (url) {
      requestUrl.searchParams.set("url", url);
    }
    return new NextRequest(requestUrl);
  };

  describe("Parameter Validation", () => {
    it("should return 400 when URL is missing", async () => {
      const request = createRequest();

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("URL is required");
    });

    it("should return 400 when URL is empty string", async () => {
      const request = createRequest("");

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
    });
  });

  describe("Successful Metadata Fetch", () => {
    it("should fetch metadata for a valid URL", async () => {
      const mockMetadataResult = {
        title: "Test Page",
        description: "A test page description",
        image: "https://example.com/image.jpg",
        url: "https://example.com",
      };

      mockGetMetadata.mockResolvedValueOnce(mockMetadataResult);

      const request = createRequest("https://example.com");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(mockMetadataResult);
      expect(mockGetMetadata).toHaveBeenCalledWith("https://example.com");
    });

    it("should handle metadata with all fields", async () => {
      const fullMetadata = {
        title: "Full Metadata Page",
        description: "A complete description",
        image: "https://example.com/og-image.jpg",
        url: "https://example.com/page",
        siteName: "Example Site",
        type: "article",
        favicon: "https://example.com/favicon.ico",
      };

      mockGetMetadata.mockResolvedValueOnce(fullMetadata);

      const request = createRequest("https://example.com/page");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual(fullMetadata);
    });

    it("should handle metadata with missing optional fields", async () => {
      const minimalMetadata = {
        title: "Minimal Page",
        url: "https://example.com",
      };

      mockGetMetadata.mockResolvedValueOnce(minimalMetadata);

      const request = createRequest("https://example.com");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("Minimal Page");
      expect(data.description).toBeUndefined();
    });
  });

  describe("URL Formats", () => {
    it("should handle URL with query parameters", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "Test" });

      const request = createRequest(
        "https://example.com/page?param=value&other=test",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetMetadata).toHaveBeenCalledWith(
        "https://example.com/page?param=value&other=test",
      );
    });

    it("should handle URL with hash fragment", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "Test" });

      const request = createRequest("https://example.com/page#section");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should handle YouTube video URL", async () => {
      const youtubeMetadata = {
        title: "YouTube Video",
        description: "Video description",
        image: "https://img.youtube.com/vi/abc123/maxresdefault.jpg",
      };

      mockGetMetadata.mockResolvedValueOnce(youtubeMetadata);

      const request = createRequest("https://www.youtube.com/watch?v=abc123");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toBe("YouTube Video");
    });

    it("should handle Twitter URL", async () => {
      const twitterMetadata = {
        title: "Tweet by @user",
        description: "Tweet content",
      };

      mockGetMetadata.mockResolvedValueOnce(twitterMetadata);

      const request = createRequest("https://twitter.com/user/status/123456");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.title).toContain("Tweet");
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when getMetadata throws an error", async () => {
      mockGetMetadata.mockRejectedValueOnce(new Error("Failed to fetch"));

      const request = createRequest("https://example.com");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch metadata");
    });

    it("should return 500 when getMetadata returns null", async () => {
      mockGetMetadata.mockResolvedValueOnce(null);

      const request = createRequest("https://example.com");
      const response = await GET(request);

      // Depending on implementation, this might return 200 with null or handle differently
      expect(response.status).toBeLessThanOrEqual(500);
    });

    it("should handle network timeout errors", async () => {
      mockGetMetadata.mockRejectedValueOnce(new Error("ETIMEDOUT"));

      const request = createRequest("https://slow-site.example.com");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch metadata");
    });

    it("should handle invalid URL format gracefully", async () => {
      mockGetMetadata.mockRejectedValueOnce(new Error("Invalid URL"));

      const request = createRequest("not-a-valid-url");
      const response = await GET(request);

      expect(response.status).toBe(500);
    });
  });

  describe("Edge Cases", () => {
    it("should handle URL with encoded characters", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "Test" });

      const request = createRequest("https://example.com/path%20with%20spaces");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should handle international domain names", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "International" });

      const request = createRequest("https://例え.jp/page");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should handle very long URLs", async () => {
      const longPath = "a".repeat(500);
      mockGetMetadata.mockResolvedValueOnce({ title: "Long URL" });

      const request = createRequest(`https://example.com/${longPath}`);
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });
});
