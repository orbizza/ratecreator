"use server";

import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import { revalidatePath } from "next/cache";
import crypto from "crypto";

const prisma = getPrismaClient();

async function getDbUserId(): Promise<string> {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");
  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true },
  });
  if (!user) throw new Error("User not found");
  return user.id;
}

function generateSlug(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const hash = crypto.randomBytes(4).toString("hex");
  return `${base}-${hash}`;
}

// ── Ensure default list ──────────────────────────

export async function ensureDefaultList(userId: string): Promise<string> {
  const existing = await prisma.creatorList.findFirst({
    where: { userId, isDefault: true },
    select: { id: true },
  });

  if (existing) return existing.id;

  const list = await prisma.creatorList.create({
    data: {
      userId,
      name: "My Favorites",
      slug: generateSlug("favorites"),
      isDefault: true,
      isPublic: false,
    },
  });

  return list.id;
}

// ── CRUD ─────────────────────────────────────────

export async function createList(input: {
  name: string;
  description?: string;
  isPublic?: boolean;
}) {
  const userId = await getDbUserId();

  const list = await prisma.creatorList.create({
    data: {
      userId,
      name: input.name,
      description: input.description,
      slug: generateSlug(input.name),
      isPublic: input.isPublic ?? false,
    },
  });

  revalidatePath("/my-lists");
  return { success: true, listId: list.id, slug: list.slug };
}

export async function updateList(
  listId: string,
  input: { name?: string; description?: string; isPublic?: boolean },
) {
  const userId = await getDbUserId();

  const list = await prisma.creatorList.findFirst({
    where: { id: listId, userId },
  });
  if (!list) throw new Error("List not found");

  const updated = await prisma.creatorList.update({
    where: { id: listId },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.description !== undefined && {
        description: input.description,
      }),
      ...(input.isPublic !== undefined && { isPublic: input.isPublic }),
    },
  });

  revalidatePath("/my-lists");
  return { success: true, list: updated };
}

export async function deleteList(listId: string) {
  const userId = await getDbUserId();

  const list = await prisma.creatorList.findFirst({
    where: { id: listId, userId },
  });
  if (!list) throw new Error("List not found");
  if (list.isDefault) throw new Error("Cannot delete default list");

  // Cascade deletes items automatically (onDelete: Cascade)
  await prisma.creatorList.delete({ where: { id: listId } });

  revalidatePath("/my-lists");
  return { success: true };
}

// ── Read ─────────────────────────────────────────

export async function getUserLists() {
  const userId = await getDbUserId();

  const lists = await prisma.creatorList.findMany({
    where: { userId },
    include: {
      _count: { select: { items: true } },
      items: {
        take: 4,
        orderBy: { addedAt: "desc" },
        include: {
          account: {
            select: { imageUrl: true, name: true, platform: true },
          },
        },
      },
    },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    description: list.description,
    slug: list.slug,
    isPublic: list.isPublic,
    isDefault: list.isDefault,
    itemCount: list._count.items,
    coverImages: list.items.map((item) => ({
      imageUrl: item.account.imageUrl,
      name: item.account.name,
      platform: item.account.platform,
    })),
    updatedAt: list.updatedAt,
  }));
}

export async function getListWithItems(
  listId: string,
  options: { page?: number; limit?: number } = {},
) {
  const userId = await getDbUserId();
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const list = await prisma.creatorList.findFirst({
    where: { id: listId, userId },
    select: {
      id: true,
      name: true,
      description: true,
      slug: true,
      isPublic: true,
      isDefault: true,
    },
  });

  if (!list) throw new Error("List not found");

  const [items, total] = await Promise.all([
    prisma.creatorListItem.findMany({
      where: { listId },
      skip,
      take: limit,
      orderBy: { addedAt: "desc" },
      include: {
        account: {
          select: {
            id: true,
            platform: true,
            accountId: true,
            handle: true,
            name: true,
            imageUrl: true,
            followerCount: true,
            rating: true,
            reviewCount: true,
          },
        },
      },
    }),
    prisma.creatorListItem.count({ where: { listId } }),
  ]);

  return {
    ...list,
    items: items.map((item) => ({
      id: item.id,
      addedAt: item.addedAt,
      account: item.account,
    })),
    total,
    hasMore: skip + items.length < total,
  };
}

