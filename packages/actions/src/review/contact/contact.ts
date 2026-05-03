"use server";

import * as z from "zod";

import { ContactSchema } from "@ratecreator/types/review";
import { getPrismaClient } from "@ratecreator/db/client";
import { getRedisClient } from "@ratecreator/db/redis-do";

const RATE_LIMIT = 5;
const RATE_WINDOW_SEC = 60 * 60; // 5 messages per email per hour

export const contact = async (values: z.infer<typeof ContactSchema>) => {
  const validatedFields = ContactSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields!",
    };
  }

  const { email, name, message } = validatedFields.data;
  const redis = getRedisClient();

  // Rate-limit by submitter email so anonymous spam is bounded.
  const rlKey = `rl:contact:${email.toLowerCase()}`;
  const count = await redis.incr(rlKey);
  if (count === 1) {
    await redis.expire(rlKey, RATE_WINDOW_SEC);
  }
  if (count > RATE_LIMIT) {
    return {
      error: "Too many messages. Please try again later.",
    };
  }

  const prisma = getPrismaClient();

  // TODO: Create an entry in db
  try {
    await prisma.contactForm.create({
      data: {
        name,
        email,
        message,
      },
    });
  } catch (error) {
    console.log(error);
    return {
      error: "Something went wrong!",
    };
  }

  // TODO: Send email to admin using ResendEmailTemplate

  // TODO: if the user is not on waitlist, add the user to waitlist and send verification email

  //   const verificationToken = await generateVerificationToken(email);
  //   await sendVerificationEmail(verificationToken.email, verificationToken.token);

  return {
    success: "Message sent!",
  };
};
