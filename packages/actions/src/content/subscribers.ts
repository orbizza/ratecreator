"use server";

import { auth } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import {
  syncSubscriberToAudience,
  upsertResendContact,
  addContactToSegment,
  removeContactFromSegment,
  listResendContacts,
  SEGMENT_AUDIENCE_MAP,
  type SegmentType,
} from "@ratecreator/email";
import { requireWriter, isCurrentUserAdmin } from "./roles";

const prisma = getPrismaClient();

async function authenticateUser() {
  const { userId } = await auth();
  if (!userId) {
    throw new Error("Unauthorized");
  }
  await requireWriter(userId);
}

async function authenticateAdmin() {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error("Forbidden: Admin role required");
  }
}

/**
 * Get subscriber statistics including per-segment counts
 */
async function getSubscriberStats() {
  await authenticateUser();

  try {
    const [total, active, pending, unsubscribed] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({ where: { status: "ACTIVE" } }),
      prisma.newsletterSubscriber.count({ where: { status: "PENDING" } }),
      prisma.newsletterSubscriber.count({
        where: { status: "UNSUBSCRIBED" },
      }),
    ]);

    // Per-segment counts
    const allSegments: SegmentType[] = ["all-users", "security", "creator"];
    const segmentCounts: Record<string, number> = {};

    for (const seg of allSegments) {
      segmentCounts[seg] = await prisma.newsletterSubscriber.count({
        where: {
          status: "ACTIVE",
          segments: { has: seg },
        },
      });
    }

    return { total, active, pending, unsubscribed, segmentCounts };
  } catch (error) {
    console.error("Error fetching subscriber stats:", error);
    return {
      total: 0,
      active: 0,
      pending: 0,
      unsubscribed: 0,
      segmentCounts: {},
    };
  }
}

/**
 * List subscribers with optional filtering and pagination
 */
async function listSubscribers(options?: {
  status?: "PENDING" | "ACTIVE" | "UNSUBSCRIBED";
  search?: string;
  segment?: string;
  page?: number;
  pageSize?: number;
}) {
  await authenticateUser();

  const page = options?.page || 1;
  const pageSize = options?.pageSize || 50;
  const skip = (page - 1) * pageSize;

  const where: any = {};
  if (options?.status) {
    where.status = options.status;
  }
  if (options?.segment) {
    where.segments = { has: options.segment };
  }
  if (options?.search) {
    where.OR = [
      { email: { contains: options.search, mode: "insensitive" } },
      { name: { contains: options.search, mode: "insensitive" } },
    ];
  }

  try {
    const [subscribers, total] = await Promise.all([
      prisma.newsletterSubscriber.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.newsletterSubscriber.count({ where }),
    ]);

    return {
      subscribers,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error listing subscribers:", error);
    return {
      subscribers: [],
      total: 0,
      page: 1,
      pageSize,
      totalPages: 0,
    };
  }
}

/**
 * Manually unsubscribe a subscriber by ID (admin action)
 */
async function unsubscribeSubscriber(subscriberId: string) {
  await authenticateUser();

  try {
    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id: subscriberId },
      data: {
        status: "UNSUBSCRIBED",
        unsubscribedAt: new Date(),
      },
    });

    // Sync to Resend (fire-and-forget)
    syncSubscriberToAudience(subscriber.email, undefined, true).catch((err) =>
      console.error("Failed to sync unsubscribe:", err),
    );

    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing subscriber:", error);
    return { error: "Failed to unsubscribe" };
  }
}

/**
 * Export active subscribers as CSV string. ADMIN only — single compromised
 * writer should not be able to dump every subscriber's PII.
 */
