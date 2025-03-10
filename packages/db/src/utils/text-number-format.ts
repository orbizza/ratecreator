export const formatValue = (value: number) => {
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)} B`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)} M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)} K`;
  return value.toString();
};

export const toSlug = (text: string): string => {
  return text
    .toLowerCase() // Convert to lowercase
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .trim(); // Remove leading/trailing spaces
};

export const fromSlug = (slug: string): string => {
  return slug
    .split("-") // Split by hyphens
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1)) // Capitalize first letter of each word
    .join(" "); // Join with spaces
};

export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export const formatUtcTimestamp = (utcTimestamp: number): string => {
  const date = new Date(utcTimestamp * 1000); // Convert Unix timestamp (seconds) to milliseconds
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short", // "Jan", "Feb", etc.
    day: "numeric",
  });
};

export const getRedditPostId = (url: string) => {
  const regex = /\/r\/([^/]+)\/comments\/([a-zA-Z0-9]+)\/([^/]+)/;
  const match = url.match(regex);
  return match ? `r/${match[1]}/comments/${match[2]}/${match[3]}/` : null;
};

export const extractTweetId = (url: string) => {
  const regex = /\/status\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

export const extractTikTokVideoId = (url: string) => {
  const regex = /tiktok\.com\/@([^/]+)\/video\/(\d+)/;
  const match = url.match(regex);

  return match ? match[2] : null;
};

export const removeNormalSuffix = (url: string) => {
  return url.replace(/_normal(\.\w+)$/, "$1");
};

export const convertToEmbeddedUrl = (youtubeUrl: string): string => {
  return youtubeUrl.replace("watch?v=", "embed/");
};

export const stripUrlParams = (url: string) => {
  if (!url) return url;
  const pngIndex = url.indexOf(".png");
  if (pngIndex !== -1) {
    return url.substring(0, pngIndex + 4); // +4 to include '.png'
  }
  return url;
};

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

export const truncateText = (text: string, maxLength: number): string => {
  if (!text) return ""; // Handle null/undefined text
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength - 3) + "...";
};

//write a function to keep a float number to 2 decimal places
export const formatFloat = (number: number): string => {
  return number.toFixed(2);
};

export const reverseAndHyphenate = (item: string) => {
  return item.toLowerCase().split(" ").join("-");
};

export const capitalizeFirstLetter = (item: string) => {
  return item
    .split("-")
    .map((word, index) =>
      index === 0
        ? word.charAt(0).toUpperCase() + word.slice(1)
        : word.toLowerCase(),
    )
    .join(" ");
};
