/**
 * YouTube OAuth verification.
 * Uses Google OAuth 2.0 to authenticate the user, then fetches their
 * YouTube channels to compare with the claimed account ID.
 */

import { getYouTubeOAuthConfig } from "./oauth-config";

interface YouTubeChannel {
  id: string;
  snippet: {
    title: string;
    customUrl?: string;
  };
}

interface YouTubeChannelListResponse {
  items?: YouTubeChannel[];
}

/**
 * Exchange authorization code for access token
 */
export async function exchangeYouTubeCode(
  code: string,
): Promise<{ accessToken: string }> {
  const config = getYouTubeOAuthConfig();

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: config.redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Token exchange failed: ${error}`);
  }

  const data = await response.json();
  return { accessToken: data.access_token };
}

/**
 * Fetch the authenticated user's YouTube channels
 */
export async function fetchYouTubeChannels(
  accessToken: string,
): Promise<YouTubeChannel[]> {
  const response = await fetch(
    "https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true",
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`YouTube channels fetch failed: ${error}`);
  }

  const data: YouTubeChannelListResponse = await response.json();
  return data.items || [];
}

/**
 * Verify that the authenticated YouTube user owns the claimed channel
 */
export async function verifyYouTubeOwnership(
  code: string,
  claimedChannelId: string,
): Promise<{
  verified: boolean;
  channelId?: string;
  channelTitle?: string;
  error?: string;
}> {
  try {
    const { accessToken } = await exchangeYouTubeCode(code);
    const channels = await fetchYouTubeChannels(accessToken);
    // Token is not stored — discarded after verification

    if (channels.length === 0) {
      return {
        verified: false,
        error: "No YouTube channels found for this Google account",
      };
    }

    // Check if any of the user's channels match the claimed channel
    const matchedChannel = channels.find(
      (ch) =>
        ch.id === claimedChannelId ||
        ch.snippet.customUrl?.replace(/^@/, "").toLowerCase() ===
          claimedChannelId.toLowerCase(),
    );

    if (!matchedChannel) {
      const userChannelIds = channels
        .map((ch) => ch.snippet.customUrl || ch.id)
        .join(", ");
      return {
        verified: false,
        error: `Your YouTube account (${userChannelIds}) doesn't match the claimed channel (${claimedChannelId})`,
      };
    }

    return {
      verified: true,
      channelId: matchedChannel.id,
      channelTitle: matchedChannel.snippet.title,
    };
  } catch (error) {
    console.error("YouTube verification failed:", error);
    return {
      verified: false,
      error:
        error instanceof Error ? error.message : "YouTube verification failed",
    };
  }
}
