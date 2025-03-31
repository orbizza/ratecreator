"use client";

import { RecoilRoot } from "recoil";
import { AppSidebar } from "@ratecreator/ui/content";
import { SidebarToggle } from "./sidebar-toggle";
import {
  SidebarInset,
  SidebarProvider,
  ThemeProvider,
  TooltipProvider,
} from "@ratecreator/ui";

export default function Provider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <RecoilRoot>
        <TooltipProvider>
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <SidebarToggle />
              {children}
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </RecoilRoot>
    </ThemeProvider>
  );
}