async function exportSubscribersCSV() {
  await authenticateUser();
  await authenticateAdmin();

  try {
    const subscribers = await prisma.newsletterSubscriber.findMany({
      where: { status: "ACTIVE" },
      orderBy: { subscribedAt: "desc" },
    });

    const header = "Email,Name,Subscribed At,Source,Segments\n";
    const rows = subscribers
      .map(
        (s) =>
          `"${s.email}","${s.name || ""}","${s.subscribedAt?.toISOString() || ""}","${s.source || ""}","${(s.segments || []).join(";")}"`,
      )
      .join("\n");

    return header + rows;
  } catch (error) {
    console.error("Error exporting subscribers:", error);
    return "Error exporting subscribers";
  }
}

/**
 * Admin action: update a subscriber's status (reactivate, unsubscribe, etc.)
 */
async function updateSubscriberStatus(
  subscriberId: string,
  newStatus: "ACTIVE" | "PENDING" | "UNSUBSCRIBED",
) {
  await authenticateUser();

  try {
    const updateData: any = { status: newStatus };

    if (newStatus === "ACTIVE") {
      updateData.subscribedAt = new Date();
      updateData.unsubscribedAt = null;
      updateData.verifyToken = null;
    } else if (newStatus === "UNSUBSCRIBED") {
      updateData.unsubscribedAt = new Date();
    }

    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id: subscriberId },
      data: updateData,
    });

    // Sync to Resend audience
    const isUnsubscribed = newStatus === "UNSUBSCRIBED";
    syncSubscriberToAudience(
      subscriber.email,
      subscriber.name || undefined,
      isUnsubscribed,
    ).catch((err) => console.error("Failed to sync status to Resend:", err));

    return { success: true, subscriber };
  } catch (error) {
    console.error("Error updating subscriber status:", error);
    return { error: "Failed to update subscriber status" };
  }
}

/**
 * Admin action: manually add a subscriber.
 *
 * SECURITY: This previously created subscribers with `status: ACTIVE` and
 * pushed them straight to Resend, letting any WRITER add arbitrary emails to
 * the broadcast list without consent. We now (a) require ADMIN role and
 * (b) leave the row in PENDING status so the standard double-opt-in path
 * applies. UNSUBSCRIBED users are NOT silently re-activated — they must be
 * re-confirmed.
 */
async function addSubscriberManually(email: string, name?: string) {
  await authenticateUser();
  await authenticateAdmin();

  try {
    const existing = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existing) {
      if (existing.status === "ACTIVE") {
        return { error: "Subscriber already active" };
      }
      // For PENDING/UNSUBSCRIBED, refuse. The user-facing /subscribe flow
      // is the only path that should activate a subscription.
      return {
        error:
          "Subscriber exists with status " +
          existing.status +
          ". They must opt in via the public newsletter form.",
      };
    }

    const subscriber = await prisma.newsletterSubscriber.create({
      data: {
        email,
        name,
        // Created in PENDING with no verifyToken — admin should still
        // trigger a verify email (or the user must opt in themselves).
        status: "PENDING",
        source: "admin",
        segments: ["all-users"],
      },
    });

    return { success: true, subscriber };
  } catch (error) {
    console.error("Error adding subscriber:", error);
    return { error: "Failed to add subscriber" };
  }
}

/**
 * Admin action: delete a subscriber permanently
 */
async function deleteSubscriber(subscriberId: string) {
  await authenticateUser();
  await authenticateAdmin();

  try {
    const subscriber = await prisma.newsletterSubscriber.delete({
      where: { id: subscriberId },
    });

    // Mark as unsubscribed in Resend
    syncSubscriberToAudience(subscriber.email, undefined, true).catch((err) =>
      console.error("Failed to sync delete to Resend:", err),
    );

    return { success: true };
  } catch (error) {
    console.error("Error deleting subscriber:", error);
    return { error: "Failed to delete subscriber" };
  }
}

/**
 * Sync subscribers from all Resend audiences into the database.
 * Fetches contacts from each segment audience, merges by email, upserts to DB.
 */
