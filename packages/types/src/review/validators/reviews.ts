import { z } from "zod";

const RedditMetadataValidator = z.object({
  slug: z.string().url(),
  title: z.string().optional(),
  author: z.string().optional(),
  subreddit: z.string().optional(),
});

// Server only trusts these fields. authorId/status/verificationStatus are
// derived server-side from the session — never accepted from the client.
export const ReviewValidator = z.object({
  title: z
    .string()
    .min(3, { message: "Title must be at least 3 characters long" })
    .max(128, { message: "Title must be less than 128 characters long" }),
  accountId: z.string().min(1).max(128),
  platform: z.string().toUpperCase(),
  stars: z.number({ message: "Star rating is required" }).min(1).max(5),
  content: z
    .string()
    .min(50, { message: "Content must be at least 50 characters long" })
    .max(10000, { message: "Content must be less than 10000 characters long" }),
  redditMetadata: RedditMetadataValidator.optional(),
  contentUrl: z.string().url().optional(),
});

export type ReviewCreationRequest = z.infer<typeof ReviewValidator>;
