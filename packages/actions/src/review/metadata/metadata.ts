"use server";

import axios from "axios";
import { load } from "cheerio";

interface Metadata {
  title?: string;
  description?: string;
  image?: string;
}

const getYouTubeVideoId = (url: string) => {
  const regExp =
    /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[7].length === 11 ? match[7] : null;
};

const getTwitterTweetId = (url: string) => {
  const regex = /\/status\/(\d+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getTikTokVideoId = (url: string) => {
  // Handle multiple TikTok URL formats
  const patterns = [/\/video\/(\d+)/, /@[\w.-]+\/video\/(\d+)/, /\/v\/(\d+)/];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
};

const getRedditPostId = (url: string) => {
  const regex = /\/comments\/([a-zA-Z0-9]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};

const getYouTubeMetadata = async (videoId: string): Promise<Metadata> => {
  try {
    const response = await axios.get(
      `https://www.youtube.com/watch?v=${videoId}`,
    );
    const $ = load(response.data);

    return {
      title: $('meta[property="og:title"]').attr("content"),
      description: $('meta[property="og:description"]').attr("content"),
      image: $('meta[property="og:image"]').attr("content"),
    };
  } catch (error) {
    console.error("Error fetching YouTube metadata:", error);
    return {};
  }
};

const getTwitterMetadata = async (tweetId: string): Promise<Metadata> => {
  try {
    const response = await axios.get(
      `https://api.twitter.com/2/tweets/${tweetId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TWITTER_BEARER_TOKEN}`,
        },
      },
    );

    return {
      title: response.data.data.text,
      description: response.data.data.text,
      // Note: Twitter API v2 doesn't provide media directly, would need additional calls
    };
  } catch (error) {
    console.error("Error fetching Twitter metadata:", error);
    return {};
  }
};

const getTikTokMetadata = async (url: string): Promise<Metadata> => {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        "Sec-Fetch-Site": "none",
        "Sec-Fetch-Mode": "navigate",
      },
      timeout: 5000, // 5 second timeout
      maxRedirects: 5,
    });

    const $ = load(response.data);

    const title =
      $('meta[property="og:title"]').attr("content") ||
      $("title").text() ||
      "TikTok Video";

    const description =
      $('meta[property="og:description"]').attr("content") ||
      $('meta[name="description"]').attr("content") ||
      "";

    const image =
      $('meta[property="og:image"]').attr("content") ||
      $('meta[property="twitter:image"]').attr("content");

    if (!title && !description && !image) {
      throw new Error("No metadata found");
    }

    return {
      title,
      description,
      image,
    };
  } catch (error) {
    console.error("Error fetching TikTok metadata:", error);
    const videoId = getTikTokVideoId(url);
    // Return basic metadata when scraping fails
    return {
      title: "TikTok Video",
      description: videoId
        ? `TikTok video ID: ${videoId}`
        : "Unable to fetch video details",
      image: "https://www.tiktok.com/favicon.ico",
    };
  }
};

const getRedditMetadata = async (postId: string): Promise<Metadata> => {
  try {
    // Try both .json and regular URL to maximize chances of getting data
    const [jsonResponse, htmlResponse] = await Promise.allSettled([
      axios.get(`https://www.reddit.com/comments/${postId}.json`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }),
      axios.get(`https://www.reddit.com/comments/${postId}`, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36",
        },
      }),
    ]);

    // Try to get data from JSON response first
    if (
      jsonResponse.status === "fulfilled" &&
      jsonResponse.value.data?.[0]?.data?.children?.[0]?.data
    ) {
      const postData = jsonResponse.value.data[0].data.children[0].data;

      // Handle different types of Reddit content
      const image = postData.url?.match(/\.(jpg|jpeg|png|gif)$/i)
        ? postData.url
        : postData.thumbnail && postData.thumbnail !== "self"
          ? postData.thumbnail
          : postData.preview?.images?.[0]?.source?.url?.replace(
              /&amp;/g,
              "&",
            ) || postData.media?.oembed?.thumbnail_url?.replace(/&amp;/g, "&");

      return {
        title: postData.title || "Reddit Post",
        description: postData.selftext || postData.url || "",
        image: image || undefined,
      };
    }

    // Fallback to HTML scraping if JSON fails
    if (htmlResponse.status === "fulfilled") {
      const $ = load(htmlResponse.value.data);

      return {
        title:
          $('meta[property="og:title"]').attr("content") ||
          $("title").text() ||
          "Reddit Post",
        description:
          $('meta[property="og:description"]').attr("content") ||
          $('meta[name="description"]').attr("content") ||
          "",
        image:
          $('meta[property="og:image"]').attr("content") ||
          $('meta[name="twitter:image"]').attr("content"),
      };
    }

    throw new Error("Failed to fetch Reddit data");
  } catch (error) {
    console.error("Error fetching Reddit metadata:", error);
    return {
      title: "Reddit Post",
      description: `Reddit post ID: ${postId}`,
      image:
        "https://www.redditstatic.com/desktop2x/img/favicon/android-icon-192x192.png",
    };
  }
};

async function getGenericMetadata(url: string): Promise<Metadata> {
  try {
    const response = await axios.get(url);
    const $ = load(response.data);

    return {
      title:
        $('meta[property="og:title"]').attr("content") || $("title").text(),
      description:
        $('meta[property="og:description"]').attr("content") ||
        $('meta[name="description"]').attr("content"),
      image: $('meta[property="og:image"]').attr("content"),
    };
  } catch (error) {
    console.error("Error fetching generic metadata:", error);
    return {};
  }
}

// Export the ID extraction functions
export {
  getYouTubeVideoId,
  getTwitterTweetId,
  getTikTokVideoId,
  getRedditPostId,
};

export const getMetadata = async (url: string): Promise<Metadata> => {
  try {
    if (!url) {
      throw new Error("URL is required");
    }

    let metadata: Metadata = {};

    // YouTube
    if (url.includes("youtube.com") || url.includes("youtu.be")) {
      const videoId = getYouTubeVideoId(url);
      if (videoId) {
        metadata = await getYouTubeMetadata(videoId);
      }
    }
    // Twitter/X
    else if (url.includes("twitter.com") || url.includes("x.com")) {
      const tweetId = getTwitterTweetId(url);
      if (tweetId) {
        metadata = await getTwitterMetadata(tweetId);
      }
    }
    // TikTok
    else if (url.includes("tiktok.com")) {
      const videoId = getTikTokVideoId(url);
      if (videoId) {
        metadata = await getTikTokMetadata(url);
      }
    }
    // Reddit
    else if (url.includes("reddit.com")) {
      const postId = getRedditPostId(url);
      if (postId) {
        metadata = await getRedditMetadata(postId);
      }
    }
    // Generic URL
    else {
      metadata = await getGenericMetadata(url);
    }

    return metadata;
  } catch (error) {
    console.error("Error processing metadata request:", error);
    throw error;
  }
};
