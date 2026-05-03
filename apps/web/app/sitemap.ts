import { MetadataRoute } from "next";
import { getPrismaClient } from "@ratecreator/db/client";

// Render on demand at request time, not at build time. The sitemap reads from
// MongoDB; building used to fail any environment without DB connectivity
// (Vercel preview without Atlas allowlisting, local builds, CI without
// secrets). On-demand rendering keeps the build hermetic and re-runs the
// query each request — fine because Next caches the response per the
// `revalidate` hint below.
export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://ratecreator.com";

  // Static routes — always emitted, even if DB is unreachable.
  const routes = [
    "",
    "/categories",
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

  let categoryGlossaryRoutes: MetadataRoute.Sitemap = [];
  let profileRoutes: MetadataRoute.Sitemap = [];

  try {
    const prisma = getPrismaClient();

    const categories = await prisma.category.findMany({
      where: { deletedAt: null },
      select: { slug: true, updatedAt: true },
    });
    categoryGlossaryRoutes = categories.map((category) => ({
      url: `${baseUrl}/category-glossary/${category.slug}`,
      lastModified: category.updatedAt,
      changeFrequency: "daily" as const,
      priority: 0.7,
    }));

    // Cap to top 5000 profiles by follower count to keep the sitemap bounded.
    const topProfiles = await prisma.account.findMany({
      where: { isSuspended: false, isDeleted: false },
      orderBy: [{ followerCount: "desc" }],
      select: { platform: true, accountId: true, updatedAt: true },
      take: 5000,
    });
    profileRoutes = topProfiles.map((profile) => ({
      url: `${baseUrl}/profile/${profile.platform.toLowerCase()}/${profile.accountId}`,
      lastModified: profile.updatedAt,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch (err) {
    // Don't fail the build / request because the DB blipped. Static routes
    // still ship; dynamic routes will populate on the next successful run.
    console.error(
      "[sitemap] DB query failed, returning static routes only:",
      err,
    );
  }

  return [...routes, ...categoryGlossaryRoutes, ...profileRoutes];
}
