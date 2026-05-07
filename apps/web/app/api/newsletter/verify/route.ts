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

    // Only PENDING subscribers can be verified — refuse on UNSUBSCRIBED so a
    // captured token cannot re-subscribe a user who has explicitly opted out.
    if (subscriber.status !== "PENDING") {
      return NextResponse.redirect(
        new URL("/newsletter?error=invalid-token", BASE_URL),
      );
    }

    // Tokens expire after 24 hours. We don't have a `verifyTokenExpiresAt`
    // column yet, so use the row's `createdAt` as a proxy (subscribers are
    // re-created on re-subscribe with a fresh token).
    const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
    if (
      subscriber.createdAt &&
      Date.now() - subscriber.createdAt.getTime() > TOKEN_TTL_MS
    ) {
      // Clear the stale token so it cannot be replayed.
      await prisma.newsletterSubscriber.update({
        where: { id: subscriber.id },
        data: { verifyToken: null },
      });
      return NextResponse.redirect(
        new URL("/newsletter?error=expired-token", BASE_URL),
      );
    }

    // Conditional update so two concurrent verify requests can't both succeed.
    const activated = await prisma.newsletterSubscriber.updateMany({
      where: { id: subscriber.id, status: "PENDING" },
      data: {
        status: "ACTIVE",
        verifyToken: null,
        subscribedAt: new Date(),
      },
    });
    if (activated.count !== 1) {
      // Another concurrent request already activated this subscriber.
      return NextResponse.redirect(
        new URL("/newsletter?verified=true", BASE_URL),
      );
    }

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
