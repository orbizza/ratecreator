import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "@ratecreator/ui/styles.css";

import "./globals.css";
import { Providers } from "./providers";
import { Appbar, Footer } from "@ratecreator/ui/review";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Rate Creator",
  description: "Search and review Content Creators",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <Providers>
          <Appbar />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
