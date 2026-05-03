/**
 * Tests for Tag CRUD Actions
 * Tests tag creation, updating, deletion, and fetching
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockRedirect, mockDeleteFile, mockAuth, mockClerkClient } =
  vi.hoisted(() => {
    const mockPrisma = {
      tag: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      tagOnPost: {
        findMany: vi.fn(),
      },
    };

    const mockRedirect = vi.fn();
    const mockDeleteFile = vi.fn();
    const mockAuth = vi.fn();
    const mockClerkClient = vi.fn();

    return {
      mockPrisma,
      mockRedirect,
      mockDeleteFile,
      mockAuth,
      mockClerkClient,
    };
  });

// Mock modules
vi.mock("@ratecreator/db/client", () => ({
  getPrismaClient: vi.fn(() => mockPrisma),
}));

vi.mock("@clerk/nextjs/server", () => ({
  auth: mockAuth,
  clerkClient: mockClerkClient,
}));

vi.mock("next/navigation", () => ({
  redirect: mockRedirect,
}));

vi.mock("../upload-crud", () => ({
  deleteFileFromBucket: mockDeleteFile,
}));

// roles.ts (transitively pulled in via requireWriter) imports cache.ts which
// pulls in the Redis client. Stub the cache module so the test doesn't try
// to instantiate Redis.
vi.mock("../content/cache", () => ({
  invalidateCache: vi.fn(),
  withCache: vi.fn(),
  CACHE_TTL: {},
  CacheKeys: {},
}));

vi.mock("@ratecreator/types/content", () => ({
  tagSchema: {
    safeParse: vi.fn((data) => {
      if (!data.slug || data.slug.trim() === "") {
        return {
          success: false,
          error: { format: () => ({ slug: "Slug required" }) },
        };
      }
      return { success: true, data };
    }),
  },
  updateTagSchema: {
    safeParse: vi.fn((data) => {
      if (!data.id || !data.slug) {
        return {
          success: false,
          error: { format: () => ({ slug: "Invalid data" }) },
        };
      }
      return { success: true, data };
    }),
  },
  Tags: {},
}));

import {
  fetchTagDetails,
  createTagAction,
  fetchAllTagsWithPostCount,
  updateTagAction,
  deleteTagAction,
  fetchTagsFromTagOnPost,
  fetchAllTagsFromTagOnPost,
} from "../content/crud-tags";

describe("Tag CRUD Actions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Default: signed-in admin (deepshaswat@gmail.com is in ADMIN_EMAILS,
    // so requireWriter() will accept this user without a roles array).
    mockAuth.mockResolvedValue({ userId: "clerk-user-1" });
    mockClerkClient.mockResolvedValue({
      users: {
        getUser: vi.fn().mockResolvedValue({
          id: "clerk-user-1",
          primaryEmailAddressId: "email-1",
          emailAddresses: [
            { id: "email-1", emailAddress: "deepshaswat@gmail.com" },
          ],
          publicMetadata: {},
        }),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("fetchTagDetails", () => {
    it("should fetch tag details by slug", async () => {
      const mockTag = {
        id: "tag-1",
        slug: "tech",
        description: "Tech posts",
        imageUrl: "https://example.com/tech.jpg",
      };
      mockPrisma.tag.findUnique.mockResolvedValueOnce(mockTag);

      const result = await fetchTagDetails("tech");

      expect(result).toEqual(mockTag);
      expect(mockPrisma.tag.findUnique).toHaveBeenCalledWith({
        where: { slug: "tech" },
      });
    });

    it("should return null for non-existent tag", async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce(null);

      const result = await fetchTagDetails("non-existent");

      expect(result).toBeNull();
    });

    it("should return null on error", async () => {
      mockPrisma.tag.findUnique.mockRejectedValueOnce(new Error("DB Error"));

      const result = await fetchTagDetails("tech");

      expect(result).toBeNull();
    });
  });

  describe("createTagAction", () => {
    it("should create a new tag successfully", async () => {
      const tagData = {
        slug: "new-tag",
        description: "New tag description",
        imageUrl: "https://example.com/tag.jpg",
      };
      mockPrisma.tag.findUnique.mockResolvedValueOnce(null);
      mockPrisma.tag.create.mockResolvedValueOnce({ id: "tag-1", ...tagData });

      const result = await createTagAction(tagData);

      expect(result.success).toBe(true);
      expect(result.tag).toBeDefined();
      expect(mockPrisma.tag.create).toHaveBeenCalledWith({
        data: tagData,
      });
    });

    it("should return error if slug already exists", async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce({
        id: "existing-tag",
        slug: "existing",
      });

      const result = await createTagAction({ slug: "existing" });

      expect(result.error).toEqual({ slug: "Slug already exists" });
      expect(mockPrisma.tag.create).not.toHaveBeenCalled();
    });

    it("should return validation error for empty slug", async () => {
      const result = await createTagAction({ slug: "" });

      expect(result.error).toBeDefined();
    });

    it("should return error on database failure", async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce(null);
      mockPrisma.tag.create.mockRejectedValueOnce(new Error("DB Error"));

      const result = await createTagAction({ slug: "new-tag" });

      expect(result.error).toBe("Failed to create tag.");
    });
  });

  describe("Authentication", () => {
    it("should reject unauthenticated callers from fetchTagDetails", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      await expect(fetchTagDetails("tech")).rejects.toThrow("Unauthorized");
      // Auth check runs before the try/catch, so prisma is never hit.
      expect(mockPrisma.tag.findUnique).not.toHaveBeenCalled();
    });

    it("should reject non-writer callers from createTagAction", async () => {
      mockClerkClient.mockResolvedValueOnce({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "clerk-user-1",
            primaryEmailAddressId: "email-1",
            emailAddresses: [
              { id: "email-1", emailAddress: "regular@example.com" },
            ],
            publicMetadata: { roles: ["USER"] },
          }),
        },
      });

      await expect(createTagAction({ slug: "tech" })).rejects.toThrow(
        "Forbidden: Writer or Admin role required",
      );
    });

    it("should reject unauthenticated callers from fetchAllTagsWithPostCount", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      await expect(fetchAllTagsWithPostCount()).rejects.toThrow("Unauthorized");
    });

    it("should reject unauthenticated callers from fetchTagsFromTagOnPost", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      await expect(
        fetchTagsFromTagOnPost({ postId: "post-1" }),
      ).rejects.toThrow("Unauthorized");
    });
  });

  describe("fetchAllTagsWithPostCount", () => {
    it("should fetch all tags with post counts", async () => {
      const mockTags = [
        {
          id: "tag-1",
          slug: "tech",
          description: "Tech posts",
          imageUrl: "https://example.com/tech.jpg",
          posts: [{ id: "post-1" }, { id: "post-2" }],
        },
        {
          id: "tag-2",
          slug: "gaming",
          description: "Gaming posts",
          imageUrl: null,
          posts: [],
        },
      ];
      mockPrisma.tag.findMany.mockResolvedValueOnce(mockTags);

      const result = await fetchAllTagsWithPostCount();

      expect(result.length).toBe(2);
      expect(result[0].posts.length).toBe(2);
      expect(result[1].description).toBe("Gaming posts");
      expect(mockPrisma.tag.findMany).toHaveBeenCalledWith({
        include: { posts: true },
        orderBy: { slug: "asc" },
      });
    });

    it("should return empty array when no tags exist", async () => {
      mockPrisma.tag.findMany.mockResolvedValueOnce(null);

      const result = await fetchAllTagsWithPostCount();

      expect(result).toEqual([]);
    });

    it("should throw error on database failure", async () => {
      mockPrisma.tag.findMany.mockRejectedValueOnce(new Error("DB Error"));

      await expect(fetchAllTagsWithPostCount()).rejects.toThrow(
        "Failed to fetch tags",
      );
    });

    it("should handle null description and imageUrl", async () => {
      const mockTags = [
        {
          id: "tag-1",
          slug: "test",
          description: null,
          imageUrl: null,
          posts: [],
        },
      ];
      mockPrisma.tag.findMany.mockResolvedValueOnce(mockTags);

      const result = await fetchAllTagsWithPostCount();

      expect(result[0].description).toBe("");
      expect(result[0].imageUrl).toBe("");
    });
  });

  describe("updateTagAction", () => {
    it("should update a tag successfully", async () => {
      const updateData = {
        id: "tag-1",
        slug: "updated-tag",
        description: "Updated description",
        imageUrl: "https://example.com/updated.jpg",
      };
      mockPrisma.tag.findUnique.mockResolvedValueOnce(null);
      mockPrisma.tag.update.mockResolvedValueOnce(updateData);

      const result = await updateTagAction(updateData);

      expect(result).toEqual(updateData);
      expect(mockPrisma.tag.update).toHaveBeenCalledWith({
        where: { id: "tag-1" },
        data: {
          slug: "updated-tag",
          description: "Updated description",
          imageUrl: "https://example.com/updated.jpg",
        },
      });
    });

    it("should return error if slug exists for different tag", async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce({
        id: "different-tag",
        slug: "existing-slug",
      });

      const result = await updateTagAction({
        id: "tag-1",
        slug: "existing-slug",
      });

      expect(result.error).toEqual({ slug: "Slug already exists" });
    });

    it("should allow updating same tag with same slug", async () => {
      const tagData = {
        id: "tag-1",
        slug: "same-slug",
        description: "Updated",
      };
      mockPrisma.tag.findUnique.mockResolvedValueOnce({
        id: "tag-1",
        slug: "same-slug",
      });
      mockPrisma.tag.update.mockResolvedValueOnce(tagData);

      const result = await updateTagAction(tagData);

      expect(result.slug).toBe("same-slug");
    });

    it("should return validation error for missing fields", async () => {
      const result = await updateTagAction({ slug: "test" } as any);

      expect(result.error).toBeDefined();
    });

    it("should return error on database failure", async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce(null);
      mockPrisma.tag.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await updateTagAction({
        id: "tag-1",
        slug: "test",
      });

      expect(result.error).toBe("Failed to update tag.");
    });
  });

  describe("deleteTagAction", () => {
    it("should delete a tag successfully", async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce({
        id: "tag-1",
        slug: "test",
        imageUrl: null,
      });
      mockPrisma.tag.delete.mockResolvedValueOnce({ id: "tag-1" });

      const result = await deleteTagAction("test");

      expect(result).toBe(true);
      expect(mockPrisma.tag.delete).toHaveBeenCalledWith({
        where: { slug: "test" },
      });
    });

    it("should delete image from bucket if exists", async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce({
        id: "tag-1",
        slug: "test",
        imageUrl: "https://example.com/image.jpg",
      });
      mockPrisma.tag.delete.mockResolvedValueOnce({ id: "tag-1" });

      await deleteTagAction("test");

      expect(mockDeleteFile).toHaveBeenCalledWith(
        "https://example.com/image.jpg",
      );
    });

    it("should return error if tag not found", async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce(null);

      const result = await deleteTagAction("non-existent");

      expect(result.error).toBe("Tag not found");
    });

    it("should throw error on database failure", async () => {
      mockPrisma.tag.findUnique.mockResolvedValueOnce({
        id: "tag-1",
        slug: "test",
        imageUrl: null,
      });
      mockPrisma.tag.delete.mockRejectedValueOnce(new Error("DB Error"));

      await expect(deleteTagAction("test")).rejects.toThrow(
        "Failed to delete tag",
      );
    });
  });

  describe("fetchTagsFromTagOnPost", () => {
    it("should fetch tags for a specific post", async () => {
      const mockTagsOnPost = [
        {
          tag: {
            id: "tag-1",
            slug: "tech",
            description: "Tech",
            imageUrl: null,
            posts: [],
          },
        },
        {
          tag: {
            id: "tag-2",
            slug: "gaming",
            description: "Gaming",
            imageUrl: null,
            posts: [],
          },
        },
      ];
      mockPrisma.tagOnPost.findMany.mockResolvedValueOnce(mockTagsOnPost);

      const result = await fetchTagsFromTagOnPost({ postId: "post-1" });

      expect(result.length).toBe(2);
      expect(mockPrisma.tagOnPost.findMany).toHaveBeenCalledWith({
        where: { postId: "post-1" },
        select: {
          tag: {
            select: {
              id: true,
              slug: true,
              description: true,
              imageUrl: true,
              posts: true,
            },
          },
        },
        orderBy: {
          tag: { slug: "asc" },
        },
      });
    });

    it("should return empty array for post with no tags", async () => {
      mockPrisma.tagOnPost.findMany.mockResolvedValueOnce([]);

      const result = await fetchTagsFromTagOnPost({ postId: "post-1" });

      expect(result).toEqual([]);
    });

    it("should throw error on database failure", async () => {
      mockPrisma.tagOnPost.findMany.mockRejectedValueOnce(
        new Error("DB Error"),
      );

      await expect(
        fetchTagsFromTagOnPost({ postId: "post-1" }),
      ).rejects.toThrow("Failed to fetch tags");
    });
  });

  describe("fetchAllTagsFromTagOnPost", () => {
    // This is a public read, but it now restricts to PUBLISHED posts so
    // draft titles/excerpts don't leak through tag joins.
    it("should fetch all tag-post associations restricted to PUBLISHED posts", async () => {
      const mockAssociations = [
        { post: { id: "post-1" }, tag: { id: "tag-1", slug: "tech" } },
        { post: { id: "post-2" }, tag: { id: "tag-1", slug: "tech" } },
      ];
      mockPrisma.tagOnPost.findMany.mockResolvedValueOnce(mockAssociations);

      const result = await fetchAllTagsFromTagOnPost();

      expect(result.length).toBe(2);
      expect(mockPrisma.tagOnPost.findMany).toHaveBeenCalledWith({
        where: { post: { status: "PUBLISHED" } },
        include: { post: true, tag: true },
        orderBy: { tag: { slug: "asc" } },
      });
    });

    it("should throw error on database failure", async () => {
      mockPrisma.tagOnPost.findMany.mockRejectedValueOnce(
        new Error("DB Error"),
      );

      await expect(fetchAllTagsFromTagOnPost()).rejects.toThrow(
        "Failed to fetch tags",
      );
    });
  });
});
