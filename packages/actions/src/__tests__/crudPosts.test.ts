/**
 * Tests for Post CRUD Actions
 * Tests blog post creation, updating, deletion, and publishing
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockSignedIn, mockRedirect } = vi.hoisted(() => {
  const mockPrisma = {
    post: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    tagOnPost: {
      createMany: vi.fn(),
      deleteMany: vi.fn(),
      findMany: vi.fn(),
    },
  };

  const mockSignedIn = vi.fn();
  const mockRedirect = vi.fn();

  return { mockPrisma, mockSignedIn, mockRedirect };
});

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@clerk/nextjs", () => ({
  SignedIn: mockSignedIn,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("../content/cache", () => ({
  invalidateCache: vi.fn(),
}));

vi.mock("@ratecreator/types/content", () => ({
  ContentPlatform: { RATECREATOR: "RATECREATOR" },
  ContentType: { BLOG: "BLOG", NEWSLETTER: "NEWSLETTER", GLOSSARY: "GLOSSARY" },
  PostStatus: {
    DRAFT: "DRAFT",
    PUBLISHED: "PUBLISHED",
    SCHEDULED: "SCHEDULED",
    DELETED: "DELETED",
  },
  FetchedPostType: {},
  PostType: {},
  UpdatePostType: {},
}));

import {
  createPost,
  updatePost,
  deletePost,
  restorePost,
  publishPost,
  unpublishPost,
  unschedulePost,
} from "../content/crud-posts";

describe("Post CRUD Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignedIn.mockResolvedValue(true);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const mockPostData = {
    title: "Test Post",
    content: "Post content",
    postUrl: "test-post",
    excerpt: "Post excerpt",
    isFeatured: false,
    featureImage: "https://example.com/image.jpg",
    author: { id: "author-1" },
    metadataTitle: "Meta Title",
    metadataDescription: "Meta Description",
    metadataImageUrl: "https://example.com/meta.jpg",
    metadataKeywords: "test,keywords",
    canonicalUrl: "https://example.com/test-post",
    contentType: "BLOG",
    contentPlatform: "RATECREATOR",
    status: "DRAFT",
    tags: [{ id: "tag-1" }, { id: "tag-2" }],
  };

  describe("createPost", () => {
    it("should create a new post successfully", async () => {
      const newPost = { id: "post-1", ...mockPostData };
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.post.create.mockResolvedValueOnce(newPost);
      mockPrisma.tagOnPost.createMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.tagOnPost.findMany.mockResolvedValueOnce([]);
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...newPost,
        tags: [],
      });

      const result = await createPost(mockPostData as any);

      expect(result.success).toBe(true);
      expect(result.post).toBeDefined();
      expect(mockPrisma.post.create).toHaveBeenCalled();
    });

    it("should return error if post URL already exists", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        id: "existing-post",
        postUrl: "test-post",
      });

      const result = await createPost(mockPostData as any);

      expect(result.error).toBe("Post URL already exists");
      expect(mockPrisma.post.create).not.toHaveBeenCalled();
    });

    it("should create tag associations for the post", async () => {
      const newPost = { id: "post-1", ...mockPostData };
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.post.create.mockResolvedValueOnce(newPost);
      mockPrisma.tagOnPost.createMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.tagOnPost.findMany.mockResolvedValueOnce([]);
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...newPost,
        tags: [],
      });

      await createPost(mockPostData as any);

      expect(mockPrisma.tagOnPost.createMany).toHaveBeenCalledWith({
        data: [
          { postId: "post-1", tagId: "tag-1" },
          { postId: "post-1", tagId: "tag-2" },
        ],
      });
    });

    it("should handle post without tags", async () => {
      const postDataNoTags = { ...mockPostData, tags: [] };
      const newPost = { id: "post-1", ...postDataNoTags };
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.post.create.mockResolvedValueOnce(newPost);
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...newPost,
        tags: [],
      });

      const result = await createPost(postDataNoTags as any);

      expect(result.success).toBe(true);
      expect(mockPrisma.tagOnPost.createMany).not.toHaveBeenCalled();
    });

    it("should return error on database failure", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.post.create.mockRejectedValueOnce(new Error("DB Error"));

      const result = await createPost(mockPostData as any);

      expect(result.error).toBe("Error creating post");
    });
  });

  describe("updatePost", () => {
    const postId = "post-123";

    it("should update a post successfully", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.tagOnPost.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        ...mockPostData,
      });
      mockPrisma.tagOnPost.createMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.tagOnPost.findMany.mockResolvedValueOnce([]);
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        id: postId,
        ...mockPostData,
        tags: [],
      });

      const result = await updatePost(mockPostData as any, postId);

      expect(result.success).toBe(true);
      expect(mockPrisma.post.update).toHaveBeenCalled();
    });

    it("should return error if URL exists for different post", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        id: "different-post",
        postUrl: "test-post",
      });

      const result = await updatePost(mockPostData as any, postId);

      expect(result.error).toBe("Post URL already exists");
    });

    it("should delete old tags before creating new ones", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.tagOnPost.deleteMany.mockResolvedValueOnce({ count: 3 });
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        ...mockPostData,
      });
      mockPrisma.tagOnPost.createMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.tagOnPost.findMany.mockResolvedValueOnce([]);
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        id: postId,
        ...mockPostData,
        tags: [],
      });

      await updatePost(mockPostData as any, postId);

      expect(mockPrisma.tagOnPost.deleteMany).toHaveBeenCalledWith({
        where: { postId },
      });
    });

    it("should handle date conversion for publishDate", async () => {
      const postDataWithDate = {
        ...mockPostData,
        publishDate: "2024-01-01T00:00:00.000Z",
      };

      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.tagOnPost.deleteMany.mockResolvedValueOnce({ count: 0 });
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        ...postDataWithDate,
      });
      mockPrisma.tagOnPost.createMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.tagOnPost.findMany.mockResolvedValueOnce([]);
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        id: postId,
        ...postDataWithDate,
        tags: [],
      });

      const result = await updatePost(postDataWithDate as any, postId);

      expect(result.success).toBe(true);
    });

    it("should return error on database failure", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.tagOnPost.deleteMany.mockRejectedValueOnce(
        new Error("DB Error"),
      );

      const result = await updatePost(mockPostData as any, postId);

      expect(result.error).toBe("Error updating post");
    });
  });

  describe("deletePost", () => {
    it("should soft delete a post by setting status to DELETED", async () => {
      const postId = "post-123";
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        status: "DELETED",
      });

      const result = await deletePost(postId);

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { status: "DELETED" },
      });
      expect(result).toBeUndefined();
    });

    it("should return error on database failure", async () => {
      mockPrisma.post.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await deletePost("post-123");

      expect(result?.error).toBe("Error deleting post");
    });
  });

  describe("restorePost", () => {
    it("should restore a deleted post to DRAFT status", async () => {
      const postId = "post-123";
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        status: "DRAFT",
      });

      const result = await restorePost(postId);

      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { status: "DRAFT" },
      });
      expect(result).toBeUndefined();
    });

    it("should return error on database failure", async () => {
      mockPrisma.post.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await restorePost("post-123");

      expect(result?.error).toBe("Error restoring post");
    });
  });

  describe("publishPost", () => {
    const postId = "post-123";
    const postData = { contentType: "BLOG" } as any;

    it("should publish post immediately", async () => {
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        status: "PUBLISHED",
      });

      const result = await publishPost(postData, "now", postId, "markdown");

      expect(result.success).toBe(true);
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: expect.objectContaining({
          status: "PUBLISHED",
          publishDate: expect.any(Date),
        }),
      });
    });

    it("should schedule post for later", async () => {
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        status: "SCHEDULED",
      });

      const result = await publishPost(postData, "later", postId, "markdown");

      expect(result.success).toBe(true);
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: { status: "SCHEDULED" },
      });
    });

    it("should return error on database failure", async () => {
      mockPrisma.post.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await publishPost(postData, "now", postId, "markdown");

      expect(result.error).toBe("Error publishing post");
    });
  });

  describe("unpublishPost", () => {
    it("should unpublish post and set to DRAFT", async () => {
      const postId = "post-123";
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        status: "DRAFT",
      });

      const result = await unpublishPost(postId);

      expect(result.success).toBe(true);
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: expect.objectContaining({
          status: "DRAFT",
          publishDate: expect.any(Date),
        }),
      });
    });

    it("should return error on database failure", async () => {
      mockPrisma.post.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await unpublishPost("post-123");

      expect(result.error).toBe("Error unpublishing post");
    });
  });

  describe("unschedulePost", () => {
    const postId = "post-123";
    const postData = { contentType: "BLOG" } as any;

    it("should unschedule post and clear broadcast IDs", async () => {
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        status: "DRAFT",
        broadcastIds: [],
      });

      const result = await unschedulePost(postData, postId);

      expect(result.success).toBe(true);
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: postId },
        data: {
          status: "DRAFT",
          broadcastIds: [],
        },
      });
    });

    it("should return error on database failure", async () => {
      mockPrisma.post.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await unschedulePost(postData, postId);

      expect(result.error).toBe("Error unscheduling post");
    });
  });
});
