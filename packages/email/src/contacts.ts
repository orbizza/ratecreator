import { getResendClient } from "./client";
import { SEGMENT_AUDIENCE_MAP, type SegmentType } from "./constants";
import type { ContactCreateOptions } from "./types";

export type Segment = SegmentType;

export interface ResendContact {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed: boolean;
  createdAt: string;
}

function getSegmentAudienceId(segment: SegmentType): string {
  const audienceId = SEGMENT_AUDIENCE_MAP[segment];
  if (!audienceId) {
    throw new Error(`No audience ID configured for segment: ${segment}`);
  }
  return audienceId;
}

/**
 * Create or update a contact in the primary (all-users) audience.
 * Fire-and-forget — logs errors, never throws.
 */
export async function upsertResendContact(options: {
  email: string;
  firstName?: string;
  lastName?: string;
  unsubscribed?: boolean;
}): Promise<void> {
  try {
    const resend = getResendClient();
    const audienceId = getSegmentAudienceId("all-users");

    await resend.contacts.create({
      audienceId,
      email: options.email,
      firstName: options.firstName || "",
      lastName: options.lastName || "",
      unsubscribed: options.unsubscribed ?? false,
    });
  } catch (error) {
    console.error("[contacts] upsertResendContact error:", error);
  }
}

/**
 * Mark a contact as unsubscribed in the primary (all-users) audience.
 * Fire-and-forget.
 */
export async function unsubscribeResendContact(email: string): Promise<void> {
  try {
    const resend = getResendClient();
    const audienceId = getSegmentAudienceId("all-users");

    const { data: contacts } = await resend.contacts.list({ audienceId });
    const contact = contacts?.data?.find((c) => c.email === email);
    if (!contact) return;

    await resend.contacts.update({
      audienceId,
      id: contact.id,
      unsubscribed: true,
    });
  } catch (error) {
    console.error("[contacts] unsubscribeResendContact error:", error);
  }
}

/**
 * Add a contact to a segment audience.
 * Fire-and-forget.
 */
export async function addContactToSegment(
  segment: SegmentType,
  contact: ContactCreateOptions,
): Promise<string | null> {
  try {
    const resend = getResendClient();
    const audienceId = getSegmentAudienceId(segment);

    const { data, error } = await resend.contacts.create({
      audienceId,
      email: contact.email,
      firstName: contact.firstName || "",
      lastName: contact.lastName || "",
      unsubscribed: contact.unsubscribed ?? false,
    });

    if (error) {
      console.error(`[contacts] addContactToSegment(${segment}) error:`, error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error(`[contacts] addContactToSegment(${segment}) error:`, error);
    return null;
  }
}

/**
 * Remove a contact from a segment audience (mark unsubscribed).
 * Fire-and-forget.
 */
export async function removeContactFromSegment(
  segment: SegmentType,
  email: string,
): Promise<void> {
  try {
    const resend = getResendClient();
    const audienceId = getSegmentAudienceId(segment);

    const { data: contacts } = await resend.contacts.list({ audienceId });
    const contact = contacts?.data?.find((c) => c.email === email);
    if (!contact) return;

    await resend.contacts.remove({
      audienceId,
      id: contact.id,
    });
  } catch (error) {
    console.error(
      `[contacts] removeContactFromSegment(${segment}) error:`,
      error,
    );
  }
}

/**
 * Move a contact from one segment audience to another.
 * Fire-and-forget.
 */
export async function moveContactToSegment(
  email: string,
  from: SegmentType,
  to: SegmentType,
  contact: ContactCreateOptions,
): Promise<void> {
  try {
    await removeContactFromSegment(from, email);
    await addContactToSegment(to, contact);
  } catch (error) {
    console.error(
      `[contacts] moveContactToSegment(${from} -> ${to}) error:`,
      error,
    );
  }
}

/**
 * List all contacts in a given audience.
 * Returns empty array on error.
 */
export async function listResendContacts(
  audienceId: string,
): Promise<ResendContact[]> {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.contacts.list({ audienceId });

    if (error) {
      console.error("[contacts] listResendContacts error:", error);
      return [];
    }

    return (data?.data || []) as unknown as ResendContact[];
  } catch (error) {
    console.error("[contacts] listResendContacts error:", error);
    return [];
  }
}

/**
 * Add a contact directly to an audience by audience ID.
 * Fire-and-forget.
 */
export async function addContactToAudience(
  email: string,
  audienceId: string,
  firstName?: string,
  lastName?: string,
): Promise<string | null> {
  try {
    const resend = getResendClient();
    const { data, error } = await resend.contacts.create({
      audienceId,
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      unsubscribed: false,
    });

    if (error) {
      console.error("[contacts] addContactToAudience error:", error);
      return null;
    }

    return data?.id || null;
  } catch (error) {
    console.error("[contacts] addContactToAudience error:", error);
    return null;
  }
}

/**
 * Remove a contact from an audience by contact ID.
 * Fire-and-forget.
 */
export async function removeContactFromAudience(
  contactId: string,
  audienceId: string,
): Promise<void> {
  try {
    const resend = getResendClient();
    await resend.contacts.remove({
      audienceId,
      id: contactId,
    });
  } catch (error) {
    console.error("[contacts] removeContactFromAudience error:", error);
  }
}

/**
 * Sync a subscriber to the all-users audience (backward-compat helper).
 */
export async function syncSubscriberToAudience(
  email: string,
  name?: string,
  unsubscribed = false,
): Promise<void> {
  await upsertResendContact({
    email,
    firstName: name || "",
    unsubscribed,
  });
}

// Legacy exports for backward compatibility
export const addContact = addContactToSegment;
export const removeContact = removeContactFromSegment;
