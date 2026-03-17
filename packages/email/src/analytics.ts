import { getResendClient } from "./client";
import type {
  EmailAnalytics,
  BroadcastAnalytics,
  BroadcastSummary,
} from "./types";

/**
 * Get analytics for a single email by ID.
 * Returns null on error.
 */
export async function getEmailAnalytics(
  emailId: string,
): Promise<EmailAnalytics | null> {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.get(emailId);

    if (error) {
      console.error("[analytics] getEmailAnalytics error:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      to: Array.isArray(data.to) ? data.to.join(", ") : data.to || "",
      subject: data.subject || "",
      createdAt: data.created_at,
      lastEvent: data.last_event,
    };
  } catch (error) {
    console.error("[analytics] getEmailAnalytics error:", error);
    return null;
  }
}

/**
 * Get analytics for a broadcast by ID.
 * Returns null on error.
 */
export async function getBroadcastAnalytics(
  broadcastId: string,
): Promise<BroadcastAnalytics | null> {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.broadcasts.get(broadcastId);

    if (error) {
      console.error("[analytics] getBroadcastAnalytics error:", error);
      return null;
    }

    if (!data) return null;

    return {
      id: data.id,
      name: data.name,
      audienceId: data.audience_id || "",
      status: data.status,
      createdAt: data.created_at,
      sentAt: data.sent_at || undefined,
    };
  } catch (error) {
    console.error("[analytics] getBroadcastAnalytics error:", error);
    return null;
  }
}

/**
 * List all broadcasts.
 * Returns empty array on error.
 */
export async function listBroadcasts(): Promise<BroadcastSummary[]> {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.broadcasts.list();

    if (error) {
      console.error("[analytics] listBroadcasts error:", error);
      return [];
    }

    if (!data?.data) return [];

    return data.data.map((b: any) => ({
      id: b.id,
      name: b.name,
      status: b.status,
      createdAt: b.created_at,
      sentAt: b.sent_at || undefined,
    }));
  } catch (error) {
    console.error("[analytics] listBroadcasts error:", error);
    return [];
  }
}
