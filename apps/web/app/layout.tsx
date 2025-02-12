import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";

import "@ratecreator/ui/styles.css";
import "./globals.css";
import { Providers, CSPostHogProvider } from "./providers";
import { Appbar, Footer } from "@ratecreator/ui/review";
import { Toaster } from "@ratecreator/ui";

const inter = Inter({ subsets: ["latin"] });

// Export metadata
export const metadata: Metadata = {
  title: "Rate Creator",
  description: "Search and review Content Creators",
};

// Mark this component as a client component
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
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
