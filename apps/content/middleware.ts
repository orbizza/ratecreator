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

function isApiRequest(request: Request): boolean {
  return new URL(request.url).pathname.startsWith("/api/");
}

export default clerkMiddleware(async (auth, request) => {
  // Allow public routes
  if (publicRoutes(request)) {
    return NextResponse.next();
  }

  const { userId } = await auth();

  // Refuse unauthenticated requests
  if (!userId) {
    if (isApiRequest(request)) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
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
      if (isApiRequest(request)) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { "Content-Type": "application/json" },
        });
      }
      const unauthorizedUrl = new URL("/unauthorized", request.url);
      return NextResponse.redirect(unauthorizedUrl);
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error checking user roles:", error);
    if (isApiRequest(request)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    const unauthorizedUrl = new URL("/unauthorized", request.url);
    return NextResponse.redirect(unauthorizedUrl);
  }
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
