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

  const email = user.emailAddresses[0]?.emailAddress || "";
  const username = user.username || "";
  const name =
    user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim();

  try {
    // Check by clerkId first, then by email to avoid P2002 unique constraint
    const existingAuthor = await prisma.author.findFirst({
      where: {
        OR: [{ clerkId: user.id }, ...(email ? [{ email }] : [])],
      },
    });

    if (existingAuthor) {
      // Update existing author's clerkId and details if needed
      const updatedAuthor = await prisma.author.update({
        where: { id: existingAuthor.id },
        data: {
          clerkId: user.id,
          name,
          username:
            existingAuthor.username && existingAuthor.clerkId !== user.id
              ? existingAuthor.username
              : username,
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
