/**
 * Tests for Metadata Actions
 * Tests URL metadata extraction for various platforms
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockAxiosGet, mockCheerioLoad, mockPrisma } = vi.hoisted(() => {
  const mockAxiosGet = vi.fn();
  const mockCheerioLoad = vi.fn();
  const mockPrisma = {
    account: {
      findFirst: vi.fn(),
    },
  };
  return { mockAxiosGet, mockCheerioLoad, mockPrisma };
});

// Mock modules
vi.mock("axios", () => ({
  default: {
    get: mockAxiosGet,
  },
}));

vi.mock("cheerio", () => ({
  load: mockCheerioLoad,
}));

vi.mock("@prisma/client", () => ({
  PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
}));

import {
  getMetadata,
  getYouTubeVideoId,
  getTwitterTweetId,
  getTikTokVideoId,
  getRedditPostId,
  getInstagramPostId,
} from "../review/metadata/metadata";

describe("Metadata Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("URL ID Extraction", () => {
    describe("getYouTubeVideoId", () => {
      it("should extract video ID from standard watch URL", () => {
        expect(
          getYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
        ).toBe("dQw4w9WgXcQ");
      });

      it("should extract video ID from short URL", () => {
        expect(getYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ")).toBe(
          "dQw4w9WgXcQ",
        );
      });

      it("should extract video ID from embed URL", () => {
        expect(
          getYouTubeVideoId("https://www.youtube.com/embed/dQw4w9WgXcQ"),
        ).toBe("dQw4w9WgXcQ");
      });

      it("should extract video ID with extra parameters", () => {
        expect(
          getYouTubeVideoId(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=120",
          ),
        ).toBe("dQw4w9WgXcQ");
      });

      it("should return null for invalid URL", () => {
        expect(
          getYouTubeVideoId("https://www.youtube.com/channel/UC123"),
        ).toBeNull();
      });

      it("should return null for non-YouTube URL", () => {
        expect(getYouTubeVideoId("https://vimeo.com/123456")).toBeNull();
      });
    });

    describe("getTwitterTweetId", () => {
      it("should extract tweet ID from Twitter URL", () => {
        expect(
          getTwitterTweetId(
            "https://twitter.com/user/status/1234567890123456789",
          ),
        ).toBe("1234567890123456789");
      });

      it("should extract tweet ID from X.com URL", () => {
        expect(
          getTwitterTweetId("https://x.com/user/status/1234567890123456789"),
        ).toBe("1234567890123456789");
      });

      it("should return null for profile URL", () => {
        expect(getTwitterTweetId("https://twitter.com/user")).toBeNull();
      });
    });

    describe("getTikTokVideoId", () => {
      it("should extract video ID from standard URL", () => {
        expect(
          getTikTokVideoId(
            "https://www.tiktok.com/@user/video/7123456789012345678",
          ),
        ).toBe("7123456789012345678");
      });

      it("should extract video ID from /video/ URL", () => {
        expect(
          getTikTokVideoId("https://www.tiktok.com/video/7123456789012345678"),
        ).toBe("7123456789012345678");
      });

      it("should extract video ID from /v/ URL", () => {
        expect(
          getTikTokVideoId("https://www.tiktok.com/v/7123456789012345678"),
        ).toBe("7123456789012345678");
      });

      it("should return null for profile URL", () => {
        expect(getTikTokVideoId("https://www.tiktok.com/@user")).toBeNull();
      });
    });

    describe("getRedditPostId", () => {
      it("should extract post ID from standard URL", () => {
        expect(
          getRedditPostId(
            "https://www.reddit.com/r/subreddit/comments/abc123/post_title",
          ),
        ).toBe("abc123");
      });

      it("should extract post ID from shortened URL", () => {
        expect(
          getRedditPostId("https://reddit.com/r/sub/comments/xyz789"),
        ).toBe("xyz789");
      });

      it("should return null for subreddit URL", () => {
        expect(
          getRedditPostId("https://www.reddit.com/r/subreddit"),
        ).toBeNull();
      });
    });

    describe("getInstagramPostId", () => {
      it("should extract post ID from /p/ URL", () => {
        expect(
          getInstagramPostId("https://www.instagram.com/p/CxYz123AbC"),
        ).toBe("CxYz123AbC");
      });

      it("should extract post ID from /reel/ URL", () => {
        expect(
          getInstagramPostId("https://www.instagram.com/reel/CxYz123AbC"),
        ).toBe("CxYz123AbC");
      });

      it("should extract post ID from /tv/ URL", () => {
        expect(
          getInstagramPostId("https://www.instagram.com/tv/CxYz123AbC"),
        ).toBe("CxYz123AbC");
      });

      it("should return null for profile URL", () => {
        expect(
          getInstagramPostId("https://www.instagram.com/username"),
        ).toBeNull();
      });
    });
  });

  describe("getMetadata", () => {
    // Helper to create mock cheerio $ function
    const createMockCheerio = (
      metadata: Record<string, string | undefined>,
    ) => {
      const mockAttr = vi.fn((name: string) => {
        const key =
          `meta[property="${name}"]` in metadata
            ? `meta[property="${name}"]`
            : `meta[name="${name}"]`;
        return metadata[key];
      });

      const mockText = vi.fn(() => metadata["title"] || "");

      const mockCheerio = vi.fn((selector: string) => {
        if (selector === "title") {
          return { text: mockText, attr: mockAttr };
        }
        return {
          attr: vi.fn((attr: string) => {
            if (selector.includes("og:title")) return metadata["og:title"];
            if (selector.includes("og:description"))
              return metadata["og:description"];
            if (selector.includes("og:image")) return metadata["og:image"];
            if (selector.includes("description"))
              return metadata["description"];
            if (selector.includes("twitter:image"))
              return metadata["twitter:image"];
            return undefined;
          }),
          text: mockText,
        };
      });

      return mockCheerio;
    };

    it("should throw error if URL is empty", async () => {
      await expect(getMetadata("")).rejects.toThrow("URL is required");
    });

    it("should fetch YouTube metadata", async () => {
      const mockHtml = "<html><head></head><body></body></html>";
      mockAxiosGet.mockResolvedValueOnce({ data: mockHtml });

      const $ = createMockCheerio({
        "og:title": "Test Video Title",
        "og:description": "Test video description",
        "og:image": "https://img.youtube.com/vi/test/maxresdefault.jpg",
      });
      mockCheerioLoad.mockReturnValueOnce($);

      const result = await getMetadata(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      );

      expect(result.title).toBe("Test Video Title");
      expect(result.description).toBe("Test video description");
      expect(result.image).toBe(
        "https://img.youtube.com/vi/test/maxresdefault.jpg",
      );
    });

    it("should fetch Twitter metadata with API", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          data: {
            text: "This is a test tweet content",
          },
        },
      });

      const result = await getMetadata(
        "https://twitter.com/user/status/1234567890123456789",
      );

      expect(result.title).toBe("This is a test tweet content");
      expect(result.description).toBe("This is a test tweet content");
      expect(mockAxiosGet).toHaveBeenCalledWith(
        "https://api.twitter.com/2/tweets/1234567890123456789",
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: expect.stringContaining("Bearer"),
          }),
        }),
      );
    });

    it("should fetch TikTok metadata", async () => {
      const mockHtml = "<html></html>";
      mockAxiosGet.mockResolvedValueOnce({ data: mockHtml });

      const $ = createMockCheerio({
        "og:title": "TikTok Video Title",
        "og:description": "TikTok video description",
        "og:image": "https://p16-sign.tiktokcdn.com/image.jpg",
      });
      mockCheerioLoad.mockReturnValueOnce($);

      const result = await getMetadata(
        "https://www.tiktok.com/@user/video/7123456789012345678",
      );

      expect(result.title).toBe("TikTok Video Title");
      expect(result.description).toBe("TikTok video description");
      expect(result.image).toBe("https://p16-sign.tiktokcdn.com/image.jpg");
    });

    it("should return fallback TikTok metadata on error", async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error("Network error"));

      const result = await getMetadata(
        "https://www.tiktok.com/@user/video/7123456789012345678",
      );

      expect(result.title).toBe("TikTok Video");
      expect(result.description).toContain("7123456789012345678");
      expect(result.image).toBe("https://www.tiktok.com/favicon.ico");
    });

    it("should fetch Reddit metadata from JSON endpoint", async () => {
      mockAxiosGet.mockImplementation((url: string) => {
        if (url.includes(".json")) {
          return Promise.resolve({
            data: [
              {
                data: {
                  children: [
                    {
                      data: {
                        title: "Reddit Post Title",
                        selftext: "Post content here",
                        url: "https://i.redd.it/image.jpg",
                      },
                    },
                  ],
                },
              },
            ],
          });
        }
        return Promise.resolve({ data: "<html></html>" });
      });

      const result = await getMetadata(
        "https://www.reddit.com/r/test/comments/abc123/post",
      );

      expect(result.title).toBe("Reddit Post Title");
      expect(result.description).toBe("Post content here");
      expect(result.image).toBe("https://i.redd.it/image.jpg");
    });

    it("should fallback to HTML scraping for Reddit on JSON failure", async () => {
      mockAxiosGet.mockImplementation((url: string) => {
        if (url.includes(".json")) {
          return Promise.reject(new Error("JSON not available"));
        }
        return Promise.resolve({ data: "<html></html>" });
      });

      const $ = createMockCheerio({
        "og:title": "Reddit Post from HTML",
        "og:description": "Description from HTML",
        "og:image": "https://preview.redd.it/image.png",
      });
      mockCheerioLoad.mockReturnValueOnce($);

      const result = await getMetadata(
        "https://www.reddit.com/r/test/comments/abc123/post",
      );

      expect(result.title).toBe("Reddit Post from HTML");
    });

    it("should fetch Instagram metadata", async () => {
      const mockHtml = "<html></html>";
      mockAxiosGet.mockResolvedValueOnce({ data: mockHtml });

      const $ = createMockCheerio({
        "og:title": "Instagram Post Title",
        "og:description": "Instagram post description",
        "og:image": "https://instagram.fxx.fbcdn.net/image.jpg",
      });
      mockCheerioLoad.mockReturnValueOnce($);

      const result = await getMetadata(
        "https://www.instagram.com/p/CxYz123AbC",
      );

      expect(result.title).toBe("Instagram Post Title");
      expect(result.description).toBe("Instagram post description");
      expect(result.image).toBe("https://instagram.fxx.fbcdn.net/image.jpg");
    });

    it("should return fallback Instagram metadata on error", async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error("Access denied"));

      const result = await getMetadata(
        "https://www.instagram.com/p/CxYz123AbC",
      );

      expect(result.title).toBe("Instagram Post");
      expect(result.description).toContain("CxYz123AbC");
    });

    it("should fetch generic metadata for unknown URLs", async () => {
      const mockHtml = "<html></html>";
      mockAxiosGet.mockResolvedValueOnce({ data: mockHtml });

      const $ = createMockCheerio({
        "og:title": "Generic Page Title",
        "og:description": "Page description",
        "og:image": "https://example.com/image.jpg",
      });
      mockCheerioLoad.mockReturnValueOnce($);

      const result = await getMetadata("https://example.com/some/page");

      expect(result.title).toBe("Generic Page Title");
      expect(result.description).toBe("Page description");
      expect(result.image).toBe("https://example.com/image.jpg");
    });

    it("should handle YouTube short URLs", async () => {
      const mockHtml = "<html></html>";
      mockAxiosGet.mockResolvedValueOnce({ data: mockHtml });

      const $ = createMockCheerio({
        "og:title": "Short URL Video",
        "og:description": "Description",
        "og:image": "https://img.youtube.com/image.jpg",
      });
      mockCheerioLoad.mockReturnValueOnce($);

      const result = await getMetadata("https://youtu.be/dQw4w9WgXcQ");

      expect(result.title).toBe("Short URL Video");
    });

    it("should handle x.com URLs as Twitter", async () => {
      mockAxiosGet.mockResolvedValueOnce({
        data: {
          data: {
            text: "X.com tweet content",
          },
        },
      });

      const result = await getMetadata(
        "https://x.com/user/status/1234567890123456789",
      );

      expect(result.title).toBe("X.com tweet content");
    });

    it("should handle instagr.am short URLs", async () => {
      const mockHtml = "<html></html>";
      mockAxiosGet.mockResolvedValueOnce({ data: mockHtml });

      const $ = createMockCheerio({
        "og:title": "Instagram Short URL",
        "og:description": "Description",
        "og:image": "https://instagram.com/image.jpg",
      });
      mockCheerioLoad.mockReturnValueOnce($);

      const result = await getMetadata("https://instagr.am/p/CxYz123AbC");

      expect(result.title).toBe("Instagram Short URL");
    });

    it("should return empty object on generic fetch error", async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error("Network error"));

      const result = await getMetadata("https://example.com/page");

      expect(result).toEqual({});
    });

    it("should handle YouTube error gracefully", async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error("YouTube unavailable"));

      const result = await getMetadata(
        "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      );

      expect(result).toEqual({});
    });

    it("should handle Twitter API error gracefully", async () => {
      mockAxiosGet.mockRejectedValueOnce(new Error("Twitter API error"));

      const result = await getMetadata(
        "https://twitter.com/user/status/1234567890123456789",
      );

      expect(result).toEqual({});
    });
  });
});
