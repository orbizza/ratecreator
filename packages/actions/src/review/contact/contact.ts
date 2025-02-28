"use server";

import * as z from "zod";

import { ContactSchema } from "@ratecreator/types/review";
import { getPrismaClient } from "@ratecreator/db/client";

// import { generateVerificationToken } from "@/lib/tokens";
// import { sendVerificationEmail } from "@/lib/mail";

export const contact = async (values: z.infer<typeof ContactSchema>) => {
  const validatedFields = ContactSchema.safeParse(values);

  if (!validatedFields.success) {
    return {
      error: "Invalid fields!",
    };
  }

  const { email, name, message } = validatedFields.data;
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
