/**
 * Worker-side notification creation.
 * Uses Prisma directly (no auth guard) since workers run in a trusted context.
 */

import { getPrismaClient } from "@ratecreator/db/client";

const prisma = getPrismaClient();

export type WorkerNotificationType =
  | "SUBMISSION_APPROVED"
  | "ACCOUNT_CLAIMED"
  | "NEWSLETTER_NEW"
  | "VOTE_MILESTONE"
  | "SYSTEM";

interface WorkerNotificationInput {
  userId: string;
  type: WorkerNotificationType;
  title: string;
  message: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export async function createWorkerNotification(
  input: WorkerNotificationInput,
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
  return notification.id;
}

export async function createWorkerNotificationBatch(
  inputs: WorkerNotificationInput[],
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

  return result.count;
}
