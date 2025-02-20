"use server";

interface RedditOEmbedResponse {
  title: string;
  author_name: string;
  provider_name: string;
}

interface RedditPostDataResponse {
  success: boolean;
  title?: string;
  author?: string;
  subreddit?: string;
  error?: string;
}

export async function getRedditPostData(
  url: string,
): Promise<RedditPostDataResponse> {
  try {
    // Use node-fetch on the server side
    const response = await fetch(
      `https://www.reddit.com/oembed?url=${encodeURIComponent(url)}`,
    );

    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch Reddit data: ${response.statusText}`,
      };
    }

    const data: RedditOEmbedResponse = await response.json();

    return {
      success: true,
      title: data.title,
      author: data.author_name,
      subreddit: data.provider_name,
    };
  } catch (error) {
    console.error("Error fetching Reddit post data:", error);
    return {
      success: false,
      error: "Failed to fetch Reddit post data",
    };
  }
}
