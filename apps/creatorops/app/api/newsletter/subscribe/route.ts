import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  generateVerifyToken,
  sendEmail,
  NewsletterVerifyEmail,
} from "@ratecreator/email";

const prisma = getPrismaClient();

const CREATOROPS_BASE_URL =
  process.env.CREATOROPS_URL || "https://creator.ratecreator.com";

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
});

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 },
      );
    }

    const body = await request.json();
    const parsed = subscribeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 },
      );
    }

    const { email, name } = parsed.data;

    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        // Add "creator" segment if not already present
        if (!existing.segments.includes("creator")) {
          await prisma.newsletterSubscriber.update({
            where: { email },
            data: { segments: [...existing.segments, "creator"] },
          });
        }
        return NextResponse.json({
          message: "You're already subscribed!",
        });
      }

      if (existing.status === "PENDING") {
        return NextResponse.json({
          message:
            "We've already sent you a verification email. Please check your inbox.",
        });
      }

      // Re-subscribe from UNSUBSCRIBED
      const token = generateVerifyToken();
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: {
          status: "PENDING",
          verifyToken: token,
          name: name || existing.name,
          unsubscribedAt: null,
          source: "creatorops",
        },
      });

      const verifyUrl = `${CREATOROPS_BASE_URL}/api/newsletter/verify?token=${token}`;
      sendEmail({
        to: email,
        subject: "Verify your Creator Portal newsletter subscription",
        react: NewsletterVerifyEmail({
          verifyUrl,
          name: name || existing.name || undefined,
        }),
      }).catch((err) =>
        console.error("Failed to send verification email:", err),
      );

      return NextResponse.json({
        message: "Welcome back! Please check your email to verify.",
      });
    }

    // New subscriber with "creator" segment
    const token = generateVerifyToken();
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        name,
        status: "PENDING",
        verifyToken: token,
        source: "creatorops",
        segments: ["creator"],
      },
    });

    const verifyUrl = `${CREATOROPS_BASE_URL}/api/newsletter/verify?token=${token}`;
    sendEmail({
      to: email,
      subject: "Verify your Creator Portal newsletter subscription",
      react: NewsletterVerifyEmail({ verifyUrl, name }),
    }).catch((err) => console.error("Failed to send verification email:", err));

    return NextResponse.json({
      message: "Please check your email to verify your subscription.",
    });
  } catch (error) {
    console.error("Subscribe error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
