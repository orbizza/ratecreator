/**
 * Update storage URLs in MongoDB from DO Spaces to GCS
 *
 * Replaces DO Spaces URLs with GCS URLs in Account records:
 *   https://ratecreator.nyc3.cdn.digitaloceanspaces.com/...
 *   → https://storage.googleapis.com/rc-profiles/...
 *
 * And in content-related collections (Post, Newsletter):
 *   https://ratecreator.nyc3.cdn.digitaloceanspaces.com/content/...
 *   → https://storage.googleapis.com/rc-content/...
 *
 * Usage:
 *   yarn update-storage-urls              # dry run
 *   yarn update-storage-urls -- --execute # actually update
 */

import { getMongoClient } from "@ratecreator/db/mongo-client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../../../../.env") });

const DO_BASE_URL = "https://ratecreator.nyc3.cdn.digitaloceanspaces.com";
const GCS_CONTENT_URL = "https://storage.googleapis.com/rc-content";
const GCS_PROFILES_URL = "https://storage.googleapis.com/rc-profiles";
const GCS_BANNERS_URL = "https://storage.googleapis.com/rc-banners";

// DO folder → GCS bucket URL mapping
const FOLDER_MAPPINGS: Record<string, string> = {
  "content/": GCS_CONTENT_URL + "/",
  "youtube-profile-image": GCS_PROFILES_URL + "/youtube",
  "youtube-profile-image-v2": GCS_PROFILES_URL + "/youtube",
  "twitter-profile-image": GCS_PROFILES_URL + "/twitter",
  "tiktok-profile-images": GCS_PROFILES_URL + "/tiktok",
  "instagram-profile-image": GCS_PROFILES_URL + "/instagram",
  "reddit-profile-image": GCS_PROFILES_URL + "/reddit",
  "youtube-banner-image": GCS_BANNERS_URL + "/youtube",
  "youtube-banner-image-v2": GCS_BANNERS_URL + "/youtube",
  "twitter-banner-image": GCS_BANNERS_URL + "/twitter",
};

const DRY_RUN = !process.argv.includes("--execute");

/**
 * Map a DO Spaces URL to the correct GCS bucket URL.
 * E.g. https://ratecreator.nyc3.cdn.digitaloceanspaces.com/youtube-profile-image/abc.jpg
 *    → https://storage.googleapis.com/rc-profiles/youtube/abc.jpg
 */
