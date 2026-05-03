import { getPrismaClient } from "@ratecreator/db/client";
import { UserRole } from "@prisma/client";

const prisma = getPrismaClient();

// Protected admin emails - always get ADMIN role and cannot be removed
const ADMIN_EMAILS = ["hi@deepshaswat.com", "deepshaswat@gmail.com"];

/**
 * Decide what roles a Clerk-synced user should have.
 *
 * SECURITY: Roles are NEVER promoted from Clerk's `public_metadata` here —
 * publicMetadata is mutable from outside our trust boundary, so trusting it
 * would let any compromised admin token / external integration that can write
 * Clerk metadata grant ADMIN/WRITER. The only path that can elevate a user is
 * the in-app `updateUserRoles` admin action.
 *
 * Returns:
 *   - ["ADMIN"] for emails in the protected ADMIN_EMAILS allowlist
 *   - existing DB roles when the user already exists (preserve in-app grants)
 *   - ["USER"] as the default for new users
 */
async function resolveRolesForCreate(payload: {
  email_addresses?: Array<{ email_address?: string }>;
  id?: string;
}): Promise<UserRole[]> {
  const email = payload.email_addresses?.[0]?.email_address;
  if (email && ADMIN_EMAILS.includes(email)) return ["ADMIN"];
  return ["USER"];
}

async function resolveRolesForUpdate(
  clerkId: string,
  email: string | undefined,
): Promise<UserRole[]> {
  if (email && ADMIN_EMAILS.includes(email)) return ["ADMIN"];
  // Preserve whatever role was set in-app; never overwrite from webhook.
  const existing = await prisma.user.findUnique({
    where: { clerkId },
    select: { role: true },
  });
  return existing?.role ?? ["USER"];
}

function pickPersistableFields(payload: Record<string, unknown>) {
  // Only the fields we actually display. Persisting the entire Clerk payload
  // (email_addresses, phone_numbers, external_accounts, last_sign_in_at, IPs,
  // OAuth tokens, MFA settings, etc.) creates a PII trove with no UI consumer.
  const imageUrl =
    typeof payload.image_url === "string"
      ? payload.image_url
      : typeof payload.profile_image_url === "string"
        ? payload.profile_image_url
        : null;
  return imageUrl ? { image_url: imageUrl } : {};
}

export async function processUserSync(
  data: Record<string, unknown>,
  attributes: Record<string, string>,
): Promise<void> {
  if (!data || !attributes.key) {
    console.error("Invalid message: data or key is null");
    return;
  }

  const payload = data as Record<string, unknown> & {
    id?: string;
    email_addresses?: Array<{ email_address?: string }>;
    first_name?: string;
    last_name?: string;
    username?: string;
  };

  // Don't dump the full Clerk payload to logs — it contains PII (email,
  // phone numbers, IP, OAuth tokens). Log just identifiers + event type.
  const [eventType] = attributes.key.split(":");
  const userId = typeof payload.id === "string" ? payload.id : "<unknown>";
  console.log(`[user-sync] ${eventType} for ${userId}`);

  if (!payload.id) {
    console.error("[user-sync] payload missing id, skipping");
    return;
  }

  try {
    if (eventType === "user.created") {
      const email = payload.email_addresses?.[0]?.email_address;
      if (!email) {
        console.error("[user-sync] user.created without email, skipping");
        return;
      }
      const roles = await resolveRolesForCreate(payload);
      const persisted = pickPersistableFields(payload);

      // SECURITY: key the upsert on clerkId (the immutable Clerk identifier),
      // not on email. Email-keyed upsert lets a fresh Clerk account using a
      // victim's email steal the victim's row by overwriting clerkId.
      await prisma.user.upsert({
        where: { clerkId: payload.id },
        create: {
          clerkId: payload.id,
          email,
          firstName: payload.first_name || "",
          lastName: payload.last_name || "",
          username: payload.username || "",
          webhookPayload: persisted,
          role: roles,
          isDeleted: false,
          deletedAt: null,
        },
        update: {
          // Only the fields safe to refresh on a duplicate-create event.
          firstName: payload.first_name || "",
          lastName: payload.last_name || "",
          username: payload.username || "",
          webhookPayload: persisted,
          isDeleted: false,
          deletedAt: null,
        },
      });
      console.log(
        `[user-sync] upserted clerkId=${payload.id}, roles=${roles.join(",")}`,
      );
    } else if (eventType === "user.updated") {
      const newEmail = payload.email_addresses?.[0]?.email_address;
      const roles = await resolveRolesForUpdate(payload.id, newEmail);
      const persisted = pickPersistableFields(payload);

      // Refuse to mutate email to a value already held by a different user.
      if (newEmail) {
        const collision = await prisma.user.findUnique({
          where: { email: newEmail },
          select: { clerkId: true },
        });
        if (collision && collision.clerkId !== payload.id) {
          console.error(
            `[user-sync] refusing email update — ${newEmail} already belongs to clerkId=${collision.clerkId}`,
          );
          return;
        }
      }

      await prisma.user.update({
        where: { clerkId: payload.id },
        data: {
          ...(newEmail ? { email: newEmail } : {}),
          firstName: payload.first_name,
          lastName: payload.last_name,
          username: payload.username,
          webhookPayload: persisted,
          role: roles,
        },
      });
      console.log(
        `[user-sync] updated clerkId=${payload.id}, roles=${roles.join(",")}`,
      );
    } else if (eventType === "user.deleted") {
      try {
        // First try to find the user
        const user = await prisma.user.findUnique({
          where: { clerkId: payload.id },
        });

        if (!user) {
          console.log(
            `User ${payload.id} not found in database for deletion. Skipping.`,
          );
          return;
        }

        await prisma.user.update({
          where: { clerkId: payload.id },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
        console.log(`Marked user as deleted: ${payload.id}`);
      } catch (error) {
        console.error(`Error processing delete for user ${payload.id}:`, error);
      }
    } else {
      console.log(`Unhandled event type: ${eventType}`);
    }
  } catch (error) {
    console.error(`Error processing message for user ${payload.id}:`, error);
  }
}
