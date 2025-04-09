"use server";

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
  postStatus?: string,
) {
  return await prisma.post.count({
    where: {
      contentPlatform: platformType.toUpperCase() as ContentPlatform,
      ...(contentType &&
        contentType.toLowerCase() !== "all" && {
          contentType: contentType.toUpperCase() as ContentType,
        }),
      ...(postStatus &&
        postStatus.toLowerCase() !== "all" && {
          status: postStatus.toUpperCase() as PostStatus,
        }),
      ...(tagOption &&
        tagOption.toLowerCase() !== "all" && {
          tags: {
            some: {
              tag: {
                slug: tagOption.toLowerCase(),
              },
            },
          },
        }),
    },
  });
}

export async function fetchAllPosts(
  tagOption: string,
  pageNumber: number,
  contentType?: string,
  platformType: string = "ratecreator",
  postStatus?: string,
) {
  const pageSize = 10;
  const offset = pageNumber * pageSize;

  return (await prisma.post.findMany({
    where: {
      contentPlatform: platformType.toUpperCase() as ContentPlatform,
      ...(contentType &&
        contentType.toLowerCase() !== "all" && {
          contentType: contentType.toUpperCase() as ContentType,
        }),
      ...(postStatus &&
        postStatus.toLowerCase() !== "all" && {
          status: postStatus.toUpperCase() as PostStatus,
        }),
      ...(tagOption &&
        tagOption.toLowerCase() !== "all" && {
          tags: {
            some: {
              tag: {
                slug: tagOption.toLowerCase(),
              },
            },
          },
        }),
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
  })) as FetchedPostType[];
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
  } else if (postOption === "blogs") {
    const posts = await prisma.post.count({
      where: {
        status: "PUBLISHED",
        contentType: ContentType.BLOG,
      },
    });
    return posts;
  } else if (postOption === "glossary") {
    const posts = await prisma.post.count({
      where: {
        status: "PUBLISHED",
        contentType: ContentType.GLOSSARY,
      },
    });
    return posts;
  }
  return 0;
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
  } else if (postOption === "blogs") {
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
  } else if (postOption === "glossary") {
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        contentType: ContentType.GLOSSARY,
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
  pageNumber: number,
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
  } else if (postOption === "blogs") {
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
  } else if (postOption === "glossary") {
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        contentType: ContentType.GLOSSARY,
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

export async function fetchAllGlossaryPosts() {
  const posts = await prisma.post.findMany({
    where: {
      contentType: ContentType.GLOSSARY,
      status: "PUBLISHED",
    },
    select: {
      title: true,
      slug: true,
    },
  });
  return posts;
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

export async function fetchPostBySlug(slug: string) {
  const post = await prisma.post.findUnique({
    where: { slug },
    include: {
      tags: true,
      author: true,
    },
  });

  return post;
}
