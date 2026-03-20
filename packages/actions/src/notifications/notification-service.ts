import { getPrismaClient } from "@ratecreator/db/client";

const prisma = getPrismaClient();

// Simple in-memory cache for unread counts (1 minute TTL)
const unreadCountCache = new Map<
  string,
  { count: number; expiresAt: number }
>();
const CACHE_TTL_MS = 60_000;

export type NotificationType =
  | "REVIEW_REPLY"
  | "COMMENT_REPLY"
  | "VOTE_MILESTONE"
  | "ACCOUNT_CLAIMED"
  | "ACCOUNT_SUBMITTED"
  | "SUBMISSION_APPROVED"
  | "NEWSLETTER_NEW"
  | "SYSTEM";

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  metadata: unknown;
  isRead: boolean;
  createdAt: Date;
}

export async function createNotification(
  input: CreateNotificationInput,
): Promise<string> {
  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? undefined,
    },
  });

  // Invalidate cache for this user
  unreadCountCache.delete(input.userId);

  return notification.id;
}

export async function createNotificationBatch(
  inputs: CreateNotificationInput[],
): Promise<number> {
  if (inputs.length === 0) return 0;

  const result = await prisma.notification.createMany({
    data: inputs.map((input) => ({
      userId: input.userId,
      type: input.type,
      title: input.title,
      message: input.message,
      metadata: input.metadata ?? undefined,
    })),
  });

  // Invalidate cache for all affected users
  const userIds = Array.from(new Set(inputs.map((i) => i.userId)));
  for (let i = 0; i < userIds.length; i++) {
    unreadCountCache.delete(userIds[i]);
  }

  return result.count;
}

export async function getNotifications(
  userId: string,
  options: { page?: number; limit?: number; unreadOnly?: boolean } = {},
): Promise<{
  notifications: NotificationItem[];
  total: number;
  hasMore: boolean;
}> {
  const page = options.page ?? 1;
  const limit = options.limit ?? 20;
  const skip = (page - 1) * limit;

  const where = {
    userId,
    ...(options.unreadOnly ? { isRead: false } : {}),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
      select: {
        id: true,
        type: true,
        title: true,
        message: true,
        metadata: true,
        isRead: true,
        createdAt: true,
      },
    }),
    prisma.notification.count({ where }),
  ]);

  return {
    notifications,
    total,
    hasMore: skip + notifications.length < total,
  };
}

export async function getUnreadCount(userId: string): Promise<number> {
  const cached = unreadCountCache.get(userId);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.count;
  }

  const count = await prisma.notification.count({
    where: { userId, isRead: false },
  });

  unreadCountCache.set(userId, {
    count,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  return count;
}

export async function markAsRead(
  notificationId: string,
  userId: string,
): Promise<boolean> {
  const result = await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });

  if (result.count > 0) {
    unreadCountCache.delete(userId);
  }

  return result.count > 0;
}

export async function markAllAsRead(userId: string): Promise<number> {
  const result = await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });

  unreadCountCache.delete(userId);
  return result.count;
}

export async function clearAllRead(userId: string): Promise<number> {
  const result = await prisma.notification.deleteMany({
    where: { userId, isRead: true },
  });

  return result.count;
}
