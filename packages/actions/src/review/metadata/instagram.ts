"use server";

import axios from "axios";
import { load } from "cheerio";

/**
 * Instagram Data Types
 */
export interface InstagramProfile {
  username: string;
  fullName: string;
  biography: string;
  profilePictureUrl: string;
  followersCount: number;
  followingCount: number;
  mediaCount: number;
  isVerified: boolean;
  isBusinessAccount: boolean;
  businessCategory?: string;
  externalUrl?: string;
  lastUpdated: string;
}

export interface InstagramMedia {
  id: string;
  mediaType: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  permalink: string;
  thumbnailUrl?: string;
  caption?: string;
  likeCount?: number;
  commentsCount?: number;
  timestamp: string;
}

export interface InstagramInsights {
  impressions?: number;
  reach?: number;
  profileViews?: number;
  websiteClicks?: number;
}

export interface InstagramData extends InstagramProfile {
  recentMedia?: InstagramMedia[];
  insights?: InstagramInsights;
}

interface InstagramMetadata {
  title?: string;
  description?: string;
  image?: string;
}

interface InstagramProfileResponse {
  success: boolean;
  data?: InstagramData;
  error?: string;
}

/**
 * Extract Instagram username from URL
 */
export async function getInstagramUsername(
  url: string,
): Promise<string | null> {
  // Handle multiple Instagram URL formats
  const patterns = [
    /instagram\.com\/([^/?#]+)/,
    /instagr\.am\/([^/?#]+)/,
    /ig\.me\/([^/?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // Filter out reserved paths
      const username = match[1].toLowerCase();
      const reservedPaths = [
        "p",
        "reel",
        "reels",
        "stories",
        "explore",
        "accounts",
        "direct",
        "tv",
        "about",
        "legal",
        "developer",
      ];
      if (!reservedPaths.includes(username)) {
        return username;
      }
    }
  }

  return null;
}

/**
 * Extract Instagram post/reel ID from URL
 */
export async function getInstagramPostId(url: string): Promise<string | null> {
  const patterns = [
    /instagram\.com\/p\/([^/?#]+)/,
    /instagram\.com\/reel\/([^/?#]+)/,
    /instagram\.com\/tv\/([^/?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Fetch Instagram profile data using the Graph API
 * Requires INSTAGRAM_ACCESS_TOKEN environment variable
 */
export async function fetchInstagramProfile(
  username: string,
): Promise<InstagramProfileResponse> {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!accessToken) {
      // Fallback to scraping if no access token
      return await scrapeInstagramProfile(username);
    }

    // Instagram Graph API requires business account ID, not username
    // First, we need to get the business account ID
    const searchResponse = await axios.get(
      `https://graph.facebook.com/v19.0/ig_hashtag_search`,
      {
        params: {
          user_id: process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID,
          q: username,
          access_token: accessToken,
        },
      },
    );

    // For now, use the Business Discovery API which allows username lookup
    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}`,
      {
        params: {
          fields: `business_discovery.username(${username}){username,name,biography,profile_picture_url,followers_count,follows_count,media_count,ig_id,website}`,
          access_token: accessToken,
        },
      },
    );

    const profile = response.data.business_discovery;

    if (!profile) {
      return {
        success: false,
        error: "Profile not found",
      };
    }

    const instagramData: InstagramData = {
      username: profile.username,
      fullName: profile.name || profile.username,
      biography: profile.biography || "",
      profilePictureUrl: profile.profile_picture_url || "",
      followersCount: profile.followers_count || 0,
      followingCount: profile.follows_count || 0,
      mediaCount: profile.media_count || 0,
      isVerified: false, // Not available via Business Discovery
      isBusinessAccount: true, // If we can query it, it's a business account
      externalUrl: profile.website,
      lastUpdated: new Date().toISOString(),
    };

    return {
      success: true,
      data: instagramData,
    };
  } catch (error) {
    console.error("Error fetching Instagram profile via API:", error);

    // Fallback to scraping
    return await scrapeInstagramProfile(username);
  }
}

/**
 * Fallback: Scrape Instagram profile data from public page
 */
async function scrapeInstagramProfile(
  username: string,
): Promise<InstagramProfileResponse> {
  try {
    const response = await axios.get(`https://www.instagram.com/${username}/`, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Cache-Control": "no-cache",
      },
      timeout: 10000,
    });

    const $ = load(response.data);

    // Try to extract from meta tags
    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      "";
    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";
    const image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content") ||
      "";

    // Parse followers from description (format: "X Followers, X Following, X Posts")
    const statsMatch = description.match(
      /([\d,.]+[KMB]?)\s*Followers.*?([\d,.]+[KMB]?)\s*Following.*?([\d,.]+[KMB]?)\s*Posts/i,
    );

    let followersCount = 0;
    let followingCount = 0;
    let mediaCount = 0;

    if (statsMatch) {
      followersCount = parseInstagramCount(statsMatch[1]);
      followingCount = parseInstagramCount(statsMatch[2]);
      mediaCount = parseInstagramCount(statsMatch[3]);
    }

    // Extract name from title (format: "Name (@username)")
    const nameMatch = title.match(/^(.+?)\s*\(@/);
    const fullName = nameMatch ? nameMatch[1].trim() : username;

    // Check for verified badge in the HTML
    const isVerified =
      response.data.includes('"is_verified":true') ||
      response.data.includes("verified_badge");

    const instagramData: InstagramData = {
      username,
      fullName,
      biography: extractBiography(description),
      profilePictureUrl: image,
      followersCount,
      followingCount,
      mediaCount,
      isVerified,
      isBusinessAccount: false,
      lastUpdated: new Date().toISOString(),
    };

    return {
      success: true,
      data: instagramData,
    };
  } catch (error) {
    console.error("Error scraping Instagram profile:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to fetch Instagram profile",
    };
  }
}

/**
 * Parse Instagram count strings (e.g., "1.2M", "500K", "1,234")
 */
function parseInstagramCount(countStr: string): number {
  if (!countStr) return 0;

  const cleaned = countStr.replace(/,/g, "").trim();
  const multipliers: Record<string, number> = {
    K: 1000,
    M: 1000000,
    B: 1000000000,
  };

  const match = cleaned.match(/^([\d.]+)([KMB])?$/i);
  if (match) {
    const num = parseFloat(match[1]);
    const suffix = match[2]?.toUpperCase();
    return suffix ? Math.round(num * multipliers[suffix]) : Math.round(num);
  }

  return parseInt(cleaned) || 0;
}

/**
 * Extract biography from Instagram description meta tag
 */
function extractBiography(description: string): string {
  // The description often includes stats, try to extract just the bio part
  // Format: "X Followers, X Following, X Posts - Biography text"
  const parts = description.split(" - ");
  if (parts.length > 1) {
    return parts.slice(1).join(" - ").trim();
  }
  return "";
}

/**
 * Fetch Instagram post/reel metadata
 */
export async function getInstagramMetadata(
  url: string,
): Promise<InstagramMetadata> {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
      },
      timeout: 10000,
    });

    const $ = load(response.data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $('meta[name="twitter:title"]').attr("content") ||
      "Instagram Post";

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    const image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[name="twitter:image"]').attr("content");

    return {
      title,
      description,
      image,
    };
  } catch (error) {
    console.error("Error fetching Instagram metadata:", error);
    const postId = await getInstagramPostId(url);
    return {
      title: "Instagram Post",
      description: postId
        ? `Instagram post ID: ${postId}`
        : "Unable to fetch post details",
      image:
        "https://www.instagram.com/static/images/ico/favicon-192.png/68d99ba29cc8.png",
    };
  }
}

/**
 * Fetch Instagram media for a business account (requires Graph API access)
 */
export async function fetchInstagramMedia(
  username: string,
  limit: number = 12,
): Promise<InstagramMedia[]> {
  try {
    const accessToken = process.env.INSTAGRAM_ACCESS_TOKEN;

    if (!accessToken) {
      return [];
    }

    const response = await axios.get(
      `https://graph.facebook.com/v19.0/${process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID}`,
      {
        params: {
          fields: `business_discovery.username(${username}){media.limit(${limit}){id,caption,media_type,permalink,thumbnail_url,timestamp,like_count,comments_count}}`,
          access_token: accessToken,
        },
      },
    );

    const media = response.data.business_discovery?.media?.data || [];

    return media.map(
      (item: any): InstagramMedia => ({
        id: item.id,
        mediaType: item.media_type,
        permalink: item.permalink,
        thumbnailUrl: item.thumbnail_url,
        caption: item.caption,
        likeCount: item.like_count,
        commentsCount: item.comments_count,
        timestamp: item.timestamp,
      }),
    );
  } catch (error) {
    console.error("Error fetching Instagram media:", error);
    return [];
  }
}

/**
 * Update Instagram data for an account
 */
export async function updateInstagramData(accountId: string): Promise<{
  success: boolean;
  data?: InstagramData;
  error?: string;
}> {
  try {
    // This would be called from the data-fetch consumer
    // The actual DB operations are handled there
    const result = await fetchInstagramProfile(accountId);
    return result;
  } catch (error) {
    console.error("Error updating Instagram data:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to update Instagram data",
    };
  }
}
