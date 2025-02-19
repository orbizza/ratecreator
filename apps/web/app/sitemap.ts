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
    "/about",
    "/contact",
    "/terms",
    "/privacy",
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

  const categoryRoutes = categories.map((category) => ({
    url: `${baseUrl}/category/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  // Fetch all active accounts
  const accounts = await prisma.account.findMany({
    where: {
      isSuspended: false,
      isDeleted: false,
    },
    select: {
      platform: true,
      accountId: true,
      updatedAt: true,
    },
  });

  const accountRoutes = accounts.map((account) => ({
    url: `${baseUrl}/${account.platform.toLowerCase()}/${account.accountId}`,
    lastModified: account.updatedAt,
    changeFrequency: "daily" as const,
    priority: 0.6,
  }));

  return [...routes, ...categoryRoutes, ...accountRoutes];
}
