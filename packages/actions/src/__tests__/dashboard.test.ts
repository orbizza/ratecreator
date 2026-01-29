/**
 * Tests for Dashboard Actions
 * Tests fetchDashboardStats, fetchRecentPosts, invalidateDashboardCache
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockInvalidateCache } = vi.hoisted(() => {
  const mockPrisma = {
    post: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    newsletterAudience: {
      count: vi.fn(),
    },
    idea: {
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

// Mock cache module: withCache passes through to fetcher, invalidateCache is tracked
vi.mock("../content/cache", () => ({
  withCache: vi.fn(
    async (_key: string, _ttl: number, fetcher: () => Promise<unknown>) =>
      fetcher(),
  ),
  invalidateCache: mockInvalidateCache,
  CACHE_TTL: {
    DASHBOARD_STATS: 60,
    ANALYTICS: 300,
    MEMBER_STATS: 120,
    MEMBERS_LIST: 60,
    IDEAS_STATS: 120,
    CONTENT_STATS: 120,
    RECENT_POSTS: 60,
    CALENDAR: 300,
  },
  CacheKeys: {
    dashboardStats: (platform?: string) =>
      `dashboard:stats:${platform || "all"}`,
    recentPosts: (limit: number, platform?: string) =>
      `posts:recent:${limit}:${platform || "all"}`,
  },
}));

import {
  fetchDashboardStats,
  fetchRecentPosts,
  invalidateDashboardCache,
} from "../content/dashboard";

describe("Dashboard Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchDashboardStats", () => {
    it("should fetch stats without platform filter", async () => {
      mockPrisma.post.count
        .mockResolvedValueOnce(100) // totalPosts
        .mockResolvedValueOnce(30) // drafts
        .mockResolvedValueOnce(50) // published
        .mockResolvedValueOnce(10) // scheduled
        .mockResolvedValueOnce(20); // newsletters
      mockPrisma.newsletterAudience.count.mockResolvedValueOnce(500); // members
      mockPrisma.idea.count
        .mockResolvedValueOnce(25) // totalIdeas
        .mockResolvedValueOnce(5) // newIdeas
        .mockResolvedValueOnce(8); // ideasInProgress

      const result = await fetchDashboardStats();

      expect(result).toEqual({
        totalPosts: 100,
        drafts: 30,
        published: 50,
        scheduled: 10,
        newsletters: 20,
        members: 500,
        totalIdeas: 25,
        newIdeas: 5,
        ideasInProgress: 8,
      });
    });

    it("should apply platform filter when provided", async () => {
      mockPrisma.post.count
        .mockResolvedValueOnce(40)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(20)
        .mockResolvedValueOnce(5)
        .mockResolvedValueOnce(8);
      mockPrisma.newsletterAudience.count.mockResolvedValueOnce(500);
      mockPrisma.idea.count
        .mockResolvedValueOnce(15)
        .mockResolvedValueOnce(3)
        .mockResolvedValueOnce(4);

      const result = await fetchDashboardStats("RATECREATOR");

      expect(result.totalPosts).toBe(40);
      expect(mockPrisma.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contentPlatform: "RATECREATOR" },
        }),
      );
    });

    it("should handle empty database", async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.newsletterAudience.count.mockResolvedValue(0);
      mockPrisma.idea.count.mockResolvedValue(0);

      const result = await fetchDashboardStats();

      expect(result).toEqual({
        totalPosts: 0,
        drafts: 0,
        published: 0,
        scheduled: 0,
        newsletters: 0,
        members: 0,
        totalIdeas: 0,
        newIdeas: 0,
        ideasInProgress: 0,
      });
    });

    it("should count drafts with DRAFT status filter", async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.newsletterAudience.count.mockResolvedValue(0);
      mockPrisma.idea.count.mockResolvedValue(0);

      await fetchDashboardStats();

      expect(mockPrisma.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "DRAFT" },
        }),
      );
    });

    it("should count published with PUBLISHED status filter", async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.newsletterAudience.count.mockResolvedValue(0);
      mockPrisma.idea.count.mockResolvedValue(0);

      await fetchDashboardStats();

      expect(mockPrisma.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: "PUBLISHED" },
        }),
      );
    });

    it("should count newsletters by content type", async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.newsletterAudience.count.mockResolvedValue(0);
      mockPrisma.idea.count.mockResolvedValue(0);

      await fetchDashboardStats();

      expect(mockPrisma.post.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contentType: "NEWSLETTER" },
        }),
      );
    });

    it("should count subscribed members", async () => {
      mockPrisma.post.count.mockResolvedValue(0);
      mockPrisma.newsletterAudience.count.mockResolvedValueOnce(200);
      mockPrisma.idea.count.mockResolvedValue(0);

      const result = await fetchDashboardStats();

      expect(result.members).toBe(200);
      expect(mockPrisma.newsletterAudience.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { subscribed: true },
        }),
      );
    });
  });

  describe("fetchRecentPosts", () => {
    it("should fetch recent posts with default limit", async () => {
      const mockPosts = [
        {
          id: "post-1",
          title: "Test Post",
          status: "PUBLISHED",
          contentType: "BLOG",
          contentPlatform: "RATECREATOR",
          publishDate: new Date("2024-06-01"),
          updatedAt: new Date("2024-06-01"),
          author: {
            id: "author-1",
            name: "Author One",
            imageUrl: "https://example.com/author.jpg",
          },
        },
      ];
      mockPrisma.post.findMany.mockResolvedValueOnce(mockPosts);

      const result = await fetchRecentPosts();

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("Test Post");
      expect(result[0].author.name).toBe("Author One");
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 5,
          orderBy: { updatedAt: "desc" },
          include: { author: true },
        }),
      );
    });

    it("should apply custom limit", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce([]);

      await fetchRecentPosts(10);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          take: 10,
        }),
      );
    });

    it("should apply platform filter", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce([]);

      await fetchRecentPosts(5, "CREATOROPS");

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { contentPlatform: "CREATOROPS" },
        }),
      );
    });

    it("should return empty array when no posts exist", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce([]);

      const result = await fetchRecentPosts();

      expect(result).toEqual([]);
    });

    it("should map post data correctly with null fields", async () => {
      const mockPost = {
        id: "post-1",
        title: "Mapped Post",
        status: "DRAFT",
        contentType: "NEWSLETTER",
        contentPlatform: "RATECREATOR",
        publishDate: null,
        updatedAt: new Date("2024-06-15"),
        author: {
          id: "author-2",
          name: null,
          imageUrl: null,
        },
        content: "This should not appear",
        slug: "mapped-post",
      };
      mockPrisma.post.findMany.mockResolvedValueOnce([mockPost]);

      const result = await fetchRecentPosts();

      expect(result[0]).toEqual({
        id: "post-1",
        title: "Mapped Post",
        status: "DRAFT",
        contentType: "NEWSLETTER",
        contentPlatform: "RATECREATOR",
        publishDate: null,
        updatedAt: new Date("2024-06-15"),
        author: {
          id: "author-2",
          name: null,
          imageUrl: null,
        },
      });
    });

    it("should not include no-filter when platform is omitted", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce([]);

      await fetchRecentPosts(5);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
        }),
      );
    });
  });

  describe("invalidateDashboardCache", () => {
    it("should invalidate dashboard and recent posts caches", async () => {
      await invalidateDashboardCache();

      expect(mockInvalidateCache).toHaveBeenCalledWith("dashboard:*");
      expect(mockInvalidateCache).toHaveBeenCalledWith("posts:recent:*");
      expect(mockInvalidateCache).toHaveBeenCalledTimes(2);
    });
  });
});
