import { SegmentType } from "./constants";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react?: React.ReactElement;
  template?: string;
  replyTo?: string;
  from?: string;
}

export interface SendBatchEmailOptions {
  emails: {
    to: string;
    subject: string;
    react: React.ReactElement;
  }[];
  from?: string;
  replyTo?: string;
}

export interface SendResult {
  success: boolean;
  resendId?: string;
  error?: string;
}

export interface NewsletterSendOptions {
  subscriberEmails: string[];
  subject: string;
  react: React.ReactElement;
}

export interface NewsletterBroadcastOptions {
  postId: string;
  title: string;
  content: string;
  segments: SegmentType[];
  previewText?: string;
}

export interface ContactCreateOptions {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
}

export interface BroadcastCreateOptions {
  audienceId: string;
  from: string;
  replyTo?: string;
  subject: string;
  html: string;
  name?: string;
}

export interface BroadcastResult {
  id: string;
  segment: SegmentType;
}

export interface EmailAnalytics {
  id: string;
  to: string;
  subject: string;
  createdAt: string;
  lastEvent?: string;
  clicks?: number;
  opens?: number;
}

export interface BroadcastAnalytics {
  id: string;
  name?: string;
  audienceId: string;
  status: string;
  createdAt: string;
  sentAt?: string;
  numSent?: number;
  numDelivered?: number;
  numOpens?: number;
  numClicks?: number;
  numBounced?: number;
  numComplaints?: number;
}

export interface BroadcastSummary {
  id: string;
  name?: string;
  status: string;
  createdAt: string;
  sentAt?: string;
}
