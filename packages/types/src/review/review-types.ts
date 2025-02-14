import { Platform } from "./account-types";

// Form Data
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

export interface CommentFormData {
  content: any; // Json type in Prisma
  reviewId: string;
  authorId: string;
  status?: CommentStatus;
  verificationStatus?: VerificationStatus;
}

export interface ReviewVoteFormData {
  reviewId: string;
  authorId: string;
  voteType: VoteType;
}

export interface CommentVoteFormData {
  commentId: string;
  authorId: string;
  voteType: VoteType;
}

// Fetched Data
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
  isDeleted: boolean;
  author?: AuthorData;
}

export interface CommentType extends CommentFormData {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  votes?: any[]; // Relation field
}

export interface AuthorData {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string;
  clerkId?: string;
  imageUrl?: string;
  email?: string;
}

// Enums

export enum CommentStatus {
  PUBLISHED = "PUBLISHED",
  HIDDEN = "HIDDEN",
  DELETED = "DELETED",
  PENDING = "PENDING",
  FLAGGED = "FLAGGED",
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

export enum VoteType {
  UP = "UP",
  DOWN = "DOWN",
}
