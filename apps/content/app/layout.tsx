import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { SidebarInset, SidebarProvider, ThemeProvider } from "@ratecreator/ui";
import { ClerkProvider } from "@clerk/nextjs";
import { AppSidebar } from "@ratecreator/ui/content";
import { SidebarToggle } from "./sidebar-toggle";
const inter = Nunito({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Content Writer - Rate Creator",
  description: "Content Writer App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang='en'>
        <body className={`${inter.className} antialiased`}>
          <ThemeProvider
            attribute='class'
            defaultTheme='system'
            enableSystem
            disableTransitionOnChange
          >
            <SidebarProvider>
              <AppSidebar />
              <SidebarInset>
                <SidebarToggle />
                {children}
              </SidebarInset>
            </SidebarProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
