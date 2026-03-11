// Client
export { getResendClient } from "./client";

// Constants
export {
  EMAIL_FROM,
  EMAIL_REPLY_TO,
  BASE_URL,
  EMAIL_LOGO_URL,
  SEGMENT_AUDIENCE_MAP,
  type SegmentType,
} from "./constants";

// Types
export type {
  SendEmailOptions,
  SendBatchEmailOptions,
  NewsletterBroadcastOptions,
  ContactCreateOptions,
  BroadcastCreateOptions,
  BroadcastResult,
  SendResult,
  NewsletterSendOptions,
  EmailAnalytics,
  BroadcastAnalytics,
  BroadcastSummary,
} from "./types";

// Email sending
export { sendEmail, sendBatchEmails, sendNewsletter } from "./send";

// Contact management
export {
  upsertResendContact,
  unsubscribeResendContact,
  addContactToSegment,
  removeContactFromSegment,
  moveContactToSegment,
  listResendContacts,
  addContactToAudience,
  removeContactFromAudience,
  syncSubscriberToAudience,
  addContact,
  removeContact,
  type Segment,
  type ResendContact,
} from "./contacts";

// Broadcasts
export {
  sendBroadcast,
  sendBroadcastToSegments,
  createBroadcast,
  deleteBroadcast,
} from "./broadcast";

// Analytics
export {
  getEmailAnalytics,
  getBroadcastAnalytics,
  listBroadcasts,
} from "./analytics";

// Tokens
export {
  generateVerifyToken,
  generateUnsubscribeToken,
  verifyUnsubscribeToken,
} from "./tokens";

// Content conversion
export { blocknoteToEmailHtml } from "./blocknote-to-email";

// Templates
export { EmailLayout } from "./templates/layout";
export { NewsletterVerifyEmail } from "./templates/newsletter-verify";
export { NewsletterWelcomeEmail } from "./templates/newsletter-welcome";
export { NewsletterIssueEmail } from "./templates/newsletter-issue";
