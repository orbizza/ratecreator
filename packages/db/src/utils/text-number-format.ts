/**
 * @fileoverview Text and number formatting utilities for Rate Creator platform
 * @module utils/text-number-format
 * @description Provides utility functions for formatting text, numbers, dates, and URLs.
 * Includes functions for number formatting, text manipulation, date formatting,
 * and social media URL parsing.
 */

/**
 * Formats a number into a human-readable string with appropriate suffix
 * @param {number} value - The number to format
 * @returns {string} Formatted number string (e.g., "1.2 B", "3.4 M", "5.6 K")
 */
export const formatValue = (value: number) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)} K`;
  return value.toString();
};

/**
 * Converts a string to a URL-friendly slug
 * @param {string} text - The text to convert
 * @returns {string} URL-friendly slug
 */
export const toSlug = (text: string): string => {
  return text
    .toLowerCase() // Convert to lowercase
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim(); // Remove leading/trailing spaces
};

/**
 * Converts a slug back to a readable string
 * @param {string} slug - The slug to convert
 * @returns {string} Readable string with capitalized words
 */
export const fromSlug = (slug: string): string => {
  return slug
    .split("-") // Split by hyphens
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
    .join(" "); // Join with spaces
};

/**
 * Formats a date string into a localized date format
 * @param {string} dateString - The date string to format
 * @returns {string} Formatted date string
 */
export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

/**
 * Formats a UTC timestamp into a localized date format
 * @param {number} utcTimestamp - The UTC timestamp to format
 * @returns {string} Formatted date string
 */
export const formatUtcTimestamp = (utcTimestamp: number): string => {
  const date = new Date(utcTimestamp * 1000); // Convert Unix timestamp (seconds) to milliseconds
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short", // "Jan", "Feb", etc.
    day: "numeric",
  });
};

/**
 * Extracts the post ID from a Reddit URL
 * @param {string} url - The Reddit URL
 * @returns {string|null} The post ID or null if not found
 */
export const getRedditPostId = (url: string) => {
  const regex = /\/r\/([^/]+)\/comments\/([a-zA-Z0-9]+)\/([^/]+)/;
  const match = url.match(regex);
  return match ? `r/${match[1]}/comments/${match[2]}/${match[3]}/` : null;
};

/**
 * Extracts the tweet ID from a Twitter URL
 * @param {string} url - The Twitter URL
 * @returns {string|null} The tweet ID or null if not found
 */
export const extractTweetId = (url: string) => {
  const regex = /\/status\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

/**
 * Extracts the video ID from a TikTok URL
 * @param {string} url - The TikTok URL
 * @returns {string|null} The video ID or null if not found
 */
export const extractTikTokVideoId = (url: string) => {
  const regex = /tiktok\.com\/@([^/]+)\/video\/(\d+)/;
  const match = url.match(regex);

  return match ? match[2] : null;
};

/**
 * Removes the "_normal" suffix from a URL
 * @param {string} url - The URL to process
 * @returns {string} URL without the "_normal" suffix
 */
export const removeNormalSuffix = (url: string) => {
  return url.replace(/_normal(\.\w+)$/, "$1");
};

/**
 * Converts a YouTube watch URL to an embed URL
 * @param {string} youtubeUrl - The YouTube watch URL
 * @returns {string} YouTube embed URL
 */
export const convertToEmbeddedUrl = (youtubeUrl: string): string => {
  return youtubeUrl.replace("watch?v=", "embed/");
};

/**
 * Removes query parameters from a URL
 * @param {string} url - The URL to process
 * @returns {string} URL without query parameters
 */
export const stripUrlParams = (url: string) => {
  if (!url) return url;
  const pngIndex = url.indexOf(".png");
  if (pngIndex !== -1) {
    return url.substring(0, pngIndex + 4); // +4 to include '.png'
  }
  return url;
};

/**
 * Gets initials from a name or email
 * @param {string} nameOrEmail - The name or email to process
 * @returns {string} Initials (e.g., "JD" for "John Doe")
 */
export const getInitials = (nameOrEmail: string) => {
  if (!nameOrEmail) return "SD";

  const nameParts = nameOrEmail.split(" ");

  if (nameParts.length > 1) {
    const firstNameInitial = nameParts[0].charAt(0).toUpperCase();
    const lastNameInitial = nameParts[nameParts.length - 1]
      .charAt(0)
      .toUpperCase();
    return `${firstNameInitial}${lastNameInitial}`;
  } else {
    return nameOrEmail.charAt(0).toUpperCase();
  }
};

/**
 * Truncates text to a specified length
 * @param {string} text - The text to truncate
 * @param {number} maxLength - Maximum length of the text
 * @returns {string} Truncated text with ellipsis if needed
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ""; // Handle null/undefined text
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
};

/**
 * Formats a float number to 2 decimal places
 * @param {number} number - The number to format
 * @returns {string} Formatted number string
 */
export const formatFloat = (number: number): string => {
  return number.toFixed(2);
};

/**
 * Reverses and hyphenates a string
 * @param {string} item - The string to process
 * @returns {string} Hyphenated string
 */
export const reverseAndHyphenate = (item: string) => {
  const url = item.toLowerCase().split(" ").join("-");
  const trimmedItem = url.trim();
  return trimmedItem;
};

/**
 * Capitalizes the first letter of a string
 * @param {string} item - The string to process
 * @returns {string} String with first letter capitalized
 */
export const capitalizeFirstLetter = (item: string) => {
  return item
    .split("-")
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.toLowerCase()
    )
    .join(" ");
};

/**
 * Capitalizes each word in a string
 * @param {string} item - The string to process
 * @returns {string} String with each word capitalized
 */
export const capitalizeEachWord = (item: string) => {
  return item
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Splits a string and capitalizes the first word
 * @param {string} item - The string to process
 * @returns {string} First word in uppercase
 */
export const splitAndCapitalize = (item: string) => {
  const [firstWord] = item.split("-");
  return firstWord.toUpperCase();
};
