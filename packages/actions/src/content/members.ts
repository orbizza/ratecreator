"use server";

import { auth, clerkClient } from "@clerk/nextjs/server";
import { getPrismaClient } from "@ratecreator/db/client";
import { UserRole } from "@prisma/client";
import { withCache, invalidateCache, CACHE_TTL, CacheKeys } from "./cache";

const prisma = getPrismaClient();

// Protected admin emails - always have admin access and cannot be removed
const ADMIN_EMAILS = ["hi@deepshaswat.com", "deepshaswat@gmail.com"];

export interface MemberInfo {
  id: string;
  clerkId: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  username: string | null;
  imageUrl: string | null;
  role: UserRole[];
  createdAt: Date;
  isAdmin: boolean;
  isProtectedAdmin: boolean; // Only true for protected admin emails that cannot have ADMIN role removed
}

/**
 * Check if the current user is an admin
 */
async function isCurrentUserAdmin(): Promise<boolean> {
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

  const metadata = user.publicMetadata as
    | { roles?: string[]; role?: string }
    | undefined;
  const roles = metadata?.roles || (metadata?.role ? [metadata.role] : []);

  return roles.some((r) => r.toUpperCase() === "ADMIN");
}

export interface MemberFilterValue {
  operator: string;
  value: string;
}

export interface MemberFilters {
  search?: string;
  name?: MemberFilterValue;
  email?: MemberFilterValue;
  role?: MemberFilterValue;
  createdAt?: MemberFilterValue;
  // Pagination
  pageNumber?: number;
  pageSize?: number;
}

// Helper to apply text filter with operator
function applyTextFilter(
  operator: string,
  value: string,
):
  | {
      contains?: string;
      startsWith?: string;
      endsWith?: string;
      equals?: string;
      not?: { contains?: string };
      mode?: "insensitive";
    }
  | undefined {
  if (!value) return undefined;

  switch (operator) {
    case "contains":
      return { contains: value, mode: "insensitive" };
    case "does not contain":
      return { not: { contains: value }, mode: "insensitive" };
    case "starts with":
      return { startsWith: value, mode: "insensitive" };
    case "ends with":
      return { endsWith: value, mode: "insensitive" };
    case "is":
      return { equals: value, mode: "insensitive" };
    default:
      return { contains: value, mode: "insensitive" };
  }
}

// Helper to apply date filter with operator
function applyDateFilter(
  operator: string,
  value: string,
): { equals?: Date; lt?: Date; gt?: Date; lte?: Date; gte?: Date } | undefined {
  if (!value) return undefined;

  const date = new Date(value);
  if (isNaN(date.getTime())) return undefined;

  switch (operator) {
    case "is":
      // For "is", we need to match the entire day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);
      return { gte: startOfDay, lte: endOfDay };
    case "is before":
      return { lt: date };
    case "is after":
      return { gt: date };
    case "is on or before":
      return { lte: date };
    case "is on or after":
      return { gte: date };
    default:
      return undefined;
  }
}

/**
 * Fetch all members with optional filters
 */
