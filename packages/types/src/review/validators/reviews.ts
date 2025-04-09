import { z } from "zod";

const ReviewStatus = z.enum([
  "PUBLISHED",
  "DRAFT",
  "PENDING",
  "HIDDEN",
  "DELETED",
  "FLAGGED",
]);
const VerificationStatus = z.enum([
  "VERIFIED",
  "NOT_VERIFIED",
  "FLAGGED",
  "SPAM",
  "BOT",
  "IN_PROGRESS",
]);

const RedditMetadataValidator = z.object({
  slug: z.string().url(),
  title: z.string().optional(),
  author: z.string().optional(),
  subreddit: z.string().optional(),
});

export const ReviewValidator = z.object({
  title: z
    .string()
    .min(3, {
      message: "Title must be at least 3 characters long",
    })
    .max(128, {
      message: "Title must be less than 128 characters long",
    }),
  accountId: z.string(),
  platform: z.string().toUpperCase(),
  stars: z.number({ message: "Star rating is required" }).min(1).max(5),
  authorId: z.string(),
  content: z
    .string()
    .min(50, { message: "Content must be at least 50 characters long" })
    .max(10000, { message: "Content must be less than 10000 characters long" }),
  redditMetadata: RedditMetadataValidator.optional(),
  contentUrl: z.string().url().optional(),
  status: ReviewStatus.default("PUBLISHED"),
  verificationStatus: VerificationStatus.default("IN_PROGRESS"),
});

export type ReviewCreationRequest = z.infer<typeof ReviewValidator>;
