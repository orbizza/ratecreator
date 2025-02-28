import * as z from "zod";

export const ContactSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  name: z.string().min(6, {
    message: "Name is required",
  }),
  message: z.string().min(20, {
    message: "Minimum of length 20 is required",
  }),
});
