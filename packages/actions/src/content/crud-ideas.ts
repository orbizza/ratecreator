"use server";

import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import { requireWriter, isCurrentUserAdmin } from "./roles";

const prisma = getPrismaClient();

async function authenticateUser(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  await requireWriter(userId);
  return userId;
}

async function requireIdeaOwnership(ideaId: string, sessionClerkId: string) {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { author: { select: { id: true, clerkId: true } } },
  });
  if (!idea) throw new Error("Idea not found");
  if (idea.author?.clerkId === sessionClerkId) return idea;
  if (await isCurrentUserAdmin()) return idea;
  throw new Error("Forbidden: you do not own this idea");
}

async function getAuthorIdForSession(sessionClerkId: string): Promise<string> {
  const author = await prisma.author.findUnique({
    where: { clerkId: sessionClerkId },
    select: { id: true },
  });
  if (!author) {
    throw new Error(
      "No Author record for the current user. Call createAuthor() first.",
    );
  }
  return author.id;
}

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
  const sessionClerkId = await authenticateUser();
  // Ignore client-supplied authorId — derive from session.
  const authorId = await getAuthorIdForSession(sessionClerkId);
  const idea = await prisma.idea.create({
    data: {
      title: data.title,
      description: data.description || null,
      topics: data.topics || [],
      targetDate: data.targetDate || null,
      authorId,
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
  await authenticateUser();
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
  await authenticateUser();
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
  const sessionClerkId = await authenticateUser();
  await requireIdeaOwnership(id, sessionClerkId);
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
  const sessionClerkId = await authenticateUser();
  await requireIdeaOwnership(id, sessionClerkId);
  await prisma.idea.delete({
    where: { id },
  });
}

export async function convertIdeaToDraft(
  ideaId: string,
  outline: string,
  _authorId: string, // ignored — derived from session below
  contentPlatform:
    | "RATECREATOR"
    | "CREATOROPS"
    | "DOCUMENTATION" = "RATECREATOR",
  contentType: "BLOG" | "GLOSSARY" | "NEWSLETTER" = "BLOG",
): Promise<{ postId: string }> {
  const sessionClerkId = await authenticateUser();
  await requireIdeaOwnership(ideaId, sessionClerkId);
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
  });

  if (!idea) {
    throw new Error("Idea not found");
  }

  // Always attribute the new post to the calling session, not the
  // client-supplied authorId.
  const authorId = await getAuthorIdForSession(sessionClerkId);

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
      authorId,
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
  await authenticateUser();
  const where: { status?: IdeaStatus; contentPlatform?: ContentPlatformType } =
    {};
  if (status) where.status = status;
  if (contentPlatform) where.contentPlatform = contentPlatform;
  return prisma.idea.count({ where });
}
