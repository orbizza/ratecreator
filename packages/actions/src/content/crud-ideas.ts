"use server";

import { getPrismaClient } from "@ratecreator/db/client";

const prisma = getPrismaClient();

export type IdeaStatus = "NEW" | "IN_PROGRESS" | "DRAFT_CREATED" | "ARCHIVED";
export type IdeaStage = "ROUGH_IDEA" | "OUTLINE" | "SCRIPT" | "READY";
export type ContentPlatformType =
  | "RATECREATOR"
  | "CREATOROPS"
  | "UNITY"
  | "DOCUMENTATION";

export interface IdeaType {
  id: string;
  title: string;
  description: string | null;
  topics: string[];
  status: IdeaStatus;
  currentStage: IdeaStage;
  contentPlatform: ContentPlatformType;
  generatedOutline: string | null;
  outlineContent: string | null;
  scriptContent: string | null;
  targetDate: Date | null;
  createdPostId: string | null;
  authorId: string;
  createdAt: Date;
  updatedAt: Date;
  author?: {
    id: string;
    name: string | null;
    email: string;
    imageUrl: string | null;
  };
}

export interface IdeaInput {
  title: string;
  description?: string;
  topics?: string[];
  targetDate?: Date | null;
  authorId: string;
  contentPlatform?: ContentPlatformType;
}

export async function createIdea(data: IdeaInput): Promise<IdeaType> {
  const idea = await prisma.idea.create({
    data: {
      title: data.title,
      description: data.description || null,
      topics: data.topics || [],
      targetDate: data.targetDate || null,
      authorId: data.authorId,
      contentPlatform: data.contentPlatform || "RATECREATOR",
      status: "NEW",
    },
    include: {
      author: true,
    },
  });

  return idea as IdeaType;
}

export async function fetchIdeas(
  status?: IdeaStatus,
  contentPlatform?: ContentPlatformType,
): Promise<IdeaType[]> {
  const where: { status?: IdeaStatus; contentPlatform?: ContentPlatformType } =
    {};
  if (status) where.status = status;
  if (contentPlatform) where.contentPlatform = contentPlatform;

  const ideas = await prisma.idea.findMany({
    where,
    include: {
      author: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return ideas as IdeaType[];
}

export async function fetchIdeaById(id: string): Promise<IdeaType | null> {
  const idea = await prisma.idea.findUnique({
    where: { id },
    include: {
      author: true,
    },
  });

  return idea as IdeaType | null;
}

export async function updateIdea(
  id: string,
  data: Partial<{
    title: string;
    description: string;
    topics: string[];
    status: IdeaStatus;
    currentStage: IdeaStage;
    generatedOutline: string;
    outlineContent: string;
    scriptContent: string;
    targetDate: Date | null;
  }>,
): Promise<IdeaType> {
  const idea = await prisma.idea.update({
    where: { id },
    data,
    include: {
      author: true,
    },
  });

  return idea as IdeaType;
}

export async function deleteIdea(id: string): Promise<void> {
  await prisma.idea.delete({
    where: { id },
  });
}

export async function convertIdeaToDraft(
  ideaId: string,
  outline: string,
  authorId: string,
  contentPlatform:
    | "RATECREATOR"
    | "CREATOROPS"
    | "DOCUMENTATION" = "RATECREATOR",
  contentType: "BLOG" | "GLOSSARY" | "NEWSLETTER" = "BLOG",
): Promise<{ postId: string }> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
  });

  if (!idea) {
    throw new Error("Idea not found");
  }

  const postUrl = idea.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .substring(0, 100);

  const uniquePostUrl = `${postUrl}-${Date.now()}`;

  const post = await prisma.post.create({
    data: {
      title: idea.title,
      content: outline,
      postUrl: uniquePostUrl,
      authorId: authorId,
      status: "DRAFT",
      excerpt: idea.description || "",
      contentPlatform: contentPlatform,
      contentType: contentType,
    },
  });

  await prisma.idea.update({
    where: { id: ideaId },
    data: {
      status: "DRAFT_CREATED",
      createdPostId: post.id,
    },
  });

  return { postId: post.id };
}

export async function fetchIdeasCount(
  status?: IdeaStatus,
  contentPlatform?: ContentPlatformType,
): Promise<number> {
  const where: { status?: IdeaStatus; contentPlatform?: ContentPlatformType } =
    {};
  if (status) where.status = status;
  if (contentPlatform) where.contentPlatform = contentPlatform;
  return prisma.idea.count({ where });
}
