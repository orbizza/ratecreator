/**
 * @fileoverview Blog post CRUD operations for Rate Creator platform
 * @module actions/content/crud-posts
 * @description Provides server actions for managing blog posts, including
 * creation, reading, updating, and deletion of posts.
 */

"use server";

import { auth } from "@clerk/nextjs/server";

import { getPrismaClient } from "@ratecreator/db/client";
import { invalidateCache } from "./cache";
import { requireWriter, isCurrentUserAdmin } from "./roles";

import {
  ContentPlatform,
  ContentType,
  FetchedPostType,
  PostStatus,
  PostType,
  UpdatePostType,
} from "@ratecreator/types/content";

import {
  blocknoteToEmailHtml,
  sendBroadcastToSegments,
  deleteBroadcast,
  NewsletterIssueEmail,
  BASE_URL,
  type SegmentType,
} from "@ratecreator/email";

import React from "react";

/**
 * Prisma client instance for database operations
 * @private
 */
const prisma = getPrismaClient();

/**
 * Verifies the current user is signed in and has WRITER/ADMIN role.
 * Returns the session userId for downstream ownership checks.
 * @throws {Error} If user is not authenticated or lacks the required role.
 */
async function authenticateUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  await requireWriter(userId);
  return userId;
}

/**
 * Confirms the calling user owns the post (matches Author.clerkId) or is
 * ADMIN. Returns the post or throws Forbidden.
 */
async function requirePostOwnership(postId: string, sessionClerkId: string) {
  const post = await prisma.post.findUnique({
    where: { id: postId },
    include: { author: { select: { id: true, clerkId: true } } },
  });
  if (!post) {
    throw new Error("Post not found");
  }
  if (post.author?.clerkId === sessionClerkId) {
    return post;
  }
  if (await isCurrentUserAdmin()) {
    return post;
  }
  throw new Error("Forbidden: you do not own this post");
}

/**
 * Creates a new blog post
 * @param {PostType} data - Post data including title, content, and metadata
 * @returns {Promise<{post?: any; success?: boolean; error?: string}>} Result of the operation
 */
async function createPost(data: PostType) {
  const sessionClerkId = await authenticateUser();
  try {
    const existingPost = await prisma.post.findUnique({
      where: { postUrl: data.postUrl },
    });

    if (existingPost) {
      return { error: "Post URL already exists" };
    }

    // Resolve the Author record from the session, never trust client-supplied
    // `data.author.id` — that lets a writer attribute a new post to anyone.
    const author = await prisma.author.findUnique({
      where: { clerkId: sessionClerkId },
      select: { id: true },
    });
    if (!author) {
      return {
        error:
          "No Author record for the current user. Call createAuthor() first.",
      };
    }

    const newPost = await prisma.post.create({
      data: {
        title: data.title,
        content: data.content,
        postUrl: data.postUrl,
        publishDate: data.publishDate || undefined,
        excerpt: data.excerpt,
        isFeatured: data.isFeatured,
        featureImage: data.featureImage,
        author: {
          connect: { id: author.id },
        },
        metadataTitle: data.metadataTitle,
        metadataDescription: data.metadataDescription,
        metadataImageUrl: data.metadataImageUrl,
        metadataKeywords: data.metadataKeywords,
        canonicalUrl: data.canonicalUrl,
        contentType: data.contentType as ContentType,
        contentPlatform: data.contentPlatform as ContentPlatform,
        status: data.status as PostStatus,
      },
    });

    if (data.tags && data.tags.length > 0) {
      await prisma.tagOnPost.createMany({
        data: data.tags.map((tag) => ({
          postId: newPost.id,
          tagId: tag.id,
        })),
      });
    }

    await prisma.tagOnPost.findMany({
      where: {
        postId: newPost.id,
        tagId: { in: data.tags.map((tag) => tag.id) },
      },
    });

    const updatedPost = await prisma.post.findUnique({
      where: { id: newPost.id },
      include: { tags: true },
    });

    await invalidateCache("posts:*");

    return { post: updatedPost, success: true };
  } catch (error) {
    console.error("Error creating post:", error);
    return { error: "Error creating post" };
  }
}

/**
 * Updates an existing blog post
 * @param {PostType} data - Updated post data
 * @param {string} postId - ID of the post to update
 * @returns {Promise<{post?: any; success?: boolean; error?: string}>} Result of the operation
 */
