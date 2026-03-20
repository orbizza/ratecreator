/**
 * OAuth configuration for platform verification.
 * Phase 5 initial: YouTube (Google) only.
 * TikTok and Twitter deferred to follow-up.
 */

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
}

function getCreatorOpsUrl(): string {
  return process.env.CREATOROPS_URL || "http://localhost:3003";
}

export function getYouTubeOAuthConfig(): OAuthConfig {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error(
      "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be set for YouTube verification",
    );
  }

  return {
    clientId,
    clientSecret,
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/youtube.readonly"],
    redirectUri: `${getCreatorOpsUrl()}/api/auth/callback/youtube`,
  };
}
