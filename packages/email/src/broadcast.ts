import { getResendClient } from "./client";
import {
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  SEGMENT_AUDIENCE_MAP,
  type SegmentType,
} from "./constants";
import type { BroadcastResult } from "./types";

/**
 * Create and send a broadcast using a React template.
 * Two-step: create broadcast, then send.
 * Fire-and-forget — returns null on error.
 */
export async function sendBroadcast(options: {
  segment: SegmentType;
  subject: string;
  react: React.ReactElement;
  name?: string;
}): Promise<BroadcastResult | null> {
  const resend = getResendClient();
  const audienceId = SEGMENT_AUDIENCE_MAP[options.segment];

  if (!audienceId) {
    console.error(
      `[broadcast] No audience ID configured for segment: ${options.segment}`,
    );
    return null;
  }

  try {
    const { data, error } = await resend.broadcasts.create({
      audienceId,
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      subject: options.subject,
      react: options.react,
      name: options.name || `Newsletter: ${options.subject}`,
    });

    if (error) {
      console.error(
        `[broadcast] Failed to create broadcast for ${options.segment}:`,
        error,
      );
      return null;
    }

    if (!data?.id) {
      console.error("[broadcast] Broadcast created but no ID returned");
      return null;
    }

    // Send the broadcast immediately
    const { error: sendError } = await resend.broadcasts.send(data.id);

    if (sendError) {
      console.error(
        `[broadcast] Failed to send broadcast for ${options.segment}:`,
        sendError,
      );
      return null;
    }

    return { id: data.id, segment: options.segment };
  } catch (error) {
    console.error(`[broadcast] Broadcast error for ${options.segment}:`, error);
    return null;
  }
}

/**
 * Send broadcasts to multiple segments, optionally with per-segment React templates.
 *
 * @param options.segments - Array of segments to broadcast to
 * @param options.subject - Email subject line
 * @param options.react - Default React element (used if buildReact is not provided)
 * @param options.buildReact - Optional callback to build per-segment React elements
 * @param options.name - Optional broadcast name
 */
export async function sendBroadcastToSegments(options: {
  segments: SegmentType[];
  subject: string;
  react?: React.ReactElement;
  buildReact?: (segment: SegmentType) => React.ReactElement;
  name?: string;
}): Promise<BroadcastResult[]> {
  const results: BroadcastResult[] = [];

  for (const segment of options.segments) {
    const react = options.buildReact
      ? options.buildReact(segment)
      : options.react;

    if (!react) {
      console.error(
        `[broadcast] No React element for segment ${segment} — provide either react or buildReact`,
      );
      continue;
    }

    const result = await sendBroadcast({
      segment,
      subject: options.subject,
      react,
      name: options.name
        ? `${options.name} [${segment}]`
        : `${options.subject} [${segment}]`,
    });

    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Create and send a broadcast using raw HTML (legacy).
 * Kept for backward compatibility.
 */
export async function createBroadcast(options: {
  segment: SegmentType;
  subject: string;
  html: string;
  name?: string;
}): Promise<BroadcastResult | null> {
  const resend = getResendClient();
  const audienceId = SEGMENT_AUDIENCE_MAP[options.segment];

  if (!audienceId) {
    console.error(
      `[broadcast] No audience ID configured for segment: ${options.segment}`,
    );
    return null;
  }

  try {
    const { data, error } = await resend.broadcasts.create({
      audienceId,
      from: EMAIL_FROM,
      replyTo: EMAIL_REPLY_TO,
      subject: options.subject,
      html: options.html,
      name: options.name || `Newsletter: ${options.subject}`,
    });

    if (error) {
      console.error(
        `[broadcast] Failed to create broadcast for ${options.segment}:`,
        error,
      );
      return null;
    }

    if (!data?.id) {
      console.error("[broadcast] Broadcast created but no ID returned");
      return null;
    }

    const { error: sendError } = await resend.broadcasts.send(data.id);

    if (sendError) {
      console.error(
        `[broadcast] Failed to send broadcast for ${options.segment}:`,
        sendError,
      );
      return null;
    }

    return { id: data.id, segment: options.segment };
  } catch (error) {
    console.error(`[broadcast] Broadcast error for ${options.segment}:`, error);
    return null;
  }
}

/**
 * Delete a broadcast by ID
 */
export async function deleteBroadcast(broadcastId: string) {
  const resend = getResendClient();

  try {
    const { error } = await resend.broadcasts.remove(broadcastId);
    if (error) {
      console.error(
        `[broadcast] Failed to delete broadcast ${broadcastId}:`,
        error,
      );
    }
  } catch (error) {
    console.error(
      `[broadcast] Error deleting broadcast ${broadcastId}:`,
      error,
    );
  }
}
