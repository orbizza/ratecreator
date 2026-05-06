import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Idiomatic Clerk middleware. `auth.protect()` is the official helper:
//   - For API routes it returns 401 (Clerk handles content-type itself).
//   - For page routes it 307-redirects to the configured sign-in URL with
//     `redirect_url` set to the originally-requested path so the user
//     lands back where they started after auth.
//
// Two protected sets:
//   - PROTECTED_API: any route handler that must not leak data to anonymous
//     callers. Defense-in-depth — every consuming Server Action also calls
//     auth(), but the middleware kills the request before it ever reaches
//     the handler so DevTools sees only `{"error":"Unauthorized"}`.
//   - PROTECTED_PAGE: any user-facing page that should redirect anonymous
//     visitors into the sign-in flow.
//
// What stays PUBLIC:
//   - `/api/search/*` — Elasticsearch catalog browsing. The homepage's Most
//     Popular Categories already renders to anonymous visitors; gating
//     search broke that without protecting any data the homepage doesn't
//     also expose. Per-IP rate limit inside the route handler.
//   - `/categories(/[slug])?` — public discovery pages. Calls `/api/search`
//     under the hood.
//   - `/sign-in`, `/sign-up`, marketing pages, `/legal/*`, etc.
const isProtectedApi = createRouteMatcher([
  "/api/reviews(.*)",
  "/api/accounts(.*)",
  "/api/categories(.*)",
  "/api/metadata(.*)",
]);

const isProtectedPage = createRouteMatcher([
  "/profile/(.*)",
  "/review/(.*)",
  "/user-profile(.*)",
]);

export default clerkMiddleware(async (auth, req) => {
  if (isProtectedApi(req) || isProtectedPage(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
