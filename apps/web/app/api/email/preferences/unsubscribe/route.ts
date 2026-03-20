import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  verifyUnsubscribeCategory,
  DEFAULT_EMAIL_PREFERENCES,
  type EmailPreferences,
} from "@ratecreator/email";

const prisma = getPrismaClient();

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const category = request.nextUrl.searchParams.get("category");
  const token = request.nextUrl.searchParams.get("token");

  if (!email || !category || !token) {
    return new NextResponse(
      renderHtmlPage("Invalid Request", "Missing required parameters."),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  if (!verifyUnsubscribeCategory(email, category, token)) {
    return new NextResponse(
      renderHtmlPage(
        "Invalid Link",
        "This unsubscribe link is invalid or has expired.",
      ),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, emailPreferences: true },
    });

    if (!user) {
      return new NextResponse(
        renderHtmlPage("Not Found", "No account found for this email."),
        { status: 404, headers: { "Content-Type": "text/html" } },
      );
    }

    const current =
      (user.emailPreferences as unknown as EmailPreferences) ??
      DEFAULT_EMAIL_PREFERENCES;

    if (category in current) {
      const updated = { ...current, [category]: false };
      await prisma.user.update({
        where: { id: user.id },
        data: {
          emailPreferences: updated as unknown as Record<string, boolean>,
        },
      });
    }

    const categoryLabels: Record<string, string> = {
      creatorUpdates: "creator updates",
      reviewAlerts: "review alerts",
      commentNotifications: "comment notifications",
      newsletterUpdates: "newsletter updates",
      marketingEmails: "marketing emails",
    };

    const label = categoryLabels[category] || category;

    return new NextResponse(
      renderHtmlPage(
        "Unsubscribed",
        `You have been unsubscribed from ${label}. You can manage your email preferences in your account settings.`,
      ),
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  } catch (error) {
    console.error("Email preference unsubscribe error:", error);
    return new NextResponse(
      renderHtmlPage("Error", "Something went wrong. Please try again later."),
      { status: 500, headers: { "Content-Type": "text/html" } },
    );
  }
}

function renderHtmlPage(title: string, message: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - Rate Creator</title>
  <style>
    body {
      margin: 0; padding: 0; min-height: 100vh;
      display: flex; align-items: center; justify-content: center;
      background-color: #09090b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #e4e4e7;
    }
    .container {
      max-width: 480px; text-align: center; padding: 48px 32px;
      background-color: #18181b; border-radius: 12px; margin: 24px;
    }
    h1 { color: #ffffff; font-size: 28px; margin-bottom: 16px; }
    p { color: #a1a1aa; font-size: 16px; line-height: 1.6; margin-bottom: 24px; }
    a {
      display: inline-block; background-color: #22c55e; color: #000000;
      padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 600;
    }
    a:hover { background-color: #16a34a; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="https://ratecreator.com">Go to Rate Creator</a>
  </div>
</body>
</html>`;
}
