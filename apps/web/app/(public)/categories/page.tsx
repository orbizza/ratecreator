import React from "react";
import { Metadata } from "next";
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

export default function CategoriesList() {
  return (
    <div>
      <CategoryListPage />
    </div>
  );
}
