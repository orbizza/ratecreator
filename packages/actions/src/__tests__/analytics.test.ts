/**
 * Tests for Analytics Actions
 * Tests fetchAnalyticsData, fetchContentStats, fetchIdeasStats, invalidateAnalyticsCache
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockInvalidateCache } = vi.hoisted(() => {
  const mockPrisma = {
    post: {
      groupBy: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    newsletterAudience: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    idea: {
      count: vi.fn(),
    },
    tag: {
      count: vi.fn(),
    },
  };

  const mockInvalidateCache = vi.fn().mockResolvedValue(undefined);

  return { mockPrisma, mockInvalidateCache };
});

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

// Mock cache module: withCache passes through to fetcher
vi.mock("../content/cache", () => ({
  withCache: vi.fn(
    async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) =>
      fetcher(),
  ),
  invalidateCache: mockInvalidateCache,
  CACHE_TTL: {
    ANALYTICS: 300,
    CONTENT_STATS: 120,
    IDEAS_STATS: 120,
  },
  CacheKeys: {
    analytics: (platform?: string) => `analytics:${platform || "all"}`,
    contentStats: (platform?: string) => `content:stats:${platform || "all"}`,
    ideasStats: (platform?: string) => `ideas:stats:${platform || "all"}`,
  },
}));

import {
  fetchAnalyticsData,
  fetchContentStats,
  fetchIdeasStats,
  invalidateAnalyticsCache,
} from "../content/analytics";

describe("Analytics Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchAnalyticsData", () => {
    function setupAnalyticsMocks() {
      // postsByStatus
      mockPrisma.post.groupBy
        .mockResolvedValueOnce([
          { status: "PUBLISHED", _count: { status: 50 } },
          { status: "DRAFT", _count: { status: 30 } },
          { status: "SCHEDULED", _count: { status: 10 } },
        ])
        // postsByPlatform
        .mockResolvedValueOnce([
          {
            contentPlatform: "RATECREATOR",
            _count: { contentPlatform: 60 },
          },
          {
            contentPlatform: "CREATOROPS",
            _count: { contentPlatform: 30 },
          },
        ]);

      // subscriberGrowth (newsletterAudience.findMany)
      mockPrisma.newsletterAudience.findMany.mockResolvedValueOnce([
        { createdAt: new Date("2024-01-15") },
        { createdAt: new Date("2024-01-20") },
        { createdAt: new Date("2024-02-10") },
      ]);

      // topPosts
      mockPrisma.post.findMany.mockResolvedValueOnce([
        {
          id: "post-1",
          title: "Top Post",
          postUrl: "/blog/top-post",
          publishDate: new Date("2024-06-01"),
          contentPlatform: "RATECREATOR",
          contentType: "BLOG",
          author: {
            id: "author-1",
            name: "Author One",
            imageUrl: "https://example.com/author.jpg",
          },
        },
      ]);

      // totalSubscribers
      mockPrisma.newsletterAudience.count
        .mockResolvedValueOnce(1000)
        // activeSubscribers
        .mockResolvedValueOnce(800);

      // totalIdeas
      mockPrisma.idea.count
        .mockResolvedValueOnce(50)
        // ideasInProgress
        .mockResolvedValueOnce(15);
    }

    it("should fetch comprehensive analytics data", async () => {
      setupAnalyticsMocks();

      const result = await fetchAnalyticsData();

      expect(result.postsByStatus).toEqual([
        { status: "PUBLISHED", count: 50 },
        { status: "DRAFT", count: 30 },
        { status: "SCHEDULED", count: 10 },
      ]);
      expect(result.postsByPlatform).toEqual([
        { platform: "RATECREATOR", count: 60 },
        { platform: "CREATOROPS", count: 30 },
      ]);
      expect(result.topPosts).toHaveLength(1);
      expect(result.topPosts[0].title).toBe("Top Post");
      expect(result.totalSubscribers).toBe(1000);
      expect(result.activeSubscribers).toBe(800);
      expect(result.totalIdeas).toBe(50);
      expect(result.ideasInProgress).toBe(15);
    });

    it("should apply platform filter when provided", async () => {
      setupAnalyticsMocks();

      await fetchAnalyticsData("RATECREATOR");

      expect(mockPrisma.post.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contentPlatform: "RATECREATOR" },
        }),
      );
    });

    it("should map top posts correctly", async () => {
      setupAnalyticsMocks();

      const result = await fetchAnalyticsData();

      const topPost = result.topPosts[0];
      expect(topPost).toEqual({
        id: "post-1",
        title: "Top Post",
        postUrl: "/blog/top-post",
        publishDate: new Date("2024-06-01"),
        contentPlatform: "RATECREATOR",
        contentType: "BLOG",
        author: {
          id: "author-1",
          name: "Author One",
          imageUrl: "https://example.com/author.jpg",
        },
      });
    });

    it("should handle empty analytics data", async () => {
      mockPrisma.post.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.newsletterAudience.findMany.mockResolvedValueOnce([]);
      mockPrisma.post.findMany.mockResolvedValueOnce([]);
      mockPrisma.newsletterAudience.count
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(0);
      mockPrisma.idea.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      const result = await fetchAnalyticsData();

      expect(result.postsByStatus).toEqual([]);
      expect(result.postsByPlatform).toEqual([]);
      expect(result.subscribersByMonth).toEqual([]);
      expect(result.topPosts).toEqual([]);
      expect(result.totalSubscribers).toBe(0);
      expect(result.activeSubscribers).toBe(0);
      expect(result.totalIdeas).toBe(0);
      expect(result.ideasInProgress).toBe(0);
    });

    it("should group subscriber growth by month", async () => {
      mockPrisma.post.groupBy
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      // Two subscribers in Jan, one in Feb
      mockPrisma.newsletterAudience.findMany.mockResolvedValueOnce([
        { createdAt: new Date("2024-01-10") },
        { createdAt: new Date("2024-01-25") },
        { createdAt: new Date("2024-02-15") },
      ]);

      mockPrisma.post.findMany.mockResolvedValueOnce([]);
      mockPrisma.newsletterAudience.count
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(3);
      mockPrisma.idea.count.mockResolvedValueOnce(0).mockResolvedValueOnce(0);

      const result = await fetchAnalyticsData();

      expect(result.subscribersByMonth).toHaveLength(2);
      const janEntry = result.subscribersByMonth.find((s) =>
        s.month.includes("Jan"),
      );
      expect(janEntry?.count).toBe(2);
    });

    it("should query only published posts for top posts", async () => {
      setupAnalyticsMocks();

      await fetchAnalyticsData();

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: "PUBLISHED" }),
          take: 10,
          orderBy: { publishDate: "desc" },
        }),
      );
    });

    it("should fetch active subscribers (subscribed: true)", async () => {
      setupAnalyticsMocks();

      await fetchAnalyticsData();

      expect(mockPrisma.newsletterAudience.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { subscribed: true },
        }),
      );
    });
  });

  describe("fetchContentStats", () => {
    it("should fetch content statistics", async () => {
      mockPrisma.post.count
        .mockResolvedValueOnce(100) // totalPosts
        .mockResolvedValueOnce(40) // newsletters
        .mockResolvedValueOnce(50) // blogs
        .mockResolvedValueOnce(10); // glossary
      mockPrisma.tag.count.mockResolvedValueOnce(25); // totalTags

      const result = await fetchContentStats();

      expect(result).toEqual({
        totalPosts: 100,
        totalTags: 25,
        totalNewsletters: 40,
        totalBlogs: 50,
        totalGlossary: 10,
      });
    });

    it("should apply platform filter", async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.tag.count.mockResolvedValue(0);

      await fetchContentStats("CREATOROPS");

      expect(mockPrisma.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contentPlatform: "CREATOROPS" },
        }),
      );
    });

    it("should filter newsletters by content type", async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.tag.count.mockResolvedValue(0);

      await fetchContentStats();

      expect(mockPrisma.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contentType: "NEWSLETTER" },
        }),
      );
    });

    it("should filter blogs by content type", async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.tag.count.mockResolvedValue(0);

      await fetchContentStats();

      expect(mockPrisma.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contentType: "BLOG" },
        }),
      );
    });

    it("should filter glossary by content type", async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.tag.count.mockResolvedValue(0);

      await fetchContentStats();

      expect(mockPrisma.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contentType: "GLOSSARY" },
        }),
      );
    });

    it("should handle empty database", async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.tag.count.mockResolvedValue(0);

      const result = await fetchContentStats();

      expect(result).toEqual({
        totalPosts: 0,
        totalTags: 0,
        totalNewsletters: 0,
        totalBlogs: 0,
        totalGlossary: 0,
      });
    });
  });

  describe("fetchIdeasStats", () => {
    it("should fetch idea statistics", async () => {
      mockPrisma.idea.count
        .mockResolvedValueOnce(50) // totalIdeas
        .mockResolvedValueOnce(20) // newIdeas
        .mockResolvedValueOnce(15) // inProgressIdeas
        .mockResolvedValueOnce(10) // draftCreatedIdeas
        .mockResolvedValueOnce(5); // archivedIdeas

      const result = await fetchIdeasStats();

      expect(result).toEqual({
        totalIdeas: 50,
        newIdeas: 20,
        inProgressIdeas: 15,
        draftCreatedIdeas: 10,
        archivedIdeas: 5,
      });
    });

    it("should apply platform filter", async () => {
      mockPrisma.idea.count.mockResolvedValue(0);

      await fetchIdeasStats("DOCUMENTATION");

      expect(mockPrisma.idea.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contentPlatform: "DOCUMENTATION" },
        }),
      );
    });

    it("should query each idea status", async () => {
      mockPrisma.idea.count.mockResolvedValue(0);

      await fetchIdeasStats();

      expect(mockPrisma.idea.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: {} }),
      );
      expect(mockPrisma.idea.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "NEW" } }),
      );
      expect(mockPrisma.idea.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "IN_PROGRESS" } }),
      );
      expect(mockPrisma.idea.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "DRAFT_CREATED" } }),
      );
      expect(mockPrisma.idea.count).toHaveBeenCalledWith(
        expect.objectContaining({ where: { status: "ARCHIVED" } }),
      );
    });

    it("should handle empty database", async () => {
      mockPrisma.idea.count.mockResolvedValue(0);

      const result = await fetchIdeasStats();

      expect(result).toEqual({
        totalIdeas: 0,
        newIdeas: 0,
        inProgressIdeas: 0,
        draftCreatedIdeas: 0,
        archivedIdeas: 0,
      });
    });
  });

  describe("invalidateAnalyticsCache", () => {
    it("should invalidate analytics, content, and ideas caches", async () => {
      await invalidateAnalyticsCache();

      expect(mockInvalidateCache).toHaveBeenCalledWith("analytics:*");
      expect(mockInvalidateCache).toHaveBeenCalledWith("content:stats:*");
      expect(mockInvalidateCache).toHaveBeenCalledWith("ideas:stats:*");
      expect(mockInvalidateCache).toHaveBeenCalledTimes(3);
    });
  });
});
