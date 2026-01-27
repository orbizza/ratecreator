/**
 * Tests for Post Fetch Actions
 * Tests various post fetching operations
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma } = vi.hoisted(() => {
  const mockPrisma = {
    post: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
  };

  return { mockPrisma };
});

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@ratecreator/types/content", () => ({
  ContentType: { BLOG: "BLOG", NEWSLETTER: "NEWSLETTER", GLOSSARY: "GLOSSARY" },
  PostStatus: {
    DRAFT: "DRAFT",
    PUBLISHED: "PUBLISHED",
    SCHEDULED: "SCHEDULED",
    DELETED: "DELETED",
  },
  ContentPlatform: { RATECREATOR: "RATECREATOR" },
  FetchedPostType: {},
}));

import {
  fetchAllPosts,
  fetchAllPostsCount,
  fetchPublishedPosts,
  fetchPublishedPostsCount,
  fetchPublishedPostsPaginated,
  fetchAllGlossaryPosts,
  fetchPostById,
  fetchPostTitleById,
  fetchPostByPostUrl,
} from "../content/fetch-posts";

describe("Post Fetch Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchAllPostsCount", () => {
    it("should count all posts with default parameters", async () => {
      mockPrisma.post.count.mockResolvedValueOnce(100);

      const result = await fetchAllPostsCount();

      expect(result).toBe(100);
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: {
          contentPlatform: "RATECREATOR",
        },
      });
    });

    it("should count posts filtered by content type", async () => {
      mockPrisma.post.count.mockResolvedValueOnce(50);

      const result = await fetchAllPostsCount(undefined, "blog");

      expect(result).toBe(50);
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          contentType: "BLOG",
        }),
      });
    });

    it("should count posts filtered by tag", async () => {
      mockPrisma.post.count.mockResolvedValueOnce(25);

      const result = await fetchAllPostsCount("tech");

      expect(result).toBe(25);
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          tags: {
            some: {
              tag: { slug: "tech" },
            },
          },
        }),
      });
    });

    it("should count posts filtered by status", async () => {
      mockPrisma.post.count.mockResolvedValueOnce(75);

      const result = await fetchAllPostsCount(
        undefined,
        undefined,
        "ratecreator",
        "published",
      );

      expect(result).toBe(75);
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: expect.objectContaining({
          status: "PUBLISHED",
        }),
      });
    });

    it("should ignore 'all' filters", async () => {
      mockPrisma.post.count.mockResolvedValueOnce(100);

      const result = await fetchAllPostsCount(
        "all",
        "all",
        "ratecreator",
        "all",
      );

      expect(result).toBe(100);
    });
  });

  describe("fetchAllPosts", () => {
    const mockPosts = [
      { id: "post-1", title: "Post 1", tags: [], author: {} },
      { id: "post-2", title: "Post 2", tags: [], author: {} },
    ];

    it("should fetch posts with pagination", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce(mockPosts);

      const result = await fetchAllPosts("all", 0);

      expect(result).toEqual(mockPosts);
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: { contentPlatform: "RATECREATOR" },
        skip: 0,
        take: 10,
        include: { tags: true, author: true },
        orderBy: { publishDate: "desc" },
      });
    });

    it("should calculate offset correctly for page 2", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce(mockPosts);

      await fetchAllPosts("all", 2);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 10,
        }),
      );
    });

    it("should filter by tag option", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce(mockPosts);

      await fetchAllPosts("tech", 0);

      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            tags: { some: { tag: { slug: "tech" } } },
          }),
        }),
      );
    });
  });

  describe("fetchPublishedPostsCount", () => {
    it("should count all posts for 'all-posts'", async () => {
      mockPrisma.post.count.mockResolvedValueOnce(100);

      const result = await fetchPublishedPostsCount("all-posts");

      expect(result).toBe(100);
      expect(mockPrisma.post.count).toHaveBeenCalledWith();
    });

    it("should count featured posts", async () => {
      mockPrisma.post.count.mockResolvedValueOnce(10);

      const result = await fetchPublishedPostsCount("featured-posts");

      expect(result).toBe(10);
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: {
          isFeatured: true,
          status: "PUBLISHED",
        },
      });
    });

    it("should count newsletters", async () => {
      mockPrisma.post.count.mockResolvedValueOnce(25);

      const result = await fetchPublishedPostsCount("newsletters");

      expect(result).toBe(25);
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: {
          contentType: "NEWSLETTER",
          status: "PUBLISHED",
        },
      });
    });

    it("should count blogs", async () => {
      mockPrisma.post.count.mockResolvedValueOnce(50);

      const result = await fetchPublishedPostsCount("blogs");

      expect(result).toBe(50);
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: {
          status: "PUBLISHED",
          contentType: "BLOG",
        },
      });
    });

    it("should count glossary posts", async () => {
      mockPrisma.post.count.mockResolvedValueOnce(30);

      const result = await fetchPublishedPostsCount("glossary");

      expect(result).toBe(30);
      expect(mockPrisma.post.count).toHaveBeenCalledWith({
        where: {
          status: "PUBLISHED",
          contentType: "GLOSSARY",
        },
      });
    });

    it("should return 0 for unknown option", async () => {
      const result = await fetchPublishedPostsCount("unknown");

      expect(result).toBe(0);
    });
  });

  describe("fetchPublishedPosts", () => {
    const mockPosts = [{ id: "post-1", tags: [], author: {} }];

    it("should fetch featured posts", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce(mockPosts);

      const result = await fetchPublishedPosts("featured-posts");

      expect(result).toEqual(mockPosts);
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: {
          isFeatured: true,
          status: "PUBLISHED",
          contentType: "BLOG",
        },
        include: { tags: true, author: true },
        orderBy: { publishDate: "desc" },
      });
    });

    it("should fetch newsletters", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce(mockPosts);

      const result = await fetchPublishedPosts("newsletters");

      expect(result).toEqual(mockPosts);
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: {
          contentType: "NEWSLETTER",
          status: "PUBLISHED",
        },
        include: { tags: true, author: true },
        orderBy: { publishDate: "desc" },
      });
    });

    it("should fetch blogs", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce(mockPosts);

      const result = await fetchPublishedPosts("blogs");

      expect(result).toEqual(mockPosts);
    });

    it("should fetch glossary posts", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce(mockPosts);

      const result = await fetchPublishedPosts("glossary");

      expect(result).toEqual(mockPosts);
    });

    it("should return empty array for unknown option", async () => {
      const result = await fetchPublishedPosts("unknown");

      expect(result).toEqual([]);
    });
  });

  describe("fetchPublishedPostsPaginated", () => {
    const mockPosts = [{ id: "post-1", tags: [], author: {} }];

    it("should fetch paginated featured posts", async () => {
      mockPrisma.post.findMany.mockResolvedValueOnce(mockPosts);

      const result = await fetchPublishedPostsPaginated("featured-posts", 1);

      expect(result).toEqual(mockPosts);
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10,
          take: 10,
        }),
      );
    });

    it("should return empty array for unknown option", async () => {
      const result = await fetchPublishedPostsPaginated("unknown", 0);

      expect(result).toEqual([]);
    });
  });

  describe("fetchAllGlossaryPosts", () => {
    it("should fetch all glossary posts with title and URL", async () => {
      const mockPosts = [
        { title: "Term 1", postUrl: "term-1" },
        { title: "Term 2", postUrl: "term-2" },
      ];
      mockPrisma.post.findMany.mockResolvedValueOnce(mockPosts);

      const result = await fetchAllGlossaryPosts();

      expect(result).toEqual(mockPosts);
      expect(mockPrisma.post.findMany).toHaveBeenCalledWith({
        where: {
          contentType: "GLOSSARY",
          status: "PUBLISHED",
        },
        select: {
          title: true,
          postUrl: true,
        },
      });
    });
  });

  describe("fetchPostById", () => {
    it("should fetch post by ID with tags and author", async () => {
      const mockPost = {
        id: "post-1",
        title: "Test Post",
        tags: [{ id: "tag-1" }],
        author: { id: "author-1" },
      };
      mockPrisma.post.findUnique.mockResolvedValueOnce(mockPost);

      const result = await fetchPostById("post-1");

      expect(result).toEqual(mockPost);
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: "post-1" },
        include: { tags: true, author: true },
      });
    });

    it("should return null for non-existent post", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);

      const result = await fetchPostById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("fetchPostTitleById", () => {
    it("should fetch only post title by ID", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce({ title: "Test Title" });

      const result = await fetchPostTitleById("post-1");

      expect(result).toBe("Test Title");
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { id: "post-1" },
        select: { title: true },
      });
    });

    it("should return null for non-existent post", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);

      const result = await fetchPostTitleById("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("fetchPostByPostUrl", () => {
    it("should fetch post by URL with tags and author", async () => {
      const mockPost = {
        id: "post-1",
        postUrl: "test-post",
        title: "Test Post",
        tags: [],
        author: {},
      };
      mockPrisma.post.findUnique.mockResolvedValueOnce(mockPost);

      const result = await fetchPostByPostUrl("test-post");

      expect(result).toEqual(mockPost);
      expect(mockPrisma.post.findUnique).toHaveBeenCalledWith({
        where: { postUrl: "test-post" },
        include: { tags: true, author: true },
      });
    });
  });
});
