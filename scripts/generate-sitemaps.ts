import fs from "fs";
import path from "path";
import { getPrismaClient } from "@ratecreator/db/client";

async function generateSitemaps() {
  const prisma = getPrismaClient();
  const baseUrl = "https://ratecreator.com";
  const outputDir = path.join(process.cwd(), "public");

  // Ensure output directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Count total profiles
  const totalProfiles = await prisma.account.count({
    where: {
      isSuspended: false,
    },
  });

  console.log(`Total profiles: ${totalProfiles}`);

  // Define chunk size
  const CHUNK_SIZE = 10000;
  const totalChunks = Math.ceil(totalProfiles / CHUNK_SIZE);

  console.log(`Generating ${totalChunks} sitemap files...`);

  // Generate sitemap index
  const sitemapIndex = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>${baseUrl}/sitemap.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>
${Array.from({ length: totalChunks })
  .map(
    (_, i) => `  <sitemap>
    <loc>${baseUrl}/sitemap-profiles-${i}.xml</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
  </sitemap>`
  )
  .join("\n")}
</sitemapindex>`;

  fs.writeFileSync(path.join(outputDir, "sitemap-index.xml"), sitemapIndex);
  console.log("Generated sitemap index");

  // Generate profile sitemaps in chunks
  for (let chunk = 0; chunk < totalChunks; chunk++) {
    console.log(`Generating sitemap chunk ${chunk + 1}/${totalChunks}...`);

    const profiles = await prisma.account.findMany({
      where: {
        isSuspended: false,
      },
      select: {
        platform: true,
        accountId: true,
        updatedAt: true,
      },
      orderBy: [{ followerCount: "desc" }],
      take: CHUNK_SIZE,
      skip: chunk * CHUNK_SIZE,
    });

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${profiles
  .map(
    (profile) => `  <url>
    <loc>${baseUrl}/profile/${profile.platform.toLowerCase()}/${profile.accountId}</loc>
    <lastmod>${profile.updatedAt.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

    fs.writeFileSync(
      path.join(outputDir, `sitemap-profiles-${chunk}.xml`),
      sitemap
    );
  }

  console.log("All sitemaps generated successfully!");
}

// Run the script
generateSitemaps()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error generating sitemaps:", error);
    process.exit(1);
  });
