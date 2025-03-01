import { ContactFormPage } from "@ratecreator/ui/review";
import { Metadata } from "next";
import Head from "next/head";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact us for any questions or feedback. We're here to help you find the best content creators.",
  openGraph: {
    title: "Contact",
    description:
      "Contact us for any questions or feedback. We're here to help you find the best content creators.",
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
    title: "Contact",
    description:
      "Contact us for any questions or feedback. We're here to help you find the best content creators.",
    images: ["/ratecreator.png"], // Uses metadataBase
  },
};

export default function ContactPage() {
  return <ContactFormPage />;
}
