"use server";

import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  DEFAULT_EMAIL_PREFERENCES,
  type EmailPreferences,
} from "@ratecreator/email";

const prisma = getPrismaClient();

async function getDbUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) throw new Error("Unauthorized");

  const user = await prisma.user.findUnique({
    where: { clerkId },
    select: { id: true, emailPreferences: true },
  });
  if (!user) throw new Error("User not found");
  return user;
}

export async function getEmailPreferencesAction(): Promise<EmailPreferences> {
  const user = await getDbUser();
  if (!user.emailPreferences) return DEFAULT_EMAIL_PREFERENCES;
  return user.emailPreferences as unknown as EmailPreferences;
}

export async function updateEmailPreferencesAction(
  preferences: Partial<EmailPreferences>,
): Promise<EmailPreferences> {
  const user = await getDbUser();

  const current =
    (user.emailPreferences as unknown as EmailPreferences) ??
    DEFAULT_EMAIL_PREFERENCES;

  const updated: EmailPreferences = { ...current, ...preferences };

  await prisma.user.update({
    where: { id: user.id },
    data: { emailPreferences: updated as unknown as Record<string, boolean> },
  });

  return updated;
}
