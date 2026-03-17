import { NextRequest, NextResponse } from "next/server";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  verifyUnsubscribeToken,
  syncSubscriberToAudience,
} from "@ratecreator/email";

const prisma = getPrismaClient();

export async function GET(request: NextRequest) {
  const email = request.nextUrl.searchParams.get("email");
  const token = request.nextUrl.searchParams.get("token");

  if (!email || !token) {
    return new NextResponse(
      renderHtmlPage("Invalid Request", "Missing email or token."),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  if (!verifyUnsubscribeToken(email, token)) {
    return new NextResponse(
      renderHtmlPage(
        "Invalid Link",
        "This unsubscribe link is invalid or has expired.",
      ),
      { status: 400, headers: { "Content-Type": "text/html" } },
    );
  }

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (!subscriber) {
      return new NextResponse(
        renderHtmlPage("Not Found", "No subscription found for this email."),
        { status: 404, headers: { "Content-Type": "text/html" } },
      );
    }

    if (subscriber.status === "UNSUBSCRIBED") {
      return new NextResponse(
        renderHtmlPage(
          "Already Unsubscribed",
          "You have already been unsubscribed from our newsletter.",
        ),
        { status: 200, headers: { "Content-Type": "text/html" } },
      );
    }

    // Mark as unsubscribed
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    });

    // Sync to Resend (fire-and-forget)
    syncSubscriberToAudience(email, undefined, true).catch((err) =>
      console.error("Failed to sync unsubscribe to audience:", err),
    );

    return new NextResponse(
      renderHtmlPage(
        "Unsubscribed",
        "You have been successfully unsubscribed from the Rate Creator newsletter. We're sorry to see you go!",
      ),
      { status: 200, headers: { "Content-Type": "text/html" } },
    );
  } catch (error) {
    console.error("Unsubscribe error:", error);
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
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #09090b;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      color: #e4e4e7;
    }
    .container {
      max-width: 480px;
      text-align: center;
      padding: 48px 32px;
      background-color: #18181b;
      border-radius: 12px;
      margin: 24px;
    }
    h1 {
      color: #ffffff;
      font-size: 28px;
      margin-bottom: 16px;
    }
    p {
      color: #a1a1aa;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 24px;
    }
    a {
      display: inline-block;
      background-color: #22c55e;
      color: #000000;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      font-weight: 600;
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
