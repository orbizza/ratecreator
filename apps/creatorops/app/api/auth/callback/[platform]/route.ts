import { NextRequest, NextResponse } from "next/server";
import { handleOAuthCallback } from "@ratecreator/actions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ platform: string }> },
) {
  const { platform } = await params;
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const error = request.nextUrl.searchParams.get("error");

  // User denied consent
  if (error) {
    return NextResponse.redirect(
      new URL(
        `/accounts/claim?error=${encodeURIComponent("Verification cancelled")}`,
        request.nextUrl.origin,
      ),
    );
  }

  if (!code || !state) {
    return NextResponse.redirect(
      new URL(
        `/accounts/claim?error=${encodeURIComponent("Missing authorization code")}`,
        request.nextUrl.origin,
      ),
    );
  }

  const result = await handleOAuthCallback(platform, code, state);

  if (result.success) {
    return NextResponse.redirect(
      new URL(
        `/accounts/claim?verified=true&claimId=${result.claimId}`,
        request.nextUrl.origin,
      ),
    );
  }

  return NextResponse.redirect(
    new URL(
      `/accounts/claim?error=${encodeURIComponent(result.error || "Verification failed")}`,
      request.nextUrl.origin,
    ),
  );
}
