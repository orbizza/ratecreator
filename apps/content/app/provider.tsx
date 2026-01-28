"use client";

import React from "react";
import { RecoilRoot } from "recoil";
import { ThemeProvider } from "next-themes";
import { TooltipProvider } from "@radix-ui/react-tooltip";
import { ContentSidebarLayout } from "./content-sidebar";

export default function Provider({
  children,
}: {
  children: React.ReactNode;
}): JSX.Element {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      disableTransitionOnChange
    >
      <RecoilRoot>
        <TooltipProvider>
          <ContentSidebarLayout>{children}</ContentSidebarLayout>
        </TooltipProvider>
      </RecoilRoot>
    </ThemeProvider>
  );
}
