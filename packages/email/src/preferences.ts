import { createHmac } from "crypto";
import { EMAIL_UNSUBSCRIBE_SECRET, BASE_URL } from "./constants";

export interface EmailPreferences {
  creatorUpdates: boolean;
  reviewAlerts: boolean;
  commentNotifications: boolean;
  newsletterUpdates: boolean;
  marketingEmails: boolean;
}

export const DEFAULT_EMAIL_PREFERENCES: EmailPreferences = {
  creatorUpdates: true,
  reviewAlerts: true,
  commentNotifications: true,
  newsletterUpdates: true,
  marketingEmails: true,
};

// Maps notification types to email preference categories
export const EMAIL_CATEGORY_MAP: Record<string, keyof EmailPreferences> = {
  REVIEW_REPLY: "reviewAlerts",
  COMMENT_REPLY: "commentNotifications",
  VOTE_MILESTONE: "reviewAlerts",
  ACCOUNT_CLAIMED: "creatorUpdates",
  ACCOUNT_SUBMITTED: "creatorUpdates",
  SUBMISSION_APPROVED: "creatorUpdates",
  NEWSLETTER_NEW: "newsletterUpdates",
};

// These email types are always sent regardless of preferences
export const ALWAYS_SEND = [
  "welcome",
  "account-deleted",
  "newsletter-verify",
  "newsletter-welcome",
  "security",
] as const;

export function shouldSendEmail(
  preferences: EmailPreferences | null | undefined,
  notificationType: string,
): boolean {
  // Always-send emails bypass preferences
  if (ALWAYS_SEND.includes(notificationType as (typeof ALWAYS_SEND)[number])) {
    return true;
  }

  const prefs = preferences ?? DEFAULT_EMAIL_PREFERENCES;
  const category = EMAIL_CATEGORY_MAP[notificationType];

  if (!category) {
    // Unknown notification type — send by default
    return true;
  }

  return prefs[category];
}

export function buildUnsubscribeUrl(
  email: string,
  category: keyof EmailPreferences,
  baseUrl?: string,
): string {
  if (!EMAIL_UNSUBSCRIBE_SECRET) {
    throw new Error("EMAIL_UNSUBSCRIBE_SECRET is not set");
  }

  const token = createHmac("sha256", EMAIL_UNSUBSCRIBE_SECRET)
    .update(`${email}:${category}`)
    .digest("hex");

  const base = baseUrl || BASE_URL;
  const params = new URLSearchParams({ email, category, token });
  return `${base}/api/email/preferences/unsubscribe?${params.toString()}`;
}

export function verifyUnsubscribeCategory(
  email: string,
  category: string,
  token: string,
): boolean {
  if (!EMAIL_UNSUBSCRIBE_SECRET) return false;

  const expected = createHmac("sha256", EMAIL_UNSUBSCRIBE_SECRET)
    .update(`${email}:${category}`)
    .digest("hex");

  return expected === token;
}