async function syncSubscribersFromResend() {
  await authenticateUser();

  try {
    const allSegments: SegmentType[] = ["all-users", "security", "creator"];
    const contactsByEmail: Record<
      string,
      {
        email: string;
        firstName?: string;
        lastName?: string;
        segments: string[];
        resendContactIds: Record<string, string>;
        unsubscribed: boolean;
      }
    > = {};

    for (const segment of allSegments) {
      const audienceId = SEGMENT_AUDIENCE_MAP[segment];
      if (!audienceId) continue;

      const contacts = await listResendContacts(audienceId);

      for (const contact of contacts) {
        const existing = contactsByEmail[contact.email];
        if (existing) {
          existing.segments.push(segment);
          existing.resendContactIds[segment] = contact.id;
          if (contact.unsubscribed) existing.unsubscribed = true;
        } else {
          contactsByEmail[contact.email] = {
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
            segments: [segment],
            resendContactIds: { [segment]: contact.id },
            unsubscribed: contact.unsubscribed,
          };
        }
      }
    }

    let synced = 0;
    let created = 0;

    for (const contact of Object.values(contactsByEmail)) {
      const name = [contact.firstName, contact.lastName]
        .filter(Boolean)
        .join(" ")
        .trim();

      const existing = await prisma.newsletterSubscriber.findUnique({
        where: { email: contact.email },
      });

      if (existing) {
        await prisma.newsletterSubscriber.update({
          where: { email: contact.email },
          data: {
            segments: contact.segments,
            resendContactIds: contact.resendContactIds,
            name: name || existing.name,
            status: contact.unsubscribed ? "UNSUBSCRIBED" : existing.status,
          },
        });
        synced++;
      } else {
        await prisma.newsletterSubscriber.create({
          data: {
            email: contact.email,
            name: name || null,
            status: contact.unsubscribed ? "UNSUBSCRIBED" : "ACTIVE",
            subscribedAt: contact.unsubscribed ? null : new Date(),
            source: "resend-sync",
            segments: contact.segments,
            resendContactIds: contact.resendContactIds,
          },
        });
        created++;
      }
    }

    return { success: true, synced, created, total: synced + created };
  } catch (error) {
    console.error("Error syncing subscribers from Resend:", error);
    return { error: "Failed to sync subscribers from Resend" };
  }
}

/**
 * Toggle subscription status: ACTIVE <-> UNSUBSCRIBED
 */
async function toggleSubscription(subscriberId: string) {
  await authenticateUser();

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id: subscriberId },
    });

    if (!subscriber) return { error: "Subscriber not found" };

    const newStatus =
      subscriber.status === "ACTIVE" ? "UNSUBSCRIBED" : "ACTIVE";
    const updateData: any = { status: newStatus };

    if (newStatus === "ACTIVE") {
      updateData.subscribedAt = new Date();
      updateData.unsubscribedAt = null;
    } else {
      updateData.unsubscribedAt = new Date();
    }

    const updated = await prisma.newsletterSubscriber.update({
      where: { id: subscriberId },
      data: updateData,
    });

    // Sync to Resend
    syncSubscriberToAudience(
      updated.email,
      updated.name || undefined,
      newStatus === "UNSUBSCRIBED",
    ).catch((err) => console.error("Failed to sync toggle to Resend:", err));

    return { success: true, subscriber: updated };
  } catch (error) {
    console.error("Error toggling subscription:", error);
    return { error: "Failed to toggle subscription" };
  }
}

/**
 * Update a subscriber's segments, syncing additions/removals to Resend
 */
