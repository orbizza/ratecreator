"use server";

import { getPrismaClient } from "@ratecreator/db/client";

const prisma = getPrismaClient();

export interface DashboardStats {
  totalPosts: number;
  drafts: number;
  published: number;
  scheduled: number;
  newsletters: number;
  members: number;
  totalIdeas: number;
  newIdeas: number;
  ideasInProgress: number;
}

export interface PostListType {
  id: string;
  title: string;
  status: string;
  contentType: string;
  contentPlatform: string;
  publishDate: Date | null;
  updatedAt: Date;
  author: {
    id: string;
    name: string | null;
    imageUrl: string | null;
  };
}

export async function fetchDashboardStats(
  contentPlatform?: "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION",
): Promise<DashboardStats> {
  const platformFilter = contentPlatform ? { contentPlatform } : {};

  const [
    totalPosts,
    drafts,
    published,
    scheduled,
    newsletters,
    members,
    totalIdeas,
    newIdeas,
    ideasInProgress,
  ] = await Promise.all([
    prisma.post.count({ where: platformFilter }),
    prisma.post.count({ where: { status: "DRAFT", ...platformFilter } }),
    prisma.post.count({ where: { status: "PUBLISHED", ...platformFilter } }),
    prisma.post.count({ where: { status: "SCHEDULED", ...platformFilter } }),
    prisma.post.count({
      where: { contentType: "NEWSLETTER", ...platformFilter },
    }),
    prisma.newsletterAudience.count({ where: { subscribed: true } }),
    prisma.idea.count({ where: contentPlatform ? { contentPlatform } : {} }),
    prisma.idea.count({
      where: { status: "NEW", ...(contentPlatform ? { contentPlatform } : {}) },
    }),
    prisma.idea.count({
      where: {
        status: "IN_PROGRESS",
        ...(contentPlatform ? { contentPlatform } : {}),
      },
    }),
  ]);

  return {
    totalPosts,
    drafts,
    published,
    scheduled,
    newsletters,
    members,
    totalIdeas,
    newIdeas,
    ideasInProgress,
  };
}

export async function fetchRecentPosts(
  limit: number = 5,
  contentPlatform?: "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION",
): Promise<PostListType[]> {
  const platformFilter = contentPlatform ? { contentPlatform } : {};

  const posts = await prisma.post.findMany({
    where: platformFilter,
    take: limit,
    orderBy: { updatedAt: "desc" },
    include: {
      author: true,
    },
  });

  return posts.map((p) => ({
    id: p.id,
    title: p.title,
    status: p.status,
    contentType: p.contentType,
    contentPlatform: p.contentPlatform,
    publishDate: p.publishDate,
    updatedAt: p.updatedAt,
    author: {
      id: p.author.id,
      name: p.author.name,
      imageUrl: p.author.imageUrl,
    },
  }));
}
