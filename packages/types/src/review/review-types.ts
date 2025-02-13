import { Platform } from "./account-types";

export interface ReviewFormData {
  stars: number;
  platform: Platform;
  accountId: string;
  content?: any; // Json type in Prisma
  title: string;
  contentUrl?: string;
  authorId: string;
  status?: ReviewStatus;
  verificationStatus?: VerificationStatus;
}

export enum ReviewStatus {
  PUBLISHED = "PUBLISHED",
  DRAFT = "DRAFT",
  PENDING = "PENDING",
  HIDDEN = "HIDDEN",
  DELETED = "DELETED",
  FLAGGED = "FLAGGED",
}

export enum VerificationStatus {
  VERIFIED = "VERIFIED",
  NOT_VERIFIED = "NOT_VERIFIED",
  FLAGGED = "FLAGGED",
  SPAM = "SPAM",
  BOT = "BOT",
  IN_PROGRESS = "IN_PROGRESS",
}

export interface ReviewType extends ReviewFormData {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isEdited: boolean;
  editHistory?: any; // Json type in Prisma
  reportCount: number;
  lastActivityAt: Date;
  viewCount: number;
  comments?: any[]; // Relation field
  votes?: any[]; // Relation field
}
