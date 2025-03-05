import React from "react";
import { Metadata } from "next";
import SearchResults from "./search-results";

export async function generateMetadata({
  searchParams,
}: {
  searchParams: { q?: string };
}): Promise<Metadata> {
  const searchQuery = searchParams.q;

  let title = "Search Creators";
  let description =
    "Search and discover creators &amp; communities across YouTube, Twitter, TikTok, and Reddit. Find ratings, reviews, and insights from the community.";

  if (searchQuery) {
    title = `${searchQuery}`;
    description = `Find and review creators &amp; communities related to "${searchQuery}". Discover ratings, reviews, and insights from the community.`;
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
          url: "/ratecreator.png",
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
      images: ["/ratecreator.png"],
    },
  };
}

export default function SearchPage() {
  return (
    <main className="min-h-[calc(100vh-20vh)]">
      <SearchResults />
    </main>
  );
}
