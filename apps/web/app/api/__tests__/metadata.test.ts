/**
 * Tests for Metadata API Route
 * Tests URL metadata fetching, auth gate, and host allowlist (anti-SSRF).
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";

// Use vi.hoisted for mocks
const { mockGetMetadata, mockAuth } = vi.hoisted(() => {
  const mockGetMetadata = vi.fn();
  const mockAuth = vi.fn();
  return { mockGetMetadata, mockAuth };
});

// Mock modules
vi.mock("@ratecreator/actions/review", () => ({
  getMetadata: mockGetMetadata,
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

import { GET } from "../metadata/route";

describe("Metadata API Route", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default to authenticated; individual tests override.
    mockAuth.mockResolvedValue({ userId: "user-123" });
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

  describe("Authentication", () => {
    it("should return 401 when unauthenticated", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      const request = createRequest("https://www.youtube.com/watch?v=abc");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe("Unauthorized");
      expect(mockGetMetadata).not.toHaveBeenCalled();
    });
  });

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

  describe("Host Allowlist (anti-SSRF)", () => {
    it("should reject arbitrary hosts (blocks SSRF)", async () => {
      const request = createRequest("https://example.com");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("URL host not allowed");
      expect(mockGetMetadata).not.toHaveBeenCalled();
    });

    it("should reject internal/private hosts", async () => {
      const request = createRequest("http://localhost:3000/admin");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("URL host not allowed");
    });

    it("should reject metadata service IPs", async () => {
      const request = createRequest("http://169.254.169.254/latest/meta-data/");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("URL host not allowed");
    });

    it("should reject file:// scheme", async () => {
      const request = createRequest("file:///etc/passwd");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("URL host not allowed");
    });

    it("should reject malformed URLs", async () => {
      const request = createRequest("not-a-valid-url");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe("URL host not allowed");
    });

    it("should accept YouTube URLs", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "YouTube Video" });

      const request = createRequest("https://www.youtube.com/watch?v=abc123");
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetMetadata).toHaveBeenCalled();
    });

    it("should accept Twitter URLs", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "Tweet" });

      const request = createRequest("https://twitter.com/user/status/123456");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should accept x.com URLs", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "Tweet" });

      const request = createRequest("https://x.com/user/status/123456");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should accept TikTok URLs", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "TikTok" });

      const request = createRequest("https://www.tiktok.com/@user/video/123");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should accept Reddit URLs", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "Reddit Post" });

      const request = createRequest(
        "https://www.reddit.com/r/test/comments/abc/title/",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
    });

    it("should accept Instagram URLs", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "Instagram Post" });

      const request = createRequest("https://www.instagram.com/p/abc123/");
      const response = await GET(request);

      expect(response.status).toBe(200);
    });
  });

  describe("Successful Metadata Fetch", () => {
    it("should fetch metadata for a YouTube URL", async () => {
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
      expect(data).toEqual(youtubeMetadata);
      expect(mockGetMetadata).toHaveBeenCalledWith(
        "https://www.youtube.com/watch?v=abc123",
      );
    });

    it("should handle URL with query parameters", async () => {
      mockGetMetadata.mockResolvedValueOnce({ title: "Test" });

      const request = createRequest(
        "https://www.youtube.com/watch?v=abc123&t=10s",
      );
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockGetMetadata).toHaveBeenCalledWith(
        "https://www.youtube.com/watch?v=abc123&t=10s",
      );
    });
  });

  describe("Error Handling", () => {
    it("should return 500 when getMetadata throws an error", async () => {
      mockGetMetadata.mockRejectedValueOnce(new Error("Failed to fetch"));

      const request = createRequest("https://www.youtube.com/watch?v=abc");
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe("Failed to fetch metadata");
    });
  });
});
