import React from "react";
import { Metadata } from "next";
import { CategoryListPage } from "@ratecreator/ui/review";

export const metadata: Metadata = {
  title: "Categories",
  description:
    "Explore and discover content creators across different categories. Find creators in gaming, education, entertainment, and more.",
  openGraph: {
    title: "Categories",
    description:
      "Explore and discover content creators across different categories. Find creators in gaming, education, entertainment, and more.",
    type: "website",
    images: [
      {
        url: "/ratecreator-dark.svg",
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
      "Explore and discover content creators across different categories. Find creators in gaming, education, entertainment, and more.",
    images: ["/ratecreator-dark.svg"],
  },
};

export default function CategoriesList() {
  return (
    <div>
      <CategoryListPage />
    </div>
  );
}
