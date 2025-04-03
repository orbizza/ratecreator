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

const prisma = getPrismaClient();

async function authenticateUser() {
  const sign = await SignedIn;
  if (!sign) {
    redirect("/sign-in");
  }
}

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

async function publishPost(
  postData: FetchedPostType,
  finalTime: Date,
  scheduleType: string,
  postId: string
) {
  // let data = {};
  // if (postData.status === PostStatus.SCHEDULED) {
  //   data = {
  //     status: PostStatus.PUBLISHED,
  //     publishDate: postData.publishDate,
  //   };
  // } else {
  //   data = { status: PostStatus.PUBLISHED };
  // }

  await authenticateUser();
  try {
    await prisma.post.update({
      where: { id: postId },
      data: {
        status: PostStatus.PUBLISHED,
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Error publishing post:", error);
    return { error: "Error publishing post" };
  }
}

export { createPost, updatePost, deletePost, restorePost, publishPost };