export async function fetchMembers(
  filters?: MemberFilters,
  platform?: string,
): Promise<MemberInfo[]> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }

  // Build where clause dynamically
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = { isDeleted: false };
  const andConditions: unknown[] = [];

  // Quick search across multiple fields
  if (filters?.search && filters.search.trim()) {
    const searchTerm = filters.search.trim();
    whereClause.OR = [
      { email: { contains: searchTerm, mode: "insensitive" } },
      { firstName: { contains: searchTerm, mode: "insensitive" } },
      { lastName: { contains: searchTerm, mode: "insensitive" } },
      { username: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  // Name filter (searches firstName and lastName)
  if (filters?.name?.value) {
    const nameFilter = applyTextFilter(
      filters.name.operator,
      filters.name.value,
    );
    if (nameFilter) {
      andConditions.push({
        OR: [{ firstName: nameFilter }, { lastName: nameFilter }],
      });
    }
  }

  // Email filter
  if (filters?.email?.value) {
    const emailFilter = applyTextFilter(
      filters.email.operator,
      filters.email.value,
    );
    if (emailFilter) {
      andConditions.push({ email: emailFilter });
    }
  }

  // Role filter
  if (filters?.role?.value) {
    const roleValue = filters.role.value as UserRole;
    if (filters.role.operator === "is") {
      whereClause.role = { has: roleValue };
    } else if (filters.role.operator === "is not") {
      andConditions.push({
        NOT: { role: { has: roleValue } },
      });
    }
  }

  // Created date filter
  if (filters?.createdAt?.value) {
    const dateFilter = applyDateFilter(
      filters.createdAt.operator,
      filters.createdAt.value,
    );
    if (dateFilter) {
      andConditions.push({ createdAt: dateFilter });
    }
  }

  // Platform filter: only show CreatorOps members (CREATOR, WRITER, ADMIN)
  if (platform === "CREATOROPS") {
    andConditions.push({
      role: { hasSome: ["CREATOR", "WRITER", "ADMIN"] },
    });
  }

  // Add AND conditions if any
  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  // Pagination
  const pageSize = filters?.pageSize ?? 20;
  const pageNumber = filters?.pageNumber ?? 0;
  const skip = pageNumber * pageSize;

  // Get users from database with pagination
  const users = await prisma.user.findMany({
    where: whereClause,
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
    skip,
    take: pageSize,
  });

  // Get image URLs and roles from Clerk
  const client = await clerkClient();
  const membersWithImages: MemberInfo[] = [];

  for (const user of users) {
    let imageUrl: string | null = null;
    let clerkRoles: UserRole[] = [];

    try {
      const clerkUser = await client.users.getUser(user.clerkId);
      imageUrl = clerkUser.imageUrl;

      // Extract roles from Clerk metadata
      const metadata = clerkUser.publicMetadata as
        | { roles?: string[]; role?: string }
        | undefined;
      if (metadata?.roles && Array.isArray(metadata.roles)) {
        clerkRoles = metadata.roles
          .map((r) => String(r).toUpperCase())
          .filter((r) =>
            ["USER", "ADMIN", "WRITER", "CREATOR", "BRAND"].includes(r),
          ) as UserRole[];
      } else if (metadata?.role && typeof metadata.role === "string") {
        const upperRole = metadata.role.toUpperCase();
        if (
          ["USER", "ADMIN", "WRITER", "CREATOR", "BRAND"].includes(upperRole)
        ) {
          clerkRoles = [upperRole as UserRole];
        }
      }
    } catch {
      // User might not exist in Clerk anymore
    }

    // Determine final roles: prefer Clerk roles if available, else use DB roles
    let finalRoles = clerkRoles.length > 0 ? clerkRoles : user.role;

    // Ensure protected admin emails always have ADMIN role
    const isProtectedAdmin = ADMIN_EMAILS.includes(user.email);
    if (isProtectedAdmin && !finalRoles.includes("ADMIN")) {
      finalRoles = ["ADMIN", ...finalRoles];
    }

    membersWithImages.push({
      id: user.id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      username: user.username,
      imageUrl,
      role: finalRoles,
      createdAt: user.createdAt,
      isAdmin: isProtectedAdmin || finalRoles.includes("ADMIN"),
      isProtectedAdmin, // Only protected admin emails cannot have ADMIN role removed
    });
  }

  return membersWithImages;
}

/**
 * Count members with optional filters (for pagination)
 */
export async function countMembers(
  filters?: Omit<MemberFilters, "pageNumber" | "pageSize">,
  platform?: string,
): Promise<number> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return 0;
  }

  // Build where clause dynamically (same as fetchMembers)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereClause: any = { isDeleted: false };
  const andConditions: unknown[] = [];

  if (filters?.search && filters.search.trim()) {
    const searchTerm = filters.search.trim();
    whereClause.OR = [
      { email: { contains: searchTerm, mode: "insensitive" } },
      { firstName: { contains: searchTerm, mode: "insensitive" } },
      { lastName: { contains: searchTerm, mode: "insensitive" } },
      { username: { contains: searchTerm, mode: "insensitive" } },
    ];
  }

  if (filters?.name?.value) {
    const nameFilter = applyTextFilter(
      filters.name.operator,
      filters.name.value,
    );
    if (nameFilter) {
      andConditions.push({
        OR: [{ firstName: nameFilter }, { lastName: nameFilter }],
      });
    }
  }

  if (filters?.email?.value) {
    const emailFilter = applyTextFilter(
      filters.email.operator,
      filters.email.value,
    );
    if (emailFilter) {
      andConditions.push({ email: emailFilter });
    }
  }

  if (filters?.role?.value) {
    const roleValue = filters.role.value as UserRole;
    if (filters.role.operator === "is") {
      whereClause.role = { has: roleValue };
    } else if (filters.role.operator === "is not") {
      andConditions.push({
        NOT: { role: { has: roleValue } },
      });
    }
  }

  if (filters?.createdAt?.value) {
    const dateFilter = applyDateFilter(
      filters.createdAt.operator,
      filters.createdAt.value,
    );
    if (dateFilter) {
      andConditions.push({ createdAt: dateFilter });
    }
  }

  // Platform filter: only count CreatorOps members (CREATOR, WRITER, ADMIN)
  if (platform === "CREATOROPS") {
    andConditions.push({
      role: { hasSome: ["CREATOR", "WRITER", "ADMIN"] },
    });
  }

  if (andConditions.length > 0) {
    whereClause.AND = andConditions;
  }

  return prisma.user.count({ where: whereClause });
}

