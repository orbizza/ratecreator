"use server";

import { getPrismaClient } from "@ratecreator/db/client";
import { auth, currentUser } from "@clerk/nextjs/server";
import { getInitials } from "@ratecreator/db/utils";
import { requireWriter } from "./roles";

const prisma = getPrismaClient();

export async function createAuthor() {
  const { userId } = await auth();
  if (!userId) {
    return { error: "Unauthorized" };
  }
  await requireWriter(userId);
  const user = await currentUser();

  if (!user) {
    console.error("No user found");
    return { error: "No user found" };
  }

  const email = user.emailAddresses[0]?.emailAddress || "";
  const username = user.username || "";
  const name =
    user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim();

  try {
    // Match ONLY by clerkId. Matching by email lets a fresh Clerk account
    // that registers a victim's email take over the victim's Author row
    // (and inherit every Post.authorId pointing to it).
    const existingByClerkId = await prisma.author.findUnique({
      where: { clerkId: user.id },
    });

    if (existingByClerkId) {
      const updatedAuthor = await prisma.author.update({
        where: { id: existingByClerkId.id },
        data: {
          name,
          username: existingByClerkId.username || username,
          email,
          imageUrl: user.imageUrl || "",
        },
      });
      return {
        id: updatedAuthor.id,
        clerkId: updatedAuthor.clerkId,
        name: updatedAuthor.name,
        username: updatedAuthor.username,
        email: updatedAuthor.email,
        imageUrl: updatedAuthor.imageUrl || "",
        role: updatedAuthor.role,
      };
    }

    // No existing Author for this clerkId. Make sure the email isn't already
    // owned by a different clerkId — refuse rather than silently steal.
    if (email) {
      const collision = await prisma.author.findUnique({
        where: { email },
      });
      if (collision && collision.clerkId !== user.id) {
        return {
          error:
            "An author record with this email already exists under a different account",
        };
      }
    }

    // Create new author
    const newAuthor = await prisma.author.create({
      data: {
        clerkId: user.id,
        name,
        username,
        email,
        imageUrl: user.imageUrl || "",
        role: "WRITER",
      },
    });
    return {
      id: newAuthor.id,
      clerkId: newAuthor.clerkId,
      name: newAuthor.name,
      username: newAuthor.username,
      email: newAuthor.email,
      imageUrl: newAuthor.imageUrl || "",
      role: newAuthor.role,
    };
  } catch (error) {
    console.error("Error creating author:", error);
    return { error: "Error creating author" };
  }
}