export async function getPublicList(slug: string) {
  const list = await prisma.creatorList.findUnique({
    where: { slug },
    include: {
      user: { select: { firstName: true, lastName: true, username: true } },
      items: {
        orderBy: { addedAt: "desc" },
        take: 50,
        include: {
          account: {
            select: {
              id: true,
              platform: true,
              accountId: true,
              handle: true,
              name: true,
              imageUrl: true,
              followerCount: true,
              rating: true,
              reviewCount: true,
            },
          },
        },
      },
      _count: { select: { items: true } },
    },
  });

  if (!list || !list.isPublic) return null;

  return {
    id: list.id,
    name: list.name,
    description: list.description,
    slug: list.slug,
    itemCount: list._count.items,
    owner: list.user,
    items: list.items.map((item) => ({
      id: item.id,
      addedAt: item.addedAt,
      account: item.account,
    })),
  };
}

// ── Item management ─────────────────────────────

export async function addToList(listId: string, accountId: string) {
  const userId = await getDbUserId();

  const list = await prisma.creatorList.findFirst({
    where: { id: listId, userId },
    select: { id: true },
  });
  if (!list) throw new Error("List not found");

  try {
    await prisma.creatorListItem.create({
      data: { listId, accountId },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("Unique constraint")) {
      return { success: true, alreadyExists: true };
    }
    throw err;
  }

  revalidatePath("/my-lists");
  return { success: true, alreadyExists: false };
}

export async function removeFromList(listId: string, accountId: string) {
  const userId = await getDbUserId();

  const list = await prisma.creatorList.findFirst({
    where: { id: listId, userId },
    select: { id: true },
  });
  if (!list) throw new Error("List not found");

  await prisma.creatorListItem.deleteMany({
    where: { listId, accountId },
  });

  revalidatePath("/my-lists");
  return { success: true };
}

export async function addToMultipleLists(accountId: string, listIds: string[]) {
  const userId = await getDbUserId();

  // Verify all lists belong to user
  const lists = await prisma.creatorList.findMany({
    where: { id: { in: listIds }, userId },
    select: { id: true },
  });
  const validListIds = new Set(lists.map((l) => l.id));

  // Get current list memberships for this account
  const currentItems = await prisma.creatorListItem.findMany({
    where: { accountId, listId: { in: listIds } },
    select: { listId: true },
  });
  const currentListIds = new Set(currentItems.map((i) => i.listId));

  // Add to new lists
  const toAdd = listIds.filter(
    (id) => validListIds.has(id) && !currentListIds.has(id),
  );
  if (toAdd.length > 0) {
    await prisma.creatorListItem.createMany({
      data: toAdd.map((listId) => ({ listId, accountId })),
    });
  }

  // Remove from lists not in the new set (for user's lists only)
  const allUserLists = await prisma.creatorList.findMany({
    where: { userId },
    select: { id: true },
  });
  const toRemove = allUserLists
    .map((l) => l.id)
    .filter((id) => !listIds.includes(id));

  if (toRemove.length > 0) {
    await prisma.creatorListItem.deleteMany({
      where: { accountId, listId: { in: toRemove } },
    });
  }

  revalidatePath("/my-lists");
  return { success: true };
}

export async function getListsForAccount(accountId: string) {
  const userId = await getDbUserId();

  const lists = await prisma.creatorList.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      isDefault: true,
      items: {
        where: { accountId },
        select: { id: true },
      },
    },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  });

  return lists.map((list) => ({
    id: list.id,
    name: list.name,
    isDefault: list.isDefault,
    hasAccount: list.items.length > 0,
  }));
}
