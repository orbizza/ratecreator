import React from "react";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

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

export default async function SearchPage() {
  const { userId } = await auth();

  // Anonymous: render an empty backdrop. The (public)/search/layout.tsx
  // wraps every search page in <AuthGateModal>; skipping <SearchResults>
  // means we never call getCategoryData / searchCreators for anonymous,
  // so the result list never enters the DOM and DevTools sees nothing.
  if (!userId) {
    return <main aria-hidden className="min-h-[calc(100vh-20vh)]" />;
  }

  return (
    <main className="min-h-[calc(100vh-20vh)]">
      <SearchResults />
    </main>
  );
}
