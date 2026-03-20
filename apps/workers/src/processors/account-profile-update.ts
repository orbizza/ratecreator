/**
 * Account Profile Update Processor
 *
 * Triggered when a verified creator edits their account details or categories.
 * Fetches the fresh account from Prisma and updates the Elasticsearch document.
 */

import { getPrismaClient } from "@ratecreator/db/client";
import {
  getElasticsearchClient,
  updateAccount,
} from "@ratecreator/db/elasticsearch-client";

const prisma = getPrismaClient();

interface ProfileUpdateEvent {
  accountId: string;
  platform: string;
  updatedFields: string[];
}

export async function processAccountProfileUpdate(
  data: ProfileUpdateEvent,
): Promise<void> {
  const { accountId } = data;

  console.log(
    `[account-profile-update] Processing update for account ${accountId}, fields: ${data.updatedFields.join(", ")}`,
  );

  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: {
      categories: {
        include: {
          category: {
            select: {
              id: true,
              name: true,
              slug: true,
              parentId: true,
            },
          },
        },
      },
    },
  });

  if (!account) {
    console.error(`[account-profile-update] Account ${accountId} not found`);
    return;
  }

  // Build ES update document
  const esDoc: Record<string, unknown> = {
    name: account.name,
    name_en: account.name_en,
    handle: account.handle,
    description: account.description,
    description_en: account.description_en,
    imageUrl: account.imageUrl,
    bannerUrl: account.bannerUrl,
    keywords: account.keywords,
    keywords_en: account.keywords_en,
    categories: account.categories.map((cm) => ({
      id: cm.category.id,
      name: cm.category.name,
      slug: cm.category.slug,
      parentId: cm.category.parentId,
    })),
    updatedAt: new Date().toISOString(),
  };

  try {
    await updateAccount(accountId, esDoc);
    console.log(`[account-profile-update] ES updated for account ${accountId}`);
  } catch (error) {
    console.error(
      `[account-profile-update] ES update failed for ${accountId}:`,
      error,
    );
    throw error;
  }
}
