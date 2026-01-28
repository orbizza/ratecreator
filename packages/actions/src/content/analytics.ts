"use server";

import { getPrismaClient } from "@ratecreator/db/client";

const prisma = getPrismaClient();

export interface PostsByStatus {
  status: string;
  count: number;
}

export interface PostsByPlatform {
  platform: string;
  count: number;
}

export interface SubscriberGrowth {
  month: string;
  count: number;
}

export interface TopPost {
  id: string;
  title: string;
  postUrl: string;
  publishDate: Date | null;
  contentPlatform: string;
  contentType: string;
  author: {
    id: string;
    name: string | null;
    imageUrl: string | null;
  };
}

export interface AnalyticsData {
  postsByStatus: PostsByStatus[];
  postsByPlatform: PostsByPlatform[];
  subscribersByMonth: SubscriberGrowth[];
  topPosts: TopPost[];
  totalSubscribers: number;
  activeSubscribers: number;
  totalIdeas: number;
  ideasInProgress: number;
}

export async function fetchAnalyticsData(
  contentPlatform?: "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION",
): Promise<AnalyticsData> {
  const platformFilter = contentPlatform ? { contentPlatform } : {};

  const [
    postsByStatusRaw,
    postsByPlatformRaw,
    subscribersByMonthData,
    topPosts,
    totalSubscribers,
    activeSubscribers,
    totalIdeas,
    ideasInProgress,
  ] = await Promise.all([
    prisma.post.groupBy({
      by: ["status"],
      _count: { status: true },
      where: platformFilter,
    }),
    prisma.post.groupBy({
      by: ["contentPlatform"],
      _count: { contentPlatform: true },
    }),
    fetchSubscriberGrowth(),
    prisma.post.findMany({
      where: { status: "PUBLISHED", ...platformFilter },
      take: 10,
      orderBy: { publishDate: "desc" },
      include: {
        author: true,
      },
    }),
    prisma.newsletterAudience.count(),
    prisma.newsletterAudience.count({ where: { subscribed: true } }),
    prisma.idea.count(),
    prisma.idea.count({ where: { status: "IN_PROGRESS" } }),
  ]);

  const postsByStatus = postsByStatusRaw.map((item) => ({
    status: item.status,
    count: item._count.status,
  }));

  const postsByPlatform = postsByPlatformRaw.map((item) => ({
    platform: item.contentPlatform,
    count: item._count.contentPlatform,
  }));

  return {
    postsByStatus,
    postsByPlatform,
    subscribersByMonth: subscribersByMonthData,
    topPosts: topPosts.map((p) => ({
      id: p.id,
      title: p.title,
      postUrl: p.postUrl,
      publishDate: p.publishDate,
      contentPlatform: p.contentPlatform,
      contentType: p.contentType,
      author: {
        id: p.author.id,
        name: p.author.name,
        imageUrl: p.author.imageUrl,
      },
    })),
    totalSubscribers,
    activeSubscribers,
    totalIdeas,
    ideasInProgress,
  };
}

async function fetchSubscriberGrowth(): Promise<SubscriberGrowth[]> {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const subscribers = await prisma.newsletterAudience.findMany({
    where: {
      createdAt: { gte: sixMonthsAgo },
    },
    select: {
      createdAt: true,
    },
    orderBy: {
      createdAt: "asc",
    },
  });

  const monthCounts: { [key: string]: number } = {};

  subscribers.forEach((sub) => {
    const monthKey = new Date(sub.createdAt).toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
    monthCounts[monthKey] = (monthCounts[monthKey] || 0) + 1;
  });

  return Object.entries(monthCounts).map(([month, count]) => ({
    month,
    count,
  }));
}

export async function fetchContentStats(
  contentPlatform?: "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION",
) {
  const platformFilter = contentPlatform ? { contentPlatform } : {};

  const [totalPosts, totalTags, totalNewsletters, totalBlogs, totalGlossary] =
    await Promise.all([
      prisma.post.count({ where: platformFilter }),
      prisma.tag.count(),
      prisma.post.count({
        where: { contentType: "NEWSLETTER", ...platformFilter },
      }),
      prisma.post.count({ where: { contentType: "BLOG", ...platformFilter } }),
      prisma.post.count({
        where: { contentType: "GLOSSARY", ...platformFilter },
      }),
    ]);

  return { totalPosts, totalTags, totalNewsletters, totalBlogs, totalGlossary };
}

export async function fetchIdeasStats(
  contentPlatform?: "RATECREATOR" | "CREATOROPS" | "DOCUMENTATION",
) {
  const platformFilter = contentPlatform ? { contentPlatform } : {};

  const [
    totalIdeas,
    newIdeas,
    inProgressIdeas,
    draftCreatedIdeas,
    archivedIdeas,
  ] = await Promise.all([
    prisma.idea.count({ where: platformFilter }),
    prisma.idea.count({ where: { status: "NEW", ...platformFilter } }),
    prisma.idea.count({ where: { status: "IN_PROGRESS", ...platformFilter } }),
    prisma.idea.count({
      where: { status: "DRAFT_CREATED", ...platformFilter },
    }),
    prisma.idea.count({ where: { status: "ARCHIVED", ...platformFilter } }),
  ]);

  return {
    totalIdeas,
    newIdeas,
    inProgressIdeas,
    draftCreatedIdeas,
    archivedIdeas,
  };
}
