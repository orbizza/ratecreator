import React from "react";
import { Metadata } from "next";
import { CategoryListPage } from "@ratecreator/ui/review";
import Head from "next/head";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Explore and discover content creators across different categories.",
  openGraph: {
    title: "Categories",
    description:
      "Explore and discover content creators across different categories.",
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
    title: "Categories",
    description:
      "Explore and discover content creators across different categories.",
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
