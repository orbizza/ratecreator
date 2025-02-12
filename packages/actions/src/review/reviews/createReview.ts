"use server";

import { auth } from "@clerk/nextjs/server";
import { ReviewValidator } from "@ratecreator/types/review";
import { Platform } from "@ratecreator/types/review";
import { getPrismaClient } from "@ratecreator/db/client";
import { revalidatePath } from "next/cache";

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

    // Create the review in the database
    const review = await prisma.review.create({
      data: {
        ...validatedData,
        authorId: user.id,
        platform: account?.platform as Platform,
        accountId: account?.id as string,
        content: validatedData.content || {},
      },
    });

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
