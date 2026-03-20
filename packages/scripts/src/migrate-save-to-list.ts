/**
 * Migrate SaveToMyList → CreatorList + CreatorListItem
 *
 * Creates a default "My Favorites" list per user, then migrates
 * all existing SaveToMyList entries into CreatorListItem rows.
 *
 * Safe to re-run — skips users that already have a default list.
 *
 * Usage:
 *   npx tsx packages/scripts/src/migrate-save-to-list.ts
 */

import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const prisma = new PrismaClient();

function generateSlug(userId: string): string {
  const hash = crypto.randomBytes(4).toString("hex");
  return `favorites-${userId.slice(-6)}-${hash}`;
}

async function migrate() {
  console.log("Starting SaveToMyList → CreatorList migration...");

  // Get all unique users with saved items
  const savedItems = await prisma.saveToMyList.findMany({
    select: { userId: true, accountId: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  // Group by userId
  const userItems = new Map<
    string,
    Array<{ accountId: string; createdAt: Date }>
  >();
  for (const item of savedItems) {
    const existing = userItems.get(item.userId) || [];
    existing.push({ accountId: item.accountId, createdAt: item.createdAt });
    userItems.set(item.userId, existing);
  }

  console.log(
    `Found ${savedItems.length} saved items across ${userItems.size} users`,
  );

  let migratedUsers = 0;
  let migratedItems = 0;
  let skippedUsers = 0;

  for (const [userId, items] of userItems) {
    // Check if user already has a default list
    const existingDefault = await prisma.creatorList.findFirst({
      where: { userId, isDefault: true },
    });

    if (existingDefault) {
      skippedUsers++;
      continue;
    }

    // Create default list
    const list = await prisma.creatorList.create({
      data: {
        userId,
        name: "My Favorites",
        slug: generateSlug(userId),
        isDefault: true,
        isPublic: false,
      },
    });

    // Create list items
    for (const item of items) {
      try {
        await prisma.creatorListItem.create({
          data: {
            listId: list.id,
            accountId: item.accountId,
            addedAt: item.createdAt,
          },
        });
        migratedItems++;
      } catch (err: unknown) {
        // Skip duplicates
        const message = err instanceof Error ? err.message : String(err);
        if (message.includes("Unique constraint")) {
          continue;
        }
        throw err;
      }
    }

    migratedUsers++;

    if (migratedUsers % 100 === 0) {
      console.log(
        `Progress: ${migratedUsers} users migrated, ${migratedItems} items`,
      );
    }
  }

  console.log(`
Migration complete:
  Users migrated:  ${migratedUsers}
  Users skipped:   ${skippedUsers}
  Items migrated:  ${migratedItems}
  `);
}

migrate()
  .catch((err) => {
    console.error("Migration failed:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
