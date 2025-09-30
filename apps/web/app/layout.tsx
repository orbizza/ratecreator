import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import "@ratecreator/ui/styles.css";
import "./globals.css";
import { Providers, CSPostHogProvider } from "./providers";
import { Appbar, Footer } from "@ratecreator/ui/review";
import { StickyBanner, Toaster } from "@ratecreator/ui";

const inter = Inter({ subsets: ["latin"] });

export const metadataBase = new URL("https://ratecreator.com");

export const metadata: Metadata = {
  title: {
    default: "Rate Creator - Discover and Review Creators and Communities",
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
    title: "Rate Creator - Discover and Review Creators and Communities",
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
    title: "Rate Creator - Discover and Review Creators and Communities",
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
        <CSPostHogProvider>
          <body className={inter.className}>
            <style>{`
        ::selection {
         background: oklch(90.5% 0.182 98.111);
         color: #000;
         -webkit-text-fill-color: #000;
         -webkit-background-clip: text;
       }
       :is(.dark) ::selection {
         background: oklch(86.5% 0.127 207.078);
         color: #000;
         -webkit-text-fill-color: #000;
         -webkit-background-clip: text;
       }
     `}</style>
            <Providers>
              {/* Sticky Banner: Remove this block to disable the site-wide banner.
                  If you remove it, also set the navbar offset back to top-0 in
                  `packages/ui/src/components/review/nav-bar/appbar.tsx`. */}
              <StickyBanner className='bg-gradient-to-b from-amber-400 to-amber-500'>
                <p className='mx-0 max-w-[90%] text-black dark:text-black font-medium'>
                  Site is under maintenance. Expected to be back by 04/10/2025
                  {/* <a
                    href='#'
                    className='transition duration-200 hover:underline'
                  >
                    
                  </a> */}
                </p>
              </StickyBanner>
              {/* Navbar appears below the banner; offset is configured inside Appbar. */}
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
