"use server";

import { auth } from "@clerk/nextjs/server";
import { getRedisClient } from "@ratecreator/db/redis-do";

const PLATFORM_PREF_PREFIX = "user:platform:";

export async function saveContentPlatformPreference(
  platform: string,
): Promise<{ success: boolean }> {
  const { userId } = await auth();
  if (!userId) return { success: false };
  try {
    const redis = getRedisClient();
    await redis.set(`${PLATFORM_PREF_PREFIX}${userId}`, platform);
    return { success: true };
  } catch (error) {
    console.error("Error saving platform preference:", error);
    return { success: false };
  }
}

export async function getContentPlatformPreference(): Promise<string | null> {
  const { userId } = await auth();
  if (!userId) return null;
  try {
    const redis = getRedisClient();
    return await redis.get(`${PLATFORM_PREF_PREFIX}${userId}`);
  } catch (error) {
    console.error("Error getting platform preference:", error);
    return null;
  }
}

export async function deleteContentPlatformPreference(): Promise<{
  success: boolean;
}> {
  const { userId } = await auth();
  if (!userId) return { success: false };
  try {
    const redis = getRedisClient();
    await redis.del(`${PLATFORM_PREF_PREFIX}${userId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting platform preference:", error);
    return { success: false };
  }
}
