import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

// Create a matcher for the sign-in page
const publicRoutes = createRouteMatcher(["/sign-in"]);

export default clerkMiddleware((auth, request) => {
  if (publicRoutes(request)) {
    return NextResponse.next();
  }

  // For all other routes, protect and redirect to sign-in if unauthenticated
  const { userId } = auth();
  if (!userId) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!.+.[w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};