function mapDOUrlToGCS(
  url: string,
  defaultType: "profiles" | "banners" | "content",
): string {
  if (!url || !url.includes("digitaloceanspaces.com")) return url;

  // Extract the path after the DO base URL
  const path = url.replace(DO_BASE_URL + "/", "");

  // Check folder mappings
  for (const [doFolder, gcsBase] of Object.entries(FOLDER_MAPPINGS)) {
    if (path.startsWith(doFolder)) {
      const relativePath = path.slice(doFolder.length).replace(/^\//, "");
      return `${gcsBase}/${relativePath}`;
    }
  }

  // Fallback: use default bucket type
  const defaultUrl =
    defaultType === "profiles"
      ? GCS_PROFILES_URL
      : defaultType === "banners"
        ? GCS_BANNERS_URL
        : GCS_CONTENT_URL;
  return `${defaultUrl}/${path}`;
}

async function updateStorageUrls() {
  console.log("=".repeat(60));
  console.log("Update Storage URLs: DO Spaces → GCS");
  console.log("=".repeat(60));
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "EXECUTE"}`);
  console.log(`DO Base: ${DO_BASE_URL}`);
  console.log(`GCS Content: ${GCS_CONTENT_URL}`);
  console.log(`GCS Profiles: ${GCS_PROFILES_URL}`);
  console.log("");

  const mongoClient = await getMongoClient();
  const db = mongoClient.db("ratecreator");

  // ── Accounts: imageUrl, bannerUrl ──────────────────────────

  console.log("── Accounts ──");

  const accountsWithDO = await db.collection("Account").countDocuments({
    $or: [
      { imageUrl: { $regex: "digitaloceanspaces\\.com" } },
      { bannerUrl: { $regex: "digitaloceanspaces\\.com" } },
    ],
  });

  console.log(`  Accounts with DO Spaces URLs: ${accountsWithDO}`);

  if (!DRY_RUN && accountsWithDO > 0) {
    // Process imageUrl → rc-profiles/<platform>/
    // The DO URL contains the folder name which tells us the platform
    const imageAccounts = await db
      .collection("Account")
      .find({ imageUrl: { $regex: "digitaloceanspaces\\.com" } })
      .project({ _id: 1, imageUrl: 1 })
      .toArray();

    let imageUpdated = 0;
    for (const acc of imageAccounts) {
      const newUrl = mapDOUrlToGCS(acc.imageUrl, "profiles");
      if (newUrl !== acc.imageUrl) {
        await db
          .collection("Account")
          .updateOne({ _id: acc._id }, { $set: { imageUrl: newUrl } });
        imageUpdated++;
      }
    }
    console.log(`  Updated imageUrl: ${imageUpdated}`);

    // Process bannerUrl → rc-banners/<platform>/
    const bannerAccounts = await db
      .collection("Account")
      .find({ bannerUrl: { $regex: "digitaloceanspaces\\.com" } })
      .project({ _id: 1, bannerUrl: 1 })
      .toArray();

    let bannerUpdated = 0;
    for (const acc of bannerAccounts) {
      const newUrl = mapDOUrlToGCS(acc.bannerUrl, "banners");
      if (newUrl !== acc.bannerUrl) {
        await db
          .collection("Account")
          .updateOne({ _id: acc._id }, { $set: { bannerUrl: newUrl } });
        bannerUpdated++;
      }
    }
    console.log(`  Updated bannerUrl: ${bannerUpdated}`);
  }

  // ── Posts: content (BlockNote JSON with embedded image URLs) ──

  console.log("");
  console.log("── Posts ──");

  const postsWithDO = await db.collection("Post").countDocuments({
    $or: [
      { featureImage: { $regex: "digitaloceanspaces\\.com" } },
      { metaImage: { $regex: "digitaloceanspaces\\.com" } },
      { content: { $regex: "digitaloceanspaces\\.com" } },
    ],
  });

  console.log(`  Posts with DO Spaces URLs: ${postsWithDO}`);

  if (!DRY_RUN && postsWithDO > 0) {
    // Feature images and meta images → rc-content
    for (const field of ["featureImage", "metaImage"]) {
      const result = await db
        .collection("Post")
        .updateMany({ [field]: { $regex: "digitaloceanspaces\\.com" } }, [
          {
            $set: {
              [field]: {
                $replaceAll: {
                  input: `$${field}`,
                  find: DO_BASE_URL,
                  replacement: GCS_CONTENT_URL,
                },
              },
            },
          },
        ]);
      console.log(`  Updated ${field}: ${result.modifiedCount}`);
    }

    // Content field (stringified JSON) — replace DO URLs
    const postsToUpdate = await db
      .collection("Post")
      .find({ content: { $regex: "digitaloceanspaces\\.com" } })
      .toArray();

    let contentUpdated = 0;
    for (const post of postsToUpdate) {
      if (typeof post.content === "string") {
        const updated = post.content.replaceAll(DO_BASE_URL, GCS_CONTENT_URL);
        if (updated !== post.content) {
          await db
            .collection("Post")
            .updateOne({ _id: post._id }, { $set: { content: updated } });
          contentUpdated++;
        }
      }
    }
    console.log(`  Updated content field: ${contentUpdated}`);
  }

  // ── Categories: any image URLs ──

  console.log("");
  console.log("── Categories ──");

  const catsWithDO = await db.collection("Category").countDocuments({
    imageUrl: { $regex: "digitaloceanspaces\\.com" },
  });

  console.log(`  Categories with DO Spaces URLs: ${catsWithDO}`);

  if (!DRY_RUN && catsWithDO > 0) {
    const result = await db
      .collection("Category")
      .updateMany({ imageUrl: { $regex: "digitaloceanspaces\\.com" } }, [
        {
          $set: {
            imageUrl: {
              $replaceAll: {
                input: "$imageUrl",
                find: DO_BASE_URL,
                replacement: GCS_CONTENT_URL,
              },
            },
          },
        },
      ]);
    console.log(`  Updated: ${result.modifiedCount}`);
  }

  // ── Summary ──

  console.log("");
  console.log("=".repeat(60));
  if (DRY_RUN) {
    console.log("DRY RUN complete. Run with --execute to update the database.");
    console.log("  yarn update-storage-urls -- --execute");
  } else {
    console.log("URL migration complete.");
    console.log("After verifying, you can set STORAGE_PROVIDER=gcs in .env");
  }

  process.exit(0);
}

updateStorageUrls().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