async function updatePost(data: PostType, postId: string) {
  const sessionClerkId = await authenticateUser();
  await requirePostOwnership(postId, sessionClerkId);
  const post: UpdatePostType = {
    title: data.title,
    content: data.content,
    postUrl: data.postUrl,
    publishDate: data.publishDate
      ? new Date(data.publishDate.toString())
      : null,
    excerpt: data.excerpt,
    isFeatured: data.isFeatured,
    featureImage: data.featureImage,
    tags: data.tags,
    author: data.author,
    metadataTitle: data.metadataTitle,
    metadataDescription: data.metadataDescription,
    metadataImageUrl: data.metadataImageUrl,
    metadataKeywords: data.metadataKeywords,
    canonicalUrl: data.canonicalUrl,
    contentType: data.contentType as ContentType,
    contentPlatform: data.contentPlatform as ContentPlatform,
    status: data.status as PostStatus,
  };

  try {
    const existingPost = await prisma.post.findUnique({
      where: {
        postUrl: post.postUrl,
        NOT: {
          id: postId,
        },
      },
    });

    if (existingPost) {
      return { error: "Post URL already exists" };
    }

    await prisma.tagOnPost.deleteMany({
      where: { postId },
    });

    // Don't allow re-assigning authorship via update — author is immutable
    // after creation. This blocks the IDOR where a writer reassigns a post
    // they own onto another writer's identity.
    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: post.title,
        content: post.content,
        postUrl: post.postUrl,
        publishDate: post.publishDate || undefined,
        excerpt: post.excerpt,
        isFeatured: post.isFeatured,
        featureImage: post.featureImage,
        metadataTitle: post.metadataTitle,
        metadataDescription: post.metadataDescription,
        metadataImageUrl: post.metadataImageUrl,
        metadataKeywords: post.metadataKeywords,
        canonicalUrl: post.canonicalUrl,
        contentType: post.contentType as ContentType,
        contentPlatform: post.contentPlatform as ContentPlatform,
        status: post.status as PostStatus,
      },
    });

    if (post.tags && post.tags.length > 0) {
      await prisma.tagOnPost.createMany({
        data: post.tags.map((tag) => ({
          postId: updatedPost.id,
          tagId: tag.id,
        })),
      });
    }

    await prisma.tagOnPost.findMany({
      where: {
        postId: updatedPost.id,
        tagId: { in: post.tags.map((tag) => tag.id) },
      },
    });

    const finalUpdatedPost = await prisma.post.findUnique({
      where: { id: updatedPost.id },
      include: { tags: true },
    });

    await invalidateCache("posts:*");

    return { post: finalUpdatedPost, success: true };
  } catch (error) {
    console.error("Error updating post:", error);
    return { error: "Error updating post" };
  }
}

/**
 * Deletes a blog post by marking it as deleted
 * @param {string} postId - ID of the post to delete
 * @returns {Promise<{error?: string}>} Result of the operation
 */
async function deletePost(postId: string) {
  const sessionClerkId = await authenticateUser();
  await requirePostOwnership(postId, sessionClerkId);
  try {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DELETED,
      },
    });
    await invalidateCache("posts:*");
  } catch (error) {
    console.error("Error deleting post:", error);
    return { error: "Error deleting post" };
  }
}

/**
 * Restores a deleted blog post to draft status
 * @param {string} postId - ID of the post to restore
 * @returns {Promise<{error?: string}>} Result of the operation
 */
async function restorePost(postId: string) {
  const sessionClerkId = await authenticateUser();
  await requirePostOwnership(postId, sessionClerkId);
  try {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
      },
    });
    await invalidateCache("posts:*");
  } catch (error) {
    console.error("Error restoring post:", error);
    return { error: "Error restoring post" };
  }
}

/**
 * Publishes a blog post immediately or schedules it for later
 * @param {FetchedPostType} postData - Post data
 * @param {string} scheduleType - Type of scheduling ("later" or immediate)
 * @param {string} postId - ID of the post to publish
 * @param {string} markdown - Markdown content of the post
 * @param {string[]} segments - Newsletter audience segments to broadcast to
 * @returns {Promise<{success?: boolean; error?: string}>} Result of the operation
 */
async function publishPost(
  postData: FetchedPostType,
  scheduleType: string,
  postId: string,
  markdown: string,
  segments?: string[],
) {
  const selectedSegments = (segments || ["all-users"]) as SegmentType[];

  let data: any = {};
  if (scheduleType === "later") {
    data = {
      status: PostStatus.SCHEDULED,
    };
    // Store segments for scheduled newsletters so cron can pick them up
    if (postData.contentType === ContentType.NEWSLETTER) {
      data.broadcastIds = selectedSegments.map((s) => `segment:${s}`);
    }
  } else {
    data = { status: PostStatus.PUBLISHED, publishDate: new Date() };
  }

  const sessionClerkId = await authenticateUser();
  await requirePostOwnership(postId, sessionClerkId);
  try {
    await prisma.post.update({
      where: { id: postId },
      data,
    });

    // Send broadcast newsletter when publishing immediately. Pass the postId
    // only — sendNewsletterBroadcast re-fetches from the DB so the email
    // body cannot diverge from what's actually stored as the post content.
    if (
      postData.contentType === ContentType.NEWSLETTER &&
      scheduleType !== "later"
    ) {
      sendNewsletterBroadcast(postId, selectedSegments, sessionClerkId).catch(
        (err) => console.error("Newsletter broadcast error:", err),
      );
    }

    await invalidateCache("posts:*");

    return { success: true };
  } catch (error) {
    console.error("Error publishing post:", error);
    return { error: "Error publishing post" };
  }
}

/**
 * Broadcast a newsletter to selected audience segments using React templates.
 *
 * SECURITY: re-fetches the post + author from the DB so the email body cannot
 * diverge from what's stored. The previous signature accepted a caller-
 * supplied `postData` which let any writer broadcast arbitrary content (and
 * impersonate any author) regardless of what was actually persisted.
 */
