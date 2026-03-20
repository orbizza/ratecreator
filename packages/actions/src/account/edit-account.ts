"use server";

import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  publishMessageWithKey,
  PUBSUB_TOPICS,
} from "@ratecreator/db/pubsub-client";
import { revalidatePath } from "next/cache";

const prisma = getPrismaClient();

async function getVerifiedOwner(accountId: string) {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) throw new Error("User not found");

  const claim = await prisma.claimedAccount.findFirst({
    where: {
      userId: user.id,
      accountId,
      status: "VERIFIED",
    },
  });

  if (!claim) {
    throw new Error("You must have a verified claim to edit this account");
  }

  return user;
}

export async function updateAccountDetails(
  accountId: string,
  data: {
    name?: string;
    description?: string;
    imageUrl?: string;
  },
) {
  await getVerifiedOwner(accountId);

  const account = await prisma.account.update({
    where: { id: accountId },
    data: {
      ...(data.name !== undefined && { name: data.name }),
      ...(data.description !== undefined && { description: data.description }),
      ...(data.imageUrl !== undefined && { imageUrl: data.imageUrl }),
    },
    select: { id: true, platform: true, accountId: true },
  });

  // Publish profile update event for ES sync
  try {
    await Promise.race([
      publishMessageWithKey(PUBSUB_TOPICS.ACCOUNT_PROFILE_UPDATED, account.id, {
        accountId: account.id,
        platform: account.platform,
        updatedFields: Object.keys(data),
      }),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Pub/Sub timeout")), 5000),
      ),
    ]);
  } catch (err) {
    console.warn("Pub/Sub publish failed for profile update:", err);
  }

  revalidatePath(
    `/profile/${account.platform.toLowerCase()}/${account.accountId}`,
  );

  return { success: true };
}

export async function updateAccountCategories(
  accountId: string,
  categoryIds: string[],
) {
  await getVerifiedOwner(accountId);

  // Delete existing mappings
  await prisma.categoryMapping.deleteMany({
    where: { accountId },
  });

  // Create new mappings
  if (categoryIds.length > 0) {
    await prisma.categoryMapping.createMany({
      data: categoryIds.map((categoryId) => ({
        accountId,
        categoryId,
      })),
    });
  }

  // Trigger ES sync
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    select: { id: true, platform: true, accountId: true },
  });

  if (account) {
    try {
      await Promise.race([
        publishMessageWithKey(
          PUBSUB_TOPICS.ACCOUNT_PROFILE_UPDATED,
          account.id,
          {
            accountId: account.id,
            platform: account.platform,
            updatedFields: ["categories"],
          },
        ),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error("Pub/Sub timeout")), 5000),
        ),
      ]);
    } catch (err) {
      console.warn("Pub/Sub publish failed for category update:", err);
    }

    revalidatePath(
      `/profile/${account.platform.toLowerCase()}/${account.accountId}`,
    );
  }

  return { success: true };
}
