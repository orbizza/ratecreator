"use server";

import { getPrismaClient } from "@ratecreator/db/client";
import { currentUser } from "@clerk/nextjs/server";

import { SignedIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import { getInitials } from "@ratecreator/db/utils";

const prisma = getPrismaClient();

async function authenticateUser() {
  const sign = await SignedIn;
  if (!sign) {
    redirect("/sign-in");
  }
}

export async function createAuthor() {
  await authenticateUser();
  const user = await currentUser();

  if (!user) {
    console.error("No user found");
    return { error: "No user found" };
  }

  // add author to db under try catch
  try {
    const existingAuthor = await prisma.author.findUnique({
      where: { clerkId: user.id },
    });

    if (!existingAuthor) {
      const newAuthor = await prisma.author.create({
        data: {
          clerkId: user.id,
          name:
            user.fullName ||
            `${user.firstName || ""} ${user.lastName || ""}`.trim(),
          username: user.username || "",
          email: user.emailAddresses[0]?.emailAddress || "",
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
    }
    // Return existing author
    return {
      id: existingAuthor.id,
      clerkId: existingAuthor.clerkId,
      name: existingAuthor.name,
      username: existingAuthor.username,
      email: existingAuthor.email,
      imageUrl: existingAuthor.imageUrl || "",
      role: existingAuthor.role,
    };
  } catch (error) {
    console.error("Error creating author:", error);
    return { error: "Error creating author" };
  }
}
