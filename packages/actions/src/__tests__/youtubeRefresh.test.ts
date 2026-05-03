/**
 * Tests for YouTube Refresh Action
 * Tests rate limiting, YouTube API interaction, Prisma updates, and cache invalidation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockRedisClient, mockPrismaInstance, mockFetch, mockAuth } = vi.hoisted(
  () => {
    const mockRedisClient = {
      incr: vi.fn(),
      expire: vi.fn(),
      decr: vi.fn(),
      del: vi.fn(),
    };
    const mockPrismaInstance = {
      account: {
        updateMany: vi.fn(),
      },
    };
    const mockFetch = vi.fn();
    const mockAuth = vi.fn();
    return { mockRedisClient, mockPrismaInstance, mockFetch, mockAuth };
  },
);

// Mock modules
vi.mock("@ratecreator/db/redis-do", () => ({
  getRedisClient: vi.fn(() => mockRedisClient),
}));

vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrismaInstance),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
}));

import { refreshYoutubeData } from "../review/creators/youtubeRefresh";

// Helper: build a full YouTube channel API response
function makeYouTubeResponse(overrides: Record<string, any> = {}) {
  return {
    items: [
      {
        snippet: {
          title: "Test Channel",
          description: "A test channel description",
          thumbnails: {
            high: { url: "https://yt.com/thumb_high.jpg" },
            default: { url: "https://yt.com/thumb_default.jpg" },
          },
          country: "US",
        },
        statistics: {
          subscriberCount: "150000",
          viewCount: "5000000",
          videoCount: "200",
        },
        brandingSettings: {
          channel: {
            keywords: "tech reviews tutorials",
          },
          image: {
            bannerExternalUrl: "https://yt.com/banner.jpg",
          },
        },
        ...overrides,
      },
    ],
  };
}

describe("refreshYoutubeData", () => {
  const ACCOUNT_ID = "UCxxxxxxxxxxxxxxxxxxxxxxxx";

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.YOUTUBE_API_KEY = "test-api-key-123";

    // Default: signed-in caller (refreshYoutubeData refuses unauthenticated
    // calls and silently returns).
    mockAuth.mockResolvedValue({ userId: "clerk-user-1" });

    // Default: rate limit is fine (first call)
    mockRedisClient.incr.mockResolvedValue(1);
    mockRedisClient.expire.mockResolvedValue(1);
    mockRedisClient.del.mockResolvedValue(1);
    mockPrismaInstance.account.updateMany.mockResolvedValue({ count: 1 });

    // Replace global fetch
    global.fetch = mockFetch;
  });

  afterEach(() => {
    delete process.env.YOUTUBE_API_KEY;
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------
  // Auth gate
  // ---------------------------------------------------------------

  it("should silently return when caller is unauthenticated", async () => {
    mockAuth.mockResolvedValueOnce({ userId: null });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await expect(refreshYoutubeData(ACCOUNT_ID)).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      "[youtube-refresh] Refusing unauthenticated refresh",
    );
    expect(mockRedisClient.incr).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(mockPrismaInstance.account.updateMany).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------
  // ENV / early exit
  // ---------------------------------------------------------------

  it("should skip when YOUTUBE_API_KEY not set", async () => {
    delete process.env.YOUTUBE_API_KEY;
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockRedisClient.incr).not.toHaveBeenCalled();
    expect(mockFetch).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[youtube-refresh] YOUTUBE_API_KEY not configured",
    );
  });

  // ---------------------------------------------------------------
  // Rate limiting
  // ---------------------------------------------------------------

  it("should skip when rate limit reached (incr returns > 125)", async () => {
    mockRedisClient.incr.mockResolvedValue(126);
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockRedisClient.incr).toHaveBeenCalledWith("youtube_api_rate_limit");
    expect(mockFetch).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      "[youtube-refresh] Rate limit reached, skipping refresh",
    );
  });

  it("should set expire on first rate limit check (incr returns 1)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeYouTubeResponse(),
    });

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockRedisClient.incr).toHaveBeenCalledWith("youtube_api_rate_limit");
    expect(mockRedisClient.expire).toHaveBeenCalledWith(
      "youtube_api_rate_limit",
      3600,
    );
  });

  it("should not set expire when incr returns value > 1", async () => {
    mockRedisClient.incr.mockResolvedValue(50);
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeYouTubeResponse(),
    });

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockRedisClient.expire).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------
  // YouTube API call
  // ---------------------------------------------------------------

  it("should fetch from YouTube API with correct URL", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeYouTubeResponse(),
    });

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockFetch).toHaveBeenCalledWith(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,brandingSettings&id=${ACCOUNT_ID}&key=test-api-key-123`,
    );
  });

  // ---------------------------------------------------------------
  // Successful update
  // ---------------------------------------------------------------

  it("should update account with fresh data", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeYouTubeResponse(),
    });

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockPrismaInstance.account.updateMany).toHaveBeenCalledTimes(1);

    const call = mockPrismaInstance.account.updateMany.mock.calls[0][0];
    expect(call.where).toEqual({
      accountId: ACCOUNT_ID,
      platform: "YOUTUBE",
    });

    const data = call.data;
    expect(data.ytData).toEqual({
      snippet: expect.objectContaining({ title: "Test Channel" }),
      statistics: expect.objectContaining({ subscriberCount: "150000" }),
      brandingSettings: expect.objectContaining({
        channel: { keywords: "tech reviews tutorials" },
        image: { bannerExternalUrl: "https://yt.com/banner.jpg" },
      }),
    });
    expect(data.lastDataRefresh).toBeInstanceOf(Date);
    expect(data.updatedAt).toBeInstanceOf(Date);
    expect(data.followerCount).toBe(150000);
    expect(data.name).toBe("Test Channel");
    expect(data.description).toBe("A test channel description");
    expect(data.imageUrl).toBe("https://yt.com/thumb_high.jpg");
    expect(data.bannerUrl).toBe("https://yt.com/banner.jpg");
    expect(data.country).toBe("US");
    expect(data.keywords).toBe("tech reviews tutorials");
  });

  // ---------------------------------------------------------------
  // Cache invalidation
  // ---------------------------------------------------------------

  it("should invalidate Redis cache after update", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => makeYouTubeResponse(),
    });

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockRedisClient.del).toHaveBeenCalledWith(
      `accounts-youtube-${ACCOUNT_ID}`,
    );
  });

  // ---------------------------------------------------------------
  // YouTube API error handling
  // ---------------------------------------------------------------

  it("should handle YouTube API 429 (decrement rate limit)", async () => {
    mockRedisClient.decr.mockResolvedValue(0);
    mockFetch.mockResolvedValue({
      ok: false,
      status: 429,
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockRedisClient.decr).toHaveBeenCalledWith("youtube_api_rate_limit");
    expect(mockPrismaInstance.account.updateMany).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[youtube-refresh] YouTube API error: 429 for ${ACCOUNT_ID}`,
    );
  });

  it("should handle YouTube API error (non-429)", async () => {
    mockFetch.mockResolvedValue({
      ok: false,
      status: 500,
    });
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockRedisClient.decr).not.toHaveBeenCalled();
    expect(mockPrismaInstance.account.updateMany).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[youtube-refresh] YouTube API error: 500 for ${ACCOUNT_ID}`,
    );
  });

  // ---------------------------------------------------------------
  // Empty / partial responses
  // ---------------------------------------------------------------

  it("should handle empty API response (no items)", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ items: [] }),
    });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockPrismaInstance.account.updateMany).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[youtube-refresh] No data returned for channel ${ACCOUNT_ID}`,
    );
  });

  it("should handle missing items key in response", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({}),
    });
    const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockPrismaInstance.account.updateMany).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith(
      `[youtube-refresh] No data returned for channel ${ACCOUNT_ID}`,
    );
  });

  it("should handle partial channel data (missing optional fields)", async () => {
    const partialResponse = {
      items: [
        {
          snippet: {
            // no title, description, country, or thumbnails
          },
          statistics: {
            // subscriberCount missing — parseInt(undefined) => NaN => || undefined
            viewCount: "100",
          },
          brandingSettings: {
            // no channel or image keys
          },
        },
      ],
    };

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => partialResponse,
    });

    await refreshYoutubeData(ACCOUNT_ID);

    expect(mockPrismaInstance.account.updateMany).toHaveBeenCalledTimes(1);

    const data = mockPrismaInstance.account.updateMany.mock.calls[0][0].data;

    // Core fields that are always set
    expect(data.ytData).toBeDefined();
    expect(data.lastDataRefresh).toBeInstanceOf(Date);
    expect(data.updatedAt).toBeInstanceOf(Date);

    // Optional fields should NOT be set when data is missing
    expect(data.followerCount).toBeUndefined();
    expect(data.name).toBeUndefined();
    expect(data.description).toBeUndefined();
    expect(data.imageUrl).toBeUndefined();
    expect(data.bannerUrl).toBeUndefined();
    expect(data.country).toBeUndefined();
    expect(data.keywords).toBeUndefined();
  });

  // ---------------------------------------------------------------
  // Generic error handling (catch block)
  // ---------------------------------------------------------------

  it("should catch and log errors without throwing", async () => {
    mockFetch.mockRejectedValue(new Error("Network failure"));
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Should not throw
    await expect(refreshYoutubeData(ACCOUNT_ID)).resolves.toBeUndefined();

    expect(consoleSpy).toHaveBeenCalledWith(
      `[youtube-refresh] Error refreshing data for ${ACCOUNT_ID}:`,
      expect.any(Error),
    );
  });
});
