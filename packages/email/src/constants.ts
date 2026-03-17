export const EMAIL_FROM =
  process.env.EMAIL_FROM || "Rate Creator <noreply@email.ratecreator.com>";

export const EMAIL_REPLY_TO =
  process.env.EMAIL_REPLY_TO || "shaswat@ratecreator.com";

export const RESEND_API_KEY = process.env.RESEND_API_KEY || "";

export const RESEND_AUDIENCE_ALL_USERS_ID =
  process.env.RESEND_AUDIENCE_ALL_USERS_ID || "";

export const RESEND_AUDIENCE_SECURITY_ID =
  process.env.RESEND_AUDIENCE_SECURITY_ID || "";

export const RESEND_AUDIENCE_CREATOR_ID =
  process.env.RESEND_AUDIENCE_CREATOR_ID || "";

export const EMAIL_UNSUBSCRIBE_SECRET =
  process.env.EMAIL_UNSUBSCRIBE_SECRET || "";

export const EMAIL_LOGO_URL =
  process.env.EMAIL_LOGO_URL || "https://ratecreator.com/logo.svg";

export const BASE_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://ratecreator.com";

export type SegmentType = "all-users" | "security" | "creator";

export const SEGMENT_AUDIENCE_MAP: Record<SegmentType, string> = {
  "all-users": RESEND_AUDIENCE_ALL_USERS_ID,
  security: RESEND_AUDIENCE_SECURITY_ID,
  creator: RESEND_AUDIENCE_CREATOR_ID,
};
