import { MetadataRoute } from "next";
import { getPrismaClient } from "@ratecreator/db/client";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Base URL of your website
  const baseUrl = "https://ratecreator.com";
  const prisma = getPrismaClient();

  // Static routes
  const routes = [
    "",
    "/categories",
    // "/about",
    "/contact",
    "/terms",
    "/privacy",
    "/cookie-policy",
    "/category-glossary",
    "/search",
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: "daily" as const,
    priority: route === "" ? 1 : 0.8,
  }));

  // Fetch all categories
  const categories = await prisma.category.findMany({
    where: {
      deletedAt: null,
    },
    select: {
      slug: true,
      updatedAt: true,
    },
  });

  // const categoryRoutes = categories.map((category) => ({
  //   url: `${baseUrl}/categories/${category.slug}`,
  //   lastModified: category.updatedAt,
  //   changeFrequency: "daily" as const,
  //   priority: 0.6,
  // }));

  const categoryGlossaryRoutes = categories.map((category) => ({
    url: `${baseUrl}/category-glossary/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.7,
  }));

  // For profile routes, we'll only include a subset of the most important ones
  // This prevents timeout issues with 3M records
  const topProfiles = await prisma.account.findMany({
    where: {
      isSuspended: false,
    },
    orderBy: [{ followerCount: "desc" }],
    select: {
      platform: true,
      accountId: true,
      updatedAt: true,
    },
    take: 5000, // Limit to top 5000 profiles by review count and follower count
  });

  const profileRoutes = topProfiles.map((profile) => ({
    url: `${baseUrl}/profile/${profile.platform.toLowerCase()}/${profile.accountId}`,
    lastModified: profile.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...routes, ...categoryGlossaryRoutes, ...profileRoutes];
}
