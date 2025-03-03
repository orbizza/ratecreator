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
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const categoryGlossaryRoutes = categories.map((category) => ({
    url: `${baseUrl}/category-glossary/${category.slug}`,
    lastModified: category.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  return [...routes, ...categoryRoutes, ...categoryGlossaryRoutes];
}
