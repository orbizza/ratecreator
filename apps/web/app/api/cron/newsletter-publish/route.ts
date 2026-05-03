import { NextRequest, NextResponse } from "next/server";
import React from "react";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  blocknoteToEmailHtml,
  sendBroadcastToSegments,
  NewsletterIssueEmail,
  BASE_URL,
  type SegmentType,
} from "@ratecreator/email";
import { isAuthorizedCronRequest } from "../../../../lib/cron-auth";

const prisma = getPrismaClient();

/**
 * Cron job: Publish scheduled newsletters that are past their publish date.
 * Runs every 5 minutes via Vercel Cron.
 *
 * For each SCHEDULED newsletter post whose publishDate has passed:
 * 1. Set status to PUBLISHED
 * 2. Send broadcasts to segments using React templates
 * 3. Store broadcast IDs on the post
 */
export async function GET(request: NextRequest) {
  if (!isAuthorizedCronRequest(request.headers.get("authorization"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();

    // Find scheduled newsletter posts that should go live
    const scheduledPosts = await prisma.post.findMany({
      where: {
        status: "SCHEDULED",
        contentType: "NEWSLETTER",
        publishDate: { lte: now },
      },
      include: { author: true },
    });

    if (scheduledPosts.length === 0) {
      return NextResponse.json({ success: true, published: 0 });
    }

    let publishedCount = 0;

    for (const post of scheduledPosts) {
      try {
        // Update status to PUBLISHED
        await prisma.post.update({
          where: { id: post.id },
          data: { status: "PUBLISHED" },
        });

        // Extract stored segments from broadcastIds (format: "segment:all-users")
        const storedSegments = (post.broadcastIds || [])
          .filter((id) => id.startsWith("segment:"))
          .map((id) => id.replace("segment:", "") as SegmentType);

        const segments: SegmentType[] =
          storedSegments.length > 0 ? storedSegments : ["all-users"];

        // Convert content to email HTML
        const emailHtml = blocknoteToEmailHtml(post.content);
        const postUrl = `${BASE_URL}/newsletter/${post.postUrl}`;
        const publishDate = post.publishDate
          ? new Date(post.publishDate).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          : undefined;

        // Send broadcasts using React templates
        const results = await sendBroadcastToSegments({
          segments,
          subject: post.title,
          name: `Scheduled: ${post.title}`,
          buildReact: (segment: SegmentType) =>
            React.createElement(NewsletterIssueEmail, {
              title: post.title,
              contentHtml: emailHtml,
              featureImage: post.featureImage || undefined,
              authorName: post.author?.name || undefined,
              authorImageUrl: post.author?.imageUrl || undefined,
              publishDate,
              postUrl,
              hideUnsubscribe: segment === "security",
              previewText: post.excerpt || post.title,
            }),
        });

        const broadcastIds = results.map((r) => r.id);

        // Log results
        for (const result of results) {
          await prisma.emailLog.create({
            data: {
              to: `broadcast:${result.segment}`,
              subject: post.title,
              template: "newsletter-issue",
              status: "SENT",
              resendId: result.id,
              metadata: {
                postId: post.id,
                segment: result.segment,
                source: "cron",
              },
            },
          });
        }

        if (broadcastIds.length > 0) {
          await prisma.post.update({
            where: { id: post.id },
            data: { broadcastIds },
          });
        }

        publishedCount++;
      } catch (error) {
        console.error(
          `[cron/newsletter-publish] Error publishing post ${post.id}:`,
          error,
        );
      }
    }

    return NextResponse.json({ success: true, published: publishedCount });
  } catch (error) {
    console.error("[cron/newsletter-publish] Error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
