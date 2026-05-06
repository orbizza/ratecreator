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
//   - `/categories(/[slug])?` — discovery pages. The page itself renders for
//     anonymous visitors (wrapped in <AuthGateModal>), but the data fetch
//     happens via the gated /api/search/* below — modal blocks the UI, the
//     middleware blocks the underlying request. Belt and suspenders.
//   - Homepage Most Popular Categories — uses the `getMostPopularCategoryWithData`
//     Server Action which already returns a tight whitelist (no internal
//     fields), unrelated to /api/search.
//   - `/sign-in`, `/sign-up`, marketing pages, `/legal/*`, etc.
//
// /api/search/* IS gated: the data leak the security PR was filed for came
// from anonymous DevTools requests against this endpoint. Defense-in-depth
// is layered with the _source whitelist inside searchAccounts/searchCategories
// so even if a future caller bypasses this matcher, response can't leak
// internal pipeline state (isSeeded, lastIndexedAt, claimed, etc.).
const isProtectedApi = createRouteMatcher([
  "/api/reviews(.*)",
  "/api/accounts(.*)",
  "/api/categories(.*)",
  "/api/metadata(.*)",
  "/api/search/(.*)",
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
