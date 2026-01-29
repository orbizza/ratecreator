"use server";

import { getPrismaClient } from "@ratecreator/db/client";
import {
  getKafkaProducer,
  createTopicIfNotExists,
} from "@ratecreator/db/kafka-client";

type Platform =
  | "youtube"
  | "twitter"
  | "instagram"
  | "reddit"
  | "tiktok"
  | "twitch";

interface AddAccountInput {
  platform: Platform;
  identifier: string; // URL or username
  addedByUserId?: string;
}

interface AddAccountResult {
  success: boolean;
  accountId?: string;
  error?: string;
  isExisting?: boolean;
}

// Parse identifier to extract platform-specific ID
function parseIdentifier(platform: Platform, identifier: string): string {
  let handle = identifier.trim();

  // Remove URL prefix if present
  const urlPatterns: Record<Platform, RegExp[]> = {
    youtube: [
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/(?:channel\/|c\/|user\/|@)([^\/\?]+)/,
      /(?:https?:\/\/)?(?:www\.)?youtube\.com\/([^\/\?]+)/,
    ],
    twitter: [
      /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/(@?[^\/\?]+)/,
    ],
    instagram: [/(?:https?:\/\/)?(?:www\.)?instagram\.com\/(@?[^\/\?]+)/],
    reddit: [/(?:https?:\/\/)?(?:www\.)?reddit\.com\/(?:user|u)\/([^\/\?]+)/],
    tiktok: [/(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([^\/\?]+)/],
    twitch: [/(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([^\/\?]+)/],
  };

  for (const pattern of urlPatterns[platform]) {
    const match = handle.match(pattern);
    if (match && match[1]) {
      handle = match[1];
      break;
    }
  }

  // Clean up handle
  handle = handle.replace(/^@/, "").replace(/^u\//, "");

  return handle;
}

// Map platform string to Prisma enum
function platformToEnum(
  platform: Platform,
): "YOUTUBE" | "TWITTER" | "INSTAGRAM" | "REDDIT" | "TIKTOK" | "TWITCH" {
  const mapping: Record<
    Platform,
    "YOUTUBE" | "TWITTER" | "INSTAGRAM" | "REDDIT" | "TIKTOK" | "TWITCH"
  > = {
    youtube: "YOUTUBE",
    twitter: "TWITTER",
    instagram: "INSTAGRAM",
    reddit: "REDDIT",
    tiktok: "TIKTOK",
    twitch: "TWITCH",
  };
  return mapping[platform];
}

export async function addAccount(
  input: AddAccountInput,
): Promise<AddAccountResult> {
  const { platform, identifier, addedByUserId } = input;

  try {
    const prisma = getPrismaClient();
    const platformAccountId = parseIdentifier(platform, identifier);
    const platformEnum = platformToEnum(platform);

    // Check if account already exists
    const existingAccount = await prisma.account.findFirst({
      where: {
        platform: platformEnum,
        OR: [{ accountId: platformAccountId }, { handle: platformAccountId }],
      },
    });

    if (existingAccount) {
      return {
        success: true,
        accountId: existingAccount.id,
        isExisting: true,
      };
    }

    // Create new account
    const newAccount = await prisma.account.create({
      data: {
        platform: platformEnum,
        accountId: platformAccountId,
        handle: platformAccountId,
        isSeeded: false,
        isDeleted: false,
      },
    });

    // Send event to Kafka for data fetch
    try {
      const producer = await getKafkaProducer();
      const topicName = "account-added";
      await createTopicIfNotExists(topicName);

      await producer.send({
        topic: topicName,
        messages: [
          {
            key: newAccount.id,
            value: JSON.stringify({
              accountId: newAccount.id,
              platform: platformEnum,
              platformAccountId,
              addedByUserId,
              timestamp: new Date().toISOString(),
            }),
          },
        ],
      });
    } catch (kafkaError) {
      console.error("Failed to send Kafka event:", kafkaError);
      // Don't fail the operation, the account is created
    }

    return {
      success: true,
      accountId: newAccount.id,
      isExisting: false,
    };
  } catch (error) {
    console.error("Error adding account:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to add account",
    };
  }
}
