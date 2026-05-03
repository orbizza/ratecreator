import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPrismaClient } from "@ratecreator/db/client";
import { getRedisClient } from "@ratecreator/db/redis-do";
import {
  generateVerifyToken,
  sendEmail,
  NewsletterVerifyEmail,
  BASE_URL,
} from "@ratecreator/email";

const prisma = getPrismaClient();
const redis = getRedisClient();

const subscribeSchema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().optional(),
});

// Redis-backed rate limiter so it works behind multiple processes.
const RATE_LIMIT = 10;
const RATE_WINDOW_SEC = 60;

async function isRateLimited(ip: string): Promise<boolean> {
  const key = `rl:newsletter:subscribe:${ip}`;
  const count = await redis.incr(key);
  if (count === 1) {
    await redis.expire(key, RATE_WINDOW_SEC);
  }
  return count > RATE_LIMIT;
}

export async function POST(request: NextRequest) {
  try {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";

    if (await isRateLimited(ip)) {
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

    // Check existing subscriber
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
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
        },
      });

      // Send verification email (fire-and-forget)
      const verifyUrl = `${BASE_URL}/api/newsletter/verify?token=${token}`;
      sendEmail({
        to: email,
        subject: "Verify your Rate Creator newsletter subscription",
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

    // New subscriber
    const token = generateVerifyToken();
    await prisma.newsletterSubscriber.create({
      data: {
        email,
        name,
        status: "PENDING",
        verifyToken: token,
        source: "website",
      },
    });

    // Send verification email (fire-and-forget)
    const verifyUrl = `${BASE_URL}/api/newsletter/verify?token=${token}`;
    sendEmail({
      to: email,
      subject: "Verify your Rate Creator newsletter subscription",
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
