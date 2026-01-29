import { auth, clerkClient } from "@clerk/nextjs/server";

export type UserRole = "USER" | "ADMIN" | "WRITER" | "CREATOR" | "BRAND";

export interface UserRoleMetadata {
  roles: UserRole[];
}

// Protected admin emails - always get admin access and cannot be removed
const ADMIN_EMAILS = ["hi@deepshaswat.com", "deepshaswat@gmail.com"];

/**
 * Get the current user's roles from Clerk publicMetadata
 */
export async function getCurrentUserRoles(): Promise<UserRole[]> {
  const { userId } = await auth();
  if (!userId) return [];

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  // Check if user email is in admin list
  const primaryEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (primaryEmail && ADMIN_EMAILS.includes(primaryEmail)) {
    return ["ADMIN"];
  }

  const metadata = user.publicMetadata as unknown as
    | UserRoleMetadata
    | undefined;
  return metadata?.roles || ["USER"];
}

/**
 * Check if current user has any of the specified roles
 */
export async function hasRole(allowedRoles: UserRole[]): Promise<boolean> {
  const userRoles = await getCurrentUserRoles();
  return userRoles.some((role) => allowedRoles.includes(role));
}

/**
 * Check if current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const roles = await getCurrentUserRoles();
  return roles.includes("ADMIN");
}

/**
 * Check if current user can access the web app (USER or ADMIN)
 */
export async function canAccessWeb(): Promise<boolean> {
  return hasRole(["USER", "ADMIN"]);
}

/**
 * Check if current user can access the content app (WRITER or ADMIN)
 */
export async function canAccessContent(): Promise<boolean> {
  return hasRole(["WRITER", "ADMIN"]);
}

/**
 * Get roles from Clerk user object (for use in user-sync consumer)
 */
export function getRolesFromClerkPayload(payload: any): UserRole[] {
  // Check admin emails first
  const email = payload.email_addresses?.[0]?.email_address;
  if (email && ADMIN_EMAILS.includes(email)) {
    return ["ADMIN"];
  }

  const metadata = payload.public_metadata as UserRoleMetadata | undefined;
  return metadata?.roles || ["USER"];
}

/**
 * Update user roles in Clerk
 */
export async function updateUserRoles(
  userId: string,
  roles: UserRole[],
): Promise<void> {
  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      roles,
    },
  });
}
