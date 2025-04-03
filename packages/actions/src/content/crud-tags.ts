"use server";

import { getPrismaClient } from "@ratecreator/db/client";
import { SignedIn } from "@clerk/nextjs";
import { redirect } from "next/navigation";

// Import your validation schema
import { tagSchema, updateTagSchema } from "@ratecreator/types/content";
import { Tags } from "@ratecreator/types/content";
import { deleteFileFromBucket } from "../upload-crud";
const prisma = getPrismaClient();

async function authenticateUser() {
  const sign = await SignedIn;
  if (!sign) {
    redirect("/sign-in");
  }
}

async function fetchAllTagsFromTagOnPost() {
  try {
    const tags = await prisma.tagOnPost.findMany({
      include: {
        post: true,
        tag: true,
      },
      orderBy: {
        tag: {
          slug: "asc",
        },
      },
    });
    return tags;
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    throw new Error("Failed to fetch tags");
  }
}

async function fetchTagsFromTagOnPost({ postId }: { postId: string }) {
  try {
    const tags = await prisma.tagOnPost.findMany({
      where: {
        postId,
      },
      select: {
        tag: {
          select: {
            id: true,
            slug: true,
            description: true,
            imageUrl: true,
            posts: true,
          },
        },
      },
      orderBy: {
        tag: {
          slug: "asc",
        },
      },
    });
    return tags;
  } catch (error) {
    console.error("Failed to fetch tags:", error);
    throw new Error("Failed to fetch tags");
  }
}

async function fetchAllTagsWithPostCount(): Promise<Tags[]> {
  try {
    // console.log("Attempting to fetch tags...");
    const tags = await prisma.tag.findMany({
      include: {
        posts: true,
      },
      orderBy: {
        slug: "asc",
      },
    });

    // console.log("Tags fetched:", tags ? tags.length : 0);

    if (!tags) {
      console.log("No tags found, returning empty array");
      return [];
    }

    return tags.map((tag) => ({
      id: tag.id,
      slug: tag.slug,
      description: tag.description ?? "",
      imageUrl: tag.imageUrl ?? "",
      posts: tag.posts,
    }));
  } catch (error) {
    console.error(
      "Failed to fetch tags with post count. Error details:",
      error,
    );
    if (error instanceof Error) {
      console.error("Error name:", error.name);
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    throw new Error("Failed to fetch tags");
  }
}

interface TagIterface {
  slug: string;
  description?: string;
  imageUrl?: string;
  posts?: any[];
}

async function fetchTagDetails(slug: string) {
  try {
    const existingTag = await prisma.tag.findUnique({
      where: { slug },
    });

    if (existingTag) {
      return existingTag;
    } else {
      console.log("Tag does not exist");
      return null;
    }
  } catch (error) {
    console.error("Failed to fetch tag:", error);

    return null;
  }
}

async function createTagAction(data: TagIterface) {
  await authenticateUser();
  const validatedData = tagSchema.safeParse(data);

  if (!validatedData.success) {
    console.log("Validation error:", validatedData.error.format());
    return {
      error: validatedData.error.format(),
    };
  }

  const { slug, description, imageUrl } = validatedData.data;
  try {
    const existingTag = await prisma.tag.findUnique({
      where: { slug },
    });

    if (existingTag) {
      console.log("Tag already exists");
      return {
        error: { slug: "Slug already exists" },
      };
    }

    console.log("Data being passed to Prisma:", validatedData.data);

    console.time("DB Operation");
    const newTag = await prisma.tag.create({
      data: {
        slug,
        description,
        imageUrl,
      },
    });
    console.timeEnd("DB Operation");

    return { success: true, tag: newTag };
  } catch (error) {
    console.error("Failed to create tag:", error);
    return { error: "Failed to create tag." };
  }
}

interface UpdateTagInterface {
  id: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

async function updateTagAction(data: UpdateTagInterface) {
  await authenticateUser();
  const validatedData = updateTagSchema.safeParse(data);

  if (!validatedData.success) {
    console.log("Validation error:", validatedData.error.format());
    return { error: validatedData.error.format() };
  }

  const { id, slug, description, imageUrl } = validatedData.data;

  try {
    // Check if the slug is unique
    const existingTag = await prisma.tag.findUnique({
      where: { slug },
    });

    if (existingTag && existingTag.id !== id) {
      return { error: { slug: "Slug already exists" } };
    }

    // Update the tag in the database
    const updatedTag = await prisma.tag.update({
      where: { id },
      data: {
        slug,
        description,
        imageUrl,
      },
    });
    return updatedTag;
  } catch (error) {
    console.error("Failed to update tag:", error);
    return { error: "Failed to update tag." };
  }
}

async function deleteTagAction(slug: string) {
  await authenticateUser();
  try {
    const tag = await prisma.tag.findUnique({
      where: { slug },
    });

    if (!tag) {
      return { error: "Tag not found" };
    }

    if (tag.imageUrl) {
      await deleteFileFromBucket(tag.imageUrl);
    }

    await prisma.tag.delete({
      where: { slug },
    });

    return true;
  } catch (error) {
    console.error("Failed to delete tag:", error);
    throw new Error("Failed to delete tag");
  }
  return false;
}

export {
  fetchTagDetails,
  createTagAction,
  fetchAllTagsWithPostCount,
  updateTagAction,
  deleteTagAction,
  fetchTagsFromTagOnPost,
  fetchAllTagsFromTagOnPost,
};
