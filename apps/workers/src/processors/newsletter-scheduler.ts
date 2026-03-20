/**
 * Newsletter Scheduler Processor
 *
 * Runs on a cron schedule (every 5 minutes). Queries for posts
 * with status=SCHEDULED, contentType=NEWSLETTER, and publishDate <= now().
 * Sends the broadcast and updates to PUBLISHED.
 */

import { getPrismaClient } from "@ratecreator/db/client";
import {
  sendBroadcastToSegments,
  blocknoteToEmailHtml,
  NewsletterIssueEmail,
  BASE_URL,
  type SegmentType,
} from "@ratecreator/email";
import React from "react";

const prisma = getPrismaClient();

export async function processScheduledNewsletters(): Promise<void> {
  const now = new Date();

  // Find newsletters scheduled for now or past
  const scheduledPosts = await prisma.post.findMany({
    where: {
      contentType: "NEWSLETTER",
      status: "SCHEDULED",
      publishDate: { lte: now },
    },
    include: {
      author: { select: { name: true, email: true } },
    },
    take: 10,
  });

  if (scheduledPosts.length === 0) {
    return;
  }

  console.log(
    `[newsletter-scheduler] Found ${scheduledPosts.length} scheduled newsletter(s)`,
  );

  for (const post of scheduledPosts) {
    try {
      // Extract segments from broadcastIds (stored as "segment:name")
      const segments = post.broadcastIds
        .filter((id) => id.startsWith("segment:"))
        .map((id) => id.replace("segment:", "")) as SegmentType[];

      if (segments.length === 0) {
        segments.push("all-users");
      }

      // Convert content to email HTML
      let emailHtml: string;
      try {
        emailHtml = await blocknoteToEmailHtml(post.content);
      } catch (err) {
        console.error(
          `[newsletter-scheduler] Failed to convert content for post ${post.id}:`,
          err,
        );
        continue;
      }

      // Send broadcasts using buildReact
      const results = await sendBroadcastToSegments({
        segments,
        subject: post.title,
        buildReact: (segment) =>
          React.createElement(NewsletterIssueEmail, {
            title: post.title,
            content: emailHtml,
            authorName: post.author?.name || "Rate Creator",
            publishDate: post.publishDate || now,
            postUrl: `${BASE_URL}/newsletter/${post.postUrl}`,
            hideUnsubscribe: segment === "security",
          }),
        name: `Scheduled: ${post.title}`,
      });

      // Collect broadcast IDs
      const broadcastIds = results.map((r) => r.id);

      // Update post to PUBLISHED
      await prisma.post.update({
        where: { id: post.id },
        data: {
          status: "PUBLISHED",
          publishDate: now,
          broadcastIds: [
            ...post.broadcastIds.filter((id) => !id.startsWith("segment:")),
            ...broadcastIds,
          ],
        },
      });

      // Log emails
      for (const result of results) {
        await prisma.emailLog.create({
          data: {
            to: `segment:${result.segment}`,
            subject: post.title,
            template: "newsletter-issue",
            status: "SENT",
            resendId: result.id,
            metadata: { postId: post.id, platform: post.contentPlatform },
          },
        });
      }

      console.log(
        `[newsletter-scheduler] Published newsletter: ${post.title} (${post.id})`,
      );
    } catch (error) {
      console.error(
        `[newsletter-scheduler] Failed to process post ${post.id}:`,
        error,
      );
    }
  }
}
