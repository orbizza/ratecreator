import React from "react";
import { Metadata } from "next";
import SearchResults from "./search-results";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string; platform?: string };
}): Promise<Metadata> {
  const searchQuery = searchParams.q;
  const platform = searchParams.platform;

  let title = "Search Creators";
  let description =
    "Search and discover content creators across YouTube, Twitter, TikTok, and Reddit. Find ratings, reviews, and insights from the community.";

  if (searchQuery) {
    title = `${searchQuery}`;
    description = `Find and review content creators related to "${searchQuery}". Discover ratings, reviews, and insights from the community.`;
    if (platform) {
      title = `${searchQuery} - ${platform}`;
      description = `Find and review ${platform} content creators related to "${searchQuery}". Discover ratings, reviews, and insights from the community.`;
    }
  } else if (platform) {
    title = `${platform} Creators`;
    description = `Find and review ${platform} content creators. Discover ratings, reviews, and insights from the community.`;
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: "/ratecreator-dark.svg",
          width: 1200,
          height: 630,
          alt: "Search Creators on Rate Creator",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/ratecreator-dark.svg"],
    },
  };
}

export default function SearchPage() {
  return (
    <main className='min-h-[calc(100vh-20vh)]'>
      <SearchResults />
    </main>
  );
}
