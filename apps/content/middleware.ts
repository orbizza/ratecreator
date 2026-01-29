import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

type UserRole = "USER" | "ADMIN" | "WRITER" | "CREATOR" | "BRAND";

// Protected admin emails - always get access and cannot be removed
const ADMIN_EMAILS = ["hi@deepshaswat.com", "deepshaswat@gmail.com"];

// Roles that can access the content app
const ALLOWED_ROLES: UserRole[] = ["WRITER", "ADMIN"];

// Public routes that don't require authentication
const publicRoutes = createRouteMatcher([
  "/sign-in",
  "/sign-up",
  "/unauthorized",
]);

/**
 * Extract roles from Clerk publicMetadata
 * Handles multiple formats:
 * - { role: "admin" } - single role as string
 * - { roles: ["ADMIN", "WRITER"] } - array of roles
 * - Case insensitive matching
 */
function extractRoles(
  metadata: Record<string, unknown> | null | undefined,
): UserRole[] {
  if (!metadata) return ["USER"];

  const validRoles = ["USER", "ADMIN", "WRITER", "CREATOR", "BRAND"];
  const roles: UserRole[] = [];

  // Check for 'roles' array
  if (metadata.roles && Array.isArray(metadata.roles)) {
    for (const role of metadata.roles) {
      const upperRole = String(role).toUpperCase();
      if (validRoles.includes(upperRole)) {
        roles.push(upperRole as UserRole);
      }
    }
  }

  // Check for 'role' string (singular)
  if (metadata.role && typeof metadata.role === "string") {
    const upperRole = metadata.role.toUpperCase();
    if (
      validRoles.includes(upperRole) &&
      !roles.includes(upperRole as UserRole)
    ) {
      roles.push(upperRole as UserRole);
    }
  }

  return roles.length > 0 ? roles : ["USER"];
}

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes
  if (publicRoutes(request)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  // Redirect to sign-in if not authenticated
  if (!userId) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }

  // Check user roles
  try {
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Check if user email is in admin list
    const primaryEmail = user.emailAddresses.find(
      (e) => e.id === user.primaryEmailAddressId,
    )?.emailAddress;

    if (primaryEmail && ADMIN_EMAILS.includes(primaryEmail)) {
      return NextResponse.next();
    }

    // Check roles from publicMetadata
    const userRoles = extractRoles(
      user.publicMetadata as Record<string, unknown>,
    );

    const hasAccess = userRoles.some((role) => ALLOWED_ROLES.includes(role));

    if (!hasAccess) {
      // User doesn't have required role - redirect to unauthorized page
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error checking user roles:", error);
    // On error, deny access
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    return NextResponse.redirect(unauthorizedUrl);
  }
});

export const config = {
  matcher: ["/((?!.+.[w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
