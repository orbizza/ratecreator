import { Metadata } from "next";
import { GlossaryListPage } from "@ratecreator/ui/content";

export const metadata: Metadata = {
  title: "Glossary",
  description: "Explore our comprehensive glossary of terms and definitions.",
  openGraph: {
    title: "Glossary",
    description: "Explore our comprehensive glossary of terms and definitions.",
    type: "website",
    images: [
      {
        url: "/ratecreator.png",
        width: 1200,
        height: 630,
        alt: "Rate Creator Glossary",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Glossary",
    description: "Explore our comprehensive glossary of terms and definitions.",
    images: ["/ratecreator.png"],
  },
};

export default function GlossaryPage() {
  return <GlossaryListPage />;
}
