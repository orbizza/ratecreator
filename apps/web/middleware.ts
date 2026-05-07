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
//   - `/api/search/*` — Elasticsearch catalog browsing for the global
//     command-bar autocomplete. Returns ONLY the whitelisted fields
//     defined in elasticsearch-client (`PUBLIC_ACCOUNT_FIELDS` /
//     `PUBLIC_CATEGORY_FIELDS`) — no internal pipeline state leaks. The
//     full search-results page (/search) and creator profile pages
//     (/profile/*) remain gated at the page layer; only the lightweight
//     dropdown is reachable anonymously.
//   - `/categories(/[slug])?` — discovery pages render an aria-hidden
//     backdrop for anonymous visitors (see each page's auth() check),
//     so the actual data never enters the DOM.
//   - Homepage Most Popular Categories — uses `getMostPopularCategoryWithData`
//     which returns its own tight whitelist.
//   - `/sign-in`, `/sign-up`, marketing pages, `/legal/*`, etc.
const isProtectedApi = createRouteMatcher([
  "/api/reviews(.*)",
  "/api/accounts(.*)",
  "/api/categories(.*)",
  "/api/metadata(.*)",
]);

// /profile/* deliberately uses the in-page <AuthGateModal> pattern (see
// apps/web/app/(public)/profile/layout.tsx) — the page renders behind a
// blurred overlay with the Clerk <SignIn> component on top, and Clerk's
// forceRedirectUrl returns the user to the same profile URL after sign-in.
// /review/* and /user-profile have no public preview to render behind a
// modal, so they get the hard redirect.
const isProtectedPage = createRouteMatcher([
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