/**
 * Update a member's roles
 */
export async function updateMemberRoles(
  memberId: string,
  roles: UserRole[],
): Promise<{ success: boolean; error?: string }> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return { success: false, error: "Unauthorized: Admin access required" };
  }

  try {
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: memberId },
      select: { clerkId: true, email: true },
    });

    if (!user) {
      return { success: false, error: "Member not found" };
    }

    // Don't allow removing admin from protected emails
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
      where: { id: memberId },
      data: { role: roles },
    });

    // Invalidate members cache
    await invalidateCache("members:*");

    return { success: true };
  } catch (error) {
    console.error("Error updating member roles:", error);
    return { success: false, error: "Failed to update member roles" };
  }
}

export interface MemberStats {
  totalMembers: number;
  admins: number;
  writers: number;
  creators: number;
  brands: number;
  users: number;
}

/**
 * Get member stats
 */
export async function fetchMemberStats(): Promise<MemberStats> {
  const isAdmin = await isCurrentUserAdmin();
  if (!isAdmin) {
    return {
      totalMembers: 0,
      admins: 0,
      writers: 0,
      creators: 0,
      brands: 0,
      users: 0,
    };
  }

  const cacheKey = CacheKeys.memberStats();

  return withCache(cacheKey, CACHE_TTL.MEMBER_STATS, async () => {
    const users = await prisma.user.findMany({
      where: { isDeleted: false },
      select: { role: true, email: true },
    });

    let admins = 0;
    let writers = 0;
    let creators = 0;
    let brands = 0;
    let regularUsers = 0;

    for (const user of users) {
      // Count each role - a user can have multiple roles
      if (ADMIN_EMAILS.includes(user.email) || user.role.includes("ADMIN")) {
        admins++;
      }
      if (user.role.includes("WRITER")) {
        writers++;
      }
      if (user.role.includes("CREATOR")) {
        creators++;
      }
      if (user.role.includes("BRAND")) {
        brands++;
      }
      if (
        user.role.includes("USER") &&
        !user.role.includes("ADMIN") &&
        !user.role.includes("WRITER") &&
        !user.role.includes("CREATOR") &&
        !user.role.includes("BRAND") &&
        !ADMIN_EMAILS.includes(user.email)
      ) {
        regularUsers++;
      }
    }

    return {
      totalMembers: users.length,
      admins,
      writers,
      creators,
      brands,
      users: regularUsers,
    };
  });
}

/**
 * Invalidate members cache after data changes
 */
export async function invalidateMembersCache(): Promise<void> {
  await invalidateCache("members:*");
}
