export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  sendEmail,
  NewsletterWelcomeEmail,
  generateUnsubscribeToken,
  syncSubscriberToAudience,
  BASE_URL,
} from "@ratecreator/email";

const prisma = getPrismaClient();

export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get("token");

    if (!token) {
      return NextResponse.redirect(
        new URL("/newsletter?error=missing-token", BASE_URL),
      );
    }

    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { verifyToken: token },
    });

    if (!subscriber) {
      return NextResponse.redirect(
        new URL("/newsletter?error=invalid-token", BASE_URL),
      );
    }

    if (subscriber.status === "ACTIVE") {
      return NextResponse.redirect(
        new URL("/newsletter?verified=true", BASE_URL),
      );
    }

    // Activate subscription
    await prisma.newsletterSubscriber.update({
      where: { id: subscriber.id },
      data: {
        status: "ACTIVE",
        verifyToken: null,
        subscribedAt: new Date(),
      },
    });

    // Generate unsubscribe URL for welcome email
    const unsubToken = generateUnsubscribeToken(subscriber.email);
    const unsubscribeUrl = `${BASE_URL}/api/newsletter/unsubscribe?email=${encodeURIComponent(subscriber.email)}&token=${unsubToken}`;

    // Send welcome email (fire-and-forget)
    sendEmail({
      to: subscriber.email,
      subject: "Welcome to the Rate Creator newsletter!",
      react: NewsletterWelcomeEmail({
        name: subscriber.name || undefined,
        unsubscribeUrl,
      }),
    }).catch((err) => console.error("Failed to send welcome email:", err));

    // Sync to Resend audience (fire-and-forget)
    syncSubscriberToAudience(
      subscriber.email,
      subscriber.name || undefined,
    ).catch((err) => console.error("Failed to sync to audience:", err));

    return NextResponse.redirect(
      new URL("/newsletter?verified=true", BASE_URL),
    );
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.redirect(
      new URL("/newsletter?error=server-error", BASE_URL),
    );
  }
}
