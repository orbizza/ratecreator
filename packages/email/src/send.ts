import { getResendClient } from "./client";
import { EMAIL_FROM, EMAIL_REPLY_TO } from "./constants";
import type {
  SendEmailOptions,
  SendResult,
  NewsletterSendOptions,
} from "./types";

/**
 * Send a single email via Resend.
 * Fire-and-forget — catches errors and returns a SendResult.
 */
export async function sendEmail(
  options: SendEmailOptions,
): Promise<SendResult> {
  try {
    const resend = getResendClient();

    const { data, error } = await resend.emails.send({
      from: options.from || EMAIL_FROM,
      to: Array.isArray(options.to) ? options.to : [options.to],
      subject: options.subject,
      react: options.react,
      replyTo: options.replyTo || EMAIL_REPLY_TO,
    });

    if (error) {
      console.error("[send] Failed to send email:", error);
      return { success: false, error: error.message };
    }

    return { success: true, resendId: data?.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("[send] sendEmail error:", message);
    return { success: false, error: message };
  }
}

/**
 * Send batch emails via Resend with rate limiting.
 * Chunks into batches of 100 with 500ms delay between batches.
 */
export async function sendBatchEmails(
  emails: {
    to: string;
    subject: string;
    react: React.ReactElement;
  }[],
  from?: string,
  replyTo?: string,
): Promise<SendResult[]> {
  const resend = getResendClient();
  const results: SendResult[] = [];

  // Chunk into batches of 100
  const BATCH_SIZE = 100;
  const BATCH_DELAY_MS = 500;

  for (let i = 0; i < emails.length; i += BATCH_SIZE) {
    const chunk = emails.slice(i, i + BATCH_SIZE);

    const batch = chunk.map((email) => ({
      from: from || EMAIL_FROM,
      to: [email.to],
      subject: email.subject,
      react: email.react,
      replyTo: replyTo || EMAIL_REPLY_TO,
    }));

    try {
      const { data, error } = await resend.batch.send(batch);

      if (error) {
        console.error("[send] Batch send error:", error);
        // Mark all in this chunk as failed
        for (const email of chunk) {
          results.push({ success: false, error: error.message });
        }
      } else {
        // Mark all in this chunk as successful
        const batchData = data?.data || [];
        for (let j = 0; j < chunk.length; j++) {
          results.push({
            success: true,
            resendId: batchData[j]?.id,
          });
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      console.error("[send] Batch send error:", message);
      for (const email of chunk) {
        results.push({ success: false, error: message });
      }
    }

    // Delay between batches to respect rate limits
    if (i + BATCH_SIZE < emails.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return results;
}

/**
 * Send a newsletter to a list of subscriber emails using a React template.
 * Wraps sendBatchEmails with newsletter-specific defaults.
 */
export async function sendNewsletter(
  options: NewsletterSendOptions,
): Promise<SendResult[]> {
  const emails = options.subscriberEmails.map((email) => ({
    to: email,
    subject: options.subject,
    react: options.react,
  }));

  return sendBatchEmails(emails);
}
