"use server";

import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  clearAllRead,
} from "./notification-service";

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

export async function getNotificationsAction(
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {},
) {
  const userId = await getDbUserId();
  return getNotifications(userId, options);
}

export async function getUnreadCountAction(): Promise<number> {
  const userId = await getDbUserId();
  return getUnreadCount(userId);
}

export async function markAsReadAction(
  notificationId: string,
): Promise<boolean> {
  const userId = await getDbUserId();
  return markAsRead(notificationId, userId);
}

export async function markAllAsReadAction(): Promise<number> {
  const userId = await getDbUserId();
  return markAllAsRead(userId);
}

export async function clearAllReadAction(): Promise<number> {
  const userId = await getDbUserId();
  return clearAllRead(userId);
}
