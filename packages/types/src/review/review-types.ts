export interface ReviewFormData {
  stars: number;
  platform: string;
  accountId: string;
  content: string;
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
