import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import "@ratecreator/ui/styles.css";
import "./globals.css";
import { Providers, CSPostHogProvider } from "./providers";
import { Appbar, Footer } from "@ratecreator/ui/review";
import { Toaster } from "@ratecreator/ui";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Rate Creator - Search and Review Creators and Communities",
    template: "%s - Rate Creator",
  },
  description:
    "Discover and review content creators across different platforms. Get insights, ratings, and detailed reviews from the community.",
  keywords: [
    "content creators",
    "creator reviews",
    "influencer ratings",
    "social media creators",
    "content review platform",
  ],
  authors: [{ name: "Rate Creator" }],
  creator: "Rate Creator",
  publisher: "Rate Creator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL("https://ratecreator.com"),
  openGraph: {
    title: "Rate Creator - Search and Review Content Creators",
    description:
      "Discover and review content creators across different platforms. Get insights, ratings, and detailed reviews from the community.",
    url: "https://ratecreator.com",
    siteName: "Rate Creator",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "https://ratecreator.com/ratecreator-dark.svg",
        width: 1200,
        height: 630,
        alt: "Rate Creator Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Rate Creator - Search and Review Content Creators",
    description:
      "Discover and review content creators across different platforms. Get insights, ratings, and detailed reviews from the community.",
    creator: "@ratecreator",
    images: ["https://ratecreator.com/ratecreator-dark.svg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// Mark this component as a client component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang='en' suppressHydrationWarning>
        <CSPostHogProvider>
          <body className={inter.className}>
            <Providers>
              <Appbar />
              {children}
              <Footer />
              <Toaster />
            </Providers>
          </body>
        </CSPostHogProvider>
      </html>
    </ClerkProvider>
  );
}
