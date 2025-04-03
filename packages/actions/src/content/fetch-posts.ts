"use server";

import { Prisma } from "@prisma/client";

import { getPrismaClient } from "@ratecreator/db/client";
import {
  ContentType,
  FetchedPostType,
  PostStatus,
  ContentPlatform,
} from "@ratecreator/types/content";

const prisma = getPrismaClient();

export async function fetchAllPostsCount(
  tagOption?: string,
  contentType?: string,
  platformType: string = "ratecreator",
  postStatus?: string
) {
  // Base where clause with platform type
  const baseWhere: Prisma.PostWhereInput = {
    contentPlatform: platformType.toUpperCase() as ContentPlatform,
  };

  // Add content type filter if specified and not "all"
  if (contentType && contentType.toLowerCase() !== "all") {
    baseWhere.contentType = contentType.toUpperCase() as ContentType;
  }

  if (postStatus && postStatus.toLowerCase() !== "all") {
    baseWhere.status = postStatus.toUpperCase() as PostStatus;
  }

  // Add tag filter if specified
  if (tagOption && tagOption.toLowerCase() !== "all") {
    baseWhere.tags = {
      some: {
        tag: {
          slug: tagOption.toLowerCase(),
        },
      },
    };
  }

  return await prisma.post.count({
    where: baseWhere,
  });
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
  tagOption: string,
  pageNumber: number,
  contentType?: string,
  platformType: string = "ratecreator",
  postStatus?: string
) {
  const pageSize = 10;
  const offset = pageNumber * pageSize;

  // Base where clause with platform type
  const baseWhere: Prisma.PostWhereInput = {
    contentPlatform: platformType.toUpperCase() as ContentPlatform,
  };

  // Add content type filter if specified and not "all"
  if (contentType && contentType.toLowerCase() !== "all") {
    baseWhere.contentType = contentType.toUpperCase() as ContentType;
  }

  if (postStatus && postStatus.toLowerCase() !== "all") {
    baseWhere.status = postStatus.toUpperCase() as PostStatus;
  }

  // Add tag filter if specified
  if (tagOption && tagOption.toLowerCase() !== "all") {
    baseWhere.tags = {
      some: {
        tag: {
          slug: tagOption.toLowerCase(),
        },
      },
    };
  }

  const posts = await prisma.post.findMany({
    where: baseWhere,
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

  return posts as FetchedPostType[];
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

    return posts as FetchedPostType[];
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

    return posts as FetchedPostType[];
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
    return posts as FetchedPostType[];
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

    return posts as FetchedPostType[];
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

    return posts as FetchedPostType[];
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
    return posts as FetchedPostType[];
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
  if (!post) {
    return null;
  }

  return post as FetchedPostType;
}

export async function fetchPostTitleById(id: string) {
  const post = await prisma.post.findUnique({
    where: { id },
    select: {
      title: true,
    },
  });
  if (!post) {
    return null;
  }

  return post.title;
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