async function sendNewsletterBroadcast(
  postId: string,
  segments: SegmentType[],
  triggeredByClerkId?: string,
) {
  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { author: true },
    });
    if (!post) {
      console.error(`sendNewsletterBroadcast: post ${postId} not found`);
      return;
    }

    const emailHtml = blocknoteToEmailHtml(post.content);
    const postUrl = `${BASE_URL}/newsletter/${post.postUrl}`;
    const publishDate = post.publishDate
      ? new Date(post.publishDate).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : undefined;

    const results = await sendBroadcastToSegments({
      segments,
      subject: post.title,
      name: post.title,
      buildReact: (segment: SegmentType) =>
        React.createElement(NewsletterIssueEmail, {
          title: post.title,
          contentHtml: emailHtml,
          featureImage: post.featureImage || undefined,
          authorName: post.author?.name || undefined,
          authorImageUrl: post.author?.imageUrl || undefined,
          publishDate,
          postUrl,
          hideUnsubscribe: segment === "security",
          previewText: post.excerpt || post.title,
        }),
    });

    const broadcastIds: string[] = [];

    for (const result of results) {
      broadcastIds.push(result.id);

      // Log success — include the actor for audit.
      await prisma.emailLog.create({
        data: {
          to: `broadcast:${result.segment}`,
          subject: post.title,
          template: "newsletter-issue",
          status: "SENT",
          resendId: result.id,
          metadata: {
            postId,
            segment: result.segment,
            ...(triggeredByClerkId ? { triggeredBy: triggeredByClerkId } : {}),
          },
        },
      });
    }

    // Log failures for segments that didn't produce results
    const succeededSegments = results.map((r) => r.segment);
    for (const segment of segments) {
      if (!succeededSegments.includes(segment)) {
        await prisma.emailLog.create({
          data: {
            to: `broadcast:${segment}`,
            subject: post.title,
            template: "newsletter-issue",
            status: "FAILED",
            error: "Broadcast creation returned null",
            metadata: {
              postId,
              segment,
              ...(triggeredByClerkId
                ? { triggeredBy: triggeredByClerkId }
                : {}),
            },
          },
        });
      }
    }

    // Update post with broadcast IDs
    if (broadcastIds.length > 0) {
      await prisma.post.update({
        where: { id: postId },
        data: { broadcastIds },
      });
    }
  } catch (error) {
    console.error("sendNewsletterBroadcast error:", error);
  }
}

/**
 * Resend a previously published newsletter to selected segments
 */
async function resendNewsletter(postId: string, segments?: string[]) {
  const sessionClerkId = await authenticateUser();
  await requirePostOwnership(postId, sessionClerkId);

  try {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { status: true, contentType: true },
    });
    if (!post || post.status !== PostStatus.PUBLISHED) {
      return { error: "Post not found or not published" };
    }
    if (post.contentType !== ContentType.NEWSLETTER) {
      return { error: "Post is not a newsletter" };
    }

    const selectedSegments = (segments || ["all-users"]) as SegmentType[];
    await sendNewsletterBroadcast(postId, selectedSegments, sessionClerkId);

    return { success: true };
  } catch (error) {
    console.error("Error resending newsletter:", error);
    return { error: "Error resending newsletter" };
  }
}

/**
 * Unpublishes a blog post and reverts it to draft status
 * @param {string} postId - ID of the post to unpublish
 * @returns {Promise<{success?: boolean; error?: string}>} Result of the operation
 */
async function unpublishPost(postId: string) {
  const sessionClerkId = await authenticateUser();
  await requirePostOwnership(postId, sessionClerkId);
  try {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
        publishDate: new Date(),
      },
    });

    await invalidateCache("posts:*");

    return { success: true };
  } catch (error) {
    console.error("Error unpublishing post:", error);
    return { error: "Error unpublishing post" };
  }
}

/**
 * Unschedules a scheduled blog post
 * @param {FetchedPostType} postData - Post data
 * @param {string} postId - ID of the post to unschedule
 * @returns {Promise<{success?: boolean; error?: string}>} Result of the operation
 */
async function unschedulePost(postData: FetchedPostType, postId: string) {
  const sessionClerkId = await authenticateUser();
  await requirePostOwnership(postId, sessionClerkId);

  try {
    if (
      postData.contentType === ContentType.NEWSLETTER &&
      postData.broadcastIds?.length > 0
    ) {
      // Delete any existing broadcasts (skip segment: prefixed entries)
      for (const broadcastId of postData.broadcastIds) {
        if (!broadcastId.startsWith("segment:")) {
          await deleteBroadcast(broadcastId);
        }
      }
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
        broadcastIds: [],
      },
    });

    await invalidateCache("posts:*");

    return { success: true };
  } catch (error) {
    console.error("Error unscheduling post:", error);
    return { error: "Error unscheduling post" };
  }
}

export {
  createPost,
  updatePost,
  deletePost,
  restorePost,
  publishPost,
  unpublishPost,
  unschedulePost,
  resendNewsletter,
};
