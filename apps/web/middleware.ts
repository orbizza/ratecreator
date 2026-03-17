import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// API routes that require auth — return 401 (no modal possible for APIs)
const isApiProtectedRoute = createRouteMatcher([
  "/api/reviews(.*)",
  "/api/comments(.*)",
  "/api/votes(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth();

  // Block unauthorized API calls with 401
  if (!userId && isApiProtectedRoute(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Page routes (/review, /user-profile, etc.) pass through
  // AuthGateModal in their layout shows the sign-in modal
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
