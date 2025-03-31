"use server";

import { SignedIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { Prisma } from "@prisma/client";
import { PostStatus as PrismaPostStatus } from "@prisma/client";

import { getPrismaClient } from "@ratecreator/db/client";
import { PostType, PostStatus, ContentType } from "@ratecreator/types/content";
import { splitAndCapitalize } from "@ratecreator/db/utils";

const prisma = getPrismaClient();

export async function fetchAllPostsCount(
  postOption: string,
  tagOption: string
) {
  // modify for based on postOption and tagOption
  if (postOption === "all-posts") {
    const posts = await prisma.post.count();
    return posts;
  } else if (postOption === "featured-posts") {
    const posts = await prisma.post.count({
      where: {
        isFeatured: true,
      },
    });
    return posts;
  } else if (postOption === "newsletters") {
    const posts = await prisma.post.count({
      where: {
        contentType: ContentType.NEWSLETTER,
      },
    });
    return posts;
  } else if (postOption === "articles") {
    const posts = await prisma.post.count({
      where: {
        status: "PUBLISHED",
        contentType: ContentType.BLOG,
      },
    });
    return posts;
  } else {
    const posts = await prisma.post.count({
      where: {
        status: {
          equals: splitAndCapitalize(postOption) as PrismaPostStatus,
        },
      },
    });
    return posts;
  }
}

export async function fetchPublishedPostsCount(postOption: string) {
  // modify for based on postOption and tagOption
  if (postOption === "all-posts") {
    const posts = await prisma.post.count();
    return posts;
  } else if (postOption === "featured-posts") {
    const posts = await prisma.post.count({
      where: {
        isFeatured: true,
        status: "PUBLISHED",
      },
    });
    return posts;
  } else if (postOption === "newsletters") {
    const posts = await prisma.post.count({
      where: {
        contentType: ContentType.NEWSLETTER,
        status: "PUBLISHED",
      },
    });
    return posts;
  } else if (postOption === "articles") {
    const posts = await prisma.post.count({
      where: {
        status: "PUBLISHED",
        contentType: ContentType.BLOG,
      },
    });
    return posts;
  }
  return 0;
}

export async function fetchAllPosts(
  postOption: string,
  tagOption: string,
  pageNumber: number
) {
  const pageSize = 10;
  const offset = pageNumber * pageSize;

  if (postOption === "all-posts") {
    const posts = await prisma.post.findMany({
      skip: offset,
      take: pageSize,
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    return posts as PostType[];
  } else if (postOption === "featured-posts") {
    const posts = await prisma.post.findMany({
      where: {
        isFeatured: true,
      },
      skip: offset,
      take: pageSize,
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    return posts as PostType[];
  } else if (postOption === "newsletters") {
    const posts = await prisma.post.findMany({
      where: {
        contentType: ContentType.NEWSLETTER,
      },
      skip: offset,
      take: pageSize,
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    return posts as PostType[];
  } else if (postOption === "articles") {
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        contentType: ContentType.BLOG,
      },
      skip: offset,
      take: pageSize,
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });
    return posts as PostType[];
  } else {
    const posts = await prisma.post.findMany({
      where: {
        status: {
          equals: splitAndCapitalize(postOption) as PrismaPostStatus,
        },
      },
      skip: offset,
      take: pageSize,
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    return posts as PostType[];
  }
}

export async function fetchPublishedPosts(postOption: string) {
  if (postOption === "featured-posts") {
    const posts = await prisma.post.findMany({
      where: {
        isFeatured: true,
        status: "PUBLISHED",
        contentType: ContentType.BLOG,
      },
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    return posts as PostType[];
  } else if (postOption === "newsletters") {
    const posts = await prisma.post.findMany({
      where: {
        contentType: ContentType.NEWSLETTER,
        status: "PUBLISHED",
      },
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    return posts as PostType[];
  } else if (postOption === "articles") {
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        contentType: ContentType.BLOG,
      },
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });
    return posts as PostType[];
  }
  return [];
}
export async function fetchPublishedPostsPaginated(
  postOption: string,
  pageNumber: number
) {
  const pageSize = 10;
  const offset = pageNumber * pageSize;

  if (postOption === "featured-posts") {
    const posts = await prisma.post.findMany({
      where: {
        isFeatured: true,
        status: "PUBLISHED",
      },
      skip: offset,
      take: pageSize,
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    return posts as PostType[];
  } else if (postOption === "newsletters") {
    const posts = await prisma.post.findMany({
      where: {
        contentType: ContentType.NEWSLETTER,
        status: "PUBLISHED",
      },
      skip: offset,
      take: pageSize,
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });

    return posts as PostType[];
  } else if (postOption === "articles") {
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        contentType: ContentType.BLOG,
      },
      skip: offset,
      take: pageSize,
      include: {
        tags: true,
        author: true,
      },
      orderBy: {
        publishDate: "desc",
      },
    });
    return posts as PostType[];
  }
  return [];
}

export async function fetchPostById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    include: {
      tags: true,
      author: true,
    },
  });

  return post;
}

export async function fetchPostByPostUrl(postUrl: string) {
  const post = await prisma.post.findUnique({
    where: { postUrl },
    include: {
      tags: true,
      author: true,
    },
  });

  return post;
}
