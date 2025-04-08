"use server";

import { auth } from "@clerk/nextjs/server";
import { ReviewValidator } from "@ratecreator/types/review";
import { Platform } from "@ratecreator/types/review";
import { getPrismaClient } from "@ratecreator/db/client";
import { revalidatePath } from "next/cache";
import {
  createTopicIfNotExists,
  getKafkaProducer,
} from "@ratecreator/db/kafka-client";

const prisma = getPrismaClient();

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

    // Send message to Kafka
    try {
      const producer = await getKafkaProducer();
      const topicName = "new-review-calculate";

      // Create topic if it doesn't exist
      //await createTopicIfNotExists(topicName);

      // Send the message with retries
      const maxRetries = 3;
      let retryCount = 0;

      while (retryCount < maxRetries) {
        try {
          await producer.send({
            topic: topicName,
            messages: [
              {
                key: review.id,
                value: JSON.stringify({
                  accountId: validatedData.accountId,
                  platform: validatedData.platform,
                  rating: validatedData.stars,
                }),
              },
            ],
          });
          console.log("Successfully sent message to Kafka");
          break;
        } catch (error) {
          retryCount++;
          console.error(
            `Failed to send message to Kafka (attempt ${retryCount}/${maxRetries}):`,
            error
          );
          if (retryCount === maxRetries) {
            throw error;
          }
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount)
          );
        }
      }
    } catch (error) {
      console.error("Error sending message to Kafka:", error);
      // Don't throw here - we want to return the review even if Kafka fails
      // The review is already saved in the database
    }

    // Revalidate the creator's page
    revalidatePath(
      `/profile/${validatedData.platform}/${validatedData.accountId}`
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
