import { z } from "zod";

const tagSchema = z.object({
  slug: z.string().min(1, "Slug is required"),
  description: z
    .string()
    .max(500, "Description must be less than 500 characters")
    .optional(),
  imageUrl: z.string().optional(),
});

const updateTagSchema = z.object({
  id: z.string().min(1, "Tag ID is required"),
  slug: z.string().min(1, "Slug is required"),
  description: z.string().optional(),
  imageUrl: z.string().optional(),
});

export { tagSchema, updateTagSchema };
