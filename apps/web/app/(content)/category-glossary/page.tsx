import { Metadata } from "next";

import { CategoryGlossaryListPage } from "@ratecreator/ui/content";

export const metadata: Metadata = {
  title: "Categories Glossary",
  description: "Glossary of categories and their definitions.",
  openGraph: {
    title: "Categories Glossary",
    description: "Glossary of categories and their definitions.",
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
    title: "Categories Glossary",
    description: "Glossary of categories and their definitions.",
    images: ["/ratecreator.png"], // Uses metadataBase
  },
};

export default function CategoryGlossaryPage() {
  return <CategoryGlossaryListPage />;
}
