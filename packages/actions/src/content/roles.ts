"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import { UserRole } from "@prisma/client";

const prisma = getPrismaClient();

// Protected admin emails - always have admin access and cannot be removed
const ADMIN_EMAILS = ["hi@deepshaswat.com", "deepshaswat@gmail.com"];

export type { UserRole };

export interface UserWithRoles {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  role: UserRole[];
  createdAt: Date;
}

/**
 * Check if the current user is an admin
 */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const { userId } = await auth();
  if (!userId) return false;

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const primaryEmail = user.emailAddresses.find(
    (e) => e.id === user.primaryEmailAddressId,
  )?.emailAddress;

  if (primaryEmail && ADMIN_EMAILS.includes(primaryEmail)) {
    return true;
  }

  const metadata = user.publicMetadata as { roles?: string[] } | undefined;
  const roles = metadata?.roles || [];

  return roles.includes("ADMIN");
}

/**
 * Get all users with their roles (admin only)
 */
export async function fetchAllUsersWithRoles(): Promise<UserWithRoles[]> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  const users = await prisma.user.findMany({
    where: { isDeleted: false },
    select: {
      id: true,
      clerkId: true,
      email: true,
      firstName: true,
      lastName: true,
      username: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return users;
}

/**
 * Update a user's roles (admin only)
 * Updates both the database and Clerk publicMetadata
 */
export async function updateUserRoles(
  userId: string,
  roles: UserRole[],
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin access required" };
  }

  try {
    // Get user from database to find Clerk ID
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { clerkId: true, email: true },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // Don't allow removing admin from admin emails
    if (ADMIN_EMAILS.includes(user.email) && !roles.includes("ADMIN")) {
      return {
        success: false,
        error: "Cannot remove admin role from protected admin email",
      };
    }

    // Update in Clerk
    const client = await clerkClient();
    await client.users.updateUserMetadata(user.clerkId, {
      publicMetadata: {
        roles: roles,
      },
    });

    // Update in database
    await prisma.user.update({
      where: { id: userId },
      data: { role: roles },
    });

    return { success: true };
  } catch (error) {
    console.error("Error updating user roles:", error);
    return { success: false, error: "Failed to update user roles" };
  }
}

/**
 * Get a user's roles by email
 */
export async function getUserRolesByEmail(
  email: string,
): Promise<UserRole[] | null> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { role: true },
  });

  return user?.role || null;
}

/**
 * Sync a user's roles from Clerk to database
 */
export async function syncUserRolesFromClerk(
  clerkId: string,
): Promise<{ success: boolean; roles?: UserRole[]; error?: string }> {
  try {
    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);

    const primaryEmail = clerkUser.emailAddresses.find(
      (e) => e.id === clerkUser.primaryEmailAddressId,
    )?.emailAddress;

    let roles: UserRole[] = ["USER"];

    // Admin emails always get admin
    if (primaryEmail && ADMIN_EMAILS.includes(primaryEmail)) {
      roles = ["ADMIN"];
    } else {
      const metadata = clerkUser.publicMetadata as
        | { roles?: string[] }
        | undefined;
      if (metadata?.roles) {
        roles = metadata.roles
          .map((r) => r.toUpperCase())
          .filter((r) =>
            ["USER", "ADMIN", "WRITER", "CREATOR", "BRAND"].includes(r),
          ) as UserRole[];
        if (roles.length === 0) roles = ["USER"];
      }
    }

    // Update database
    await prisma.user.update({
      where: { clerkId },
      data: { role: roles },
    });

    return { success: true, roles };
  } catch (error) {
    console.error("Error syncing user roles from Clerk:", error);
    return { success: false, error: "Failed to sync roles from Clerk" };
  }
}
