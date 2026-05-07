/**
 * Tests for Post CRUD Actions
 * Tests blog post creation, updating, deletion, and publishing.
 *
 * The post-IDOR fix introduced two new gates wired into every mutating
 * function:
 *   1. authenticateUser() now RETURNS the session userId (was void) so
 *      ownership checks can use it.
 *   2. requirePostOwnership(postId, sessionClerkId) — looks up the post and
 *      verifies post.author.clerkId === session OR caller is ADMIN.
 * createPost ignores caller-supplied data.author.id and resolves the Author
 * row from the session via prisma.author.findUnique({where:{clerkId}}).
 * publishPost calls sendNewsletterBroadcast(postId, segments, clerkId) — the
 * old (postId, postData, segments) signature is gone.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Use vi.hoisted for mocks
const { mockPrisma, mockRedirect, mockAuth, mockClerkClient } = vi.hoisted(
  () => {
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
      author: {
        findUnique: vi.fn(),
      },
      emailLog: {
        create: vi.fn(),
      },
    };

    const mockRedirect = vi.fn();
    const mockAuth = vi.fn();
    const mockClerkClient = vi.fn();

    return { mockPrisma, mockRedirect, mockAuth, mockClerkClient };
  },
);

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

// The email package is only used at publish time for newsletters; stub it
// out so this test file doesn't pull in the full email runtime.
vi.mock("@ratecreator/email", () => ({
  blocknoteToEmailHtml: vi.fn(() => ""),
  sendBroadcastToSegments: vi.fn(async () => []),
  deleteBroadcast: vi.fn(async () => undefined),
  NewsletterIssueEmail: () => null,
  BASE_URL: "http://localhost",
}));

import {
  createPost,
  updatePost,
  deletePost,
  restorePost,
  publishPost,
  unpublishPost,
  unschedulePost,
  resendNewsletter,
} from "../content/crud-posts";
import { sendBroadcastToSegments } from "@ratecreator/email";

// Default ownership shape: post is owned by the same clerkId the session
// uses, so requirePostOwnership() lets the call through.
const ownedPost = (postId: string) => ({
  id: postId,
  author: { id: "author-1", clerkId: "clerk-user-1" },
});

describe("Post CRUD Actions", () => {
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
    // Default Author lookup (createPost) — current user has an Author row.
    mockPrisma.author.findUnique.mockResolvedValue({ id: "author-1" });
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
      // 1) postUrl uniqueness check → no collision.
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.post.create.mockResolvedValueOnce(newPost);
      mockPrisma.tagOnPost.createMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.tagOnPost.findMany.mockResolvedValueOnce([]);
      // 2) re-read with tags relation included.
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...newPost,
        tags: [],
      });

      const result = await createPost(mockPostData as any);

      expect(result.success).toBe(true);
      expect(result.post).toBeDefined();
      expect(mockPrisma.post.create).toHaveBeenCalled();
    });

    it("should resolve authorId from the session, not the client payload", async () => {
      // Caller tries to attribute the post to a different author. Source must
      // ignore that and use the session's Author row instead.
      const malicious = { ...mockPostData, author: { id: "victim-author" } };
      const newPost = { id: "post-1", ...malicious };
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.post.create.mockResolvedValueOnce(newPost);
      mockPrisma.tagOnPost.createMany.mockResolvedValueOnce({ count: 2 });
      mockPrisma.tagOnPost.findMany.mockResolvedValueOnce([]);
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        ...newPost,
        tags: [],
      });
      mockPrisma.author.findUnique.mockResolvedValueOnce({
        id: "session-author",
      });

      await createPost(malicious as any);

      expect(mockPrisma.author.findUnique).toHaveBeenCalledWith({
        where: { clerkId: "clerk-user-1" },
        select: { id: true },
      });
      expect(mockPrisma.post.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            author: { connect: { id: "session-author" } },
          }),
        }),
      );
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

    it("should return error when no Author row exists for the current user", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      mockPrisma.author.findUnique.mockResolvedValueOnce(null);

      const result = await createPost(mockPostData as any);

      expect(result.error).toMatch(/createAuthor/);
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

  describe("Authentication", () => {
    it("should reject unauthenticated callers", async () => {
      mockAuth.mockResolvedValueOnce({ userId: null });

      await expect(createPost(mockPostData as any)).rejects.toThrow(
        "Unauthorized",
      );
      expect(mockPrisma.post.create).not.toHaveBeenCalled();
    });

    it("should reject callers without writer/admin role", async () => {
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

      await expect(createPost(mockPostData as any)).rejects.toThrow(
        "Forbidden: Writer or Admin role required",
      );
    });
  });

  describe("updatePost", () => {
    const postId = "post-123";

    it("should update a post successfully when caller owns the post", async () => {
      // Ownership check first.
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
      // postUrl uniqueness check.
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

    it("should never include author.connect in the update payload (author is immutable)", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
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

      await updatePost(mockPostData as any, postId);

      const updateCallArg = mockPrisma.post.update.mock.calls[0][0];
      expect(updateCallArg.data).toBeDefined();
      expect(updateCallArg.data.author).toBeUndefined();
      expect(updateCallArg.data.authorId).toBeUndefined();
    });

    it("should return error if URL exists for different post", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        id: "different-post",
        postUrl: "test-post",
      });

      const result = await updatePost(mockPostData as any, postId);

      expect(result.error).toBe("Post URL already exists");
    });

    it("should delete old tags before creating new ones", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
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

      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
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
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
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
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
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
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost("post-123"));
      mockPrisma.post.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await deletePost("post-123");

      expect(result?.error).toBe("Error deleting post");
    });
  });

  describe("restorePost", () => {
    it("should restore a deleted post to DRAFT status", async () => {
      const postId = "post-123";
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
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
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost("post-123"));
      mockPrisma.post.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await restorePost("post-123");

      expect(result?.error).toBe("Error restoring post");
    });
  });

  describe("publishPost", () => {
    const postId = "post-123";
    const postData = { contentType: "BLOG" } as any;

    it("should publish post immediately", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
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
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
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
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
      mockPrisma.post.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await publishPost(postData, "now", postId, "markdown");

      expect(result.error).toBe("Error publishing post");
    });

    it("should fire newsletter broadcast with (postId, segments, sessionClerkId) signature", async () => {
      // Newsletter publish path. The new signature drops the post-data arg
      // and adds the triggering clerkId so the broadcast can re-fetch the
      // post itself instead of trusting caller-supplied content.
      const newsletterPostData = { contentType: "NEWSLETTER" } as any;

      // Ownership check inside publishPost.
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        status: "PUBLISHED",
      });
      // Re-fetch inside sendNewsletterBroadcast.
      mockPrisma.post.findUnique.mockResolvedValueOnce({
        id: postId,
        title: "T",
        content: "{}",
        excerpt: null,
        featureImage: null,
        publishDate: null,
        postUrl: "p",
        author: null,
      });

      const result = await publishPost(
        newsletterPostData,
        "now",
        postId,
        "markdown",
        ["all-users"],
      );
      expect(result.success).toBe(true);

      // Give the fire-and-forget broadcast a tick to settle.
      await new Promise((r) => setImmediate(r));

      expect(sendBroadcastToSegments).toHaveBeenCalledWith(
        expect.objectContaining({
          segments: ["all-users"],
        }),
      );
    });
  });

  describe("unpublishPost", () => {
    it("should unpublish post and set to DRAFT", async () => {
      const postId = "post-123";
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
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
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost("post-123"));
      mockPrisma.post.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await unpublishPost("post-123");

      expect(result.error).toBe("Error unpublishing post");
    });
  });

  describe("unschedulePost", () => {
    const postId = "post-123";
    const postData = { contentType: "BLOG" } as any;

    it("should unschedule post and clear broadcast IDs", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
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
      mockPrisma.post.findUnique.mockResolvedValueOnce(ownedPost(postId));
      mockPrisma.post.update.mockRejectedValueOnce(new Error("DB Error"));

      const result = await unschedulePost(postData, postId);

      expect(result.error).toBe("Error unscheduling post");
    });
  });

  // ── Ownership / IDOR regressions ────────────────────────────────────────
  // requirePostOwnership() must refuse any mutating call where the post's
  // author.clerkId doesn't match the session and the caller isn't ADMIN.
  describe("post ownership (IDOR)", () => {
    const postId = "post-foreign";

    const foreignPost = () => ({
      id: postId,
      author: { id: "victim-author", clerkId: "victim-clerk" },
    });

    beforeEach(() => {
      // Make the session a regular WRITER (NOT in ADMIN_EMAILS) so the
      // isCurrentUserAdmin() escape hatch returns false.
      mockClerkClient.mockResolvedValue({
        users: {
          getUser: vi.fn().mockResolvedValue({
            id: "clerk-user-1",
            primaryEmailAddressId: "email-1",
            emailAddresses: [
              { id: "email-1", emailAddress: "writer@example.com" },
            ],
            publicMetadata: { roles: ["WRITER"] },
          }),
        },
      });
    });

    it("updatePost rejects non-owner writer", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(foreignPost());
      await expect(updatePost(mockPostData as any, postId)).rejects.toThrow(
        /Forbidden: you do not own this post/,
      );
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("deletePost rejects non-owner writer", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(foreignPost());
      await expect(deletePost(postId)).rejects.toThrow(
        /Forbidden: you do not own this post/,
      );
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("publishPost rejects non-owner writer", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(foreignPost());
      await expect(
        publishPost({ contentType: "BLOG" } as any, "now", postId, "md"),
      ).rejects.toThrow(/Forbidden: you do not own this post/);
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("unpublishPost rejects non-owner writer", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(foreignPost());
      await expect(unpublishPost(postId)).rejects.toThrow(
        /Forbidden: you do not own this post/,
      );
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("unschedulePost rejects non-owner writer", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(foreignPost());
      await expect(
        unschedulePost({ contentType: "BLOG" } as any, postId),
      ).rejects.toThrow(/Forbidden: you do not own this post/);
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("restorePost rejects non-owner writer", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(foreignPost());
      await expect(restorePost(postId)).rejects.toThrow(
        /Forbidden: you do not own this post/,
      );
      expect(mockPrisma.post.update).not.toHaveBeenCalled();
    });

    it("resendNewsletter rejects non-owner writer", async () => {
      // resendNewsletter calls requirePostOwnership BEFORE its try/catch,
      // so the Forbidden bubbles all the way out — that's a stronger guard
      // than swallowing it into the response object.
      mockPrisma.post.findUnique.mockResolvedValueOnce(foreignPost());
      await expect(resendNewsletter(postId, ["all-users"])).rejects.toThrow(
        /Forbidden: you do not own this post/,
      );
    });

    it("admin can mutate any post", async () => {
      // Admin emails bypass the ownership check.
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
      mockPrisma.post.findUnique.mockResolvedValueOnce(foreignPost());
      mockPrisma.post.update.mockResolvedValueOnce({
        id: postId,
        status: "DELETED",
      });

      const result = await deletePost(postId);
      expect(result).toBeUndefined();
      expect(mockPrisma.post.update).toHaveBeenCalled();
    });

    it("rejects when the post does not exist", async () => {
      mockPrisma.post.findUnique.mockResolvedValueOnce(null);
      await expect(deletePost("ghost")).rejects.toThrow("Post not found");
    });
  });
});
