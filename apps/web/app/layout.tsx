import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import "@ratecreator/ui/styles.css";
import "./globals.css";
import { Providers, CSPostHogProvider } from "./providers";
import { Appbar, Footer } from "@ratecreator/ui/review";
import { Toaster } from "@ratecreator/ui";
import Head from "next/head";

const inter = Inter({ subsets: ["latin"] });

export const metadataBase = new URL("https://ratecreator.com");

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
    "review creators",
    "review communities",
    "review content",
    "review influencers",
    "review social media",
    "review youtube",
    "review tiktok",
    "review instagram",
    "review facebook",
    "review twitter",
    "review twitch",
    "review discord",
    "review reddit",
    "rate creator",
    "rate community",
    "rate content",
    "rate influencers",
    "rate social media",
    "rate youtube",
    "rate tiktok",
    "rate instagram",
    "rate facebook",
    "rate twitter",
    "rate twitch",
    "rate discord",
    "rate reddit",
  ],
  authors: [{ name: "Rate Creator" }],
  creator: "Rate Creator",
  publisher: "Rate Creator",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: "Rate Creator - Search and Review Content Creators",
    description:
      "Discover and review content creators across different platforms. Get insights, ratings, and detailed reviews from the community.",
    url: "/",
    siteName: "Rate Creator",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/ratecreator.png", // ✅ metadataBase will automatically prepend this
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
    images: ["/ratecreator.png"], // ✅ metadataBase will prepend this
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
        <Head>
          <meta
            property='og:image'
            content='https://ratecreator.com/ratecreator.png'
          />
          <meta property='og:image:width' content='1200' />
          <meta property='og:image:height' content='630' />
          <meta
            name='twitter:image'
            content='https://ratecreator.com/ratecreator.png'
          />
        </Head>

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
