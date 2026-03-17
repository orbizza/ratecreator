"use server";

import { auth } from "@clerk/nextjs/server";
import { ReviewValidator } from "@ratecreator/types/review";
import { Platform } from "@ratecreator/types/review";
import { getPrismaClient } from "@ratecreator/db/client";
import { getRedisClient } from "@ratecreator/db/redis-do";
import { revalidatePath } from "next/cache";
import { publishMessageWithKey } from "@ratecreator/db/pubsub-client";

const prisma = getPrismaClient();

const ACCOUNT_CACHE_PREFIXES: Record<string, string> = {
  YOUTUBE: "accounts-youtube-",
  TWITTER: "accounts-twitter-",
  TIKTOK: "accounts-tiktok-",
  REDDIT: "accounts-reddit-",
  INSTAGRAM: "accounts-instagram-",
};

export async function createReview(formData: unknown) {
  try {
    // Get the current user
    const { userId } = auth();
    if (!userId) {
      throw new Error("Unauthorized: You must be logged in to create a review");
    }

    // Get the user's database ID using their Clerk ID
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });

    if (!user) {
      throw new Error("User not found in database");
    }

    // Validate the form data
    const validatedData = ReviewValidator.parse(formData);

    const account = await prisma.account.findUnique({
      where: {
        platform_accountId: {
          platform: validatedData.platform.toUpperCase() as Platform,
          accountId: validatedData.accountId,
        },
      },
      select: { platform: true, id: true },
    });

    if (!account) {
      throw new Error("Account not found");
    }

    // Create the review in the database
    const review = await prisma.review.create({
      data: {
        title: validatedData.title,
        authorId: user.id,
        platform: account.platform as Platform,
        accountId: account.id,
        stars: validatedData.stars,
        status: validatedData.status,
        verificationStatus: validatedData.verificationStatus,
        content: validatedData.content,
        contentUrl: validatedData.contentUrl,
        redditMetadata:
          validatedData.platform === "REDDIT" && validatedData.redditMetadata
            ? {
                slug: validatedData.contentUrl,
                title: validatedData.redditMetadata.title,
                author: validatedData.redditMetadata.author,
                subreddit: validatedData.redditMetadata.subreddit,
              }
            : undefined,
      },
    });

    // Send message to Pub/Sub (non-blocking with timeout)
    // Fire-and-forget: don't block the response even if Pub/Sub is slow/unreachable
    const sendToPubSub = async () => {
      try {
        // Send the message with retries
        const maxRetries = 3;
        let retryCount = 0;

        while (retryCount < maxRetries) {
          try {
            await publishMessageWithKey("new-review-calculate", review.id, {
              accountId: validatedData.accountId,
              platform: validatedData.platform,
              rating: validatedData.stars,
            });
            console.log("Successfully sent message to Pub/Sub");
            break;
          } catch (error) {
            retryCount++;
            console.error(
              `Failed to send message to Pub/Sub (attempt ${retryCount}/${maxRetries}):`,
              error,
            );
            if (retryCount === maxRetries) {
              throw error;
            }
            // Wait before retrying
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * retryCount),
            );
          }
        }
      } catch (error) {
        console.error("Error sending message to Pub/Sub:", error);
        // Don't throw - Pub/Sub failures shouldn't block review creation
      }
    };

    // Wrap Pub/Sub operation with timeout to prevent hanging
    // Use Promise.race to timeout after 5 seconds
    Promise.race([
      sendToPubSub(),
      new Promise<void>((resolve) =>
        setTimeout(() => {
          console.warn(
            "Pub/Sub operation timed out after 5 seconds, continuing without blocking",
          );
          resolve();
        }, 5000),
      ),
    ]).catch((error) => {
      console.error("Pub/Sub operation failed:", error);
      // Don't throw - continue execution
    });

    // Invalidate Redis cache for this account so fresh review count shows
    try {
      const redis = getRedisClient();
      const prefix =
        ACCOUNT_CACHE_PREFIXES[validatedData.platform.toUpperCase()];
      if (prefix) {
        await redis.del(`${prefix}${validatedData.accountId}`);
      }
    } catch (cacheError) {
      console.error("Failed to invalidate account cache:", cacheError);
    }

    // Revalidate the creator's page
    revalidatePath(
      `/profile/${validatedData.platform}/${validatedData.accountId}`,
    );

    return { success: true, data: review };
  } catch (error) {
    console.error("Error creating review:", error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: "An unexpected error occurred" };
  }
}
