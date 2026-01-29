/**
 * Tests for Calendar Actions
 * Tests fetchCalendarEvents, updateIdeaTargetDate, fetchIdeasWithTargetDates,
 * updatePostSchedule, invalidateCalendarCache
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockInvalidateCache } = vi.hoisted(() => {
  const mockPrisma = {
    post: {
      findMany: vi.fn(),
      update: vi.fn(),
    },
    idea: {
      findMany: vi.fn(),
      update: vi.fn(),
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
    CALENDAR: 300,
  },
  CacheKeys: {
    calendar: (platform?: string, month?: string) =>
      `calendar:${platform || "all"}:${month || "current"}`,
  },
}));

import {
  fetchCalendarEvents,
  updateIdeaTargetDate,
  fetchIdeasWithTargetDates,
  updatePostSchedule,
  invalidateCalendarCache,
} from "../content/calendar";

describe("Calendar Actions", () => {
  const startDate = new Date("2024-06-01");
  const endDate = new Date("2024-06-30");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchCalendarEvents", () => {
    it("should fetch and combine scheduled, published, and idea events", async () => {
      const scheduledPosts = [
        {
          id: "post-1",
          title: "Scheduled Blog",
          publishDate: new Date("2024-06-10"),
          status: "SCHEDULED",
          postUrl: "/blog/scheduled",
          contentType: "BLOG",
          contentPlatform: "RATECREATOR",
        },
      ];
      const publishedPosts = [
        {
          id: "post-2",
          title: "Published Newsletter",
          publishDate: new Date("2024-06-05"),
          status: "PUBLISHED",
          postUrl: "/newsletter/published",
          contentType: "NEWSLETTER",
          contentPlatform: "RATECREATOR",
        },
      ];
      const ideas = [
        {
          id: "idea-1",
          title: "New Idea",
          targetDate: new Date("2024-06-20"),
          status: "IN_PROGRESS",
          contentPlatform: "RATECREATOR",
        },
      ];

      mockPrisma.post.findMany
        .mockResolvedValueOnce(scheduledPosts)
        .mockResolvedValueOnce(publishedPosts);
      mockPrisma.idea.findMany.mockResolvedValueOnce(ideas);

      const result = await fetchCalendarEvents(startDate, endDate);

      expect(result).toHaveLength(3);
      // Should be sorted by date ascending
      expect(result[0].title).toBe("Published Newsletter");
      expect(result[1].title).toBe("Scheduled Blog");
      expect(result[2].title).toBe("New Idea");
    });

    it("should set type to 'newsletter' for NEWSLETTER content type (scheduled)", async () => {
      const scheduledNewsletter = [
        {
          id: "post-3",
          title: "Scheduled Newsletter",
          publishDate: new Date("2024-06-15"),
          status: "SCHEDULED",
          postUrl: "/newsletter/scheduled",
          contentType: "NEWSLETTER",
          contentPlatform: "RATECREATOR",
        },
      ];
      mockPrisma.post.findMany
        .mockResolvedValueOnce(scheduledNewsletter)
        .mockResolvedValueOnce([]);
      mockPrisma.idea.findMany.mockResolvedValueOnce([]);

      const result = await fetchCalendarEvents(startDate, endDate);

      expect(result[0].type).toBe("newsletter");
    });

    it("should set type to 'scheduled' for non-NEWSLETTER scheduled posts", async () => {
      const scheduledBlog = [
        {
          id: "post-4",
          title: "Scheduled Blog",
          publishDate: new Date("2024-06-15"),
          status: "SCHEDULED",
          postUrl: "/blog/scheduled",
          contentType: "BLOG",
          contentPlatform: "RATECREATOR",
        },
      ];
      mockPrisma.post.findMany
        .mockResolvedValueOnce(scheduledBlog)
        .mockResolvedValueOnce([]);
      mockPrisma.idea.findMany.mockResolvedValueOnce([]);

      const result = await fetchCalendarEvents(startDate, endDate);

      expect(result[0].type).toBe("scheduled");
    });

    it("should set type to 'published' for non-NEWSLETTER published posts", async () => {
      const publishedBlog = [
        {
          id: "post-5",
          title: "Published Blog",
          publishDate: new Date("2024-06-15"),
          status: "PUBLISHED",
          postUrl: "/blog/published",
          contentType: "BLOG",
          contentPlatform: "RATECREATOR",
        },
      ];
      mockPrisma.post.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(publishedBlog);
      mockPrisma.idea.findMany.mockResolvedValueOnce([]);

      const result = await fetchCalendarEvents(startDate, endDate);

      expect(result[0].type).toBe("published");
    });

    it("should set type to 'newsletter' for published NEWSLETTER posts", async () => {
      const publishedNewsletter = [
        {
          id: "post-6",
          title: "Published Newsletter",
          publishDate: new Date("2024-06-15"),
          status: "PUBLISHED",
          postUrl: "/newsletter/published",
          contentType: "NEWSLETTER",
          contentPlatform: "RATECREATOR",
        },
      ];
      mockPrisma.post.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(publishedNewsletter);
      mockPrisma.idea.findMany.mockResolvedValueOnce([]);

      const result = await fetchCalendarEvents(startDate, endDate);

      expect(result[0].type).toBe("newsletter");
    });

    it("should set type to 'idea' for ideas", async () => {
      mockPrisma.post.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.idea.findMany.mockResolvedValueOnce([
        {
          id: "idea-2",
          title: "Test Idea",
          targetDate: new Date("2024-06-15"),
          status: "NEW",
          contentPlatform: "RATECREATOR",
        },
      ]);

      const result = await fetchCalendarEvents(startDate, endDate);

      expect(result[0].type).toBe("idea");
    });

    it("should apply platform filter to queries", async () => {
      mockPrisma.post.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.idea.findMany.mockResolvedValueOnce([]);

      await fetchCalendarEvents(startDate, endDate, "CREATOROPS");

      // Scheduled posts query should include platform filter
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            contentPlatform: "CREATOROPS",
          }),
        }),
      );
    });

    it("should return empty array when no events exist", async () => {
      mockPrisma.post.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.idea.findMany.mockResolvedValueOnce([]);

      const result = await fetchCalendarEvents(startDate, endDate);

      expect(result).toEqual([]);
    });

    it("should sort events by date ascending", async () => {
      const scheduledPosts = [
        {
          id: "post-late",
          title: "Late Post",
          publishDate: new Date("2024-06-25"),
          status: "SCHEDULED",
          postUrl: "/blog/late",
          contentType: "BLOG",
          contentPlatform: "RATECREATOR",
        },
      ];
      const publishedPosts = [
        {
          id: "post-early",
          title: "Early Post",
          publishDate: new Date("2024-06-02"),
          status: "PUBLISHED",
          postUrl: "/blog/early",
          contentType: "BLOG",
          contentPlatform: "RATECREATOR",
        },
      ];
      mockPrisma.post.findMany
        .mockResolvedValueOnce(scheduledPosts)
        .mockResolvedValueOnce(publishedPosts);
      mockPrisma.idea.findMany.mockResolvedValueOnce([
        {
          id: "idea-mid",
          title: "Mid Idea",
          targetDate: new Date("2024-06-15"),
          status: "NEW",
          contentPlatform: "RATECREATOR",
        },
      ]);

      const result = await fetchCalendarEvents(startDate, endDate);

      expect(result[0].title).toBe("Early Post");
      expect(result[1].title).toBe("Mid Idea");
      expect(result[2].title).toBe("Late Post");
    });

    it("should query scheduled posts with correct date range", async () => {
      mockPrisma.post.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.idea.findMany.mockResolvedValueOnce([]);

      await fetchCalendarEvents(startDate, endDate);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: "SCHEDULED",
            publishDate: { gte: startDate, lte: endDate },
          }),
        }),
      );
    });

    it("should exclude archived ideas", async () => {
      mockPrisma.post.findMany
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);
      mockPrisma.idea.findMany.mockResolvedValueOnce([]);

      await fetchCalendarEvents(startDate, endDate);

      expect(mockPrisma.idea.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: { not: "ARCHIVED" },
          }),
        }),
      );
    });
  });

  describe("updateIdeaTargetDate", () => {
    it("should update idea target date", async () => {
      const targetDate = new Date("2024-07-15");
      mockPrisma.idea.update.mockResolvedValueOnce({});

      await updateIdeaTargetDate("idea-1", targetDate);

      expect(mockPrisma.idea.update).toHaveBeenCalledWith({
        where: { id: "idea-1" },
        data: { targetDate },
      });
    });

    it("should allow setting target date to null", async () => {
      mockPrisma.idea.update.mockResolvedValueOnce({});

      await updateIdeaTargetDate("idea-1", null);

      expect(mockPrisma.idea.update).toHaveBeenCalledWith({
        where: { id: "idea-1" },
        data: { targetDate: null },
      });
    });

    it("should invalidate calendar cache after update", async () => {
      mockPrisma.idea.update.mockResolvedValueOnce({});

      await updateIdeaTargetDate("idea-1", new Date());

      expect(mockInvalidateCache).toHaveBeenCalledWith("calendar:*");
    });
  });

  describe("fetchIdeasWithTargetDates", () => {
    it("should fetch non-archived ideas ordered by target date", async () => {
      const mockIdeas = [
        {
          id: "idea-1",
          title: "First Idea",
          targetDate: new Date("2024-06-10"),
          status: "NEW",
        },
        {
          id: "idea-2",
          title: "Second Idea",
          targetDate: new Date("2024-06-20"),
          status: "IN_PROGRESS",
        },
      ];
      mockPrisma.idea.findMany.mockResolvedValueOnce(mockIdeas);

      const result = await fetchIdeasWithTargetDates();

      expect(result).toHaveLength(2);
      expect(mockPrisma.idea.findMany).toHaveBeenCalledWith({
        where: {
          status: { not: "ARCHIVED" },
        },
        select: {
          id: true,
          title: true,
          targetDate: true,
          status: true,
        },
        orderBy: { targetDate: "asc" },
      });
    });

    it("should return empty array when no ideas exist", async () => {
      mockPrisma.idea.findMany.mockResolvedValueOnce([]);

      const result = await fetchIdeasWithTargetDates();

      expect(result).toEqual([]);
    });
  });

  describe("updatePostSchedule", () => {
    it("should set post to SCHEDULED when date is provided", async () => {
      const publishDate = new Date("2024-07-01");
      mockPrisma.post.update.mockResolvedValueOnce({});

      await updatePostSchedule("post-1", publishDate);

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: "post-1" },
        data: {
          publishDate,
          status: "SCHEDULED",
        },
      });
    });

    it("should set post to DRAFT when date is null", async () => {
      mockPrisma.post.update.mockResolvedValueOnce({});

      await updatePostSchedule("post-1", null);

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: "post-1" },
        data: {
          publishDate: null,
          status: "DRAFT",
        },
      });
    });

    it("should invalidate both calendar and dashboard caches", async () => {
      mockPrisma.post.update.mockResolvedValueOnce({});

      await updatePostSchedule("post-1", new Date());

      expect(mockInvalidateCache).toHaveBeenCalledWith("calendar:*");
      expect(mockInvalidateCache).toHaveBeenCalledWith("dashboard:*");
      expect(mockInvalidateCache).toHaveBeenCalledTimes(2);
    });
  });

  describe("invalidateCalendarCache", () => {
    it("should invalidate calendar cache pattern", async () => {
      await invalidateCalendarCache();

      expect(mockInvalidateCache).toHaveBeenCalledWith("calendar:*");
      expect(mockInvalidateCache).toHaveBeenCalledTimes(1);
    });
  });
});
