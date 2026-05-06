import React from "react";
import { Metadata } from "next";
import { auth } from "@clerk/nextjs/server";

import { CategoryListPage } from "@ratecreator/ui/review";

export const metadata: Metadata = {
  title: "Search Categories",
  description: "Find the best content creators across different categories.",
  openGraph: {
    title: "Search Categories",
    description: "Find the best content creators across different categories.",
    type: "website",
    images: [
      {
        url: "/ratecreator.png", // Now uses metadataBase automatically
        width: 1200,
        height: 630,
        alt: "Rate Creator Categories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Search Categories",
    description: "Find the best content creators across different categories.",
    images: ["/ratecreator.png"], // Uses metadataBase
  },
};

export default async function CategoriesList() {
  const { userId } = await auth();

  // Anonymous: render an empty backdrop. The (public)/categories/layout.tsx
  // wraps every categories page in <AuthGateModal>, which paints the Clerk
  // sign-in over a blurred copy of `children`. Skipping <CategoryListPage>
  // avoids the getCategoryData fetch — without this the full category tree
  // renders into the DOM and is visible behind the modal (and via View
  // Source / DevTools), which was the leak the security PR was filed for.
  if (!userId) {
    return <div aria-hidden className="min-h-[calc(100vh-20vh)]" />;
  }

  return (
    <div>
      <CategoryListPage />
    </div>
  );
}