async function updateSubscriberSegments(
  subscriberId: string,
  newSegments: string[],
) {
  await authenticateUser();

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id: subscriberId },
    });

    if (!subscriber) return { error: "Subscriber not found" };

    const oldSegments = subscriber.segments || [];
    const added = newSegments.filter((s) => !oldSegments.includes(s));
    const removed = oldSegments.filter((s) => !newSegments.includes(s));

    // Update DB
    const updated = await prisma.newsletterSubscriber.update({
      where: { id: subscriberId },
      data: { segments: newSegments },
    });

    // Sync additions to Resend (fire-and-forget)
    for (const seg of added) {
      addContactToSegment(seg as SegmentType, {
        email: subscriber.email,
        firstName: subscriber.name || "",
      }).catch((err) =>
        console.error(`Failed to add contact to segment ${seg}:`, err),
      );
    }

    // Sync removals from Resend (fire-and-forget)
    for (const seg of removed) {
      removeContactFromSegment(seg as SegmentType, subscriber.email).catch(
        (err) =>
          console.error(`Failed to remove contact from segment ${seg}:`, err),
      );
    }

    return { success: true, subscriber: updated };
  } catch (error) {
    console.error("Error updating subscriber segments:", error);
    return { error: "Failed to update segments" };
  }
}

/**
 * Get a subscriber by ID with email activity summary
 */
async function getSubscriberById(subscriberId: string) {
  await authenticateUser();

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id: subscriberId },
    });

    if (!subscriber) return { error: "Subscriber not found" };

    // Get email activity counts
    const [sentCount, failedCount, bouncedCount] = await Promise.all([
      prisma.emailLog.count({
        where: { to: subscriber.email, status: "SENT" },
      }),
      prisma.emailLog.count({
        where: { to: subscriber.email, status: "FAILED" },
      }),
      prisma.emailLog.count({
        where: { to: subscriber.email, status: "BOUNCED" },
      }),
    ]);

    return {
      success: true,
      subscriber,
      emailActivity: {
        sent: sentCount,
        failed: failedCount,
        bounced: bouncedCount,
      },
    };
  } catch (error) {
    console.error("Error fetching subscriber:", error);
    return { error: "Failed to fetch subscriber" };
  }
}

/**
 * Update subscriber profile info (name, note, location)
 */
async function updateSubscriber(
  subscriberId: string,
  data: { name?: string; note?: string; location?: string },
) {
  await authenticateUser();

  try {
    const subscriber = await prisma.newsletterSubscriber.update({
      where: { id: subscriberId },
      data: {
        name: data.name,
        note: data.note,
        location: data.location,
      },
    });

    // Sync name to Resend if changed
    if (data.name !== undefined) {
      upsertResendContact({
        email: subscriber.email,
        firstName: data.name || "",
      }).catch((err) => console.error("Failed to sync name to Resend:", err));
    }

    return { success: true, subscriber };
  } catch (error) {
    console.error("Error updating subscriber:", error);
    return { error: "Failed to update subscriber" };
  }
}

/**
 * Get activity timeline for a subscriber from EmailLog
 */
async function getSubscriberTimeline(
  subscriberId: string,
  options?: { page?: number; pageSize?: number },
) {
  await authenticateUser();

  const page = options?.page || 1;
  const pageSize = options?.pageSize || 20;
  const skip = (page - 1) * pageSize;

  try {
    const subscriber = await prisma.newsletterSubscriber.findUnique({
      where: { id: subscriberId },
    });

    if (!subscriber) return { error: "Subscriber not found" };

    const [logs, total] = await Promise.all([
      prisma.emailLog.findMany({
        where: { to: subscriber.email },
        orderBy: { createdAt: "desc" },
        skip,
        take: pageSize,
      }),
      prisma.emailLog.count({
        where: { to: subscriber.email },
      }),
    ]);

    return {
      success: true,
      timeline: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  } catch (error) {
    console.error("Error fetching subscriber timeline:", error);
    return { error: "Failed to fetch timeline" };
  }
}

export {
  getSubscriberStats,
  listSubscribers,
  unsubscribeSubscriber,
  updateSubscriberStatus,
  addSubscriberManually,
  deleteSubscriber,
  exportSubscribersCSV,
  syncSubscribersFromResend,
  toggleSubscription,
  updateSubscriberSegments,
  getSubscriberById,
  updateSubscriber,
  getSubscriberTimeline,
};
