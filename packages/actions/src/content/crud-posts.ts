/**
 * @fileoverview Blog post CRUD operations for Rate Creator platform
 * @module actions/content/crud-posts
 * @description Provides server actions for managing blog posts, including
 * creation, reading, updating, and deletion of posts.
 */

"use server";

import { SignedIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { getPrismaClient } from "@ratecreator/db/client";

import {
  ContentPlatform,
  ContentType,
  FetchedPostType,
  PostStatus,
  PostType,
  UpdatePostType,
} from "@ratecreator/types/content";

/**
 * Prisma client instance for database operations
 * @private
 */
const prisma = getPrismaClient();

/**
 * Authenticates the current user and redirects to sign-in if not authenticated
 * @private
 * @throws {Error} If user is not authenticated
 */
async function authenticateUser() {
  const sign = await SignedIn;
  if (!sign) {
    redirect("/sign-in");
  }
}

/**
 * Creates a new blog post
 * @param {PostType} data - Post data including title, content, and metadata
 * @returns {Promise<{post?: any; success?: boolean; error?: string}>} Result of the operation
 */
async function createPost(data: PostType) {
  await authenticateUser();
  try {
    const existingPost = await prisma.post.findUnique({
      where: { postUrl: data.postUrl },
    });

    if (existingPost) {
      console.log("Post URL already exists");
      return { error: "Post URL already exists" };
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
          connect: { id: data.author.id },
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
  await authenticateUser();
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
      console.log("Post URL already exists");
      return { error: "Post URL already exists" };
    }

    await prisma.tagOnPost.deleteMany({
      where: { postId },
    });

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
        author: {
          connect: { id: post.author.id },
        },
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
  await authenticateUser();
  try {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DELETED,
      },
    });
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
  await authenticateUser();
  try {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
      },
    });
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
 * @returns {Promise<{success?: boolean; error?: string}>} Result of the operation
 */
async function publishPost(
  postData: FetchedPostType,
  scheduleType: string,
  postId: string,
  markdown: string
) {
  let data = {};
  if (scheduleType === "later") {
    data = {
      status: PostStatus.SCHEDULED,
    };
  } else {
    data = { status: PostStatus.PUBLISHED, publishDate: new Date() };
  }

  await authenticateUser();
  try {
    await prisma.post.update({
      where: { id: postId },
      data,
    });

    // TODO: Send broadcast newsletter

    if (postData.contentType === ContentType.NEWSLETTER) {
      // await sendBroadcastNewsletter({ post, sendData: data, markdown });
    }

    return { success: true };
  } catch (error) {
    console.error("Error publishing post:", error);
    return { error: "Error publishing post" };
  }
}

/**
 * Unpublishes a blog post and reverts it to draft status
 * @param {string} postId - ID of the post to unpublish
 * @returns {Promise<{success?: boolean; error?: string}>} Result of the operation
 */
async function unpublishPost(postId: string) {
  await authenticateUser();
  try {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
        publishDate: new Date(),
      },
    });

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
  await authenticateUser();

  try {
    // TODO: Send broadcast newsletter

    if (postData.contentType === ContentType.NEWSLETTER) {
      // await deleteBroadcastNewsletter({ postData.broadcastIds });
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.DRAFT,
        broadcastIds: [],
      },
    });

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
};
